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
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
    db = drizzle(pool, { schema });
    console.log('✅ PostgreSQL database connected (Neon)');
    console.log('📊 Database:', process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('💡 Check your DATABASE_URL in Replit Secrets');
    db = null;
    pool = null;
  }
} else {
  console.error('❌ DATABASE_URL not set');
  console.error('💡 Add DATABASE_URL to Replit Secrets');
}

export { db, pool };
