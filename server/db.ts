import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";

const { Pool } = pg;

// Allow app to run without database (demo mode)
let db: any = null;
let pool: any = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      max: 10,
      keepAlive: true,
      statement_timeout: 30000,
    });
    db = drizzle(pool, { schema });
    console.log('✅ PostgreSQL database connected (Neon)');
    console.log(`📊 Database: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown'}`);
    // EXPLICIT CONNECTION TEST
    pool.query('SELECT NOW()').then(() => console.log('🚀 Database Query Test: SUCCESS')).catch((e: any) => console.error('❌ Database Query Test: FAILED', e));
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('💡 Check your DATABASE_URL in Vercel environment variables');
    db = null;
    pool = null;
  }
} else {
  console.error('❌ DATABASE_URL not set');
  console.error('💡 Add DATABASE_URL to Vercel environment variables');
}

export { db, pool };
