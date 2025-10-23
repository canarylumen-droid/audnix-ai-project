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
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
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

  const fileBuffer = await fs.readFile(localPath);
  
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

  // Clean up local file
  await fs.unlink(localPath).catch(console.error);

  return publicUrl;
}

/**
 * Process PDF and generate embeddings
 */
export async function processPDFEmbeddings(
  userId: string,
  fileUrl: string,
  fileName: string
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  // In a real implementation, you would:
  // 1. Extract text from PDF using a library like pdf-parse
  // 2. Chunk the text into smaller pieces
  // 3. Generate embeddings for each chunk
  // 4. Store in brand_embeddings table

  // For now, create a placeholder record
  const { error } = await supabase
    .from("uploads")
    .insert({
      user_id: userId,
      type: "pdf",
      file_url: fileUrl,
      file_name: fileName,
      status: "processing",
    });

  if (error) {
    console.error("Failed to create upload record:", error);
  }

  // TODO: Implement actual PDF text extraction and embedding generation
  console.log(`PDF processing queued for ${fileName}`);
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
 * Extract text from PDF (placeholder - needs pdf-parse library)
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  // TODO: Implement with pdf-parse or similar library
  // For now, return placeholder
  return "PDF text extraction not yet implemented. Install pdf-parse library.";
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
