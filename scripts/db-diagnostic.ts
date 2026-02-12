
import 'dotenv/config';
import { db } from "../server/db";
import { sql } from "drizzle-orm";
import * as fs from 'fs';

async function diagnose() {
  const logFile = 'db-diagnostic.log';
  const log = (msg: string) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
  };

  if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
  
  log("🔍 Checking database columns...");

  try {
    const tables = ['campaign_leads', 'email_messages', 'outreach_campaigns'];
    
    for (const table of tables) {
      log(`\n--- Table: ${table} ---`);
      const result = await db.execute(sql.raw(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
        ORDER BY ordinal_position;
      `));
      
      const rows = (result as any).rows || result;
      if (rows.length === 0) {
        log(`❌ Table ${table} not found!`);
      } else {
        log(`Columns in ${table}:`);
        rows.forEach((row: any) => {
          log(`  - ${row.column_name} (${row.data_type})`);
        });
      }
    }
  } catch (error) {
    log(`❌ Diagnostic failed: ${error}`);
  } finally {
    process.exit(0);
  }
}

diagnose();
