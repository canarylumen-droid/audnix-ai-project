import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function applyPhase2Schema() {
  console.log('🚀 Applying consolidated Phase 2 schema updates...');
  
  try {
    // 1. daily_limit in integrations
    console.log('🔹 Checking integrations.daily_limit...');
    await db.execute(sql`
      ALTER TABLE integrations 
      ADD COLUMN IF NOT EXISTS daily_limit INTEGER NOT NULL DEFAULT 50
    `);
    console.log('✅ integrations.daily_limit ensured.');

    // 2. auto_redistribute in user_outreach_settings
    console.log('🔹 Checking user_outreach_settings.auto_redistribute...');
    await db.execute(sql`
      ALTER TABLE user_outreach_settings 
      ADD COLUMN IF NOT EXISTS auto_redistribute BOOLEAN NOT NULL DEFAULT TRUE
    `);
    console.log('✅ user_outreach_settings.auto_redistribute ensured.');

    // 3. integration_id in bounce_tracker
    console.log('🔹 Checking bounce_tracker.integration_id...');
    await db.execute(sql`
      ALTER TABLE bounce_tracker 
      ADD COLUMN IF NOT EXISTS integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE
    `);
    console.log('✅ bounce_tracker.integration_id ensured.');

    // Note: daily_limit exists on BOTH integrations AND user_outreach_settings (schema requires both)

  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    process.exit(0);
  }
}

applyPhase2Schema();
