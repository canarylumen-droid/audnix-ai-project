import { db } from '../../db.js';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { sql } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Runs database migrations using the active Neon serverless connection.
 * This method is safer for Vercel environments than spawning a child process.
 */
export async function runDatabaseMigrations() {
    console.log("🚀 Starting database migrations (direct integration)...");
    
    // Find migrations folder relative to this file
    // In source: server/lib/db/migrator.ts -> ../../../migrations
    // In dist: dist/server/lib/db/migrator.js -> ../../../../migrations (likely)
    const possiblePaths = [
        path.join(process.cwd(), "migrations"),
        path.join(__dirname, "..", "..", "..", "migrations"),
        path.join(__dirname, "..", "..", "..", "..", "migrations"),
    ];

    let migrationsFolder = "";
    for (const p of possiblePaths) {
        if (fs.existsSync(p) && fs.existsSync(path.join(p, "meta", "_journal.json"))) {
            migrationsFolder = p;
            break;
        }
    }

    if (!migrationsFolder) {
        console.error("❌ Migrations folder not found! Searched in:", possiblePaths);
        return;
    }

    console.log(`📂 Using migrations from: ${migrationsFolder}`);

    try {
        if (!db) {
            console.warn("⚠️ Database not initialized. Skipping migrations.");
            return;
        }

        // 1. First, attempt the Drizzle-managed migration
        await migrate(db, { migrationsFolder });
        console.log("✨ Database migrations completed successfully");
    } catch (error: any) {
        console.warn("⚠️ Drizzle migration reported an issue:", error.message || error);
        
        // 2. Emergency fallback: Directly ensure critical columns exist
        // This handles cases where the migration journal might be out of sync
        console.log("🛠️ Running emergency schema synchronization...");
        try {
            await db.execute(sql`
                DO $$ 
                BEGIN
                    -- Leads: archived
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='archived') THEN
                        ALTER TABLE leads ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false;
                    END IF;
                    
                    -- Outreach: stats
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='outreach_campaigns') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='outreach_campaigns' AND column_name='stats') THEN
                            ALTER TABLE outreach_campaigns ADD COLUMN stats jsonb DEFAULT '{"total": 0, "sent": 0, "replied": 0, "bounced": 0}'::jsonb;
                        END IF;
                    END IF;

                    -- Deals: deal_value
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='deal_value') THEN
                        ALTER TABLE deals ADD COLUMN deal_value INTEGER DEFAULT 0;
                    END IF;
                END $$;
            `);
            console.log("✅ Emergency schema synchronization completed.");
        } catch (emergencyError: any) {
            console.error("❌ Emergency schema synchronization failed:", emergencyError.message || emergencyError);
        }

        const isAlreadyExists = error.code === '42P07' || 
                               error.code === '42710' || 
                               error.message?.includes('already exists');
        
        if (isAlreadyExists) {
            console.log("✅ Database schema appears to be up to date (soft-fail handled).");
        }
    }
}
