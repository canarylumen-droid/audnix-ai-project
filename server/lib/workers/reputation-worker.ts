import { storage } from '../../storage.js';
import { verifyDomainDns } from '../email/dns-verification.js';
import { wsSync } from '../websocket-sync.js';
import { decryptToJSON } from '../crypto/encryption.js';

export class ReputationWorker {
    private interval: NodeJS.Timeout | null = null;
    private isProcessing = false;

    start(intervalMs = 3600000) { // Default 1 hour
        if (this.interval) return;

        console.log('🚀 Autonomous Reputation Worker Started');

        // Initial run after 10 seconds
        setTimeout(() => this.process(), 10000);

        this.interval = setInterval(() => {
            this.process();
        }, intervalMs);
    }

    async process() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            console.log('🔍 Running autonomous reputation checks...');
            const users = await storage.getAllUsers();

            for (const user of users) {
                const integrations = await storage.getIntegrations(user.id);
                const emailIntegrations = integrations.filter(i =>
                    (i.provider === 'gmail' || i.provider === 'outlook' || i.provider === 'custom_email') &&
                    i.connected
                );

                for (const integration of emailIntegrations) {
                    const meta = decryptToJSON(integration.encryptedMeta) || {};
                    const email = meta.email || meta.user || (integration as any).email;
                    if (!email) continue;

                    const domain = email.split('@')[1];
                    if (!domain) continue;

                    // Check if we already have a recent verification
                    const recentVerifications = await storage.getDomainVerifications(user.id, 1);
                    const lastCheck = recentVerifications[0];

                    // If last check was more than 12 hours ago, or none exists, re-check
                    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
                    if (!lastCheck || new Date(lastCheck.createdAt) < twelveHoursAgo) {
                        console.log(`📡 Autonomous DNS Check for ${domain} (${user.email})`);
                        const result = await verifyDomainDns(domain, undefined, true);

                        try {
                            await storage.createAuditLog({
                                userId: user.id,
                                leadId: "system", // Required field
                                integrationId: integration.id,
                                action: 'domain_reputation_check',
                                details: { domain, result, autonomous: true },
                                createdAt: new Date()
                            });

                            wsSync.notifyStatsUpdated(user.id);
                        } catch (e) {
                            console.error(`Failed to save reputation for ${domain}:`, e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Reputation Worker Error:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

export const reputationWorker = new ReputationWorker();
