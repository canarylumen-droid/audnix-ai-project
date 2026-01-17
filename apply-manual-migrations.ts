import "dotenv/config";
import { getDatabase } from "./server/db.js";
import { sql } from "drizzle-orm";

async function applyMigrations() {
    const db = getDatabase();
    if (!db) {
        console.error("❌ Database could not be initialized.");
        process.exit(1);
    }

    try {
        console.log("🚀 Applying manual migrations to fix schema mismatches...");

        // Fix 'deals' table
        console.log("Updating 'deals' table...");
        await db.execute(sql`
      ALTER TABLE deals 
      ADD COLUMN IF NOT EXISTS meeting_scheduled BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS meeting_url TEXT;
    `);
        console.log("✅ 'deals' table updated.");

        // Fix 'ai_action_logs' table
        console.log("Updating 'ai_action_logs' table...");
        await db.execute(sql`
      ALTER TABLE ai_action_logs 
      ADD COLUMN IF NOT EXISTS decision TEXT,
      ADD COLUMN IF NOT EXISTS intent_score INTEGER,
      ADD COLUMN IF NOT EXISTS timing_score INTEGER,
      ADD COLUMN IF NOT EXISTS confidence REAL,
      ADD COLUMN IF NOT EXISTS reasoning TEXT,
      ADD COLUMN IF NOT EXISTS asset_id UUID,
      ADD COLUMN IF NOT EXISTS asset_type TEXT,
      ADD COLUMN IF NOT EXISTS outcome TEXT,
      ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
    `);

        // Set default value for decision if any rows exist
        await db.execute(sql`
      UPDATE ai_action_logs SET decision = 'act' WHERE decision IS NULL;
      ALTER TABLE ai_action_logs ALTER COLUMN decision SET NOT NULL;
    `);

        console.log("✅ 'ai_action_logs' table updated.");

        console.log("✨ All manual migrations applied successfully.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error applying manual migrations:", error);
        process.exit(1);
    }
}

applyMigrations();
