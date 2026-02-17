import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { storage } from '../../storage.js';
import { decrypt } from '../crypto/encryption.js';
import { pagedEmailImport } from '../imports/paged-email-importer.js';
import type { Integration } from '../../../shared/schema.js';

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
    private connections: Map<string, Imap> = new Map();
    private folders: Map<string, { inbox: string[], sent: string[] }> = new Map();
    private isRunning = false;

    /**
     * Start the IMAP IDLE manager
     */
    async start(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('🚀 IMAP IDLE Manager starting...');
        await this.syncConnections();

        // Periodically sync connections to pick up new accounts or handle drops
        setInterval(() => this.syncConnections(), 5 * 60 * 1000); // Every 5 minutes
    }

    /**
     * Get discovered folders for a user
     */
    public getDiscoveredFolders(userId: string): { inbox: string[], sent: string[] } | undefined {
        return this.folders.get(userId);
    }

    /**
     * Sync active connections with database integrations
     */
    public async syncConnections(): Promise<void> {
        try {
            const integrations = await storage.getIntegrationsByProvider('custom_email');
            const activeUserIds = new Set(integrations.filter(i => i.connected).map(i => i.userId));

            // Remove connections for users no longer active/connected
            for (const [userId, imap] of this.connections.entries()) {
                if (!activeUserIds.has(userId)) {
                    console.log(`🔌 Closing IMAP connection for user ${userId}`);
                    imap.end();
                    this.connections.delete(userId);
                    this.folders.delete(userId);
                }
            }

            // Add connections for new active users
            for (const integration of integrations) {
                if (integration.connected && !this.connections.has(integration.userId)) {
                    // Only start if user is actually connected
                    console.log(`🔌 Opening IMAP connection for user ${integration.userId}`);
                    this.setupConnection(integration.userId, integration);
                }
            }
        } catch (error) {
            console.error('Error syncing IMAP IDLE connections:', error);
        }
    }

    /**
     * Discover special folders (Inbox, Sent) using IMAP attributes
     */
    private async discoverFolders(userId: string, imap: Imap): Promise<void> {
        return new Promise((resolve) => {
            imap.getBoxes((err, boxes) => {
                if (err) {
                    console.warn(`[IMAP] Could not list boxes for user ${userId}:`, err.message);
                    this.folders.set(userId, { inbox: ['INBOX'], sent: ['Sent', 'Sent Items', '[Gmail]/Sent Mail', 'Sent Messages', 'Sent-Mail', 'SENT'] });
                    resolve();
                    return;
                }

                const inboxFolders: string[] = [];
                const sentFolders: string[] = [];

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
                            } else if (standardSents.some(s => lowerKey === s || lowerKey.includes('sent') || fullName.toLowerCase().includes('inbox.sent'))) {
                                if (!sentFolders.includes(fullName)) sentFolders.push(fullName);
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

                console.log(`[IMAP] Discovered folders for ${userId}: Inbox=[${inboxFolders.join(',')}], Sent=[${sentFolders.join(',')}]`);
                this.folders.set(userId, { inbox: [...new Set(inboxFolders)], sent: [...new Set(sentFolders)] });
                resolve();
            });
        });
    }

    /**
     * Setup a persistent IMAP connection with IDLE support
     */
    private async setupConnection(userId: string, integration: Integration): Promise<void> {
        try {
            const credentialsStr = await decrypt(integration.encryptedMeta!);
            const config = JSON.parse(credentialsStr) as EmailConfig;

            const imapHost = config.imap_host || config.smtp_host?.replace('smtp', 'imap') || '';
            const imapPort = config.imap_port || 993;

            if (!imapHost) {
                console.error(`IMAP host not found for user ${userId}`);
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
                // Add debug to catch low-level socket errors
                debug: (msg: string) => {
                   // console.log(`[IMAP RAW ${userId}]`, msg); 
                }
            });

            this.connections.set(userId, imap);

            const safeEnd = () => {
                try {
                     if (imap.state !== 'disconnected') imap.end(); 
                } catch (err) { 
                    // Ignore errors during end
                }
            };

            imap.once('ready', async () => {
                await this.discoverFolders(userId, imap);
                this.openInbox(userId, imap);
            });

            imap.once('error', async (err: any) => {
                console.error(`IMAP Error for user ${userId}:`, err.message);

                // Ignore EPIPE/ECONNRESET during error handling as they are side effects of connection drop
                if (err.code === 'EPIPE' || err.code === 'ECONNRESET') {
                     safeEnd();
                     return; 
                }

                // If it's a definitive configuration error, don't reconnect and mark integration as failing
                const fatalErrors = ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'AUTHENTICATIONFAILED'];
                const isFatal = fatalErrors.some(code => err.code === code || err.message?.includes(code));

                if (isFatal) {
                    console.warn(`🛑 Fatal IMAP error for user ${userId}. Stopping retries.`);
                    this.connections.delete(userId);
                    this.folders.delete(userId);

                    try {
                        // Update integration metadata with error
                        const integration = await storage.getIntegration(userId, 'custom_email');
                        if (integration) {
                            const meta = JSON.parse(await (await import('../crypto/encryption.js')).decrypt(integration.encryptedMeta!));
                            meta.last_error = err.message;
                            meta.error_at = new Date().toISOString();

                            await storage.updateIntegration(integration.userId, 'custom_email', {
                                encryptedMeta: await (await import('../crypto/encryption.js')).encrypt(JSON.stringify(meta))
                            });
                        }
                    } catch (e) {
                        console.error('Failed to update integration with IMAP error:', e);
                    }
                } else {
                    this.reconnect(userId, integration);
                }
            });

            imap.once('end', () => {
                console.log(`IMAP connection ended for user ${userId}`);
                if (this.connections.get(userId) === imap) {
                    this.reconnect(userId, integration);
                }
            });
            
            // Safety: Catch synchronous errors during connect
            try {
                imap.connect();
            } catch (err: any) {
                console.error(`IMAP synchronous connect error for user ${userId}:`, err.message);
                this.reconnect(userId, integration);
            }
        } catch (error) {
            console.error(`Failed to setup IMAP connection for user ${userId}:`, error);
        }
    }

    private openInbox(userId: string, imap: Imap): void {
        const userFolders = this.folders.get(userId) || { inbox: ['INBOX'], sent: [] };
        const primaryInbox = userFolders.inbox[0] || 'INBOX';

        imap.openBox(primaryInbox, false, (err: any) => {
            if (err) {
                console.error(`Failed to open ${primaryInbox} for user ${userId}:`, err.message);
                return;
            }

            console.log(`✅ IMAP IDLE active on ${primaryInbox} for user ${userId}`);

            // Initial sync on connection
            this.fetchNewEmails(userId, imap, primaryInbox, 'inbound');

            imap.on('mail', (numNewMsgs: number) => {
                console.log(`📬 User ${userId} received ${numNewMsgs} new messages`);
                this.fetchNewEmails(userId, imap, primaryInbox, 'inbound');
            });

            // Dual Sync: Watch Sent folder too if possible
            for (const sentFolder of userFolders.sent) {
                if (sentFolder !== primaryInbox) {
                    imap.on('mail', (num) => {
                        console.log(`📤 New message detected in Sent folder ${sentFolder} for user ${userId}`);
                        this.fetchNewEmails(userId, imap, sentFolder, 'outbound');
                    });
                }
            }

            // Start IDLE
            if (typeof (imap as any).idle === 'function') {
                (imap as any).idle();
            }

            // Periodically check all specialized folders sequentially to avoid connection state issues
            setInterval(async () => {
                const currentFolders = this.folders.get(userId);
                if (!currentFolders) return;

                console.log(`🕒 Starting periodic full sync for user ${userId}`);

                // 1. Sync any extra Inboxes
                for (let i = 1; i < currentFolders.inbox.length; i++) {
                    await this.fetchNewEmails(userId, imap, currentFolders.inbox[i], 'inbound');
                }

                // 2. Sync all Sent folders
                for (const folder of currentFolders.sent) {
                    await this.fetchNewEmails(userId, imap, folder, 'outbound');
                }
            }, 20 * 1000); // Every 20 seconds (Optimized for real-time)
        });
    }

    private async fetchNewEmails(userId: string, imap: Imap, folderName: string = 'INBOX', direction: 'inbound' | 'outbound' = 'inbound'): Promise<void> {
        return new Promise((resolve) => {
            const userFolders = this.folders.get(userId) || { inbox: ['INBOX'], sent: [] };
            const primaryInbox = userFolders.inbox[0] || 'INBOX';

            // @ts-ignore - types mismatch
            imap.openBox(folderName, true, (err: any, box: any) => {
                if (err) {
                    console.warn(`[IMAP] Could not open folder ${folderName} for user ${userId}:`, err.message);
                    resolve();
                    return;
                }

                if (!box || !box.messages || box.messages.total === 0) {
                    // Empty box, nothing to fetch
                    if (folderName !== primaryInbox) {
                        imap.openBox(primaryInbox, false, (openErr) => {
                            if (!openErr) {
                                try {
                                    if (typeof (imap as any).idle === 'function') {
                                        (imap as any).idle();
                                    }
                                } catch (e) { }
                            }
                            resolve();
                        });
                    } else {
                        try {
                            if (typeof (imap as any).idle === 'function') {
                                (imap as any).idle();
                            }
                        } catch (e) { }
                        resolve();
                    }
                    return;
                }

                // We fetch the last 20 emails to be safe and catch up on both new messages and flag changes
                const total = box.messages.total;
                const fetchRange = total < 20 ? '1:*' : `${total - 19}:*`;

                const fetch = imap.seq.fetch(fetchRange, {
                    bodies: '',
                    struct: true
                });

                const emails: any[] = [];
                let fetchError: any = null;

                fetch.on('message', (msg: any, seqno: number) => {
                    let flags: string[] = [];
                    let bodyParsed = false;

                    msg.on('attributes', (attrs: any) => {
                        flags = attrs.flags || [];
                    });

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
                                    uid: seqno, // Fallback UID
                                    messageId: parsed.messageId,
                                    inReplyTo: parsed.inReplyTo
                                });
                            }
                            bodyParsed = true;
                        });
                    });
                });

                fetch.once('error', (err: any) => {
                    fetchError = err;
                });

                fetch.once('end', async () => {
                    if (fetchError) {
                        console.error(`[IMAP] Fetch error for ${folderName}:`, fetchError.message);
                    } else if (emails.length > 0) {
                        console.log(`📥 Processing ${emails.length} ${direction} emails from ${folderName} for user ${userId}`);
                        const results = await pagedEmailImport(userId, emails.map(e => ({
                            from: e.from?.split('<')[1]?.split('>')[0] || e.from,
                            to: e.to?.split('<')[1]?.split('>')[0] || e.to,
                            subject: e.subject,
                            text: e.text,
                            date: e.date,
                            html: e.html,
                            isRead: e.flags?.includes('\\Seen') || false,
                            messageId: e.messageId,
                            inReplyTo: e.inReplyTo
                        })), undefined, direction);

                        if (results.imported > 0 || results.skipped < emails.length) {
                            // results.imported counts new messages OR read status updates in our paged importer
                            // pagedEmailImport returns { imported, skipping } where imported includes updates
                        }
                    }

                    // Return to primary INBOX and resume IDLE
                    if (folderName !== primaryInbox) {
                        imap.openBox(primaryInbox, false, (openErr) => {
                            if (!openErr) {
                                try {
                                    if (typeof (imap as any).idle === 'function') {
                                        (imap as any).idle();
                                    }
                                } catch (e) { }
                            }
                            resolve();
                        });
                    } else {
                        try {
                            if (typeof (imap as any).idle === 'function') {
                                (imap as any).idle();
                            }
                        } catch (e) { }
                        resolve();
                    }
                });
            });
        });
    }

    private reconnect(userId: string, integration: Integration): void {
        if (!this.isRunning) return;

        this.connections.delete(userId);
        console.log(`🔄 Attempting to reconnect IMAP for user ${userId} in 30s...`);

        setTimeout(() => {
            if (this.isRunning && !this.connections.has(userId)) {
                this.setupConnection(userId, integration);
            }
        }, 30000);
    }

    stop(): void {
        this.isRunning = false;
        for (const imap of this.connections.values()) {
            imap.end();
        }
        this.connections.clear();
        console.log('🛑 IMAP IDLE Manager stopped');
    }
    public async appendSentMessage(userId: string, rawMessage: string, config: EmailConfig): Promise<void> {
        const MAX_RETRIES = 3;
        const BASE_DELAY = 1000;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                await new Promise<void>((resolve, reject) => {
                    // Use cached folders from the main connection if available
                    const discovered = this.folders.get(userId);
                    const sentFolders = ['Sent', 'Sent Items', 'Sent Messages', '[Gmail]/Sent Mail', 'Sent-Mail', 'SENT'];

                    // Force common Sent folder names if discovery yielded nothing or we just want to be sure
                    const fallbackFolders = ['Sent', 'Sent Items', 'Sent Messages', '[Gmail]/Sent Mail', 'Sent-Mail', 'SENT', 'INBOX.Sent'];

                    const foldersToTry = discovered?.sent && discovered.sent.length > 0
                        ? [...new Set([...discovered.sent, ...fallbackFolders])]
                        : fallbackFolders;

                    const imapHost = config.imap_host || config.smtp_host?.replace('smtp', 'imap') || '';
                    const imapPort = config.imap_port || 993;

                    if (!imapHost) {
                        console.warn(`[Append] No IMAP host for user ${userId}`);
                        resolve(); // Don't crash, just skip
                        return;
                    }

                    // Create a dedicated transient connection for appending
                    // This avoids conflicts with the main IDLE connection
                    const appendImap = new Imap({
                        user: config.smtp_user!,
                        password: config.smtp_pass!,
                        host: imapHost,
                        port: imapPort,
                        tls: imapPort === 993,
                        tlsOptions: { rejectUnauthorized: false },
                        authTimeout: 10000,
                        connTimeout: 10000 // 10s connection timeout
                    });

                    const cleanup = () => {
                        try {
                            if (appendImap.state !== 'disconnected') appendImap.end();
                        } catch (e) {
                            // Suppress cleanup errors
                        }
                    };

                    appendImap.once('ready', async () => {
                        const appendToFolder = (folder: string) => {
                            return new Promise<void>((res, rej) => {
                                try {
                                    appendImap.append(rawMessage, { mailbox: folder, flags: ['\\Seen'] }, (err: any) => {
                                        if (err) {
                                            rej(err);
                                        } else {
                                            res();
                                        }
                                    });
                                } catch (e) {
                                    // Catch synchronous errors in append
                                    rej(e);
                                }
                            });
                        };

                        // Try discovered and common names
                        let appended = false;
                        for (const folder of foldersToTry) {
                            try {
                                console.log(`[Append] Attempting to mirror message to '${folder}' for user ${userId}...`);
                                await appendToFolder(folder);
                                console.log(`✅ Message successfully mirrored to '${folder}' for user ${userId}`);
                                appended = true;
                                break;
                            } catch (e: any) {
                                console.warn(`[Append] Failed to append to '${folder}': ${e.message}`);
                                // Continue to next folder
                            }
                        }

                        if (!appended) {
                            console.error(`❌ Failed to append sent message for user ${userId}. Tried folders: ${foldersToTry.join(', ')}`);
                        }

                        cleanup();
                        resolve();
                    });

                    appendImap.once('error', (err: any) => {
                        console.error(`[Append] Connection error for user ${userId}:`, err.message);
                        cleanup();
                        reject(err); // Reject so we can retry
                    });

                    appendImap.connect();
                });
                
                // If we get here, it succeeded (or resolved without crashing)
                return;

            } catch (error: any) {
                const isLastAttempt = attempt === MAX_RETRIES;
                const isTimeout = error.message && (error.message.includes('tim') || error.message.includes('TIM'));
                
                if (!isLastAttempt) {
                    console.warn(`[Append] Attempt ${attempt} failed for ${userId}. Retrying in ${BASE_DELAY * attempt}ms...`);
                    await new Promise(res => setTimeout(res, BASE_DELAY * attempt));
                    continue;
                }
                
                console.error(`[Append] All ${MAX_RETRIES} attempts failed for user ${userId}:`, error.message);
                // We resolve cleanly to prevent blocking the send flow, but the error is logged
                return;
            }
        }
    }


    /**
     * Trigger a historical sync for a user (e.g. last 30 days)
     */
    public async syncHistoricalEmails(userId: string, daysToSync: number = 30): Promise<{ success: boolean; count: number; error?: string }> {
        const imap = this.connections.get(userId);
        if (!imap || imap.state !== 'authenticated') {
            return { success: false, count: 0, error: 'IMAP connection not active' };
        }

        const userFolders = this.folders.get(userId);
        if (!userFolders) {
            return { success: false, count: 0, error: 'Folders not discovered yet' };
        }

        console.log(`📜 Starting historical sync for user ${userId} (${daysToSync} days)`);
        let totalImported = 0;

        try {
            // Calculate date string for "SINCE" search criteria
            const sinceDate = new Date();
            sinceDate.setDate(sinceDate.getDate() - daysToSync);
            // IMAP date format: "01-Jan-2023"
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const sinceStr = `${sinceDate.getDate()}-${months[sinceDate.getMonth()]}-${sinceDate.getFullYear()}`;

            // Helper to sync a specific folder
            const syncFolder = async (folderName: string, direction: 'inbound' | 'outbound') => {
                return new Promise<number>((resolve) => {
                    const fetchEmails = () => {
                        imap.search([['SINCE', sinceStr]], (searchErr, results) => {
                            if (searchErr || !results || results.length === 0) {
                                resolve(0);
                                return;
                            }

                            const fetch = imap.fetch(results, {
                                bodies: '',
                                struct: true
                            });

                            const emails: any[] = [];

                            fetch.on('message', (msg: any, _seqno: number) => {
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
                                                messageId: parsed.messageId,
                                                inReplyTo: parsed.inReplyTo
                                            });
                                        }
                                    });
                                });
                            });

                            fetch.once('end', async () => {
                                if (emails.length > 0) {
                                    console.log(`📜 Importing ${emails.length} historical ${direction} emails from ${folderName}`);
                                    const importResult = await pagedEmailImport(userId, emails.map(e => ({
                                        from: e.from?.split('<')[1]?.split('>')[0] || e.from,
                                        to: e.to?.split('<')[1]?.split('>')[0] || e.to,
                                        subject: e.subject,
                                        text: e.text,
                                        date: e.date,
                                        html: e.html,
                                        isRead: e.flags?.includes('\\Seen') || false,
                                        messageId: e.messageId,
                                        inReplyTo: e.inReplyTo
                                    })), undefined, direction);
                                    resolve(importResult.imported);
                                } else {
                                    resolve(0);
                                }
                            });
                            
                            fetch.once('error', (err) => {
                                console.error(`[Historical] Fetch error in ${folderName}:`, err);
                                resolve(0);
                            });
                        });
                    };

                    imap.openBox(folderName, true, (err) => {
                        if (err) {
                            console.warn(`[Historical] Could not open ${folderName}:`, err.message);
                            resolve(0);
                        } else {
                            fetchEmails();
                        }
                    });
                });
            };

            // 1. Sync Inbox(es)
            for (const inbox of userFolders.inbox) {
                totalImported += await syncFolder(inbox, 'inbound');
            }

            // 2. Sync Sent Folder(s)
            for (const sent of userFolders.sent) {
                totalImported += await syncFolder(sent, 'outbound');
            }

            // Return to primary Inbox and IDLE
            const primaryInbox = userFolders.inbox[0] || 'INBOX';
            imap.openBox(primaryInbox, false, (err) => {
                if (!err) {
                    try {
                        if (typeof (imap as any).idle === 'function') {
                            (imap as any).idle();
                        }
                    } catch (e) { }
                }
            });

            console.log(`✅ Historical sync complete for user ${userId}. Total imported: ${totalImported}`);

            // Notify frontend via websocket (optional / good UX)
            // (Assuming wsSync is available or we can trigger it elsewhere)
            
            return { success: true, count: totalImported };

        } catch (error: any) {
            console.error(`❌ Historical sync failed for user ${userId}:`, error);
            return { success: false, count: totalImported, error: error.message };
        }
    }
}


export const imapIdleManager = new ImapIdleManager();
