import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function fix() {
  console.log("Adding missing columns to 'campaign_leads'...");
  await db.execute(sql`ALTER TABLE campaign_leads ADD COLUMN IF NOT EXISTS created_at timestamp NOT NULL DEFAULT NOW()`);
  await db.execute(sql`ALTER TABLE campaign_leads ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT NOW()`);
  console.log("✅ Fixed missing columns.");
  process.exit(0);
}
fix().catch(console.error);
