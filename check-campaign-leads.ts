process.env.REDIS_URL = '';
import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function check() {
  const res = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'campaign_leads' ORDER BY ordinal_position`);
  console.log('campaign_leads columns:');
  for (const r of res.rows) {
    console.log('  -', (r as any).column_name);
  }
  
  // Check what the leads look like now
  const leads = await db.execute(sql`SELECT id, integration_id, status FROM campaign_leads WHERE campaign_id = '99999999-9999-9999-9999-999999999999'`);
  console.log('\nTest campaign leads:');
  for (const l of leads.rows) {
    console.log('  ', JSON.stringify(l));
  }
  
  process.exit(0);
}
check().catch(e => { console.error(e.message); process.exit(1); });
