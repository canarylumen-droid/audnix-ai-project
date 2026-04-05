import 'dotenv/config';
import pgPkg from 'pg';
const { Pool } = pgPkg;

async function alignment() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('❌ DATABASE_URL missing');
        process.exit(1);
    }

    const pool = new Pool({ connectionString: url });
    console.log('🚀 Finalizing Database Schema Alignment (Master Raw SQL)...');

    try {
        // 1. LEADS TABLE REPAIR
        console.log('📦 Repairing "leads" table...');
        await pool.query(`
            ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false;
            ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP;
            ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
            ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "integration_id" UUID REFERENCES "integrations"("id") ON DELETE SET NULL;
            ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "timezone" TEXT;
            ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "calendly_link" TEXT;
            ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "fathom_meeting_id" TEXT;
            ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "snippet" TEXT;
            ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "bio" TEXT;
            ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "organization_id" UUID REFERENCES "organizations"("id") ON DELETE CASCADE;
        `);

        // 2. INTEGRATIONS TABLE REPAIR
        console.log('📦 Repairing "integrations" table...');
        await pool.query(`
            ALTER TABLE "integrations" ADD COLUMN IF NOT EXISTS "health_status" TEXT NOT NULL DEFAULT 'connected';
            ALTER TABLE "integrations" ADD COLUMN IF NOT EXISTS "last_health_error" TEXT;
            ALTER TABLE "integrations" ADD COLUMN IF NOT EXISTS "last_health_check_at" TIMESTAMP;
            ALTER TABLE "integrations" ADD COLUMN IF NOT EXISTS "mailbox_pause_until" TIMESTAMP;
            ALTER TABLE "integrations" ADD COLUMN IF NOT EXISTS "failure_count" INTEGER NOT NULL DEFAULT 0;
            ALTER TABLE "integrations" ADD COLUMN IF NOT EXISTS "daily_limit" INTEGER NOT NULL DEFAULT 50;
            ALTER TABLE "integrations" ADD COLUMN IF NOT EXISTS "spam_risk_score" REAL NOT NULL DEFAULT 0;
            ALTER TABLE "integrations" ADD COLUMN IF NOT EXISTS "ai_autonomous_mode" BOOLEAN NOT NULL DEFAULT false;
            ALTER TABLE "integrations" ADD COLUMN IF NOT EXISTS "reputation_score" INTEGER NOT NULL DEFAULT 100;
            ALTER TABLE "integrations" ADD COLUMN IF NOT EXISTS "warmup_status" TEXT NOT NULL DEFAULT 'none';
            ALTER TABLE "integrations" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now();
        `);

        // 3. MESSAGES TABLE REPAIR
        console.log('📦 Repairing "messages" table...');
        await pool.query(`
            ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "thread_id" UUID;
            ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "subject" TEXT;
            ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "tracking_id" TEXT;
            ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "external_id" TEXT;
            ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "opened_at" TIMESTAMP;
            ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "clicked_at" TIMESTAMP;
            ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "replied_at" TIMESTAMP;
            ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "is_read" BOOLEAN NOT NULL DEFAULT false;
            ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "integration_id" UUID REFERENCES "integrations"("id") ON DELETE SET NULL;
            ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "target_url" TEXT;
            ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "is_ai_draft" BOOLEAN NOT NULL DEFAULT false;
        `);

        // 4. OTHER CORE TABLES
        console.log('📦 Repairing other tables...');
        await pool.query(`
            ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN DEFAULT false;
            ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP;
            ALTER TABLE "prospects" ADD COLUMN IF NOT EXISTS "email_valid" BOOLEAN;
        `);

        console.log('✅ Master Alignment complete.');

    } catch (err) {
        console.error('❌ Alignment failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

alignment();
