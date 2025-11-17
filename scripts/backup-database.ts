
import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

/**
 * Database Backup Script
 * Creates a SQL dump and uploads to cloud storage (S3-compatible)
 * Run with: npm run backup
 * Or set ENABLE_AUTO_BACKUP=true for daily automatic backups
 */

async function uploadToCloudStorage(filePath: string, fileName: string) {
  // Check if cloud storage is configured
  if (!process.env.BACKUP_S3_BUCKET) {
    console.log('⚠️  No cloud storage configured - backup saved locally only');
    console.log('💡 Set BACKUP_S3_BUCKET, BACKUP_S3_ACCESS_KEY, BACKUP_S3_SECRET_KEY for cloud backups');
    return false;
  }

  try {
    // Dynamic import with fallback if package not installed
    let AWS, Upload;
    try {
      AWS = await import('@aws-sdk/client-s3');
      Upload = (await import('@aws-sdk/lib-storage')).Upload;
    } catch (importError) {
      console.log('⚠️  AWS SDK not installed - cloud backups unavailable');
      return false;
    }
    
    const s3Client = new AWS.S3Client({
      region: process.env.BACKUP_S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.BACKUP_S3_ACCESS_KEY!,
        secretAccessKey: process.env.BACKUP_S3_SECRET_KEY!,
      },
      endpoint: process.env.BACKUP_S3_ENDPOINT, // For DigitalOcean Spaces, Wasabi, etc.
    });

    const fileStream = fs.createReadStream(filePath);
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.BACKUP_S3_BUCKET,
        Key: `audnix-backups/${fileName}`,
        Body: fileStream,
        ContentType: 'application/sql',
      },
    });

    await upload.done();
    console.log(`☁️  Uploaded to cloud storage: ${fileName}`);
    return true;
  } catch (error) {
    console.error('❌ Cloud upload failed:', error);
    return false;
  }
}

async function backupDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const fileName = `backup-${timestamp}.sql`;
    const backupFile = path.join(backupDir, fileName);
    
    console.log('🔄 Starting database backup...');
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    
    // Get all table names
    const tables = await db.execute(sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    let backupSQL = `-- ============================================================================\n`;
    backupSQL += `-- Audnix AI Database Backup\n`;
    backupSQL += `-- Created: ${new Date().toISOString()}\n`;
    backupSQL += `-- Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[1] || 'Unknown'}\n`;
    backupSQL += `-- Tables: ${tables.rows.length}\n`;
    backupSQL += `-- ============================================================================\n\n`;
    
    let totalRows = 0;
    
    // Backup each table
    for (const table of tables.rows as any[]) {
      const tableName = table.tablename;
      console.log(`  📦 Backing up table: ${tableName}`);
      
      // Get table data
      const data = await db.execute(sql.raw(`SELECT * FROM "${tableName}"`));
      totalRows += data.rows.length;
      
      backupSQL += `\n-- ============================================================================\n`;
      backupSQL += `-- Table: ${tableName} (${data.rows.length} rows)\n`;
      backupSQL += `-- ============================================================================\n`;
      
      if (data.rows.length > 0) {
        const columns = Object.keys(data.rows[0]);
        
        // Disable triggers during restore for faster import
        backupSQL += `ALTER TABLE "${tableName}" DISABLE TRIGGER ALL;\n`;
        backupSQL += `DELETE FROM "${tableName}";\n\n`;
        
        // Batch inserts for performance (100 rows per batch)
        const batchSize = 100;
        for (let i = 0; i < data.rows.length; i += batchSize) {
          const batch = data.rows.slice(i, i + batchSize);
          
          for (const row of batch as any[]) {
            const values = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
              if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              if (val instanceof Date) return `'${val.toISOString()}'`;
              return val;
            }).join(', ');
            
            backupSQL += `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values});\n`;
          }
        }
        
        backupSQL += `\nALTER TABLE "${tableName}" ENABLE TRIGGER ALL;\n`;
      } else {
        backupSQL += `-- No data to backup\n`;
      }
    }
    
    // Add restore verification query
    backupSQL += `\n\n-- ============================================================================\n`;
    backupSQL += `-- Restore Verification\n`;
    backupSQL += `-- ============================================================================\n`;
    backupSQL += `SELECT 'Backup restored successfully!' AS status;\n`;
    backupSQL += `SELECT tablename, n_live_tup as row_count FROM pg_stat_user_tables ORDER BY tablename;\n`;
    
    // Write backup to file
    fs.writeFileSync(backupFile, backupSQL);
    
    const sizeInMB = (fs.statSync(backupFile).size / 1024 / 1024).toFixed(2);
    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📁 File: ${backupFile}`);
    console.log(`💾 Size: ${sizeInMB} MB`);
    console.log(`📊 Total rows: ${totalRows.toLocaleString()}`);
    
    // Upload to cloud storage
    const uploaded = await uploadToCloudStorage(backupFile, fileName);
    
    // Keep only last 10 backups locally (cloud storage keeps all)
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
      .sort()
      .reverse();
    
    if (backups.length > 10) {
      console.log('\n🗑️  Cleaning up old local backups...');
      backups.slice(10).forEach(oldBackup => {
        fs.unlinkSync(path.join(backupDir, oldBackup));
        console.log(`  Deleted: ${oldBackup}`);
      });
    }
    
    console.log(`\n📋 Backup Summary:`);
    console.log(`  • Local backup: ${uploaded ? '✅ Saved' : '✅ Saved (only copy)'}`);
    console.log(`  • Cloud backup: ${uploaded ? '✅ Uploaded' : '⚠️  Not configured'}`);
    console.log(`  • Total tables: ${tables.rows.length}`);
    console.log(`  • Total rows: ${totalRows.toLocaleString()}`);
    
    return { success: true, fileName, size: sizeInMB, rows: totalRows };
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

// Auto-backup scheduler (runs daily at 2 AM UTC if enabled)
export async function startAutoBackup() {
  if (process.env.ENABLE_AUTO_BACKUP !== 'true') {
    console.log('⏭️  Auto-backup disabled (set ENABLE_AUTO_BACKUP=true to enable)');
    return;
  }

  console.log('🕐 Auto-backup enabled - scheduling daily backups at 2 AM UTC');
  
  const scheduleNextBackup = () => {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(2, 0, 0, 0);
    
    // If it's past 2 AM today, schedule for tomorrow
    if (now.getUTCHours() >= 2) {
      next.setUTCDate(next.getUTCDate() + 1);
    }
    
    const msUntilBackup = next.getTime() - now.getTime();
    
    setTimeout(async () => {
      console.log('⏰ Running scheduled backup...');
      try {
        await backupDatabase();
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error);
      }
      scheduleNextBackup(); // Schedule next backup
    }, msUntilBackup);
    
    console.log(`⏰ Next backup scheduled for: ${next.toISOString()}`);
  };
  
  scheduleNextBackup();
}

// Run backup if called directly (CommonJS check)
if (typeof require !== 'undefined' && require.main === module) {
  backupDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { backupDatabase, startAutoBackup };
