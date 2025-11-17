
import { db } from '../server/db';
import fs from 'fs';
import path from 'path';

/**
 * Database Restore Script
 * Restores database from a backup file
 * Run with: npm run restore -- backup-2024-01-15.sql
 */

async function restoreDatabase(backupFileName: string) {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    const backupFile = path.join(backupDir, backupFileName);
    
    if (!fs.existsSync(backupFile)) {
      console.error(`❌ Backup file not found: ${backupFile}`);
      console.log('\n📁 Available backups:');
      const backups = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.sql'))
        .sort()
        .reverse();
      backups.forEach(b => console.log(`  • ${b}`));
      process.exit(1);
    }
    
    console.log('🔄 Starting database restore...');
    console.log(`📁 Backup file: ${backupFileName}`);
    console.log('⚠️  WARNING: This will DELETE all existing data!');
    
    // Read backup SQL
    const backupSQL = fs.readFileSync(backupFile, 'utf-8');
    
    console.log('⏳ Executing restore...');
    await db.execute(backupSQL as any);
    
    console.log('\n✅ Database restored successfully!');
    console.log('📊 Verifying data...');
    
    // Verify restore
    const verification = await db.execute(`
      SELECT tablename, n_live_tup as row_count 
      FROM pg_stat_user_tables 
      ORDER BY tablename
    ` as any);
    
    console.log('\n📋 Database tables:');
    for (const row of verification.rows as any[]) {
      console.log(`  • ${row.tablename}: ${row.row_count.toLocaleString()} rows`);
    }
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
    process.exit(1);
  }
}

const backupFileName = process.argv[2];
if (!backupFileName) {
  console.error('❌ Usage: npm run restore -- backup-2024-01-15.sql');
  process.exit(1);
}

restoreDatabase(backupFileName);
