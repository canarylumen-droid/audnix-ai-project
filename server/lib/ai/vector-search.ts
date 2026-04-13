/**
 * Vector Search Engine for Brand Knowledge Base
 * Uses OpenAI text-embedding-3-small + pgvector for semantic retrieval
 * 
 * Pipeline:
 *  PDF text → chunk (500 tokens) → embed → store in brand_embeddings
 *  Query → embed → cosine similarity search → return top K chunks
 */

import { db } from '../../db.js';
import { sql } from 'drizzle-orm';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHUNK_SIZE_CHARS = 1800; // ~450 tokens at ~4 chars/token
const CHUNK_OVERLAP_CHARS = 200;

/**
 * Call OpenAI embeddings API.
 * Falls back gracefully if OPENAI_API_KEY is missing.
 */
export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[VectorSearch] OPENAI_API_KEY not set — skipping embedding, using empty vector');
    return [];
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text.substring(0, 8000), // Max 8k chars for safety
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI embedding failed: ${err}`);
  }

  const data = await response.json() as any;
  return data.data[0].embedding as number[];
}

/**
 * Split text into overlapping chunks for precise retrieval.
 */
export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE_CHARS, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) { // Skip tiny chunks
      chunks.push(chunk);
    }
    start += CHUNK_SIZE_CHARS - CHUNK_OVERLAP_CHARS;
  }

  return chunks;
}

/**
 * Index all chunks from a PDF into brand_embeddings.
 * Supports CUMULATIVE MEMORY: Does not delete old chunks unless explicitly asked.
 */
export async function indexPdfChunks(
  pdfText: string,
  userId: string,
  pdfId: string, // External ID or document UUID
  fileName: string,
  options: { clearPrevious?: boolean; version?: number } = {}
): Promise<number> {
  // Ensure the extension and table exist first
  await ensureVectorSetup();

  const chunks = chunkText(pdfText);
  if (chunks.length === 0) return 0;

  // Clear previous version if requested (default to RETAIN)
  if (options.clearPrevious) {
    console.log(`🗑️ [VectorSearch] Clearing previous chunks for user ${userId}...`);
    await db.execute(
      sql`DELETE FROM brand_embeddings WHERE user_id = ${userId}`
    );
  }

  // Get current version to increment, or use provided
  let currentVersion = options.version || 1;
  if (!options.version) {
    const lastVersionRes = await db.execute(sql`
      SELECT MAX(version) as max_v FROM brand_embeddings WHERE user_id = ${userId}
    `);
    currentVersion = (parseInt((lastVersionRes.rows[0] as any)?.max_v || '0')) + 1;
  }

  let indexedCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    let embedding: number[] = [];

    try {
      embedding = await embedText(chunk);
    } catch (e) {
      console.warn(`[VectorSearch] Embedding chunk ${i} failed:`, (e as Error).message);
    }

    const embeddingStr = embedding.length > 0
      ? `[${embedding.join(',')}]`
      : null;

    await db.execute(sql`
      INSERT INTO brand_embeddings (user_id, document_id, source, snippet, embedding, version, created_at)
      VALUES (
        ${userId},
        ${pdfId},
        ${fileName},
        ${chunk},
        ${embeddingStr ? sql`${embeddingStr}::vector` : sql`NULL`},
        ${currentVersion},
        NOW()
      )
    `);

    indexedCount++;
  }

  console.log(`✅ [VectorSearch] Indexed ${indexedCount} chunks (v${currentVersion}) for user: ${userId}`);
  return indexedCount;
}

/**
 * Semantic similarity search using cosine distance on brand_embeddings.
 * Weighted to prioritize newer versions while still considering relevant old memory.
 */
export async function searchSimilarChunks(
  query: string,
  userId: string,
  topK = 5
): Promise<{ content: string; similarity: number; fileName: string; version: number }[]> {
  try {
    let embedding: number[] = [];
    try {
      embedding = await embedText(query);
    } catch (e) {
      console.warn('[VectorSearch] Embedding query failed, falling back to keyword search');
    }

    if (embedding.length > 0) {
      // Semantic cosine similarity search
      // We use (1 - distance) * (version weight) to slightly prefer newer data if similarity is close
      const embeddingStr = `[${embedding.join(',')}]`;
      const result = await db.execute(sql`
        SELECT 
          snippet as content, 
          source as file_name, 
          version,
          (1 - (embedding <=> ${embeddingStr}::vector)) as similarity
        FROM brand_embeddings
        WHERE user_id = ${userId} AND embedding IS NOT NULL
        ORDER BY (1 - (embedding <=> ${embeddingStr}::vector)) * (1 + (version * 0.05)) DESC
        LIMIT ${topK}
      `);

      return result.rows.map((row: any) => ({
        content: row.content,
        fileName: row.file_name,
        version: row.version,
        similarity: parseFloat(row.similarity) || 0,
      }));
    } else {
      // Fallback: keyword search with ILIKE
      const result = await db.execute(sql`
        SELECT snippet as content, source as file_name, version, 0.5 AS similarity
        FROM brand_embeddings
        WHERE user_id = ${userId}
          AND snippet ILIKE ${'%' + query.substring(0, 50) + '%'}
        ORDER BY version DESC
        LIMIT ${topK}
      `);

      return result.rows.map((row: any) => ({
        content: row.content,
        fileName: row.file_name,
        version: row.version,
        similarity: 0.5,
      }));
    }
  } catch (error) {
    console.warn('[VectorSearch] Search failed:', (error as Error).message);
    return [];
  }
}

/**
 * Check if a user has any brand knowledge indexed.
 */
export async function userHasChunks(userId: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT COUNT(*) AS count FROM brand_embeddings WHERE user_id = ${userId} LIMIT 1
    `);
    return parseInt((result.rows[0] as any)?.count || '0') > 0;
  } catch {
    return false;
  }
}

/**
 * Ensure vector extension and appropriate indexes exist.
 * Uses brand_embeddings table from schema.ts.
 */
export async function ensureVectorSetup(): Promise<void> {
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
  } catch (e) {
    console.warn('[VectorSearch] pgvector extension error:', (e as Error).message);
  }

  try {
    // Create vector index on brand_embeddings if it doesn't exist
    // Note: Drizzle defines the table, but we ensure the specialized vector index here
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS brand_embeddings_vector_idx 
      ON brand_embeddings USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `).catch(() => {
      // Index might fail if table is empty or extension not fully ready
    });
  } catch (e) {
    console.warn('[VectorSearch] Index setup alert:', (e as Error).message);
  }
}
