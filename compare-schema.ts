import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';
import * as schema from './shared/schema.js';
import { getTableConfig } from 'drizzle-orm/pg-core';

async function syncSchema() {
  console.log('--- Schema Synchronization Audit ---');
  
  // Get all tables and columns from DB
  const dbRes = await db.execute(sql`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
  `);
  
  const dbSchema: Record<string, Set<string>> = {};
  dbRes.rows.forEach((row: any) => {
    if (!dbSchema[row.table_name]) dbSchema[row.table_name] = new Set();
    dbSchema[row.table_name].add(row.column_name);
  });

  const missing: string[] = [];
  const checkedTables = new Set<string>();

  // Iterate over schema exports
  for (const [key, value] of Object.entries(schema)) {
    try {
      // Check if it's a Drizzle table
      if (value && typeof value === 'object' && (value as any).constructor?.name === 'PgTable' || ('config' in (value as any) && (value as any).config)) {
        const config = getTableConfig(value as any);
        const actualTableName = config.name;
        
        if (checkedTables.has(actualTableName)) continue;
        checkedTables.add(actualTableName);

        const columns = config.columns;
        console.log(`Checking table: ${actualTableName} (${columns.length} columns)`);

        if (!dbSchema[actualTableName]) {
          missing.push(`Table MISSING: ${actualTableName}`);
          continue;
        }

        for (const col of columns) {
          if (!dbSchema[actualTableName].has(col.name)) {
            missing.push(`Column MISSING: ${actualTableName}.${col.name}`);
          }
        }
      }
    } catch (e) {
      // Not a table
    }
  }

  if (missing.length === 0) {
    console.log('\n✅ Database schema matches Drizzle schema!');
  } else {
    console.log('\n❌ Discrepancies found:');
    missing.forEach(m => console.log(m));
  }
}

syncSchema().catch(console.error);
