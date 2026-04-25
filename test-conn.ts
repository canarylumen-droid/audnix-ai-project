import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function testConn() {
  try {
    const res = await db.execute(sql`SELECT 1 as connected`);
    console.log('✅ Connection successful:', res.rows);
  } catch (err: any) {
    console.error('❌ Connection failed:', err.message);
  }
  process.exit(0);
}

testConn();
