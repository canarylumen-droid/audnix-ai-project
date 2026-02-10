import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "../shared/schema.js";
import ws from "ws";

// Configure neon to use ws for pooling in Node environments
neonConfig.webSocketConstructor = ws;

let _db: any = null;
let _pool: any = null;

function initializeDb() {
  if (_db) return { db: _db, pool: _pool };

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn('⚠️ DATABASE_URL not set. Running in demo mode.');
    return { db: null, pool: null };
  }

  // Neon-specific optimizations for Vercel/Neon deployment
  const dbUrl = new URL(url);
  if (url.includes('neon.tech')) {
    dbUrl.searchParams.set('sslmode', 'verify-full');
  }
  const connectionString = dbUrl.toString();

  try {
    _pool = new Pool({
      connectionString,
      ssl: url.includes('neon.tech') ? { rejectUnauthorized: true } : false
    });
    _db = drizzle(_pool, { schema });
    console.log('✅ PostgreSQL database connected (Neon Serverless compatibility restored)');
    return { db: _db, pool: _pool };
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return { db: null, pool: null };
  }
}

const result = initializeDb();
export const db = result.db;
export const pool = result.pool;

export function getDatabase() {
  if (!_db) return initializeDb().db;
  return _db;
}
