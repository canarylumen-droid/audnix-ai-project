import { storage } from '../../storage.js';
import { decrypt } from '../crypto/encryption.js';
import { importCustomEmails } from '../channels/email.js';
import { pagedEmailImport } from '../imports/paged-email-importer.js';
import { workerHealthMonitor } from '../monitoring/worker-health.js';
import type { Integration, Lead } from '../../../shared/schema.js';

/**
 * Email Sync Worker
 * 
 * Periodically syncs emails from user's connected mailboxes:
 * - Supports Custom IMAP, Gmail, and Outlook
 * - Imports new emails and creates leads
 * - Detects ghosted leads (no reply in 48+ hours)
 */

interface SyncResult {
  userId: string;
  imported: number;
  skipped: number;
  errors: number;
  ghostedDetected: number;
}

interface EmailData {
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
  date?: Date;
}

class EmailSyncWorker {
  private isRunning = false;
  private isSyncing = false;
  private syncTimeout: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 15 * 1000; // 15 seconds polling (increased from 3s to prevent flooding)
  private readonly GHOSTED_THRESHOLD_HOURS = 48; 

  /**
   * Start the email sync worker
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('📬 Email sync worker started');

    this.scheduleNextSync();
  }

  private scheduleNextSync() {
    if (!this.isRunning) return;
    
    this.syncTimeout = setTimeout(async () => {
      if (this.isSyncing) return;
      
      this.isSyncing = true;
      try {
        await this.syncAllUserEmails();
      } catch (e) {
        console.error('Error in email sync loop:', e);
      } finally {
        this.isSyncing = false;
        this.scheduleNextSync();
      }
    }, this.SYNC_INTERVAL_MS);
  }

  /**
   * Stop the worker
   */
  stop(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
    this.isRunning = false;
    console.log('📬 Email sync worker stopped');
  }

  /**
   * Sync emails for all users with connected email integrations
   */
  async syncAllUserEmails(): Promise<void> {
    try {
      const emailProviders = ['custom_email', 'gmail', 'outlook'];
      let integrations: Integration[] = [];

      for (const provider of emailProviders) {
        const found = await storage.getIntegrationsByProvider(provider);
        if (found) integrations = [...integrations, ...found];
      }

      for (const integration of integrations) {
        if (!integration.connected) continue;
        await this.syncUserEmails(integration.userId, integration);
      }
      workerHealthMonitor.recordSuccess('email-sync-worker');
    } catch (error: any) {
      workerHealthMonitor.recordError('email-sync-worker', error?.message || 'Unknown error');
    }
  }

  /**
   * Sync emails for a specific user using IMAP
   */
  async syncUserEmails(userId: string, integration: Integration, limit: number = 500): Promise<SyncResult> {
    const result: SyncResult = { userId, imported: 0, skipped: 0, errors: 0, ghostedDetected: 0 };

    try {
      if (integration.provider === 'custom_email') {
        const credentialsStr = await decrypt(integration.encryptedMeta);
        const credentials = JSON.parse(credentialsStr);

        // Fetch Inbox and Sent messages
        const inboxEmails = await importCustomEmails(credentials, limit, 60000, 'INBOX');
        let sentEmails: any[] = [];
        const sentFolderNames = ['Sent', 'Sent Items', 'Sent Messages', '[Gmail]/Sent Mail', 'Sent-Mail', 'SENT'];

        for (const folder of sentFolderNames) {
          try {
            sentEmails = await importCustomEmails(credentials, Math.floor(limit / 2), 20000, folder);
            if (sentEmails.length > 0) break;
          } catch (e) { }
        }

        const mapEmail = (e: EmailData) => ({
          from: e.from?.split('<')[1]?.split('>')[0] || e.from,
          to: e.to?.split('<')[1]?.split('>')[0] || e.to,
          subject: e.subject,
          text: e.text || e.html || '',
          date: e.date,
          html: e.html
        });

        const inbound = await pagedEmailImport(userId, inboxEmails.map(mapEmail), () => { }, 'inbound');
        const outbound = await pagedEmailImport(userId, sentEmails.map(mapEmail), () => { }, 'outbound');

        if (inbound.imported > 0 || outbound.imported > 0) {
          const { wsSync } = await import('../websocket-sync.js');
          wsSync.notifyMessagesUpdated(userId, { event: 'INSERT', count: inbound.imported + outbound.imported });
          wsSync.notifyActivityUpdated(userId, { type: 'email_sync', count: inbound.imported + outbound.imported });
        }

        result.imported = inbound.imported + outbound.imported;
        result.skipped = inbound.skipped + outbound.skipped;
        result.errors = inbound.errors.length + outbound.errors.length;
      }

      result.ghostedDetected = await this.detectGhostedLeads(userId);
      return result;
    } catch (error: any) {
      console.error(`Sync error for user ${userId}:`, error.message);
      result.errors++;
      return result;
    }
  }

  async detectGhostedLeads(userId: string): Promise<number> {
    try {
      const leads: Lead[] = await storage.getLeads({ userId });
      const now = new Date();
      const threshold = this.GHOSTED_THRESHOLD_HOURS * 60 * 60 * 1000;
      let count = 0;

      for (const lead of leads) {
        if (['cold', 'not_interested', 'converted'].includes(lead.status)) continue;
        if (lead.lastMessageAt) {
          if (now.getTime() - new Date(lead.lastMessageAt).getTime() > threshold) {
            await storage.updateLead(lead.id, {
              status: 'cold',
              metadata: { ...(lead.metadata as object), ghostedDetectedAt: now.toISOString() }
            });
            count++;
          }
        }
      }
      return count;
    } catch (e) { return 0; }
  }

  getStatus() {
    return { isRunning: this.isRunning, syncIntervalMs: this.SYNC_INTERVAL_MS };
  }
}

export const emailSyncWorker = new EmailSyncWorker();
