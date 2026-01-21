
import 'dotenv/config'; // Load .env file
import { db } from "../server/db";
import { users } from "../shared/schema";
import { sql } from "drizzle-orm";

async function resetDatabase() {
    console.log("⚠️  Starting Database Reset (Users & Sessions)...");

    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is missing even after dotenv load.");
        process.exit(1);
    }

    try {
        console.log("🗑️  Clearing 'users' table and cascading...");

        // We try to truncate 'users' and 'session' (if exists) 
        await db.execute(sql`TRUNCATE TABLE ${users}, "session" CASCADE;`);

        console.log("✅ Database reset complete. All users and sessions cleared.");
    } catch (error: any) {
        if (error.message.includes('"session" does not exist')) {
            console.log("⚠️ 'session' table not found, just truncating 'users'...");
            try {
                await db.execute(sql`TRUNCATE TABLE ${users} CASCADE;`);
                console.log("✅ Database reset complete.");
            } catch (innerError) {
                console.error("❌ Reset failed during fallback:", innerError);
                process.exit(1);
            }
        } else {
            console.error("❌ Reset failed:", error);
            process.exit(1);
        }
    }
}

resetDatabase();
