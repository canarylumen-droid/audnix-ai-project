import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function applyAutoRedistributeCol() {
  console.log('🚀 Applying auto_redistribute column to user_outreach_settings...');
  
  try {
    // Check if column already exists
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_outreach_settings' AND column_name = 'auto_redistribute'
    `);

    if (checkResult.length === 0) {
      console.log('➕ Adding auto_redistribute column...');
      await db.execute(sql`
        ALTER TABLE user_outreach_settings 
        ADD COLUMN auto_redistribute BOOLEAN NOT NULL DEFAULT TRUE
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

applyAutoRedistributeCol();
