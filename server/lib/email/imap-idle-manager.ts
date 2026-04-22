import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { storage } from '../../storage.js';
import { decrypt } from '../crypto/encryption.js';
import { pagedEmailImport } from '../imports/paged-email-importer.js';
import type { Integration } from '../../../shared/schema.js';
import { wsSync } from '../websocket-sync.js';
import { mailboxHealthService } from './mailbox-health-service.js';
import { quotaService } from '../monitoring/quota-service.js';
import { gmailOAuth } from '../oauth/gmail.js';
import { outlookOAuth } from '../oauth/outlook.js';
import { workerHealthMonitor } from '../monitoring/worker-health.js';

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
    private connections: Map<string, Map<string, Imap>> = new Map(); // Key: integrationId -> folderType (primaryInbox/primarySent)
    private folders: Map<string, { inbox: string[], sent: string[], spam: string[] }> = new Map(); // Key: integrationId
    private syncIntervals: Map<string, Map<string, NodeJS.Timeout>> = new Map(); // Key: integrationId -> folderType
    private syncing: Set<string> = new Set(); // Key: integrationId
    private isRunning = false;
    private backoffDelays: Map<string, number> = new Map(); // Key: integrationId
    private lastActivity: Map<string, Date> = new Map(); // Key: `${integrationId}:${folderName}`
    private reconnectTimers: Map<string, NodeJS.Timeout> = new Map(); // Key: integrationId
    private failureCooldowns: Map<string, number> = new Map(); // Key: integrationId -> timestamp to retry
    private watchdogInterval: NodeJS.Timeout | null = null;
    private readonly MIN_BACKOFF = 5000; // 5s initial retry
    private readonly MAX_BACKOFF = 15 * 60 * 1000; // 15m max
    private readonly ZOMBIE_TIMEOUT_MS = 120 * 60 * 1000; // 2 hours silence = zombie

    /**
     * Start the IMAP IDLE manager
     */
    async start(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('🚀 IMAP IDLE Manager starting (Multi-Mailbox mode)...');
        // Initial sync
        await this.syncConnections();

        // Phase 11: Start the Zombie Connection Watchdog
        this.startWatchdog();

        // Use BullMQ for periodic connection management
        // This ensures transparency and reliability across restarts
        const { emailSyncQueue } = await import('../queues/email-sync-queue.js');
        if (emailSyncQueue) {
          await emailSyncQueue.add('sync-connections', { type: 'discovery' }, {
            repeat: {
              every: 5 * 60 * 1000 // Every 5 minutes
            },
            jobId: 'discovery-cycle'
          });
        }
    }

    /**
     * Gracefully stop the IMAP IDLE Manager.
     * Called during server SIGTERM/SIGINT to prevent ghost sessions on redeploy.
     */
    async stop(): Promise<void> {
        this.isRunning = false;
        if (this.watchdogInterval) {
            clearInterval(this.watchdogInterval);
            this.watchdogInterval = null;
        }

        let closed = 0;
        for (const [integrationId, folderMap] of this.connections.entries()) {
            const intervals = this.syncIntervals.get(integrationId);
            if (intervals) {
                for (const interval of intervals.values()) clearInterval(interval);
                this.syncIntervals.delete(integrationId);
            }
            for (const imap of folderMap.values()) {
                try { imap.end(); closed++; } catch (e) { /* already disconnected */ }
            }
        }

        this.connections.clear();
        this.folders.clear();
        this.lastActivity.clear();
        console.log(`[ImapIdleManager] Stopped. Closed ${closed} connection(s).`);
    }

    /**
     * Check if the IMAP manager is currently running
     */
    public getRunningStatus(): boolean {
        return this.isRunning;
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

    /**
     * Immediately and permanently kill all IMAP connections for a specific integration.
     * Called when a user explicitly disconnects a mailbox.
     * Clears all state, timers, and notifies the frontend in real time.
     */
    public forceDisconnect(integrationId: string, userId?: string): void {
        console.log(`🔌 [IMAP] Force-disconnecting all connections for integration ${integrationId}`);

        // 1. Kill all sync intervals for this integration
        const intervals = this.syncIntervals.get(integrationId);
        if (intervals) {
            for (const interval of intervals.values()) clearInterval(interval);
            this.syncIntervals.delete(integrationId);
        }

        // 2. Kill all IMAP connections (destroy, not just end — no graceful goodbye)
        const folderMap = this.connections.get(integrationId);
        if (folderMap) {
            for (const imap of folderMap.values()) {
                try {
                    if (imap.state !== 'disconnected') imap.destroy();
                } catch (e) { /* already gone */ }
            }
            this.connections.delete(integrationId);
        }

        // 3. Clear all metadata for this integration
        this.folders.delete(integrationId);
        this.syncing.delete(integrationId);
        this.backoffDelays.delete(integrationId);

        // 4. Clear any pending reconnection timers
        const timer = this.reconnectTimers.get(integrationId);
        if (timer) {
            clearTimeout(timer);
            this.reconnectTimers.delete(integrationId);
        }

        // 5. Clear any lastActivity entries for this integration
        for (const key of this.lastActivity.keys()) {
            if (key.startsWith(`${integrationId}:`)) {
                this.lastActivity.delete(key);
            }
        }

        // 5. Notify frontend in real time so UI updates immediately
        if (userId) {
            wsSync.notifySettingsUpdated(userId);
            wsSync.notifySyncStatus(userId, { syncing: false, integrationId, disconnected: true });
        }

        console.log(`✅ [IMAP] Integration ${integrationId} fully disconnected and all state cleared.`);
    }

    public async syncConnections(): Promise<void> {
        if (quotaService.isRestricted()) {
            console.log('[IMAPIdleManager] Skipping connection sync: Database quota restricted');
            return;
        }
        try {
            // All providers now use permanent IMAP IDLE connections for real-time sync.
            // Gmail & Outlook authenticate via XOAUTH2 (access token).
            // custom_email authenticates via password from encryptedMeta.
            const providers = ['gmail', 'outlook', 'custom_email'];
            let integrations: Integration[] = [];
            
            for (const provider of providers) {
                const found = await storage.getIntegrationsByProvider(provider);
                if (found) integrations = [...integrations, ...found];
            }
            
            const activeIntegrationIds = new Set(integrations.filter(i => i.connected).map(i => i.id));

            // Remove connections for integrations no longer active/connected
            for (const [integrationId, folderMap] of this.connections.entries()) {
                if (!activeIntegrationIds.has(integrationId)) {
                    console.log(`🔌 Closing all IMAP connections for integration ${integrationId}`);
                    
                    // Clear sync intervals
                    const intervals = this.syncIntervals.get(integrationId);
                    if (intervals) {
                        for (const interval of intervals.values()) clearInterval(interval);
                        this.syncIntervals.delete(integrationId);
                    }

                    for (const imap of folderMap.values()) {
                        try { imap.end(); } catch (e) {}
                    }
                    this.connections.delete(integrationId);
                    this.folders.delete(integrationId);
                }
            }

            // Add persistent IMAP IDLE connections for ALL active integrations:
            // - custom_email: Password auth via encryptedMeta
            // - gmail / outlook: XOAUTH2 via live OAuth token refresh
            const supported = ['custom_email', 'gmail', 'outlook'];
            for (const integration of integrations) {
                if (integration.connected && supported.includes(integration.provider) && !this.connections.has(integration.id)) {
                    console.log(`🔌 Opening real-time IMAP IDLE connection for integration ${integration.id} (${integration.provider}, User: ${integration.userId})`);
                    this.setupConnection(integration.id, integration);
                }
            }
        } catch (error) {
            console.error('Error syncing IMAP IDLE connections:', error);
            quotaService.reportDbError(error);
        }
    }

    /**
     * Discover special folders (Inbox, Sent) using IMAP attributes
     */
    private async discoverFolders(integrationId: string, imap: Imap): Promise<void> {
        try {
            const boxes = await this.executeImapCommand<any>(imap, (cb) => imap.getBoxes(cb));
            
            const inboxFolders: string[] = [];
            const sentFolders: string[] = [];
            const spamFolders: string[] = [];

            const processBoxes = (obj: any, prefix = '') => {
                for (const key in obj) {
                    const box = obj[key];
                    const fullName = prefix + key;
                    const attribs = box.attribs || [];

                    // 1. Check standard IMAP attributes (Most Reliable)
                    // Attributes like \Sent, \Junk, etc. are standard in RFC 6154
                    const isInbox = attribs.some((a: string) => a.toLowerCase() === '\\inbox');
                    const isSent = attribs.some((a: string) => 
                        a.toLowerCase() === '\\sent' || 
                        a.toLowerCase() === '\\sentmail' || 
                        a.toLowerCase() === '\\sentitems'
                    );
                    const isSpam = attribs.some((a: string) => 
                        a.toLowerCase() === '\\spam' || 
                        a.toLowerCase() === '\\junk'
                    );

                    if (isInbox) {
                        inboxFolders.push(fullName);
                    } else if (isSent) {
                        sentFolders.push(fullName);
                    } else if (isSpam) {
                        spamFolders.push(fullName);
                    } else {
                        // 2. Fallback to name patterns (Localized)
                        const lowerKey = key.toLowerCase();
                        if (lowerKey === 'inbox') {
                            inboxFolders.push(fullName);
                        } else if ([
                            'sent', 'sent items', 'sent messages', 'sent mails', 'sent-mail',
                            'gesendet', 'enviados', 'envoyés', 'outbox', 'verzonden', 
                            'posta inviata', 'skickat', 'elementos enviados'
                        ].some(s => lowerKey === s || lowerKey === `inbox.${s}`)) {
                            sentFolders.push(fullName);
                        } else if ([
                            'spam', 'junk', 'bulk', 'junk-email', 'junk email', 'spam-messages'
                        ].some(s => lowerKey === s || lowerKey.includes(s))) {
                            spamFolders.push(fullName);
                        }
                    }

                    if (box.children) {
                        processBoxes(box.children, fullName + (box.delimiter || '/'));
                    }
                }
            };

            processBoxes(boxes);

            // Defaults if none found
            if (inboxFolders.length === 0) inboxFolders.push('INBOX');
            if (sentFolders.length === 0) sentFolders.push('Sent'); 
            if (spamFolders.length === 0) spamFolders.push('Spam');

            console.log(`[IMAP] Discovered folders for ${integrationId}: Inbox=[${inboxFolders}], Sent=[${sentFolders}], Spam=[${spamFolders}]`);
            this.folders.set(integrationId, {
                inbox: [...new Set(inboxFolders)],
                sent: [...new Set(sentFolders)],
                spam: [...new Set(spamFolders)]
            });
        } catch (err: any) {
            console.warn(`[IMAP] Folder discovery failed for ${integrationId}:`, err.message);
            // Minimal fallbacks
            this.folders.set(integrationId, {
                inbox: ['INBOX'],
                sent: ['Sent', 'Sent Items', '[Gmail]/Sent Mail'],
                spam: ['Spam', 'Junk', '[Gmail]/Spam']
            });
        }
    }

    /**
     * Helper to execute IMAP commands safely by stopping IDLE if active, 
     * running the command, and then restarting IDLE if appropriate.
     */
    private async executeImapCommand<T>(imap: Imap, commandFn: (cb: (err: any, result: T) => void) => void): Promise<T | undefined> {
        if (!imap || imap.state === 'disconnected') return undefined;

        return new Promise((resolve, reject) => {
            const wasIdling = !!(imap as any)._idleWaiter;
            
            const runCommand = () => {
                commandFn((err, result) => {
                    if (wasIdling && imap.state === 'authenticated') {
                        try { (imap as any).idle(); } catch (e) {}
                    }
                    if (err) return reject(err);
                    resolve(result);
                });
            };

            if (wasIdling && imap.state === 'authenticated') {
                imap.once('update', () => { /* wait for idle stop */ });
                (imap as any).stopIdle();
                setTimeout(runCommand, 20); // Give it a moment to stop
            } else {
                runCommand();
            }
        });
    }

    /**
     * Setup a persistent IMAP connection with IDLE support
     */
    private async setupConnection(integrationId: string, integration: Integration): Promise<void> {
        if (this.connections.has(integrationId)) return;

        // Phase 19 Hardening: Connection Failure Throttling
        const nextRetry = this.failureCooldowns.get(integrationId) || 0;
        if (Date.now() < nextRetry) {
            // Silently skip if we are in cooldown (already logged the error once)
            return;
        }

        console.log(`🔌 [IMAP] Initializing real-time connection for integration ${integrationId} (User: ${integration.userId})`);
        try {
            // For OAuth providers (gmail/outlook), we do NOT need encryptedMeta.
            // They authenticate via a live access token (XOAUTH2).
            // For custom_email, we require encryptedMeta to get IMAP credentials.
            const isOAuthProvider = integration.provider === 'gmail' || integration.provider === 'outlook';

            let config: EmailConfig = {};
            if (!isOAuthProvider) {
                if (!integration.encryptedMeta) {
                    console.warn(`[IMAP] Skipping integration ${integrationId} — encryptedMeta is missing (User: ${integration.userId})`);
                    return;
                }
                try {
                    const credentialsStr = await decrypt(integration.encryptedMeta);
                    config = JSON.parse(credentialsStr) as EmailConfig;
                } catch (decryptErr) {
                    console.warn(`[IMAP] Skipping integration ${integrationId} — failed to decrypt/parse config: ${(decryptErr as any)?.message}`);
                    return;
                }
            }

            // Determine IMAP host - OAuth providers have well-known hosts
            let imapHost = config.imap_host || config.smtp_host?.replace('smtp', 'imap') || '';
            const imapPort = config.imap_port || 993;

            if (!imapHost) {
                if (integration.provider === 'gmail') imapHost = 'imap.gmail.com';
                else if (integration.provider === 'outlook') imapHost = 'outlook.office365.com';
            }

            if (!imapHost) {
                console.warn(`[IMAP] Skipping integration ${integrationId} — imap_host not found in config (User: ${integration.userId})`);
                return;
            }

            // Phase 21: Absolute IPv4 Force - Pre-resolve host to IP
            let resolvedImapHost = imapHost;
            try {
                const dns = await import('dns');
                const lookup = await dns.promises.lookup(imapHost, { family: 4 });
                resolvedImapHost = lookup.address;
                console.log(`[IMAP] Pre-resolved ${imapHost} to ${resolvedImapHost} (IPv4)`);
            } catch (lookupErr) {
                console.warn(`[IMAP] DNS Pre-resolution failed for ${imapHost}:`, lookupErr);
            }

            const imapOptions: any = {
                user: config.smtp_user || integration.accountType || '',
                host: resolvedImapHost,
                port: imapPort,
                tls: imapPort === 993,
                // Force IPv4 for cloud environment stability
                family: 4,
                tlsOptions: { 
                    rejectUnauthorized: false,
                    servername: imapHost // Essential for SNI verification when connecting by IP
                },
                connTimeout: 45000,
                authTimeout: 45000,
                keepalive: {
                    interval: 15000,
                    idleInterval: 60000, 
                    forceNoop: true
                }
            };

            // Handle OAuth providers with XOAUTH2
            if (integration.provider === 'gmail' || integration.provider === 'outlook') {
                const token = integration.provider === 'gmail' 
                    ? await gmailOAuth.getValidToken(integration.userId, integration.accountType || undefined)
                    : await outlookOAuth.getValidToken(integration.userId);
                
                if (token) {
                    imapOptions.xoauth2 = Buffer.from(
                        `user=${imapOptions.user}\x01auth=Bearer ${token}\x01\x01`
                    ).toString('base64');
                    
                    const { socketService } = await import('../realtime/socket-service.js');
                    socketService.emitToUser(integration.userId, 'sync:status', {
                        integrationId,
                        provider: integration.provider,
                        status: 'connected',
                        realtime: true,
                        method: 'idle'
                    });
                    // Remove password for OAuth
                    delete imapOptions.password;
                } else {
                    console.warn(`[IMAP] Could not get OAuth token for ${integration.provider} integration ${integrationId}`);
                    return;
                }
            } else {
                imapOptions.password = config.smtp_pass!;
            }

            const imap = new Imap(imapOptions);

            if (!this.connections.has(integrationId)) this.connections.set(integrationId, new Map());
            this.connections.get(integrationId)!.set('discovery', imap);

            const safeEnd = () => {
                try {
                    if (imap.state !== 'disconnected') imap.end();
                } catch (err) {
                }
            };

            imap.once('ready', async () => {
                try {
                    await this.discoverFolders(integrationId, imap);
                    const folders = this.folders.get(integrationId);
                    
                    // This first connection handles INBOX discovery and IDLE
                    const primaryInbox = folders?.inbox[0] || 'INBOX';
                    this.setupPersistentListener(integrationId, primaryInbox, integration, 'inbound');

                    // If we have a Sent folder, spawn a second persistent listener for "Real Mail App" 0s discovery
                    const primarySent = folders?.sent[0];
                    if (primarySent) {
                        this.setupPersistentListener(integrationId, primarySent, integration, 'outbound');
                    }

                    // Close this discovery connection as we now have specific persistent ones
                    imap.end();
                } catch (readyErr) {
                    console.error(`[IMAP] CRITICAL: Discovery/setup failed for integration ${integrationId}:`, readyErr);
                    imap.end();
                }
            });

            imap.once('error', async (err: any) => {
                try {
                    // Phase 19: Full Error Diagnostics. Log everything to debug production loops.
                    const errorDetails = {
                        code: err.code,
                        message: err.message || 'No explicit message',
                        stack: err.stack ? 'present' : 'none',
                        integrationId,
                        userId: integration.userId
                    };
                    console.error(`IMAP Error for integration ${integrationId} (User: ${integration.userId}):`, JSON.stringify(errorDetails));
                    
                    workerHealthMonitor.recordError('IMAP IDLE', err.message || 'Unknown IMAP error');

                    // Set cooldown to prevent loop (5 minutes)
                    this.failureCooldowns.set(integrationId, Date.now() + 5 * 60 * 1000);

                    const fatalErrors = ['AUTHENTICATIONFAILED', 'Not authenticated', 'Invalid credentials', 'Login failed', 'BAD', 'NO'];
                    const retryableErrors = ['ETIMEDOUT', 'ECONNRESET', 'EPIPE', 'ECONNREFUSED', 'ENOTFOUND'];
                    
                    const errorStr = (err.code || err.message || '').toLowerCase();
                    const isFatal = fatalErrors.some(code => errorStr.includes(code.toLowerCase()));
                    const isRetryable = retryableErrors.some(code => errorStr.includes(code.toLowerCase()));

                    if (isFatal) {
                        console.warn(`🛑 Fatal IMAP error for integration ${integrationId}. Stopping retries.`);
                        try { imap.destroy(); } catch (e) {}
                        this.cleanupIntegration(integrationId);

                        try {
                            const integrationLatest = await storage.getIntegration(integration.userId, integrationId);
                            if (integrationLatest) {
                                await mailboxHealthService.handleMailboxFailure(integrationLatest, err.message || 'Authentication Failed');
                            }
                        } catch (e) {
                            console.error('Failed to update integration with IMAP error:', e);
                        }
                    } else if (isRetryable) {
                        // Phase 20: Hardened Reconnection. 
                        // If we just set a 5-minute cooldown (at line 480), we should NOT immediately reconnect.
                        // We will let the background syncConnections loop (every 2m) pick it up only after the cooldown.
                        console.warn(`⏳ Retryable IMAP error for ${integrationId} (${err.code}). Error is throttled for 5m. Waiting for periodic sync.`);
                        try { imap.destroy(); } catch (e) {}
                        this.cleanupIntegration(integrationId);
                    } else {
                        try { imap.destroy(); } catch (e) {}
                        this.cleanupIntegration(integrationId);
                    }
                } catch (fatalErr) {
                    console.error('[IMAP] CRITICAL: Exception in error handler:', fatalErr);
                }
            });

            imap.once('end', () => {
                console.log(`IMAP discovery connection ended for integration ${integrationId}`);
                if (this.connections.get(integrationId)?.get('discovery') === imap) {
                    this.connections.get(integrationId)!.delete('discovery');
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

    private async setupPersistentListener(integrationId: string, folderName: string, integration: Integration, direction: 'inbound' | 'outbound'): Promise<void> {
        try {
            // OAuth providers (gmail/outlook) authenticate via live access token — no encryptedMeta needed.
            const isOAuthProvider = integration.provider === 'gmail' || integration.provider === 'outlook';

            let config: EmailConfig = {};
            if (!isOAuthProvider) {
                if (!integration.encryptedMeta) {
                    console.warn(`[IMAP Persistent] Skipping ${folderName} for ${integrationId} — encryptedMeta missing.`);
                    return;
                }
                const credentialsStr = await decrypt(integration.encryptedMeta);
                config = JSON.parse(credentialsStr) as EmailConfig;
            }

            let imapHost = config.imap_host || config.smtp_host?.replace('smtp', 'imap') || '';
            const imapPort = config.imap_port || 993;

            if (!imapHost) {
                if (integration.provider === 'gmail') imapHost = 'imap.gmail.com';
                else if (integration.provider === 'outlook') imapHost = 'outlook.office365.com';
            }

            if (!imapHost) {
                console.warn(`[IMAP Persistent] Skipping folder ${folderName} for ${integrationId} — imap_host not found.`);
                return;
            }

            const imapOptions: any = {
                user: config.smtp_user || integration.accountType || '',
                host: imapHost,
                port: imapPort,
                tls: imapPort === 993,
                // Force IPv4 for cloud environment stability
                family: 4,
                tlsOptions: { rejectUnauthorized: false },
                keepalive: {
                    interval: 15000, // NOOP interval
                    idleInterval: 60000, // IDLE restart interval
                    forceNoop: true
                }
            };

            if (isOAuthProvider) {
                const token = integration.provider === 'gmail'
                    ? await gmailOAuth.getValidToken(integration.userId, integration.accountType || undefined)
                    : await outlookOAuth.getValidToken(integration.userId);

                if (!token) {
                    console.warn(`[IMAP Persistent] Could not get OAuth token for ${integration.provider} integration ${integrationId}. Aborting persistent listener.`);
                    return;
                }
                const user = integration.accountType || config.smtp_user || '';
                imapOptions.user = user;
                imapOptions.xoauth2 = Buffer.from(`user=${user}\x01auth=Bearer ${token}\x01\x01`).toString('base64');
            } else {
                imapOptions.password = config.smtp_pass!;
            }

            const imap = new Imap(imapOptions);

            if (!this.connections.has(integrationId)) this.connections.set(integrationId, new Map());
            this.connections.get(integrationId)!.set(folderName, imap);

            imap.once('ready', () => {
                workerHealthMonitor.recordSuccess('IMAP IDLE');
                // Reset backoff on successful connect so next disconnect recovers fast (5s)
                this.backoffDelays.delete(integrationId);
                this.lastActivity.set(`${integrationId}:${folderName}`, new Date());

                imap.openBox(folderName, false, (err: any) => {
                    if (err) {
                        console.error(`[IMAP] Failed to open ${folderName} for integration ${integrationId}:`, err.message);
                        workerHealthMonitor.recordError('IMAP IDLE', err.message);
                        return;
                    }

                    console.log(`✅ Real-time IDLE active on '${folderName}' for integration ${integrationId} (${direction})`);
                    
                    wsSync.notifyActivityUpdated(integration.userId, {
                        type: 'sync_active',
                        title: '⚡ Real-time Sync Active',
                        message: `Monitoring ${direction} on ${folderName}`
                    });

                    this.fetchNewEmails(integrationId, integration.userId, imap, folderName, direction);

                    imap.on('mail', (num: number) => {
                        workerHealthMonitor.recordSuccess('IMAP IDLE');
                        this.lastActivity.set(`${integrationId}:${folderName}`, new Date());
                        console.log(`📬 [${folderName}] Integration ${integrationId} received ${num} new messages (IDLE push)`);
                        this.fetchNewEmails(integrationId, integration.userId, imap, folderName, direction);
                    });

                    imap.on('expunge', (seq: number) => {
                        console.log(`🗑️ [${folderName}] Integration ${integrationId} expunged message. Syncing deletions.`);
                        this.syncDeletedMessages(integrationId, imap, integration.userId, folderName);
                    });

                    if (typeof (imap as any).idle === 'function') (imap as any).idle();

                    if (!this.syncIntervals.has(integrationId)) this.syncIntervals.set(integrationId, new Map());
                    const interval = setInterval(async () => {
                        if (this.connections.get(integrationId)?.get(folderName) === imap) {
                            if (imap.state === 'authenticated') {
                                try {
                                    // NOOP is safer than full fetch for heartbeat unless we actually expect mail signal to be lost
                                    // imap.noop(() => {}); 
                                    this.fetchNewEmails(integrationId, integration.userId, imap, folderName, direction);
                                } catch (e) {}
                            }
                        }
                    }, 5 * 60 * 1000); // 5m is enough with imap keepalive active
                    this.syncIntervals.get(integrationId)!.set(folderName, interval);
                });
            });

            imap.once('error', (err: any) => {
                workerHealthMonitor.recordError('IMAP IDLE', err.message);
                console.error(`[IMAP Persistent] Error on ${folderName} for ${integrationId}:`, err.message);
                this.reconnect(integrationId, integration); // This will eventually re-setup all connections
            });

            imap.once('end', () => {
                workerHealthMonitor.recordError('IMAP IDLE', 'Connection ended unexpectedly');
            });

            imap.once('close', (hadError: boolean) => {
                workerHealthMonitor.recordError('IMAP IDLE', `Connection closed (hadError: ${hadError})`);
            });

            imap.connect();
        } catch (e) {
            console.error(`[IMAP Persistent] Setup failed for ${folderName}:`, e);
        }
    }

    private async syncAccountFolders(integrationId: string, imap: Imap, userId: string): Promise<void> {
        if (imap.state !== 'authenticated') return;
        if (this.syncing.has(integrationId)) return;
        this.syncing.add(integrationId);
        
        // Instant notify UI
        wsSync.notifySyncStatus(userId, { syncing: true, integrationId });

        try {
            const folders = this.folders.get(integrationId);
            if (!folders) return;

            // Sync all discovered folders using the provided connection
            // Note: This connection is transient or one of the persistent ones
            for (const inbox of folders.inbox) await this.fetchNewEmails(integrationId, userId, imap, inbox, 'inbound');
            for (const sent of folders.sent) await this.fetchNewEmails(integrationId, userId, imap, sent, 'outbound');
            for (const spam of folders.spam) await this.fetchNewEmails(integrationId, userId, imap, spam, 'inbound', true);
        } catch (error) {
            console.error(`[IMAP] Sync folders failed for ${integrationId}:`, error);
        } finally {
            this.syncing.delete(integrationId);
            wsSync.notifySyncStatus(userId, { syncing: false, integrationId });
        }
    }

    private async fetchNewEmails(integrationId: string, userId: string, imap: Imap, folderName: string = 'INBOX', direction: 'inbound' | 'outbound' = 'inbound', isSpam = false): Promise<void> {
        try {
            wsSync.notifySyncStatus(userId, { syncing: true, folder: folderName, integrationId });

            await this.executeImapCommand(imap, (cb) => {
                imap.openBox(folderName, true, (err, box) => {
                    if (err) return cb(err, null);

                    if (!box || !box.messages || box.messages.total === 0) {
                        return cb(null, null);
                    }

                    const total = box.messages.total;
                    const fetchLimit = total < 20 ? 1 : total - 19;
                    const fetch = imap.seq.fetch(`${fetchLimit}:*`, { bodies: '', struct: true });
                    const emails: any[] = [];

                    fetch.on('message', (msg: any, seqno: number) => {
                        let flags: string[] = [];
                        let size = 0;
                        msg.on('attributes', (attrs: any) => {
                            flags = attrs.flags || [];
                            size = attrs.size || 0;
                        });
                        msg.on('body', (stream: any) => {
                            // Phase 15: MIME Safeguard - Skip parsing for huge attachments (>5MB)
                            if (size > 5 * 1024 * 1024) {
                                console.warn(`[IMAP] Skipping parsing for large message (${Math.round(size/1024/1024)}MB) at seq ${seqno}`);
                                stream.resume(); // Consume stream without parsing
                                emails.push({
                                    subject: `(Large Message Skipped: ${Math.round(size/1024/1024)}MB)`,
                                    text: 'This message was too large to sync automatically. Please view it in your primary email client.',
                                    date: new Date(),
                                    flags,
                                    uid: seqno,
                                    isSpam: isSpam
                                });
                                return;
                            }

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

                    fetch.once('error', (err: any) => cb(err, null));
                    fetch.once('end', async () => {
                        try {
                            if (emails.length > 0) {
                                console.log(`📥 Processing ${emails.length} ${direction} emails from ${folderName}`);
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

                                if (importRes.imported > 0) {
                                    wsSync.notifyMessagesUpdated(userId, { event: 'INSERT', count: importRes.imported });
                                    if (isSpam) {
                                        const { calculateReputationScore } = await import('./reputation-monitor.js');
                                        calculateReputationScore(integrationId).catch(console.error);
                                    }
                                    
                                    // Trigger autonomous AI reply for new inbound messages
                                    if (direction === 'inbound' && !isSpam) {
                                        if (process.env.GLOBAL_AI_PAUSE === 'true') {
                                            console.warn("[IMAP] Global AI Pause active. Skipping automated analysis/reply.");
                                        } else {
                                            try {
                                                const { users } = await import('../../../shared/schema.js');
                                            const { eq } = await import('drizzle-orm');
                                            const { db } = await import('../../db.js');

                                            const userRow = await db.select({ config: users.config }).from(users).where(eq(users.id, userId)).limit(1);
                                            const config = (userRow[0]?.config as any) || {};
                                            const isAutonomousMode = config.autonomousMode !== false;

                                            for (const email of emails) {
                                                const lead = await storage.getLeadByEmail(email.from?.split('<')[1]?.split('>')[0] || email.from, userId);
                                                if (lead) {
                                                    if (!isAutonomousMode || lead.aiPaused) continue;

                                                    const { processInboundMessageWithAnalysis } = await import('../ai/inbound-message-analyzer.js');
                                                    const analysis = await processInboundMessageWithAnalysis(lead.id, email.text, 'email');

                                                    wsSync.notifyMessagesUpdated(userId, { 
                                                        leadId: lead.id, 
                                                        message: { 
                                                            id: email.id, 
                                                            content: email.text, 
                                                            direction: 'inbound', 
                                                            createdAt: email.date,
                                                            intent: analysis?.urgencyLevel
                                                        },
                                                        integrationId
                                                    });
                                                    
                                                    if (analysis?.shouldAutoReply) {
                                                        const { scheduleAutomatedEmailReply } = await import('../ai/email-automation.js');
                                                        await scheduleAutomatedEmailReply(
                                                            userId, lead.id, email.from, email.subject, email.text, analysis.intent as any, email.threadId
                                                        );
                                                    }
                                                }
                                            }
                                        } catch (aiErr) {
                                            console.error('[IMAP] AI trigger error:', aiErr);
                                        }
                                    }
                                }
                            }
                        }
                    } catch (importError) {
                            console.error(`[IMAP] CRITICAL: Failed to import emails from ${folderName}:`, importError);
                        } finally {
                            cb(null, null);
                        }
                    });
                });
            });
        } catch (error: any) {
            console.warn(`[IMAP] fetchNewEmails failed for ${folderName}:`, error.message);
        } finally {
            wsSync.notifySyncStatus(userId, { syncing: false, folder: folderName, integrationId });
        }
    }

    private async syncDeletedMessages(integrationId: string, imap: Imap, userId: string, folderName: string): Promise<void> {
        try {
            await this.executeImapCommand(imap, (cb) => {
                imap.openBox(folderName, true, (err, box) => {
                    if (err || !box || box.messages.total === 0) return cb(err, null);

                    const fetchRange = box.messages.total < 500 ? '1:*' : `${box.messages.total - 499}:*`;
                    const fetch = imap.seq.fetch(fetchRange, { struct: false, bodies: 'HEADER.FIELDS (MESSAGE-ID)' });
                    const imapMessageIds = new Set<string>();

                    fetch.on('message', (msg: any) => {
                        msg.on('body', (stream: any) => {
                            let buffer = '';
                            stream.on('data', (chunk: any) => buffer += chunk.toString());
                            stream.on('end', () => {
                                const match = buffer.match(/Message-ID:\s*(<[^>]+>)/i);
                                if (match && match[1]) imapMessageIds.add(match[1]);
                            });
                        });
                    });

                    fetch.once('error', (err: any) => cb(err, null));
                    fetch.once('end', async () => {
                        try {
                            const { db } = await import('../../db.js');
                            const { messages } = await import('../../../shared/schema.js');
                            const { eq, and, desc, inArray } = await import('drizzle-orm');

                            const recentDbMessages = await db.select()
                                .from(messages)
                                .where(and(eq(messages.userId, userId), eq(messages.integrationId, integrationId)))
                                .orderBy(desc(messages.createdAt))
                                .limit(100);

                            const toDelete: string[] = [];
                            for (const dbMsg of recentDbMessages) {
                                if (dbMsg.provider === 'email' && dbMsg.metadata && (dbMsg.metadata as any).messageId) {
                                    const mid = (dbMsg.metadata as any).messageId;
                                    if (!imapMessageIds.has(mid)) toDelete.push(dbMsg.id);
                                }
                            }

                            if (toDelete.length > 0) {
                                await db.delete(messages).where(inArray(messages.id, toDelete));
                                wsSync.notifyMessagesUpdated(userId, { event: 'DELETE', messageIds: toDelete });
                                wsSync.notifyStatsUpdated(userId);
                                console.log(`[IMAP] Synced ${toDelete.length} deletions.`);
                            }
                        } catch (e) {}
                        cb(null, null);
                    });
                });
            });
        } catch (error: any) {
            console.error(`[IMAP] syncDeletedMessages failed for ${integrationId}:`, error.message);
        }
    }

    private cleanupIntegration(integrationId: string): void {
        const folderMap = this.connections.get(integrationId);
        if (folderMap) {
            for (const imap of folderMap.values()) {
                try { 
                    if ((imap as any)._idleWaiter) (imap as any).stopIdle();
                    try { imap.destroy(); } catch (e) {} 
                } catch (e) {}
            }
        }
        this.connections.delete(integrationId);
        
        const intervals = this.syncIntervals.get(integrationId);
        if (intervals) {
            for (const interval of intervals.values()) clearInterval(interval);
            this.syncIntervals.delete(integrationId);
        }
        
        this.folders.delete(integrationId);
        this.syncing.delete(integrationId);
        
        // Phase 12: Clear any pending reconnection timers
        const timer = this.reconnectTimers.get(integrationId);
        if (timer) {
            clearTimeout(timer);
            this.reconnectTimers.delete(integrationId);
        }
    }

    private reconnect(integrationId: string, integration: Integration): void {
        if (!this.isRunning) return;

        console.log(`🔄 Preparing IMAP reconnection for ${integrationId} (${integration.provider})...`);
        this.cleanupIntegration(integrationId);

        const currentDelay = this.backoffDelays.get(integrationId) || this.MIN_BACKOFF;
        // Phase 13: Exponential Backoff with Jitter (prevents synchronized thundering herd)
        const jitter = 0.5 + Math.random(); // 0.5 to 1.5 range
        const nextDelay = Math.min(Math.floor(currentDelay * 2 * jitter), this.MAX_BACKOFF);
        this.backoffDelays.set(integrationId, nextDelay);

        console.log(`🔄 Reconnecting IMAP for ${integrationId} in ${Math.round(currentDelay / 1000)}s (Next wait: ${Math.round(nextDelay / 1000)}s)...`);

        // Clear existing timer if any
        const existingTimer = this.reconnectTimers.get(integrationId);
        if (existingTimer) clearTimeout(existingTimer);

        const timer = setTimeout(async () => {
            this.reconnectTimers.delete(integrationId);

            if (!this.isRunning || this.connections.has(integrationId)) return;

            // Phase 14: Database Verification — ensure integration still exists before reconnecting
            try {
                const checkInt = await storage.getIntegrationById(integrationId);
                if (!checkInt || !checkInt.connected) {
                    console.log(`🔌 [IMAP Reconnect] Aborting — integration ${integrationId} is no longer connected or was deleted.`);
                    return;
                }
            } catch (e) {
                console.error(`[IMAP Reconnect] DB Check failed for ${integrationId}:`, e);
                return;
            }

            // For OAuth providers, proactively refresh token before reconnecting.
            // This prevents an expired token causing an infinite auth-failure loop.
            if (integration.provider === 'gmail' || integration.provider === 'outlook') {
                try {
                    const token = integration.provider === 'gmail'
                        ? await gmailOAuth.getValidToken(integration.userId, integration.accountType || undefined)
                        : await outlookOAuth.getValidToken(integration.userId);
                    if (!token) {
                        console.warn(`[IMAP Reconnect] Could not refresh OAuth token for ${integrationId}. Aborting reconnect.`);
                        return;
                    }
                    console.log(`[IMAP Reconnect] OAuth token refreshed for ${integrationId}. Reconnecting...`);
                } catch (tokenErr: any) {
                    console.error(`[IMAP Reconnect] Token refresh failed for ${integrationId}:`, tokenErr.message);
                    return;
                }
            }

            this.setupConnection(integrationId, integration);
        }, currentDelay);

        this.reconnectTimers.set(integrationId, timer);
    }

    /**
     * Sync a local action (archive/delete) to the remote IMAP server
     */
    public async syncRemoteAction(userId: string, leadId: string, action: 'archive' | 'unarchive' | 'delete'): Promise<void> {
        try {
            const lead = await storage.getLeadById(leadId);
            if (!lead || !lead.externalId) {
                throw new Error('Lead missing Instagram ID (externalId)');
            }

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
        const folderMap = this.connections.get(integrationId);
        const imap = folderMap?.values().next().value;
        if (!imap || imap.state !== 'authenticated') return { success: false, count: 0, error: 'IMAP not active' };

        const folders = this.folders.get(integrationId);
        if (!folders) return { success: false, count: 0, error: 'Folders not discovered' };

        let totalImported = 0;
        wsSync.notifySyncStatus(userId, { syncing: true, integrationId });

        try {
            const syncFolder = async (folderName: string, direction: 'inbound' | 'outbound'): Promise<number> => {
                const result = await this.executeImapCommand<number>(imap, (cb) => {
                    imap.openBox(folderName, true, (err, box) => {
                        if (err || !box || box.messages.total === 0) return cb(null, 0);

                        const total = box.messages.total;
                        const fetchRange = `${Math.max(1, total - Math.min(total, limit) + 1)}:*`;
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
                        
                        fetch.once('error', (err: any) => cb(err, 0));
                        fetch.once('end', async () => {
                            try {
                                if (emails.length > 0) {
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
                                    cb(null, res.imported);
                                } else {
                                    cb(null, 0);
                                }
                            } catch (error) {
                                console.error(`[IMAP] Historical sync error for folder ${folderName}:`, error);
                                cb(null, 0); // Still return 0 so the chain doesn't break
                            } finally {
                                // Guaranteed safety for the IMAP connection pool
                            }
                        });
                    });
                });
                return result || 0;
            };

            for (const inbox of (folders?.inbox || [])) totalImported += await syncFolder(inbox, 'inbound');
            for (const sent of (folders?.sent || [])) totalImported += await syncFolder(sent, 'outbound');

            return { success: true, count: totalImported };
        } catch (error: any) {
            return { success: false, count: totalImported, error: error.message };
        } finally {
            wsSync.notifySyncStatus(userId, { syncing: false, integrationId });
        }
    }

    /**
     * Phase 11: Zombie Watchdog Logic
     * Periodically checks all active connections to ensure they've seen activity.
     * If a connection is 'silent' for > 2 hours, we assume it's a zombie and recycle it.
     */
    private startWatchdog(): void {
        if (this.watchdogInterval) clearInterval(this.watchdogInterval);
        
        this.watchdogInterval = setInterval(() => {
            const now = new Date().getTime();
            for (const [key, lastSeen] of this.lastActivity.entries()) {
                const idleTime = now - lastSeen.getTime();
                if (idleTime > this.ZOMBIE_TIMEOUT_MS) {
                    const [integrationId, folderName] = key.split(':');
                    console.warn(`🚨 [WATCHDOG] Zombie detected on ${integrationId}:${folderName} (${Math.round(idleTime/1000/60)}m idle). Recycling...`);
                    this.forceRecycleConnection(integrationId, folderName);
                }
            }
        }, 15 * 60 * 1000); // Check every 15 minutes
    }

    private forceRecycleConnection(integrationId: string, folderName: string): void {
        const folderMap = this.connections.get(integrationId);
        if (!folderMap) return;

        const imap = folderMap.get(folderName);
        if (imap) {
            try {
                // Destroying the connection will trigger the 'error' or 'close' listener, which triggers reconnect()
                imap.destroy();
                this.lastActivity.delete(`${integrationId}:${folderName}`);
            } catch (e) {
                console.error(`[WATCHDOG] Failed to destroy zombie connection ${integrationId}:`, e);
            }
        }
    }
}


export const imapIdleManager = new ImapIdleManager();
