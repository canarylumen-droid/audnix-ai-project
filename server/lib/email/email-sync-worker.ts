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
 * - Runs every 5 minutes for active users
 * - Imports new emails and creates leads
 * - Detects ghosted leads (no reply in 48+ hours)
 * - Tracks email engagement metrics
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
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly GHOSTED_THRESHOLD_HOURS = 48; // Mark as ghosted after 48 hours

  /**
   * Start the email sync worker
   */
  start(): void {
    if (this.isRunning) {
      console.log('Email sync worker already running');
      return;
    }

    this.isRunning = true;
    console.log('📬 Email sync worker started');
    console.log(`   Sync interval: Every ${this.SYNC_INTERVAL_MS / 60000} minutes`);
    console.log(`   Ghosted threshold: ${this.GHOSTED_THRESHOLD_HOURS} hours`);

    // Run sync every 5 minutes
    this.syncInterval = setInterval(() => {
      this.syncAllUserEmails();
    }, this.SYNC_INTERVAL_MS);

    // Run immediately on start (after 30 second delay to let server start)
    setTimeout(() => this.syncAllUserEmails(), 30000);
  }

  /**
   * Stop the worker
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('📬 Email sync worker stopped');
  }

  /**
   * Sync emails for all users with connected email integrations
   */
  async syncAllUserEmails(): Promise<void> {
    try {
      // Get all users with custom email integrations
      const integrations = await storage.getIntegrationsByProvider('custom_email');

      if (!integrations || integrations.length === 0) {
        return; // No users with connected emails
      }

      console.log(`📬 Syncing emails for ${integrations.length} connected accounts...`);

      for (const integration of integrations) {
        if (!integration.connected) continue;

        try {
          await this.syncUserEmails(integration.userId, integration);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Email sync failed for user ${integration.userId}:`, errorMessage);
        }
      }
      workerHealthMonitor.recordSuccess('email-sync-worker');
    } catch (error: any) {
      console.error('Email sync worker error:', error);
      workerHealthMonitor.recordError('email-sync-worker', error?.message || 'Unknown error');
    }
  }

  /**
   * Sync emails for a specific user
   */
  async syncUserEmails(userId: string, integration: Integration): Promise<SyncResult> {
    const result: SyncResult = {
      userId,
      imported: 0,
      skipped: 0,
      errors: 0,
      ghostedDetected: 0
    };

    try {
      // Decrypt credentials
      const credentialsStr = await decrypt(integration.encryptedMeta);
      const credentials = JSON.parse(credentialsStr) as Record<string, unknown>;

      // Import last 50 emails (recent ones only) from INBOX
      const inboxEmails = await importCustomEmails(credentials as Parameters<typeof importCustomEmails>[0], 50, 15000, 'INBOX');

      // Import Sent emails (if possible) - Try 'Sent' or 'Sent Items'
      // Note: importCustomEmails now logs fail-soft if box not found, returning empty.
      // We start with 'Sent' as generic, but ideally we'd try multiple or accept config.
      // For now, let's try 'Sent Items' as a common default for business email (Office365/Exchange)
      // or 'Sent' for others.
      // Since importCustomEmails logic for recursive search isn't robust yet, let's try 'Sent' first.

      let sentEmails: any[] = [];
      try {
        // Many IMAP servers use "Sent" or "Sent Items".
        // We can try one, if fail, try other?
        // importCustomEmails throws if openBox fails.
        // So we wrap in try/catch block.
        sentEmails = await importCustomEmails(credentials as Parameters<typeof importCustomEmails>[0], 30, 8000, 'Sent Items');
      } catch (err) {
        try {
          sentEmails = await importCustomEmails(credentials as Parameters<typeof importCustomEmails>[0], 30, 8000, 'Sent');
        } catch (e) {
          console.warn(`User ${userId}: Could not sync Sent box`);
        }
      }

      if (inboxEmails.length === 0 && sentEmails.length === 0) {
        return result;
      }

      const mapEmail = (emailData: EmailData) => ({
        from: emailData.from?.split('<')[1]?.split('>')[0] || emailData.from,
        to: emailData.to?.split('<')[1]?.split('>')[0] || emailData.to,
        subject: emailData.subject,
        text: emailData.text || emailData.html || '',
        date: emailData.date,
        html: emailData.html
      });

      // Process Inbound
      const inboundResults = await pagedEmailImport(userId, inboxEmails.map(mapEmail), () => { }, 'inbound');

      // Process Outbound
      const outboundResults = await pagedEmailImport(userId, sentEmails.map(mapEmail), () => { }, 'outbound');

      result.imported = inboundResults.imported + outboundResults.imported;
      result.skipped = inboundResults.skipped + outboundResults.skipped;
      result.errors = inboundResults.errors.length + outboundResults.errors.length;

      // Detect ghosted leads (only relevant if we have outbound context? No, strictly time based)
      result.ghostedDetected = await this.detectGhostedLeads(userId);

      if (result.imported > 0) {
        console.log(`📬 User ${userId}: Imported ${result.imported} emails (Inbox+Sent), ${result.ghostedDetected} ghosted leads detected`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Email sync error for user ${userId}:`, errorMessage);
      result.errors++;
    }

    return result;
  }

  /**
   * Detect leads that haven't replied in 48+ hours
   */
  async detectGhostedLeads(userId: string): Promise<number> {
    try {
      const leads: Lead[] = await storage.getLeads({ userId });
      const now = new Date();
      const thresholdMs = this.GHOSTED_THRESHOLD_HOURS * 60 * 60 * 1000;
      let ghostedCount = 0;

      for (const lead of leads) {
        // Skip if already marked as cold/not_interested
        if (lead.status === 'cold' || lead.status === 'not_interested' || lead.status === 'converted') {
          continue;
        }

        // Check if we sent a message and haven't received a reply
        if (lead.lastMessageAt) {
          const timeSinceMessage = now.getTime() - new Date(lead.lastMessageAt).getTime();

          if (timeSinceMessage > thresholdMs) {
            // Mark as ghosted (cold status)
            await storage.updateLead(lead.id, {
              status: 'cold',
              metadata: {
                ...(lead.metadata as Record<string, unknown>),
                ghostedDetectedAt: now.toISOString(),
                ghostedReason: `No reply in ${this.GHOSTED_THRESHOLD_HOURS}+ hours`
              }
            });
            ghostedCount++;
          }
        }
      }

      return ghostedCount;
    } catch (error) {
      console.error('Ghosted lead detection error:', error);
      return 0;
    }
  }

  /**
   * Get worker status
   */
  getStatus(): { isRunning: boolean; syncIntervalMs: number; ghostedThresholdHours: number } {
    return {
      isRunning: this.isRunning,
      syncIntervalMs: this.SYNC_INTERVAL_MS,
      ghostedThresholdHours: this.GHOSTED_THRESHOLD_HOURS
    };
  }
}

export const emailSyncWorker = new EmailSyncWorker();
