import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function checkAllCols() {
  console.log('--- Database Column Audit ---');
  const res = await db.execute(sql`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    ORDER BY table_name, column_name
  `);
  
  const tables: Record<string, string[]> = {};
  res.rows.forEach((row: any) => {
    if (!tables[row.table_name]) tables[row.table_name] = [];
    tables[row.table_name].push(row.column_name);
  });

  console.log(JSON.stringify(tables, null, 2));
}

checkAllCols().catch(console.error);
