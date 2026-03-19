import 'dotenv/config';
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function applyBounceIntegrationCol() {
  console.log('🚀 Applying integration_id column to bounce_tracker...');
  
  try {
    // Check if column already exists
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bounce_tracker' AND column_name = 'integration_id'
    `);

    if (checkResult.length === 0) {
      console.log('➕ Adding integration_id column...');
      await db.execute(sql`
        ALTER TABLE bounce_tracker 
        ADD COLUMN integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE
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

applyBounceIntegrationCol();
