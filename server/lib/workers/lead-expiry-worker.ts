import { db } from '../../db.js';
import { leads } from '../../../shared/schema.js';
import { eq, and, sql, lt } from 'drizzle-orm';
import { wsSync } from '../websocket-sync.js';
import { workerHealthMonitor } from '../monitoring/worker-health.js';

/**
 * Lead Expiry Worker
 * 
 * Periodically checks for leads with 'new' status that were created
 * more than 6 hours ago and transitions them to 'open' status.
 */
export class LeadExpiryWorker {
  private isRunning: boolean = false;
  private interval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 30 * 60 * 1000; // Check every 30 minutes
  private readonly EXPIRY_HOURS = 6;

  /**
   * Start the lead expiry worker
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🕒 Lead Expiry Worker started (6-hour timeout)');

    this.interval = setInterval(() => this.tick(), this.CHECK_INTERVAL_MS);
    this.tick(); // Run immediately on start
  }

  /**
   * Stop the worker
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('🛑 Lead Expiry Worker stopped');
  }

  /**
   * Single check iteration
   */
  async tick(): Promise<void> {
    try {
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() - this.EXPIRY_HOURS);

      // Find leads that are 'new' and older than 6 hours
      const expiredLeads = await db
        .select({ id: leads.id, userId: leads.userId })
        .from(leads)
        .where(
          and(
            eq(leads.status, 'new'),
            lt(leads.createdAt, expiryTime)
          )
        );

      if (expiredLeads.length > 0) {
        console.log(`🕒 Expiring 'new' status for ${expiredLeads.length} leads...`);

        // Batch update status to 'open'
        const leadIds = expiredLeads.map((l: { id: string }) => l.id);
        await db.update(leads)
          .set({ status: 'open', updatedAt: new Date() })
          .where(sql`id IN (${sql.join(leadIds, sql`, `)})`);

        // Notify users via WebSocket
        const uniqueUserIds = [...new Set(expiredLeads.map((l: { userId: string }) => l.userId))];
        for (const userId of uniqueUserIds) {
          wsSync.notifyLeadsUpdated(userId as string, { action: 'status_expired' });
        }
      }

      workerHealthMonitor.recordSuccess('lead-expiry-worker');
    } catch (error: any) {
      console.error('[LeadExpiryWorker] Tick error:', error);
      workerHealthMonitor.recordError('lead-expiry-worker', error?.message || 'Unknown error');
    }
  }
}

export const leadExpiryWorker = new LeadExpiryWorker();
