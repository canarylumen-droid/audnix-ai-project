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
     * Sync active connections with database integrations
     */
    private async syncConnections(): Promise<void> {
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
                    this.folders.set(userId, { inbox: ['INBOX'], sent: ['Sent', 'Sent Items', '[Gmail]/Sent Mail'] });
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

                        // Check attributes first (best way)
                        if (attribs.includes('\\Inbox')) {
                            inboxFolders.push(fullName);
                        } else if (attribs.includes('\\Sent')) {
                            sentFolders.push(fullName);
                        } else {
                            // Fallback to name pattern
                            const lowerKey = key.toLowerCase();
                            if (lowerKey === 'inbox') {
                                if (!inboxFolders.includes(fullName)) inboxFolders.push(fullName);
                            } else if (
                                lowerKey === 'sent' ||
                                lowerKey === 'sent items' ||
                                lowerKey === 'sent messages' ||
                                lowerKey === 'sent-mail'
                            ) {
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
                if (sentFolders.length === 0) sentFolders.push('Sent');

                console.log(`[IMAP] Discovered folders for ${userId}: Inbox=[${inboxFolders.join(',')}], Sent=[${sentFolders.join(',')}]`);
                this.folders.set(userId, { inbox: inboxFolders, sent: sentFolders });
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
                keepalive: {
                    interval: 10000,
                    idleInterval: 300000,
                    forceNoop: true
                }
            });

            this.connections.set(userId, imap);

            imap.once('ready', async () => {
                await this.discoverFolders(userId, imap);
                this.openInbox(userId, imap);
            });

            imap.once('error', async (err: any) => {
                console.error(`IMAP Error for user ${userId}:`, err.message);
                
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
                            
                            await storage.updateIntegration(integration.id, {
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

            imap.connect();
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

            // Start IDLE
            (imap as any).idle();

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
            }, 10 * 60 * 1000); // Every 10 minutes
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
                                try { (imap as any).idle(); } catch (e) {}
                            }
                            resolve();
                        });
                    } else {
                        try { (imap as any).idle(); } catch (e) {}
                        resolve();
                    }
                    return;
                }

                // We fetch the last 20 emails to be safe and catch up on both new messages and flag changes
                const total = box.messages.total;
                const fetchRange = total < 20 ? '1:*' : `${total - 19}:*`;

                const fetch = imap.seq.fetch(fetchRange, {
                    bodies: '',
                    struct: true,
                    flags: true
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
                                    uid: seqno // Fallback UID
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
                            isRead: e.flags?.includes('\\Seen') || false
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
                                try { (imap as any).idle(); } catch (e) {}
                            }
                            resolve();
                        });
                    } else {
                        try { (imap as any).idle(); } catch (e) {}
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
    public async appendSentMessage(userId: string, rawMessage: string): Promise<void> {
        const imap = this.connections.get(userId);
        if (!imap) {
            console.warn(`Cannot append sent message: No active IMAP connection for user ${userId}`);
            return;
        }

        const sentFolders = ['Sent', 'Sent Items', 'Sent Messages', '[Gmail]/Sent Mail', 'Sent-Mail', 'SENT'];
        
        // Find existing sent folder we might be using, or default to Sent
        // Note: checking valid folder is expensive, we try blindly or just pick one?
        // Better to iterate or use previously known folder.
        // For now, we try 'Sent Items' or 'Sent' or '[Gmail]/Sent Mail'
        // But we need to know which one exists.
        // We can just try to append to 'Sent Items' (Outlook) or '[Gmail]/Sent Mail' (Gmail) or 'Sent' (Generic)
        // Let's try to list boxes or just guessing.
        
        // Simple logic: Try standard folders.
        // In a real app, we should use the folder detected during setup.
        
        // Since we are inside the class, we could cache folders.
        // For this fix, let's try a best-effort approach.
        
        const targetFolder = 'Sent'; // Default fallback

        // We can use a callback wrapper
        const appendToFolder = (folder: string) => {
            return new Promise<void>((resolve, reject) => {
                imap.append(rawMessage, { mailbox: folder, flags: ['\\Seen'] }, (err: any) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        };

        // Try common names
        for (const folder of sentFolders) {
            try {
                await appendToFolder(folder);
                console.log(`✅ Appended sent message to ${folder} for user ${userId}`);
                return; 
            } catch (e) {
                // Continue to next folder
            }
        }
        console.warn(`⚠️ Failed to append sent message to any common Sent folder for user ${userId}`);
    }
}

export const imapIdleManager = new ImapIdleManager();
