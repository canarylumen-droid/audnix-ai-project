
import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

/**
 * Database Backup Script
 * Creates a SQL dump of the entire database
 * Run with: npm run backup
 */

async function backupDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);
    
    console.log('🔄 Starting database backup...');
    
    // Get all table names
    const tables = await db.execute(sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    let backupSQL = `-- Audnix AI Database Backup\n`;
    backupSQL += `-- Created: ${new Date().toISOString()}\n\n`;
    
    // Backup each table
    for (const table of tables.rows as any[]) {
      const tableName = table.tablename;
      console.log(`  📦 Backing up table: ${tableName}`);
      
      // Get table schema
      const schema = await db.execute(sql.raw(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
      `));
      
      // Get table data
      const data = await db.execute(sql.raw(`SELECT * FROM "${tableName}"`));
      
      backupSQL += `\n-- Table: ${tableName}\n`;
      backupSQL += `-- Rows: ${data.rows.length}\n`;
      
      if (data.rows.length > 0) {
        const columns = Object.keys(data.rows[0]);
        backupSQL += `DELETE FROM "${tableName}";\n`;
        
        for (const row of data.rows as any[]) {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return val;
          }).join(', ');
          
          backupSQL += `INSERT INTO "${tableName}" (${columns.join(', ')}) VALUES (${values});\n`;
        }
      }
    }
    
    // Write backup to file
    fs.writeFileSync(backupFile, backupSQL);
    
    const sizeInMB = (fs.statSync(backupFile).size / 1024 / 1024).toFixed(2);
    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📁 File: ${backupFile}`);
    console.log(`💾 Size: ${sizeInMB} MB`);
    
    // Keep only last 10 backups
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
      .sort()
      .reverse();
    
    if (backups.length > 10) {
      console.log('\n🗑️  Cleaning up old backups...');
      backups.slice(10).forEach(oldBackup => {
        fs.unlinkSync(path.join(backupDir, oldBackup));
        console.log(`  Deleted: ${oldBackup}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

backupDatabase();
