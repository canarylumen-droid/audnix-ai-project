import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';
import * as schema from './shared/schema.js';
import { getTableConfig } from 'drizzle-orm/pg-core';

async function check() {
  const dbRes = await db.execute(sql`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'`);
  const dbSchema: Record<string, string[]> = {};
  dbRes.rows.forEach((row: any) => {
    if (!dbSchema[row.table_name]) dbSchema[row.table_name] = [];
    dbSchema[row.table_name].push(row.column_name);
  });
  
  const checkedTables = new Set();
  const missing = [];
  for (const [key, value] of Object.entries(schema)) {
    try {
      if (value && typeof value === 'object' && ('config' in (value as any) && (value as any).config)) {
        const config = getTableConfig(value as any);
        const tableName = config.name;
        if (checkedTables.has(tableName)) continue;
        checkedTables.add(tableName);
        
        if (!dbSchema[tableName]) {
          missing.push({ type: 'table', name: tableName });
          continue;
        }
        for (const col of config.columns) {
          if (!dbSchema[tableName].includes(col.name)) {
            missing.push({ type: 'column', table: tableName, name: col.name });
          }
        }
      }
    } catch (e) {}
  }
  console.log("FINAL_RESULT=" + JSON.stringify(missing));
  process.exit(0);
}
check().catch(console.error);
