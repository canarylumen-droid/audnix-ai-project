
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Automated Database Backup Scheduler
 * Runs daily backups automatically
 */
export class BackupScheduler {
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    // Run backup immediately on startup
    this.runBackup();

    // Schedule daily backups at 3 AM
    const scheduleDaily = () => {
      const now = new Date();
      const next3AM = new Date(now);
      next3AM.setHours(3, 0, 0, 0);
      
      if (next3AM <= now) {
        next3AM.setDate(next3AM.getDate() + 1);
      }
      
      const msUntil3AM = next3AM.getTime() - now.getTime();
      
      setTimeout(() => {
        this.runBackup();
        // Schedule next day
        scheduleDaily();
      }, msUntil3AM);
    };

    scheduleDaily();
    console.log('🔄 Automated database backups enabled (daily at 3 AM)');
  }

  async runBackup() {
    try {
      console.log('🔄 Running scheduled database backup...');
      const { stdout, stderr } = await execAsync('npm run backup');
      
      if (stderr) {
        console.error('⚠️  Backup warnings:', stderr);
      }
      
      console.log('✅ Scheduled backup completed');
    } catch (error) {
      console.error('❌ Scheduled backup failed:', error);
    }
  }

  stop() {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Automated backups stopped');
    }
  }
}

export const backupScheduler = new BackupScheduler();
