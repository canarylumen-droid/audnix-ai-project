import { storage } from '../../storage.js';
import { decrypt } from '../crypto/encryption.js';
import { importCustomEmails } from '../channels/email.js';
import { pagedEmailImport } from '../imports/paged-email-importer.js';
import { workerHealthMonitor } from '../monitoring/worker-health.js';
import type { Integration, Lead } from '../../../shared/schema.js';
import { Buffer } from 'buffer';

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
  private readonly SYNC_INTERVAL_MS = 30 * 1000; // Updated to match dashboard sync interval
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
   * Sync emails for a specific user
   */
  async syncUserEmails(userId: string, integration: Integration, limit: number = 5000): Promise<SyncResult> {
    const result: SyncResult = { userId, imported: 0, skipped: 0, errors: 0, ghostedDetected: 0 };

    try {
      if (integration.provider === 'custom_email') {
        const syncRes = await this.syncCustomMessages(userId, integration, limit);
        result.imported += syncRes.imported || 0;
        result.skipped += syncRes.skipped || 0;
        result.errors += syncRes.errors || 0;
      } else if (integration.provider === 'gmail') {
        const syncRes = await this.syncGmailMessages(userId, integration, limit);
        result.imported += syncRes.imported || 0;
        result.skipped += syncRes.skipped || 0;
        result.errors += syncRes.errors || 0;
      } else if (integration.provider === 'outlook') {
        const syncRes = await this.syncOutlookMessages(userId, integration, limit);
        result.imported += syncRes.imported || 0;
        result.skipped += syncRes.skipped || 0;
        result.errors += syncRes.errors || 0;
      }

      if (result.imported > 0) {
        const { wsSync } = await import('../websocket-sync.js');
        wsSync.notifyMessagesUpdated(userId, { event: 'INSERT', count: result.imported });
        wsSync.notifyActivityUpdated(userId, { type: 'email_sync', count: result.imported });
      }

      result.ghostedDetected = await this.detectGhostedLeads(userId);
      return result;
    } catch (error: any) {
      console.error(`Sync error for user ${userId}:`, error.message);
      result.errors++;
      return result;
    }
  }

  /**
   * Fetch latest emails using IMAP for custom business emails
   */
  private async syncCustomMessages(userId: string, integration: Integration, limit: number): Promise<Partial<SyncResult>> {
    const res = { imported: 0, skipped: 0, errors: 0 };
    try {
      const { imapIdleManager } = await import('./imap-idle-manager.js');
      const credentialsStr = await decrypt(integration.encryptedMeta);
      const credentials = JSON.parse(credentialsStr);

      const discoveredFolders = imapIdleManager.getDiscoveredFolders(userId);
      const inboxFolders = discoveredFolders?.inbox || ['INBOX'];
      const sentFolders = discoveredFolders?.sent || ['Sent', 'Sent Items', 'Sent Messages', '[Gmail]/Sent Mail', 'Sent-Mail', 'SENT'];

      const mapEmail = (e: EmailData) => ({
        from: e.from?.split('<')[1]?.split('>')[0] || e.from,
        to: e.to?.split('<')[1]?.split('>')[0] || e.to,
        subject: e.subject,
        text: e.text || e.html || '',
        date: e.date,
        html: e.html
      });

      // 1. Sync Inbox Folders
      for (const folder of inboxFolders) {
        try {
          const emails = await importCustomEmails(credentials, limit, 30000, folder);
          if (emails.length > 0) {
            const result = await pagedEmailImport(userId, emails.map(mapEmail), () => { }, 'inbound');
            res.imported += result.imported;
            res.skipped += result.skipped;
            res.errors += result.errors.length;
          }
        } catch (e) {
          console.warn(`[SyncWorker] Failed to sync custom INBOX folder ${folder}:`, e);
        }
      }

      // 2. Sync Sent Folders
      for (const folder of sentFolders) {
        try {
          const emails = await importCustomEmails(credentials, Math.floor(limit / 2), 30000, folder);
          if (emails.length > 0) {
            const result = await pagedEmailImport(userId, emails.map(mapEmail), () => { }, 'outbound');
            res.imported += result.imported;
            res.skipped += result.skipped;
            res.errors += result.errors.length;
          }
        } catch (e) {
          console.warn(`[SyncWorker] Failed to sync custom SENT folder ${folder}:`, e);
        }
      }
    } catch (e) {
      console.error(`[SyncWorker] Custom IMAP sync error for user ${userId}:`, e);
      res.errors++;
    }
    return res;
  }

  /**
   * Fetch latest emails using Gmail API
   */
  private async syncGmailMessages(userId: string, integration: Integration, limit: number): Promise<Partial<SyncResult>> {
    const res = { imported: 0, skipped: 0, errors: 0 };
    try {
      const credentialsStr = await decrypt(integration.encryptedMeta);
      const credentials = JSON.parse(credentialsStr);

      const fetchMessages = async (q: string) => {
        const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=${encodeURIComponent(q)}`, {
          headers: { 'Authorization': `Bearer ${credentials.access_token}` }
        });
        if (!response.ok) return [];
        const data = await response.json() as any;
        return data.messages || [];
      };

      const [inboxList, sentList] = await Promise.all([
        fetchMessages('label:INBOX'),
        fetchMessages('label:SENT')
      ]);

      const processMsgList = async (list: any[], direction: 'inbound' | 'outbound') => {
        const fullMessages = await Promise.all(list.map(async (m: any) => {
          const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}`, {
            headers: { 'Authorization': `Bearer ${credentials.access_token}` }
          });
          if (!detailRes.ok) return null;
          const detail = await detailRes.json() as any;

          const getHeader = (name: string) => detail.payload.headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

          return {
            from: getHeader('from'),
            to: getHeader('to'),
            subject: getHeader('subject'),
            text: detail.snippet,
            date: new Date(parseInt(detail.internalDate)),
            html: detail.payload.parts?.find((p: any) => p.mimeType === 'text/html')?.body?.data
              ? Buffer.from(detail.payload.parts.find((p: any) => p.mimeType === 'text/html').body.data, 'base64').toString()
              : ''
          };
        }));

        const validMsg = fullMessages.filter(Boolean) as any[];
        return await pagedEmailImport(userId, validMsg, () => { }, direction);
      };

      const inbound = await processMsgList(inboxList, 'inbound');
      const outbound = await processMsgList(sentList, 'outbound');

      res.imported = inbound.imported + outbound.imported;
      res.skipped = inbound.skipped + outbound.skipped;
      res.errors = inbound.errors.length + outbound.errors.length;
    } catch (e) {
      console.error(`Gmail sync error for user ${userId}:`, e);
      res.errors++;
    }
    return res;
  }

  /**
   * Fetch latest emails using Microsoft Graph API
   */
  private async syncOutlookMessages(userId: string, integration: Integration, limit: number): Promise<Partial<SyncResult>> {
    const res = { imported: 0, skipped: 0, errors: 0 };
    try {
      const credentialsStr = await decrypt(integration.encryptedMeta);
      const credentials = JSON.parse(credentialsStr);

      const fetchFolder = async (folder: string, direction: 'inbound' | 'outbound') => {
        const response = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${folder}/messages?$top=50&$select=subject,from,toRecipients,bodyPreview,body,receivedDateTime`, {
          headers: { 'Authorization': `Bearer ${credentials.access_token}` }
        });
        if (!response.ok) return { imported: 0, skipped: 0, errors: [] };
        const data = await response.json() as any;
        const messages = (data.value || []).map((m: any) => ({
          from: m.from?.emailAddress?.address,
          to: m.toRecipients?.[0]?.emailAddress?.address,
          subject: m.subject,
          text: m.bodyPreview,
          html: m.body?.content,
          date: new Date(m.receivedDateTime)
        }));
        return await pagedEmailImport(userId, messages, () => { }, direction);
      };

      const [inbound, outbound] = await Promise.all([
        fetchFolder('inbox', 'inbound'),
        fetchFolder('sentitems', 'outbound')
      ]);

      res.imported = inbound.imported + outbound.imported;
      res.skipped = inbound.skipped + outbound.skipped;
      res.errors = inbound.errors.length + outbound.errors.length;
    } catch (e) {
      console.error(`Outlook sync error for user ${userId}:`, e);
      res.errors++;
    }
    return res;
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
