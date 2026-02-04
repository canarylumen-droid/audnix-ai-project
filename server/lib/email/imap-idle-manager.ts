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

            imap.once('ready', () => {
                this.openInbox(userId, imap);
            });

            imap.once('error', (err: any) => {
                console.error(`IMAP Error for user ${userId}:`, err.message);
                this.reconnect(userId, integration);
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
        imap.openBox('INBOX', false, (err: any) => {
            if (err) {
                console.error(`Failed to open INBOX for user ${userId}:`, err.message);
                return;
            }

            console.log(`✅ IMAP IDLE active for user ${userId}`);

            // Initial sync on connection
            this.fetchNewEmails(userId, imap, 'INBOX', 'inbound');

            imap.on('mail', (numNewMsgs: number) => {
                console.log(`📬 User ${userId} received ${numNewMsgs} new messages`);
                this.fetchNewEmails(userId, imap, 'INBOX', 'inbound');
            });

            // Periodically check Sent folders for outbound synchronization
            const sentFolders = ['Sent', 'Sent Items', 'Sent Messages', '[Gmail]/Sent Mail', 'Sent-Mail', 'SENT'];
            setInterval(() => {
                for (const folder of sentFolders) {
                    this.fetchNewEmails(userId, imap, folder, 'outbound').catch(() => { });
                }
            }, 10 * 60 * 1000); // Every 10 minutes

            // Start IDLE
            (imap as any).idle();
        });
    }

    private async fetchNewEmails(userId: string, imap: Imap, folderName: string = 'INBOX', direction: 'inbound' | 'outbound' = 'inbound'): Promise<void> {
        return new Promise((resolve) => {
            imap.openBox(folderName, true, (err: any) => {
                if (err) {
                    resolve();
                    return;
                }

                // We fetch the last 10 emails to be safe and catch up
                const fetch = imap.seq.fetch('-10:*', {
                    bodies: '',
                    struct: true
                });

                const emails: any[] = [];

                fetch.on('message', (msg: any) => {
                    msg.on('body', (stream: any) => {
                        simpleParser(stream, async (err: any, parsed: any) => {
                            if (!err && parsed) {
                                emails.push({
                                    from: parsed.from?.text,
                                    to: parsed.to?.text,
                                    subject: parsed.subject,
                                    text: parsed.text || parsed.html || '',
                                    date: parsed.date,
                                    html: parsed.html
                                });
                            }
                        });
                    });
                });

                fetch.once('end', async () => {
                    if (emails.length > 0) {
                        console.log(`📥 Processing ${emails.length} ${direction} emails from ${folderName} for user ${userId}`);
                        const results = await pagedEmailImport(userId, emails.map(e => ({
                            from: e.from?.split('<')[1]?.split('>')[0] || e.from,
                            to: e.to?.split('<')[1]?.split('>')[0] || e.to,
                            subject: e.subject,
                            text: e.text,
                            date: e.date,
                            html: e.html
                        })), (progress) => {
                            // Log progress if needed
                        }, direction);

                        if (results.imported > 0) {
                            console.log(`✨ Real-time sync: Imported ${results.imported} new ${direction} messages for user ${userId}`);

                            // Emit real-time update to frontend
                            try {
                                const { wsSync } = await import('../websocket-sync.js');
                                wsSync.notifyLeadsUpdated(userId, { type: 'UPDATE', count: results.imported });
                                wsSync.notifyMessagesUpdated(userId, { type: 'INSERT', count: results.imported });
                            } catch (wsError) {
                                // WebSocket might not be available or initialized
                            }
                        }
                    }

                    // Return to INBOX and resume IDLE if we were scanning a sent folder
                    if (folderName !== 'INBOX') {
                        imap.openBox('INBOX', false, () => {
                            (imap as any).idle();
                            resolve();
                        });
                    } else {
                        (imap as any).idle();
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
}

export const imapIdleManager = new ImapIdleManager();
