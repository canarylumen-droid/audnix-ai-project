
import { pgTable, text, timestamp, boolean, uuid, jsonb } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { Pool, neonConfig } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
}

const dbUrl = new URL(process.env.DATABASE_URL);
dbUrl.searchParams.set('uselibpqcompat', 'true');
dbUrl.searchParams.set('sslmode', 'require');
const connectionString = dbUrl.toString();

const pool = new Pool({ connectionString });

async function checkColumns() {
    const client = await pool.connect();
    try {
        console.log("🔍 Checking 'notifications' table columns...");
        const resNotifications = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notifications';
    `);
        console.table(resNotifications.rows);

        console.log("\n🔍 Checking 'onboarding_profiles' table columns...");
        const resProfiles = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'onboarding_profiles';
    `);
        console.table(resProfiles.rows);

    } catch (error) {
        console.error("❌ Error checking columns:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkColumns();
