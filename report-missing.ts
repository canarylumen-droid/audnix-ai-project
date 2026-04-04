import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';
import * as schema from './shared/schema.js';
import { getTableConfig } from 'drizzle-orm/pg-core';
import fs from 'fs';

async function generateReport() {
  const dbRes = await db.execute(sql`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'`);
  const dbCols = new Set();
  dbRes.rows.forEach((r: any) => dbCols.add(`${r.table_name}.${r.column_name}`));
  
  const missingTables: string[] = [];
  const missingColumns: string[] = [];
  const checked = new Set();
  
  for (const [key, val] of Object.entries(schema)) {
    if (val && typeof val === 'object' && (val as any).constructor && ((val as any).constructor.name === 'PgTable' || 'config' in (val as any))) {
       const config = getTableConfig(val as any);
       if (checked.has(config.name)) continue;
       checked.add(config.name);
       
       let tableExists = false;
       for(const {table_name} of dbRes.rows as any[]) {
          if(table_name === config.name) tableExists = true;
       }
       if (!tableExists) {
         missingTables.push(config.name);
       } else {
         for (const col of config.columns) {
           if (!dbCols.has(`${config.name}.${col.name}`)) {
             missingColumns.push(`${config.name}.${col.name}`);
           }
         }
       }
    }
  }
  
  fs.writeFileSync('schema_report.json', JSON.stringify({ missingTables, missingColumns }, null, 2));
  console.log("REPORT SAVED");
  process.exit(0);
}
generateReport().catch(console.error);
