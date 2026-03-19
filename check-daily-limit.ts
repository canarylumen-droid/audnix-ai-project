process.env.REDIS_URL = '';
import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function check() {
  const res = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'integrations' ORDER BY ordinal_position`);
  console.log('integrations columns:');
  for (const r of res.rows) {
    console.log('  -', (r as any).column_name);
  }
  
  // Also try a direct SELECT on daily_limit
  console.log('\nDirect SELECT test:');
  try {
    const test = await db.execute(sql`SELECT id, daily_limit FROM integrations LIMIT 3`);
    console.log('SUCCESS - daily_limit exists:', test.rows);
  } catch (e: any) {
    console.error('FAILED:', e.message);
  }
  
  process.exit(0);
}
check().catch(e => { console.error(e.message); process.exit(1); });
