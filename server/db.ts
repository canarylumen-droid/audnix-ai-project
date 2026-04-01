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

  // Normalize connection string for SSL compatibility
  let connectionString: string;
  try {
    const dbUrl = new URL(url);
    const isNeon = url.includes('neon.tech');

    if (isNeon) {
      // Neon requires uselibpqcompat + require for libpq-standard behavior
      dbUrl.searchParams.set('uselibpqcompat', 'true');
      if (!dbUrl.searchParams.has('sslmode')) {
        dbUrl.searchParams.set('sslmode', 'require');
      }
    } else if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      // Standard PostgreSQL: use explicit verify-full to silence pg v9 deprecation warning
      if (!dbUrl.searchParams.has('sslmode')) {
        dbUrl.searchParams.set('sslmode', 'verify-full');
      }
    }

    connectionString = dbUrl.toString();
  } catch (urlError) {
    console.error('❌ Invalid DATABASE_URL format:', url);
    connectionString = url;
  }

  const isProduction = url.includes('neon.tech') || process.env.NODE_ENV === "production";
  try {
    _pool = new Pool({
      connectionString,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
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
