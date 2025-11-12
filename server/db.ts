import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

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
    console.log('✅ PostgreSQL database connected');
  } catch (error) {
    console.warn('⚠️  Database connection failed, running in demo mode:', error);
    db = null;
    pool = null;
  }
} else {
  console.warn('⚠️  DATABASE_URL not set - app will run in demo mode');
  console.log('💡 Add DATABASE_URL to Replit Secrets for full functionality');
}

export { db, pool };
