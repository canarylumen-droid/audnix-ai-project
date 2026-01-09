import { drizzle } from "drizzle-orm/neon-serverless";
import { pool } from "@neondatabase/serverless";
import * as schema from "../shared/schema.js";

// Allow app to run without database (demo mode)
let db: any = null;
let dbPool: any = null;

if (process.env.DATABASE_URL) {
  try {
    dbPool = pool({
      connectionString: process.env.DATABASE_URL,
    });
    db = drizzle(dbPool, { schema });
    console.log('✅ PostgreSQL database connected (Neon Serverless)');
    console.log(`📊 Database: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown'}`);

    // EXPLICIT CONNECTION TEST
    dbPool.query('SELECT NOW()')
      .then(() => console.log('🚀 Database Query Test: SUCCESS'))
      .catch((e: any) => console.error('❌ Database Query Test: FAILED', e));
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('💡 Check your DATABASE_URL in Vercel environment variables');
    db = null;
    dbPool = null;
  }
} else {
  console.error('❌ DATABASE_URL not set');
  console.error('💡 Add DATABASE_URL to Vercel environment variables');
}

export { db, dbPool as pool };
