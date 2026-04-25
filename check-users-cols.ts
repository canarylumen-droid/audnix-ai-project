import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function checkUsersTable() {
  const columns = [
    "id", "supabase_id", "email", "password", "name", "username", "avatar", "company", "timezone", 
    "plan", "subscription_tier", "trial_expires_at", "reply_tone", "role", "stripe_customer_id", 
    "stripe_subscription_id", "voice_clone_id", "voice_minutes_used", "voice_minutes_topup", 
    "business_name", "voice_rules", "pdf_confidence_threshold", "last_insight_generated_at", 
    "last_prospect_scan_at", "payment_status", "pending_payment_plan", "pending_payment_amount", 
    "pending_payment_date", "payment_approved_at", "stripe_session_id", "subscription_id", 
    "metadata", "created_at", "last_login", "updated_at", "calendar_link", "brand_guideline_pdf_url", 
    "brand_guideline_pdf_text", "config", "filtered_leads_count", "calendly_access_token", 
    "calendly_refresh_token", "calendly_expires_at", "calendly_user_uri", "business_logo", 
    "intelligence_metadata", "default_payment_link", "offer_description", "ai_sticker_followups_enabled"
  ];

  console.log('🧪 Checking users table columns...');
  for (const col of columns) {
    try {
      await db.execute(sql.raw(`SELECT ${col} FROM users LIMIT 1`));
      // console.log(`✅ ${col} exists`);
    } catch (err: any) {
      console.error(`❌ Column missing: ${col} - ${err.message}`);
    }
  }
  process.exit(0);
}

checkUsersTable();
