import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function checkSchema() {
  console.log('🔍 Checking Schema Integrity...');
  const tables = ['users', 'integrations', 'user_outreach_settings', 'bounce_tracker', 'leads', 'campaign_leads'];
  
  for (const table of tables) {
    try {
      const res = await db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = ${table}
      `);
      console.log(`\n📊 Table: ${table}`);
      console.table(res.rows);
    } catch (err: any) {
      console.error(`❌ Table ${table} check failed:`, err.message);
    }
  }
  process.exit(0);
}

checkSchema();
