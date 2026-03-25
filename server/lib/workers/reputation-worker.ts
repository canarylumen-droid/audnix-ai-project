import { storage } from '../../storage.js';
import { verifyDomainDns } from '../email/dns-verification.js';
import { wsSync } from '../websocket-sync.js';
import { decryptToJSON } from '../crypto/encryption.js';
import { quotaService } from '../monitoring/quota-service.js';

export class ReputationWorker {
    private interval: NodeJS.Timeout | null = null;
    private isProcessing = false;

    start(intervalMs = 120000) { // Set to 2 minutes as requested
        if (this.interval) return;

        console.log('🚀 Autonomous Reputation Worker Started (2m interval)');

        // Initial run after 5 seconds
        setTimeout(() => this.process(), 5000);

        this.interval = setInterval(() => {
            this.process();
        }, intervalMs);
    }

    async process() {
        if (this.isProcessing) return;
        if (quotaService.isRestricted()) {
            console.log('[ReputationWorker] Skipping check: Database quota restricted');
            return;
        }
        this.isProcessing = true;

        try {
            console.log('🔍 Running autonomous reputation checks (Every 2m)...');
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

                    // REAL-TIME: Always check every 2 minutes as requested
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
        } catch (error: any) {
            console.error('Reputation Worker Error:', error);
            quotaService.reportDbError(error);
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
