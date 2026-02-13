
import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function verify() {
  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const rows = (result as any).rows || result;
    console.log(`📊 DATABASE RESET VERIFICATION:`);
    console.log(`Found ${rows.length} tables in public schema.`);
    rows.forEach((row: any) => console.log(`  ✓ ${row.table_name}`));

    if (rows.length > 0) {
      console.log("\n✅ Database schema recreation successful!");
    } else {
      console.log("\n❌ No tables found. Schema recreation might have failed.");
    }
  } catch (error) {
    console.error("❌ Verification failed:", error);
  } finally {
    process.exit(0);
  }
}

verify();
