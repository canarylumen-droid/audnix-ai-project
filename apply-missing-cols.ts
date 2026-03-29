import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function applyMissingColumns() {
  console.log('--- Applying Missing Database Columns ---\n');

  const migrations = [
    // integrations table
    {
      label: 'integrations.ai_autonomous_mode',
      query: sql`ALTER TABLE integrations ADD COLUMN IF NOT EXISTS ai_autonomous_mode BOOLEAN NOT NULL DEFAULT FALSE`
    },
    {
      label: 'integrations.reputation_score',
      query: sql`ALTER TABLE integrations ADD COLUMN IF NOT EXISTS reputation_score INTEGER NOT NULL DEFAULT 100`
    },
    {
      label: 'integrations.warmup_status',
      query: sql`ALTER TABLE integrations ADD COLUMN IF NOT EXISTS warmup_status TEXT NOT NULL DEFAULT 'none'`
    },
    // leads table
    {
      label: 'leads.timezone',
      query: sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS timezone TEXT`
    },
    {
      label: 'leads.calendly_link',
      query: sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS calendly_link TEXT`
    },
    {
      label: 'leads.fathom_meeting_id',
      query: sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS fathom_meeting_id TEXT`
    },
    // outreach_campaigns table
    {
      label: 'outreach_campaigns.ai_autonomous_mode',
      query: sql`ALTER TABLE outreach_campaigns ADD COLUMN IF NOT EXISTS ai_autonomous_mode BOOLEAN NOT NULL DEFAULT FALSE`
    },
  ];

  let success = 0;
  let failed = 0;

  for (const migration of migrations) {
    try {
      await db.execute(migration.query);
      console.log(`✅ Added: ${migration.label}`);
      success++;
    } catch (err: any) {
      console.error(`❌ Failed: ${migration.label} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\n--- Done: ${success} added, ${failed} failed ---`);
}

applyMissingColumns().catch(console.error);
