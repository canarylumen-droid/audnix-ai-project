import "dotenv/config";
import { getDatabase } from "./server/db.js";
import { sql } from "drizzle-orm";

async function checkSchema() {
    const db = getDatabase();
    if (!db) {
        console.error("❌ Database could not be initialized. Check DATABASE_URL.");
        process.exit(1);
    }
    try {
        console.log("Checking 'deals' table...");
        const dealsCols = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'deals'
    `);
        console.log("Deals columns:", JSON.stringify(dealsCols.rows, null, 2));

        console.log("\nChecking 'ai_action_logs' table...");
        const aiLogsCols = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ai_action_logs'
    `);
        console.log("AI Action Logs columns:", JSON.stringify(aiLogsCols.rows, null, 2));

        process.exit(0);
    } catch (error) {
        console.error("Error checking schema:", error);
        process.exit(1);
    }
}

checkSchema();
