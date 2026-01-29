import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "../shared/schema.js";
import ws from "ws";

// CRITICAL: Configure neon to use ws for pooling in Node environments
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

  // Handle SSL mode security warning by explicitly using verify-full and libpq compat
  const dbUrl = new URL(url);
  dbUrl.searchParams.set('uselibpqcompat', 'true');
  if (!dbUrl.searchParams.has('sslmode')) {
    dbUrl.searchParams.set('sslmode', 'verify-full');
  } else if (['prefer', 'require', 'verify-ca'].includes(dbUrl.searchParams.get('sslmode') || '')) {
    dbUrl.searchParams.set('sslmode', 'verify-full');
  }
  const connectionString = dbUrl.toString();

  try {
    _pool = new Pool({ connectionString });
    _db = drizzle(_pool, { schema });
    console.log('✅ PostgreSQL database connected (Neon Serverless - Live Protocol)');
    return { db: _db, pool: _pool };
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return { db: null, pool: null };
  }
}

// For compatibility with existing imports
const result = initializeDb();
export const db = result.db;
export const pool = result.pool;

// Add a getter for dynamic access (useful for scripts)
export function getDatabase() {
  if (!_db) return initializeDb().db;
  return _db;
}
