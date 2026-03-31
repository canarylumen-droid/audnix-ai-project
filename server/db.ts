import { drizzle } from "drizzle-orm/node-postgres";
import pgPkg from "pg";
const { Pool } = pgPkg;
import * as schema from "../shared/schema.js";
import { quotaService } from "./lib/monitoring/quota-service.js";

let _db: any = null;
let _pool: any = null;

function initializeDb() {
  if (_db) return { db: _db, pool: _pool };

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn('⚠️ DATABASE_URL not set. Running in demo mode.');
    return { db: null, pool: null };
  }

  const connectionString = url;

  try {
    _pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });

    _pool.on('error', (err: any) => {
      console.error('🚨 [DB POOL ERROR]', err.message || err);
      quotaService.reportDbError(err);
    });

    _db = drizzle(_pool, { schema });
    console.log('✅ PostgreSQL database initialized (Neon Serverless)');
    return { db: _db, pool: _pool };
  } catch (error: any) {
    console.error('❌ Database initialization failed:', error.message || error);
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
