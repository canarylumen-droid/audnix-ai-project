import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function fixUsersSchema() {
  console.log('🛠️ Fixing users table schema...');
  
  const columns = [
    { name: 'supabase_id', type: 'TEXT' },
    { name: 'username', type: 'TEXT' },
    { name: 'avatar', type: 'TEXT' },
    { name: 'company', type: 'TEXT' },
    { name: 'subscription_tier', type: 'TEXT' },
    { name: 'trial_expires_at', type: 'TIMESTAMP' },
    { name: 'stripe_customer_id', type: 'TEXT' },
    { name: 'stripe_subscription_id', type: 'TEXT' },
    { name: 'voice_clone_id', type: 'TEXT' },
    { name: 'voice_minutes_used', type: 'REAL DEFAULT 0' },
    { name: 'voice_minutes_topup', type: 'REAL DEFAULT 0' },
    { name: 'business_name', type: 'TEXT' },
    { name: 'voice_rules', type: 'TEXT' },
    { name: 'pdf_confidence_threshold', type: 'REAL DEFAULT 0.7' },
    { name: 'last_insight_generated_at', type: 'TIMESTAMP' },
    { name: 'last_prospect_scan_at', type: 'TIMESTAMP' },
    { name: 'payment_status', type: 'TEXT DEFAULT \'none\'' },
    { name: 'pending_payment_plan', type: 'TEXT' },
    { name: 'pending_payment_amount', type: 'REAL' },
    { name: 'pending_payment_date', type: 'TIMESTAMP' },
    { name: 'payment_approved_at', type: 'TIMESTAMP' },
    { name: 'stripe_session_id', type: 'TEXT' },
    { name: 'subscription_id', type: 'TEXT' },
    { name: 'last_login', type: 'TIMESTAMP' },
    { name: 'updated_at', type: 'TIMESTAMP DEFAULT NOW()' },
    { name: 'calendar_link', type: 'TEXT' },
    { name: 'brand_guideline_pdf_url', type: 'TEXT' },
    { name: 'brand_guideline_pdf_text', type: 'TEXT' },
    { name: 'config', type: 'JSONB DEFAULT \'{"autonomousMode": false}\'::jsonb' },
    { name: 'filtered_leads_count', type: 'INTEGER DEFAULT 0' },
    { name: 'calendly_access_token', type: 'TEXT' },
    { name: 'calendly_refresh_token', type: 'TEXT' },
    { name: 'calendly_expires_at', type: 'TIMESTAMP' },
    { name: 'calendly_user_uri', type: 'TEXT' },
    { name: 'business_logo', type: 'TEXT' },
    { name: 'intelligence_metadata', type: 'JSONB DEFAULT \'{}\'::jsonb' },
    { name: 'default_payment_link', type: 'TEXT' },
    { name: 'offer_description', type: 'TEXT' },
    { name: 'ai_sticker_followups_enabled', type: 'BOOLEAN DEFAULT TRUE' }
  ];

  for (const col of columns) {
    try {
      await db.execute(sql.raw(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`));
      console.log(`✅ Ensured column: ${col.name}`);
    } catch (err: any) {
      console.error(`❌ Failed to add ${col.name}:`, err.message);
    }
  }
  
  console.log('✨ Users table schema fix complete.');
  process.exit(0);
}

fixUsersSchema();
