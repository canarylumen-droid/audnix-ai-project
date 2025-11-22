/* @ts-nocheck */
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import { createClient } from "@supabase/supabase-js";
import { embed as generateEmbedding } from "./ai/openai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");

// Ensure upload directory exists
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const crypto = require('crypto');
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// File filter for voice files (mp3, wav, m4a)
const voiceFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4'];
  const allowedExts = ['.mp3', '.wav', '.m4a'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = allowedMimes.includes(file.mimetype);
  const extOk = allowedExts.includes(ext);
  
  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files (mp3, wav, m4a) are allowed'));
  }
};

// File filter for PDF files
const pdfFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

// Multer middleware configurations
export const uploadVoice = multer({
  storage: multerStorage,
  fileFilter: voiceFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for voice files
  },
});

export const uploadPDF = multer({
  storage: multerStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max for PDFs
  },
});

// File filter for avatar images
const avatarFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
};

export const uploadAvatar = multer({
  storage: multerStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for avatars
  },
});

/**
 * Upload file to Supabase Storage
 */
export async function uploadToSupabase(
  bucket: string,
  filePath: string,
  localPath: string
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  // Validate localPath to prevent path traversal attacks
  const resolvedPath = path.resolve(localPath);
  const uploadDirResolved = path.resolve(uploadDir);
  
  // Use path.relative to ensure the file is truly within the upload directory
  const relativePath = path.relative(uploadDirResolved, resolvedPath);
  const isInsideUploadDir = relativePath && 
    !relativePath.startsWith('..') && 
    !path.isAbsolute(relativePath);
  
  if (!isInsideUploadDir) {
    throw new Error("Invalid file path: path traversal detected");
  }

  const fileBuffer = await fs.readFile(resolvedPath);
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: 'auto',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  // Clean up local file - validate path again before deletion
  const relativePathCheck = path.relative(uploadDirResolved, resolvedPath);
  const canDelete = relativePathCheck && 
    !relativePathCheck.startsWith('..') && 
    !path.isAbsolute(relativePathCheck);
    
  if (canDelete) {
    await fs.unlink(resolvedPath).catch(console.error);
  }

  return publicUrl;
}

/**
 * Process PDF and generate embeddings
 */
export async function processPDFEmbeddings(
  userId: string,
  fileUrl: string,
  fileName: string,
  localPath?: string
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    // Create upload record
    const { error: insertError } = await supabase
      .from("uploads")
      .insert({
        user_id: userId,
        type: "pdf",
        file_url: fileUrl,
        file_name: fileName,
        status: "processing",
      });

    if (insertError) {
      console.error("Failed to create upload record:", insertError);
      return;
    }

    // Extract text from PDF
    let extractedText = '';
    if (localPath) {
      extractedText = await extractTextFromPDF(localPath);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      console.warn(`No text extracted from PDF: ${fileName}`);
      // Update status to failed
      await supabase
        .from("uploads")
        .update({ status: "failed" })
        .eq("file_name", fileName)
        .eq("user_id", userId);
      return;
    }

    // Generate and store embeddings for extracted text
    await generateAndStoreEmbeddings(userId, extractedText, fileName, "pdf");

    // Update status to completed
    await supabase
      .from("uploads")
      .update({ status: "completed" })
      .eq("file_name", fileName)
      .eq("user_id", userId);

    console.log(`✅ PDF processed successfully: ${fileName} (${extractedText.length} chars extracted)`);
  } catch (error: any) {
    console.error(`Error processing PDF ${fileName}:`, error.message);
    
    // Update status to failed
    if (supabase) {
      await supabase
        .from("uploads")
        .update({ status: "failed" })
        .eq("file_name", fileName)
        .eq("user_id", userId)
        .catch(console.error);
    }
  }
}

/**
 * Store voice sample for ElevenLabs voice cloning
 */
export async function storeVoiceSample(
  userId: string,
  fileUrl: string,
  fileName: string
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  // Store voice sample record
  const { error } = await supabase
    .from("uploads")
    .insert({
      user_id: userId,
      type: "voice",
      file_url: fileUrl,
      file_name: fileName,
      status: "ready",
    });

  if (error) {
    console.error("Failed to create voice upload record:", error);
    throw error;
  }

  console.log(`Voice sample stored: ${fileName}`);
}

/**
 * Extract text from PDF using pdf-parse library
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const pdfParse = require('pdf-parse');
    const fileBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(fileBuffer);
    
    // Extract text from all pages
    let fullText = '';
    if (pdfData.text) {
      fullText = pdfData.text;
    }
    
    // If pdf-parse doesn't extract text well, try page-by-page
    if (!fullText || fullText.trim().length < 50) {
      fullText = pdfData.pages?.map((page: any) => page.getTextContent?.() || '').join('\n') || '';
    }
    
    return fullText || '';
  } catch (error: any) {
    console.error('Error extracting PDF text:', error.message);
    // Return empty string instead of error to allow graceful degradation
    return '';
  }
}

/**
 * Generate and store embeddings for text chunks
 */
export async function generateAndStoreEmbeddings(
  userId: string,
  text: string,
  source: string,
  sourceType: "pdf" | "conversation" | "note"
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  // Chunk text into ~500 character pieces
  const chunks = chunkText(text, 500);

  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk);

      await supabase
        .from("brand_embeddings")
        .insert({
          user_id: userId,
          content: chunk,
          embedding: embedding,
          source: source,
          source_type: sourceType,
        });
    } catch (error) {
      console.error("Failed to generate embedding:", error);
    }
  }
}

/**
 * Chunk text into smaller pieces
 */
function chunkText(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/);
  
  let currentChunk = "";
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;
    
    if (currentChunk.length + trimmedSentence.length + 1 > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = trimmedSentence;
    } else {
      currentChunk += (currentChunk ? ". " : "") + trimmedSentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Search for relevant context using semantic search
 */
export async function semanticSearch(
  userId: string,
  query: string,
  limit: number = 5
): Promise<string[]> {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc("match_brand_embeddings", {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit,
    filter_user_id: userId,
  });

  if (error) {
    console.error("Semantic search failed:", error);
    return [];
  }

  return data.map((row: any) => row.content);
}
