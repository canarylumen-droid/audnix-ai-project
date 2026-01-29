import "dotenv/config";
import { getDatabase } from "./server/db.js";
import { sql } from "drizzle-orm";

async function fixMissingColumns() {
    const db = getDatabase();
    if (!db) {
        console.error("❌ Database could not be initialized.");
        process.exit(1);
    }

    try {
        console.log("🚀 Adding missing columns to fix schema issues...");

        // Add company column to users table if it doesn't exist
        console.log("Checking users table...");
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS company TEXT`);
        console.log("✅ Ensured 'company' column exists in users table");

        // Add company column to leads table if it doesn't exist  
        console.log("Checking leads table...");
        await db.execute(sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS company TEXT`);
        console.log("✅ Ensured 'company' column exists in leads table");

        // Add role column to leads table if it doesn't exist
        console.log("Checking leads.role column...");
        await db.execute(sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS role TEXT`);
        console.log("✅ Ensured 'role' column exists in leads table");

        // Add bio column to leads table if it doesn't exist
        console.log("Checking leads.bio column...");
        await db.execute(sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS bio TEXT`);
        console.log("✅ Ensured 'bio' column exists in leads table");

        console.log("✨ Schema fix completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error fixing schema:", error);
        process.exit(1);
    }
}

fixMissingColumns();
