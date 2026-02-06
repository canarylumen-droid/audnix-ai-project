import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";

const { Pool } = pg;

let _db: any = null;
let _pool: any = null;

function initializeDb() {
  if (_db) return { db: _db, pool: _pool };

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn('⚠️ DATABASE_URL not set. Running in demo mode.');
    return { db: null, pool: null };
  }

  try {
    _pool = new Pool({ 
      connectionString: url,
    });
    _db = drizzle(_pool, { schema });
    console.log('✅ PostgreSQL database connected');
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
