import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { storage } from '../../storage.js';
import { decrypt } from '../crypto/encryption.js';
import { pagedEmailImport } from '../imports/paged-email-importer.js';
import type { Integration } from '../../../shared/schema.js';
import { wsSync } from '../websocket-sync.js';

interface EmailConfig {
    smtp_host?: string;
    smtp_port?: number;
    imap_host?: string;
    imap_port?: number;
    smtp_user?: string;
    smtp_pass?: string;
    provider?: 'gmail' | 'outlook' | 'smtp' | 'custom';
}

class ImapIdleManager {
    private connections: Map<string, Imap> = new Map(); // Key: integrationId
    private folders: Map<string, { inbox: string[], sent: string[], spam: string[] }> = new Map(); // Key: integrationId
    private syncing: Set<string> = new Set(); // Key: integrationId
    private isRunning = false;
    private backoffDelays: Map<string, number> = new Map(); // Key: integrationId
    private readonly MIN_BACKOFF = 30000; // 30s
    private readonly MAX_BACKOFF = 30 * 60 * 1000; // 30m

    /**
     * Start the IMAP IDLE manager
     */
    async start(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('🚀 IMAP IDLE Manager starting (Multi-Mailbox mode)...');
        // Initial sync
        await this.syncConnections();

        // Use BullMQ for periodic connection management instead of simple setInterval
        // This ensures transparency and reliability across restarts
        const { emailSyncQueue } = await import('../queues/email-sync-queue.js');
        await emailSyncQueue.add('sync-connections', { type: 'discovery' }, {
            repeat: {
                every: 5 * 60 * 1000 // Every 5 minutes
            },
            jobId: 'discovery-cycle'
        });
    }

    /**
     * Get discovered folders for a specific integration
     */
    public getDiscoveredFolders(integrationId: string): { inbox: string[], sent: string[], spam: string[] } | undefined {
        return this.folders.get(integrationId);
    }

    /**
     * Sync active connections with database integrations
     */
    public async syncConnections(): Promise<void> {
        try {
            const allIntegrations = await storage.getIntegrationsByProvider('custom_email');
            const gmailIntegrations = await storage.getIntegrationsByProvider('gmail');
            const outlookIntegrations = await storage.getIntegrationsByProvider('outlook');

            const integrations = [...allIntegrations, ...gmailIntegrations, ...outlookIntegrations];
            const activeIntegrationIds = new Set(integrations.filter(i => i.connected).map(i => i.id));

            // Remove connections for integrations no longer active/connected
            for (const [integrationId, imap] of this.connections.entries()) {
                if (!activeIntegrationIds.has(integrationId)) {
                    console.log(`🔌 Closing IMAP connection for integration ${integrationId}`);
                    imap.end();
                    this.connections.delete(integrationId);
                    this.folders.delete(integrationId);
                }
            }

            // Add connections for new active integrations
            for (const integration of integrations) {
                if (integration.connected && !this.connections.has(integration.id)) {
                    console.log(`🔌 Opening IMAP connection for integration ${integration.id} (User: ${integration.userId})`);
                    this.setupConnection(integration.id, integration);
                }
            }
        } catch (error) {
            console.error('Error syncing IMAP IDLE connections:', error);
        }
    }

    /**
     * Discover special folders (Inbox, Sent) using IMAP attributes
     */
    private async discoverFolders(integrationId: string, imap: Imap): Promise<void> {
        return new Promise((resolve) => {
            imap.getBoxes((err, boxes) => {
                if (err) {
                    console.warn(`[IMAP] Could not list boxes for integration ${integrationId}:`, err.message);
                    this.folders.set(integrationId, {
                        inbox: ['INBOX'],
                        sent: ['Sent', 'Sent Items', '[Gmail]/Sent Mail'],
                        spam: ['Spam', 'Junk', '[Gmail]/Spam']
                    });
                    resolve();
                    return;
                }

                const inboxFolders: string[] = [];
                const sentFolders: string[] = [];
                const spamFolders: string[] = [];

                const processBoxes = (obj: any, prefix = '') => {
                    for (const key in obj) {
                        const box = obj[key];
                        const fullName = prefix + key;
                        const attribs = box.attribs || [];

                        // 1. Check standard IMAP attributes (best way)
                        if (attribs.includes('\\Inbox')) {
                            inboxFolders.push(fullName);
                        } else if (attribs.includes('\\Sent') || attribs.includes('\\SentMail') || attribs.includes('\\SentItems')) {
                            sentFolders.push(fullName);
                        } else if (attribs.includes('\\Spam') || attribs.includes('\\Junk')) {
                            spamFolders.push(fullName);
                        } else {
                            // 2. Fallback to name patterns
                            const lowerKey = key.toLowerCase();
                            const standardInboxes = ['inbox'];
                            const standardSents = [
                                'sent-mail', 'sent mail', 'sent items',
                                'gesendet', 'enviados', 'envoyés', 'outbox',
                                'inbox.sent', 'inbox.sent items', 'inbox.sent mail',
                                'verzonden', 'posta inviata', 'skickat', 'elementos enviados',
                                'sent messages', 'sent mails'
                            ];

                            if (standardInboxes.includes(lowerKey)) {
                                if (!inboxFolders.includes(fullName)) inboxFolders.push(fullName);
                            } else if (standardSents.some(s => lowerKey === s || lowerKey.includes('sent'))) {
                                if (!sentFolders.includes(fullName)) sentFolders.push(fullName);
                            } else if (lowerKey.includes('spam') || lowerKey.includes('junk') || lowerKey.includes('bulk')) {
                                if (!spamFolders.includes(fullName)) spamFolders.push(fullName);
                            }
                        }

                        if (box.children) {
                            processBoxes(box.children, fullName + (box.delimiter || '/'));
                        }
                    }
                };

                processBoxes(boxes);

                // Default fallbacks if none found
                if (inboxFolders.length === 0) inboxFolders.push('INBOX');
                if (sentFolders.length === 0) {
                    // Commonly used names if discovery fails
                    sentFolders.push('Sent');
                    sentFolders.push('Sent Items');
                }

                if (spamFolders.length === 0) {
                    spamFolders.push('Spam');
                    spamFolders.push('Junk');
                    spamFolders.push('[Gmail]/Spam');
                }

                console.log(`[IMAP] Discovered folders for integration ${integrationId}: Inbox=[${inboxFolders.join(',')}], Sent=[${sentFolders.join(',')}], Spam=[${spamFolders.join(',')}]`);
                this.folders.set(integrationId, {
                    inbox: [...new Set(inboxFolders)],
                    sent: [...new Set(sentFolders)],
                    spam: [...new Set(spamFolders)]
                });
                resolve();
            });
        });
    }

    /**
     * Setup a persistent IMAP connection with IDLE support
     */
    private async setupConnection(integrationId: string, integration: Integration): Promise<void> {
        try {
            const credentialsStr = await decrypt(integration.encryptedMeta!);
            const config = JSON.parse(credentialsStr) as EmailConfig;

            const imapHost = config.imap_host || config.smtp_host?.replace('smtp', 'imap') || '';
            const imapPort = config.imap_port || 993;

            if (!imapHost) {
                console.error(`IMAP host not found for integration ${integrationId} (User: ${integration.userId})`);
                return;
            }

            const imap = new Imap({
                user: config.smtp_user!,
                password: config.smtp_pass!,
                host: imapHost,
                port: imapPort,
                tls: imapPort === 993,
                tlsOptions: { rejectUnauthorized: false },
                connTimeout: 45000,
                authTimeout: 45000,
                keepalive: {
                    interval: 10000,
                    idleInterval: 300000,
                    forceNoop: true
                },
                debug: (msg: string) => {
                    // console.log(`[IMAP RAW ${integrationId}]`, msg); 
                }
            });

            this.connections.set(integrationId, imap);

            const safeEnd = () => {
                try {
                    if (imap.state !== 'disconnected') imap.end();
                } catch (err) {
                }
            };

            imap.once('ready', async () => {
                await this.discoverFolders(integrationId, imap);
                this.openInbox(integrationId, imap, integration.userId);
            });

            imap.once('error', async (err: any) => {
                console.error(`IMAP Error for integration ${integrationId} (User: ${integration.userId}):`, err.message);

                if (err.code === 'EPIPE' || err.code === 'ECONNRESET') {
                    safeEnd();
                    return;
                }

                const fatalErrors = ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'AUTHENTICATIONFAILED', 'Not authenticated', 'Invalid credentials', 'Login failed'];
                const isFatal = fatalErrors.some(code => String(err.code) === code || String(err.message).toLowerCase().includes(code.toLowerCase()));

                if (isFatal) {
                    console.warn(`🛑 Fatal IMAP error for integration ${integrationId}. Stopping retries.`);
                    this.connections.delete(integrationId);
                    this.folders.delete(integrationId);

                    try {
                        const integrationLatest = await storage.getIntegration(integration.userId, integrationId);
                        if (integrationLatest) {
                            const meta = JSON.parse(await (await import('../crypto/encryption.js')).decrypt(integrationLatest.encryptedMeta!));
                            meta.last_error = err.message || 'Authentication Failed';
                            meta.error_at = new Date().toISOString();

                            await storage.updateIntegration(integration.userId, integrationId, {
                                connected: false,
                                encryptedMeta: await (await import('../crypto/encryption.js')).encrypt(JSON.stringify(meta))
                            });
                        }
                    } catch (e) {
                        console.error('Failed to update integration with IMAP error:', e);
                    }
                } else {
                    this.reconnect(integrationId, integration);
                }
            });

            imap.once('end', () => {
                console.log(`IMAP connection ended for integration ${integrationId}`);
                if (this.connections.get(integrationId) === imap) {
                    this.reconnect(integrationId, integration);
                }
            });

            try {
                imap.connect();
            } catch (err: any) {
                console.error(`IMAP synchronous connect error for integration ${integrationId}:`, err.message);
                this.reconnect(integrationId, integration);
            }
        } catch (error) {
            console.error(`Failed to setup IMAP connection for integration ${integrationId}:`, error);
        }
    }

    private openInbox(integrationId: string, imap: Imap, userId: string): void {
        const folders = this.folders.get(integrationId) || { inbox: ['INBOX'], sent: [] };
        const primaryInbox = folders.inbox[0] || 'INBOX';

        try {
            imap.openBox(primaryInbox, false, (err: any) => {
                if (err) {
                    console.error(`Failed to open ${primaryInbox} for integration ${integrationId}:`, err.message);
                    return;
                }

                console.log(`✅ IMAP IDLE active on ${primaryInbox} for integration ${integrationId} (User: ${userId})`);

            this.syncAccountFolders(integrationId, imap, userId);

            imap.on('mail', (numNewMsgs: number) => {
                console.log(`📬 Integration ${integrationId} received ${numNewMsgs} new messages`);
                this.syncAccountFolders(integrationId, imap, userId);
            });

            imap.on('expunge', (seqno: number) => {
                console.log(`🗑️ Integration ${integrationId} expunged message (Seq: ${seqno})`);
                this.syncDeletedMessages(integrationId, imap, userId, primaryInbox);
            });

            if (typeof (imap as any).idle === 'function') {
                (imap as any).idle();
            }

            setInterval(async () => {
                if (this.connections.get(integrationId) === imap) {
                    this.syncAccountFolders(integrationId, imap, userId);
                }
            }, 30 * 1000); // 30s sync safety net (IDLE handles real-time)
        });
        } catch (e) {
            console.error(`[IMAP] Failed to initiate openBox for ${primaryInbox}:`, e);
            if (this.connections.get(integrationId) === imap) {
                this.syncAccountFolders(integrationId, imap, userId);
            }
        }
    }

    private async syncAccountFolders(integrationId: string, imap: Imap, userId: string): Promise<void> {
        if (imap.state !== 'authenticated') {
            console.warn(`[IMAP] Skipping sync for ${integrationId} because state is ${imap.state}`);
            return;
        }
        if (this.syncing.has(integrationId)) return;
        this.syncing.add(integrationId);

        try {
            const folders = this.folders.get(integrationId);
            if (!folders) return;

            // Sync Inbox
            for (const inbox of folders.inbox) {
                await this.fetchNewEmails(integrationId, userId, imap, inbox, 'inbound');
            }

            // Sync Sent
            for (const sent of folders.sent) {
                await this.fetchNewEmails(integrationId, userId, imap, sent, 'outbound');
            }

            // Sync Spam
            for (const spam of folders.spam) {
                await this.fetchNewEmails(integrationId, userId, imap, spam, 'inbound', true);
            }
        } catch (error) {
            console.error(`[IMAP] Sync folders failed for ${integrationId}:`, error);
        } finally {
            this.syncing.delete(integrationId);
        }
    }

    private async fetchNewEmails(integrationId: string, userId: string, imap: Imap, folderName: string = 'INBOX', direction: 'inbound' | 'outbound' = 'inbound', isSpam = false): Promise<void> {
        return new Promise((resolve) => {
            const folders = this.folders.get(integrationId) || { inbox: ['INBOX'], sent: [] };
            const primaryInbox = folders.inbox[0] || 'INBOX';

            if (imap.state !== 'authenticated') {
                console.warn(`[IMAP] Connection state is ${imap.state}, skipping openBox for ${folderName}`);
                resolve();
                return;
            }
            imap.openBox(folderName, true, (err: any, box: any) => {
                if (err) {
                    console.warn(`[IMAP] Could not open folder ${folderName} for integration ${integrationId}:`, err.message);
                    resolve();
                    return;
                }

                if (!box || !box.messages || box.messages.total === 0) {
                    if (folderName !== primaryInbox) {
                        imap.openBox(primaryInbox, false, (openErr) => {
                            if (!openErr) {
                                try {
                                    if (imap.state === 'authenticated' && typeof (imap as any).idle === 'function') (imap as any).idle();
                                } catch (e) { }
                            }
                            resolve();
                        });
                    } else {
                        try {
                            if (imap.state === 'authenticated' && typeof (imap as any).idle === 'function') (imap as any).idle();
                        } catch (e) { }
                        resolve();
                    }
                    return;
                }

                const total = box.messages.total;
                if (total === 0) {
                    try {
                        if (imap.state === 'authenticated' && typeof (imap as any).idle === 'function') (imap as any).idle();
                    } catch (e) { }
                    resolve();
                    return;
                }

                const fetchRange = total < 20 ? '1:*' : `${total - 19}:*`;

                const fetch = imap.seq.fetch(fetchRange, { bodies: '', struct: true });
                const emails: any[] = [];
                let fetchError: any = null;

                fetch.on('message', (msg: any, seqno: number) => {
                    let flags: string[] = [];
                    msg.on('attributes', (attrs: any) => flags = attrs.flags || []);
                    msg.on('body', (stream: any) => {
                        simpleParser(stream, async (err: any, parsed: any) => {
                            if (!err && parsed) {
                                emails.push({
                                    from: parsed.from?.text,
                                    to: parsed.to?.text,
                                    subject: parsed.subject,
                                    text: parsed.text || parsed.html || '',
                                    date: parsed.date,
                                    html: parsed.html,
                                    flags,
                                    uid: seqno,
                                    messageId: parsed.messageId,
                                    inReplyTo: parsed.inReplyTo,
                                    isSpam: isSpam
                                });
                            }
                        });
                    });
                });

                fetch.once('error', (err: any) => fetchError = err);

                fetch.once('end', async () => {
                    if (fetchError) {
                        console.error(`[IMAP] Fetch error for ${folderName}:`, fetchError.message);
                    } else if (emails.length > 0) {
                        console.log(`📥 Processing ${emails.length} ${direction} emails from ${folderName} for integration ${integrationId} (Spam: ${isSpam})`);
                        const importRes = await pagedEmailImport(userId, emails.map(e => ({
                            from: e.from?.split('<')[1]?.split('>')[0] || e.from,
                            to: e.to?.split('<')[1]?.split('>')[0] || e.to,
                            subject: e.subject,
                            text: e.text,
                            date: e.date,
                            html: e.html,
                            isRead: e.flags?.includes('\\Seen') || false,
                            messageId: e.messageId,
                            inReplyTo: e.inReplyTo,
                            integrationId: integrationId,
                            isSpam: isSpam
                        })), undefined, direction);

                        if (importRes.imported > 0 && direction === 'inbound') {
                            const { wsSync } = await import('../websocket-sync.js');
                            wsSync.notifyMessagesUpdated(userId, { event: 'INSERT', count: importRes.imported });

                            // Trigger autonomous AI reply for new inbound messages
                            try {
                                const { scheduleAutomatedEmailReply } = await import('../ai/email-automation.js');
                                const { analyzeLeadIntent } = await import('../ai/intent-analyzer.js');

                                for (const email of emails) {
                                  if (email.direction === 'inbound' && !email.isSpam) {
                                      const lead = await storage.getLeadByEmail(email.from?.split('<')[1]?.split('>')[0] || email.from, userId);
                                      if (lead && !lead.aiPaused) {
                                          const intent = await analyzeLeadIntent(email.text, {
                                              id: lead.id,
                                              name: lead.name,
                                              channel: 'email',
                                              status: lead.status,
                                              tags: lead.tags || []
                                          });

                                          await scheduleAutomatedEmailReply(
                                              userId,
                                              lead.id,
                                              email.from,
                                              email.subject,
                                              email.text,
                                              intent,
                                              email.threadId
                                          );
                                      }
                                  }
                                }
                            } catch (aiErr) {
                                console.error('[IMAP] AI trigger error:', aiErr);
                            }
                        }

                        // Real-time propagation to UI
                        wsSync.notifyMessagesUpdated(userId);
                        wsSync.notifyStatsUpdated(userId); // Trigger total bounce/spam refresh

                        if (direction === 'inbound' && !isSpam) {
                            wsSync.notifyActivityUpdated(userId, {
                                type: 'email_received',
                                title: 'New Email Received',
                                message: `Received ${emails.length} new message(s)`
                            });
                        }
                    }

                    if (folderName !== primaryInbox) {
                        imap.openBox(primaryInbox, false, (openErr) => {
                            if (!openErr) {
                                try {
                                    if (imap.state === 'authenticated' && typeof (imap as any).idle === 'function') (imap as any).idle();
                                } catch (e) { }
                            }
                            resolve();
                        });
                    } else {
                        try {
                            if (imap.state === 'authenticated' && typeof (imap as any).idle === 'function') (imap as any).idle();
                        } catch (e) { }
                        resolve();
                    }
                });
            });
        });
    }

    private async syncDeletedMessages(integrationId: string, imap: Imap, userId: string, folderName: string): Promise<void> {
        if (imap.state !== 'authenticated') return;
        try {
            const { db } = await import('../../db.js');
            const { messages } = await import('../../../shared/schema.js');
            const { eq, and, desc, inArray } = await import('drizzle-orm');

            // Find recent messages in our DB for this user that MIGHT have been deleted
            const recentDbMessages = await db.select()
                .from(messages)
                .where(and(eq(messages.userId, userId), eq(messages.integrationId, integrationId)))
                .orderBy(desc(messages.createdAt))
                .limit(100);

            if (recentDbMessages.length === 0) return;

            imap.openBox(folderName, true, (err: any, box: any) => {
                if (err || !box || box.messages.total === 0) {
                    try { if (typeof (imap as any).idle === 'function') (imap as any).idle(); } catch (e) { }
                    return;
                }

                // Fetch UIDs and Message-IDs for the last 150 messages in the folder
                const fetchRange = box.messages.total < 150 ? '1:*' : `${box.messages.total - 149}:*`;
                const fetch = imap.seq.fetch(fetchRange, { struct: false, bodies: 'HEADER.FIELDS (MESSAGE-ID)' });
                const imapMessageIds = new Set<string>();

                fetch.on('message', (msg: any) => {
                    msg.on('body', (stream: any) => {
                        let buffer = '';
                        stream.on('data', (chunk: any) => buffer += chunk.toString());
                        stream.on('end', () => {
                            const match = buffer.match(/Message-ID:\s*(<[^>]+>)/i);
                            if (match && match[1]) {
                                imapMessageIds.add(match[1]);
                            }
                        });
                    });
                });

                fetch.once('end', async () => {
                    const toDelete: string[] = [];
                    for (const dbMsg of recentDbMessages) {
                        // If we have a Message-ID but it's not in the folder anymore, it's likely deleted
                        if (dbMsg.provider === 'email' && dbMsg.metadata && (dbMsg.metadata as any).messageId) {
                            const mid = (dbMsg.metadata as any).messageId;
                            if (!imapMessageIds.has(mid)) {
                                console.log(`🧹 Sync deletion: ${mid} not found in ${folderName}`);
                                toDelete.push(dbMsg.id);
                            }
                        }
                    }

                    if (toDelete.length > 0) {
                        await db.delete(messages).where(inArray(messages.id, toDelete));
                        wsSync.notifyMessagesUpdated(userId, { event: 'DELETE', messageIds: toDelete });
                        wsSync.notifyStatsUpdated(userId);
                        wsSync.notifyLeadsUpdated(userId);
                    }
                    try { if (typeof (imap as any).idle === 'function') (imap as any).idle(); } catch (e) { }
                });
            });
        } catch (error) {
            console.error(`[IMAP] Sync deleted messages failed for ${integrationId}:`, error);
        }
    }

    private reconnect(integrationId: string, integration: Integration): void {
        if (!this.isRunning) return;

        const currentDelay = this.backoffDelays.get(integrationId) || this.MIN_BACKOFF;
        const nextDelay = Math.min(currentDelay * 2, this.MAX_BACKOFF);
        this.backoffDelays.set(integrationId, nextDelay);

        this.connections.delete(integrationId);
        console.log(`🔄 Attempting to reconnect IMAP for ${integrationId} in ${Math.round(currentDelay / 1000)}s (Next attempt in ${Math.round(nextDelay / 1000)}s)...`);

        setTimeout(() => {
            if (this.isRunning && !this.connections.has(integrationId)) {
                this.setupConnection(integrationId, integration);
            }
        }, currentDelay);
    }

    /**
     * Sync a local action (archive/delete) to the remote IMAP server
     */
    public async syncRemoteAction(userId: string, leadId: string, action: 'archive' | 'unarchive' | 'delete'): Promise<void> {
        try {
            const lead = await storage.getLeadById(leadId);
            if (!lead || !lead.email) return;

            // Find the integration for this user and lead
            const integrations = await storage.getIntegrations(userId);
            const emailIntegrations = integrations.filter((i: Integration) => 
                i.connected && (i.provider === 'gmail' || i.provider === 'outlook' || i.provider === 'custom_email')
            );

            // In a better architecture, we'd know which integration a lead belongs to.
            // For now, we try to find messages for this lead to identify the integration.
            const messages = await storage.getMessagesByLeadId(leadId);
            const integrationId = messages.find(m => m.integrationId)?.integrationId;

            if (!integrationId) {
                console.warn(`[IMAP Sync] Could not identify integration for lead ${leadId} to perform ${action}`);
                return;
            }

            const integration = emailIntegrations.find((i: Integration) => i.id === integrationId);
            if (!integration) return;

            const credentialsStr = await decrypt(integration.encryptedMeta!);
            const config = JSON.parse(credentialsStr) as EmailConfig;

            const imapHost = config.imap_host || config.smtp_host?.replace('smtp', 'imap') || '';
            const imapPort = config.imap_port || 993;

            const imap = new Imap({
                user: config.smtp_user!,
                password: config.smtp_pass!,
                host: imapHost,
                port: imapPort,
                tls: imapPort === 993,
                tlsOptions: { rejectUnauthorized: false }
            });

            return new Promise((resolve, reject) => {
                const cleanup = () => {
                    if (imap.state !== 'disconnected') imap.end();
                };

                imap.once('ready', () => {
                    const folders = this.folders.get(integrationId) || { inbox: ['INBOX'], sent: [] };
                    const primaryInbox = folders.inbox[0] || 'INBOX';

                    imap.openBox(primaryInbox, false, (err) => {
                        if (err) {
                            cleanup();
                            return resolve();
                        }

                        // Search for messages with this lead's email
                        imap.search([['FROM', lead.email]], (err, uids) => {
                            if (err || !uids || uids.length === 0) {
                                cleanup();
                                return resolve();
                            }

                            if (action === 'archive') {
                                // For Gmail, archiving is removing '\Inbox' label (moving to All Mail)
                                // For standard IMAP, it's moving to an 'Archive' folder
                                const archiveFolder = 'Archive'; // Standard name
                                imap.move(uids, archiveFolder, (moveErr) => {
                                    if (moveErr) {
                                        console.warn(`[IMAP Sync] Move to Archive failed for ${lead.email}:`, moveErr.message);
                                    } else {
                                        console.log(`✅ [IMAP Sync] Archived ${uids.length} messages for ${lead.email}`);
                                    }
                                    cleanup();
                                    resolve();
                                });
                            } else if (action === 'unarchive') {
                                // Move back to INBOX
                                const folders = this.folders.get(integrationId) || { inbox: ['INBOX'], sent: [] };
                                const primaryInbox = folders.inbox[0] || 'INBOX';
                                imap.move(uids, primaryInbox, (moveErr) => {
                                    if (moveErr) {
                                        console.warn(`[IMAP Sync] Move to INBOX failed for ${lead.email}:`, moveErr.message);
                                    } else {
                                        console.log(`✅ [IMAP Sync] Unarchived ${uids.length} messages for ${lead.email}`);
                                    }
                                    cleanup();
                                    resolve();
                                });
                            } else if (action === 'delete') {
                                // Add \Deleted flag and expunge
                                imap.addFlags(uids, '\\Deleted', (delErr) => {
                                    if (delErr) {
                                        console.warn(`[IMAP Sync] Delete failed for ${lead.email}:`, delErr.message);
                                    } else {
                                        imap.expunge((expErr) => {
                                            if (!expErr) console.log(`✅ [IMAP Sync] Deleted/Expunged ${uids.length} messages for ${lead.email}`);
                                        });
                                    }
                                    cleanup();
                                    resolve();
                                });
                            }
                        });
                    });
                });

                imap.once('error', (err) => {
                    cleanup();
                    resolve();
                });

                imap.connect();
            });
        } catch (error) {
            console.error(`[IMAP Sync] Remote action ${action} failed:`, error);
        }
    }

    stop(): void {
        this.isRunning = false;
        for (const imap of this.connections.values()) {
            imap.end();
        }
        this.connections.clear();
        console.log('🛑 IMAP IDLE Manager stopped');
    }

    public async appendSentMessage(userId: string, integrationId: string, rawMessage: string, config: EmailConfig): Promise<void> {
        const MAX_RETRIES = 3;
        const BASE_DELAY = 1000;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                await new Promise<void>((resolve, reject) => {
                    const discovered = this.folders.get(integrationId);
                    const fallbackFolders = ['Sent', 'Sent Items', 'Sent Messages', '[Gmail]/Sent Mail', 'Sent-Mail', 'SENT', 'INBOX.Sent'];
                    const foldersToTry = discovered?.sent && discovered.sent.length > 0
                        ? [...new Set([...discovered.sent, ...fallbackFolders])]
                        : fallbackFolders;

                    const imapHost = config.imap_host || config.smtp_host?.replace('smtp', 'imap') || '';
                    const imapPort = config.imap_port || 993;

                    if (!imapHost) {
                        console.warn(`[Append] No IMAP host for integration ${integrationId}`);
                        resolve();
                        return;
                    }

                    const appendImap = new Imap({
                        user: config.smtp_user!,
                        password: config.smtp_pass!,
                        host: imapHost,
                        port: imapPort,
                        tls: imapPort === 993,
                        tlsOptions: { rejectUnauthorized: false },
                        authTimeout: 10000,
                        connTimeout: 10000
                    });

                    const cleanup = () => {
                        try {
                            if (appendImap.state !== 'disconnected') appendImap.end();
                        } catch (e) { }
                    };

                    appendImap.once('ready', async () => {
                        let appended = false;
                        for (const folder of foldersToTry) {
                            try {
                                await new Promise<void>((res, rej) => {
                                    appendImap.append(rawMessage, { mailbox: folder, flags: ['\\Seen'] }, (err: any) => err ? rej(err) : res());
                                });
                                console.log(`✅ Message mirrored to '${folder}' for integration ${integrationId}`);
                                appended = true;
                                break;
                            } catch (e) { }
                        }
                        cleanup();
                        resolve();
                    });

                    appendImap.once('error', (err: any) => {
                        cleanup();
                        reject(err);
                    });

                    appendImap.connect();
                });
                return;
            } catch (error: any) {
                if (attempt === MAX_RETRIES) break;
                await new Promise(res => setTimeout(res, BASE_DELAY * attempt));
            }
        }
    }

    public async syncHistoricalEmails(userId: string, integrationId: string, limit: number = 5000): Promise<{ success: boolean; count: number; error?: string }> {
        const imap = this.connections.get(integrationId);
        if (!imap || imap.state !== 'authenticated') {
            return { success: false, count: 0, error: 'IMAP connection not active' };
        }

        const folders = this.folders.get(integrationId);
        if (!folders) return { success: false, count: 0, error: 'Folders not discovered yet' };

        console.log(`📜 Starting historical sync for integration ${integrationId} (Up to ${limit} emails per folder)`);
        let totalImported = 0;

        try {
            const syncFolder = async (folderName: string, direction: 'inbound' | 'outbound') => {
                return new Promise<number>((resolve) => {
                    imap.openBox(folderName, true, (err, box) => {
                        if (err || !box || box.messages.total === 0) {
                            resolve(0);
                            return;
                        }
                        
                        const total = box.messages.total;
                        const fetchLimit = Math.min(total, limit);
                        const startSeq = Math.max(1, total - fetchLimit + 1);
                        const fetchRange = `${startSeq}:*`;
                        
                        console.log(`[Historical Sync] Fetching ${folderName} (${fetchRange})`);

                        const fetch = imap.seq.fetch(fetchRange, { bodies: '', struct: true });
                        const emails: any[] = [];
                        
                        fetch.on('message', (msg: any) => {
                            let flags: string[] = [];
                            msg.on('attributes', (attrs: any) => flags = attrs.flags || []);
                            msg.on('body', (stream: any) => {
                                simpleParser(stream, async (err2: any, parsed: any) => {
                                    if (!err2 && parsed) {
                                        emails.push({
                                            from: parsed.from?.text,
                                            to: parsed.to?.text,
                                            subject: parsed.subject,
                                            text: parsed.text || parsed.html || '',
                                            date: parsed.date,
                                            html: parsed.html,
                                            flags,
                                            messageId: parsed.messageId,
                                            inReplyTo: parsed.inReplyTo
                                        });
                                    }
                                });
                            });
                        });
                        
                        fetch.once('end', async () => {
                            if (emails.length > 0) {
                                console.log(`[Historical Sync] Passing ${emails.length} emails to pagedEmailImport`);
                                const res = await pagedEmailImport(userId, emails.map(e => ({
                                    from: e.from?.split('<')[1]?.split('>')[0] || e.from,
                                    to: e.to?.split('<')[1]?.split('>')[0] || e.to,
                                    subject: e.subject,
                                    text: e.text,
                                    date: e.date,
                                    html: e.html,
                                    isRead: e.flags?.includes('\\Seen') || false,
                                    messageId: e.messageId,
                                    inReplyTo: e.inReplyTo,
                                    integrationId
                                })), undefined, direction);
                                resolve(res.imported);
                            } else resolve(0);
                        });
                    });
                });
            };

            for (const inbox of folders.inbox) totalImported += await syncFolder(inbox, 'inbound');
            for (const sent of folders.sent) totalImported += await syncFolder(sent, 'outbound');
            // We usually skip spam for historical syncs to save quota/space
            // for (const spam of folders.spam) totalImported += await syncFolder(spam, 'inbound');

            const primaryInbox = folders.inbox[0] || 'INBOX';
            imap.openBox(primaryInbox, false, (err) => {
                if (!err) {
                    try {
                        if (typeof (imap as any).idle === 'function') (imap as any).idle();
                    } catch (e) { }
                }
            });

            return { success: true, count: totalImported };
        } catch (error: any) {
            return { success: false, count: totalImported, error: error.message };
        }
    }
}


export const imapIdleManager = new ImapIdleManager();
