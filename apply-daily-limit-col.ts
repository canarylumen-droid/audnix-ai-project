import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function applyDailyLimitCol() {
  console.log('🚀 Applying daily_limit column to integrations...');
  
  try {
    // Check if column already exists
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'integrations' AND column_name = 'daily_limit'
    `);

    if (checkResult.length === 0) {
      console.log('➕ Adding daily_limit column...');
      await db.execute(sql`
        ALTER TABLE integrations 
        ADD COLUMN daily_limit INTEGER NOT NULL DEFAULT 50
      `);
      console.log('✅ Column added successfully.');
    } else {
      console.log('ℹ️ Column already exists, skipping.');
    }
  } catch (err: any) {
    console.error('❌ Failed to add column:', err.message);
  } finally {
    process.exit(0);
  }
}

applyDailyLimitCol();
