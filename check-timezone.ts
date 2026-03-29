import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function checkTimezone() {
  const res = await db.execute(sql`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema='public' AND column_name='timezone'
    ORDER BY table_name
  `);
  console.log('Tables WITH timezone column:');
  res.rows.forEach((r: any) => console.log(' -', r.table_name));
  
  // Also check user_outreach_settings specifically
  const ous = await db.execute(sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='user_outreach_settings'
    ORDER BY column_name
  `);
  console.log('\nColumns in user_outreach_settings:');
  ous.rows.forEach((r: any) => console.log(' -', r.column_name));
}

checkTimezone().catch(console.error);
