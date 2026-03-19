process.env.REDIS_URL = '';
import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function check() {
  const res = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'audit_trail' ORDER BY ordinal_position`);
  console.log('audit_trail columns:');
  for (const r of res.rows) {
    console.log('  -', (r as any).column_name);
  }
  process.exit(0);
}
check().catch(e => { console.error(e.message); process.exit(1); });
