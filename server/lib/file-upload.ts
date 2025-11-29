import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import { createClient } from "@supabase/supabase-js";
import { embed as generateEmbedding } from "./ai/openai.js";
import type { Request } from "express";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const uploadDir = path.join(process.cwd(), "uploads");

fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const voiceFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
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

const pdfFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

export const uploadVoice = multer({
  storage: multer.memoryStorage(),
  fileFilter: voiceFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const uploadPDF = multer({
  storage: multer.memoryStorage(),
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

const avatarFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
};

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export async function uploadToSupabase(
  bucket: string,
  filePath: string,
  fileBuffer?: Buffer | string
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  // If fileBuffer is a string (file path), read it
  let buffer: Buffer;
  if (typeof fileBuffer === 'string') {
    const resolvedPath = path.resolve(fileBuffer);
    const uploadDirResolved = path.resolve(uploadDir);
    
    const relativePath = path.relative(uploadDirResolved, resolvedPath);
    const isInsideUploadDir = relativePath && 
      !relativePath.startsWith('..') && 
      !path.isAbsolute(relativePath);
    
    if (!isInsideUploadDir) {
      throw new Error("Invalid file path: path traversal detected");
    }

    buffer = await fs.readFile(resolvedPath);
    
    // Clean up local file
    await fs.unlink(resolvedPath).catch(console.error);
  } else if (Buffer.isBuffer(fileBuffer)) {
    buffer = fileBuffer;
  } else {
    throw new Error("No file data provided");
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: 'auto',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}

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

    let extractedText = '';
    if (localPath) {
      extractedText = await extractTextFromPDF(localPath);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      console.warn(`No text extracted from PDF: ${fileName}`);
      await supabase
        .from("uploads")
        .update({ status: "failed" })
        .eq("file_name", fileName)
        .eq("user_id", userId);
      return;
    }

    await generateAndStoreEmbeddings(userId, extractedText, fileName, "pdf");

    await supabase
      .from("uploads")
      .update({ status: "completed" })
      .eq("file_name", fileName)
      .eq("user_id", userId);

    console.log(`✅ PDF processed successfully: ${fileName} (${extractedText.length} chars extracted)`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error processing PDF ${fileName}:`, errorMessage);
    
    if (supabase) {
      try {
        await supabase
          .from("uploads")
          .update({ status: "failed" })
          .eq("file_name", fileName)
          .eq("user_id", userId);
      } catch (updateError) {
        console.error("Failed to update upload status:", updateError);
      }
    }
  }
}

export async function storeVoiceSample(
  userId: string,
  fileUrl: string,
  fileName: string
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

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

interface PDFParseResult {
  text: string;
  numpages: number;
  numrender: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown>;
  version: string;
}

async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const pdfParse = require('pdf-parse') as (dataBuffer: Buffer) => Promise<PDFParseResult>;
    const fileBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(fileBuffer);
    
    let fullText = '';
    if (pdfData.text) {
      fullText = pdfData.text;
    }
    
    return fullText || '';
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error extracting PDF text:', errorMessage);
    return '';
  }
}

export async function generateAndStoreEmbeddings(
  userId: string,
  text: string,
  source: string,
  sourceType: "pdf" | "conversation" | "note"
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

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

interface BrandEmbeddingMatch {
  id: string;
  content: string;
  similarity: number;
}

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

  return (data as BrandEmbeddingMatch[]).map((row: BrandEmbeddingMatch) => row.content);
}
