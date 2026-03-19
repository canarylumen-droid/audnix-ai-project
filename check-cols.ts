import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function check() {
  console.log('--- Table: integrations ---');
  const res1 = await db.execute(sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'integrations'`);
  console.log(JSON.stringify(res1.rows, null, 2));

  console.log('\n--- Table: user_outreach_settings ---');
  const res2 = await db.execute(sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_outreach_settings'`);
  console.log(JSON.stringify(res2.rows, null, 2));
}

check().catch(console.error);
