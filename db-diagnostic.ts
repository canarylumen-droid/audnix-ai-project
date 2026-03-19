import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function diagnose() {
  console.log('🔍 Database Diagnostic...');
  try {
    const res = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'integrations'
      ORDER BY column_name;
    `);
    console.log('📊 Table: integrations');
    console.table(res.rows);

    const res2 = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_outreach_settings'
      ORDER BY column_name;
    `);
    console.log('📊 Table: user_outreach_settings');
    console.table(res2.rows);

  } catch (err: any) {
    console.error('❌ Diagnostic failed:', err.message);
  } finally {
    process.exit(0);
  }
}

diagnose();
