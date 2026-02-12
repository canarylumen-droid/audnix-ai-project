import { db } from '../../db.js';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
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

        await migrate(db, { migrationsFolder });
        console.log("✨ Database migrations completed successfully");
    } catch (error: any) {
        // Handle "already exists" errors gracefully as they often occur during concurrent startup
        const isAlreadyExists = error.code === '42P07' || 
                               error.code === '42710' || 
                               error.message?.includes('already exists');
        
        if (isAlreadyExists) {
            console.log("✅ Database schema already contains requested objects. (Pre-flight check passed)");
        } else {
            console.error("❌ Database migration failed:", error);
            // We don't throw here to allow the app to attempt to start anyway,
            // but we log the error loudly.
        }
    }
}
