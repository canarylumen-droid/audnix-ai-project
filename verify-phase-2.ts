process.env.REDIS_URL = ''; // Inline Redis disable
import 'dotenv/config';
import { db } from './server/db.js';
import { 
  integrations, 
  campaignLeads, 
  userOutreachSettings,
  bounceTracker,
  auditTrail,
  users,
  outreachCampaigns,
  leads
} from './shared/schema.js';
import { eq, and, sql, inArray, like, lte, or } from 'drizzle-orm';
import { redistributionWorker } from './server/lib/email/redistribution-worker.js';
import { bounceHandler } from './server/lib/email/bounce-handler.js';
import * as fs from 'fs';

const LOG_FILE = 'verification_phase2.log';
function log(msg: string) {
  console.log(msg);
  fs.appendFileSync(LOG_FILE, msg + '\n');
}

if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

async function verifyPhase2() {
  log('🧪 Starting Phase 2 Verification...');

  try {
    // 1. Setup Test Data
    const [user] = await db.select().from(users).limit(1);
    if (!user) throw new Error('No user found');
    const userId = user.id;

    log(`👤 Testing with user: ${userId}`);

    const dummyCampaignId = '99999999-9999-9999-9999-999999999999';
    const mb1Id = '00000000-0000-0000-0000-000000000001';
    const mb2Id = '00000000-0000-0000-0000-000000000002';
    
    // Cleanup
    await db.delete(campaignLeads).where(eq(campaignLeads.campaignId, dummyCampaignId));
    await db.delete(outreachCampaigns).where(eq(outreachCampaigns.id, dummyCampaignId));
    await db.delete(integrations).where(inArray(integrations.id, [mb1Id, mb2Id]));
    await db.delete(leads).where(like(sql`id::text`, '88888888-8888-8888-8888-88888888888%'));

    // Create Campaign
    await db.insert(outreachCampaigns).values({
      id: dummyCampaignId,
      userId,
      name: 'Test Campaign',
      status: 'active',
      template: {}
    });

    // Create Leads
    for (let i = 0; i < 3; i++) {
      await db.insert(leads).values({
        id: `88888888-8888-8888-8888-88888888888${i}`,
        userId,
        name: `Test Lead ${i}`,
        email: `test${i}@example.com`,
        channel: 'email',
        status: 'new'
      });
    }

    // Create Mailboxes
    await db.insert(integrations).values([
      {
        id: mb1Id,
        userId,
        provider: 'custom_email',
        encryptedMeta: 'test',
        connected: true,
        healthStatus: 'failed',
        lastHealthCheckAt: new Date(0), // Jan 1, 1970 - definitely past threshold
        dailyLimit: 50
      },
      {
        id: mb2Id,
        userId,
        provider: 'gmail',
        encryptedMeta: 'test',
        connected: true,
        healthStatus: 'connected',
        lastHealthCheckAt: new Date(),
        dailyLimit: 2
      }
    ]);

    const leadIds = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333'
    ];

    await db.insert(campaignLeads).values(leadIds.map((id, i) => ({
      id,
      campaignId: dummyCampaignId,
      leadId: `88888888-8888-8888-8888-88888888888${i}`,
      userId,
      integrationId: mb1Id,
      status: 'pending'
    })));

    // Ensure userOutreachSettings row exists (upsert)
    const [existingSettings] = await db.select().from(userOutreachSettings).where(eq(userOutreachSettings.userId, userId));
    if (!existingSettings) {
      await db.insert(userOutreachSettings).values({ userId, autoRedistribute: true });
    }

    // Audit DB state
    const mb1 = await db.select().from(integrations).where(eq(integrations.id, mb1Id));
    log(`🔎 Mailbox 1: health=${mb1[0]?.healthStatus}, lastCheck=${mb1[0]?.lastHealthCheckAt}`);
    
    // Test Worker Logic
    const threshold = new Date();
    threshold.setHours(threshold.getHours() - 24);
    const failedMbs = await db.select()
      .from(integrations)
      .where(and(
        eq(integrations.healthStatus, 'failed'),
        lte(integrations.lastHealthCheckAt, threshold)
      ));
    log(`🔎 Worker Search Result: ${failedMbs.length} mailboxes found (threshold: ${threshold.toISOString()})`);
    if (failedMbs.length > 0) {
      log(`🔎 Found IDs: ${failedMbs.map(m => m.id).join(', ')}`);
    }

    const mb2 = await db.select().from(integrations).where(eq(integrations.id, mb2Id));
    log(`🔎 Mailbox 2: health=${mb2[0]?.healthStatus}, connected=${mb2[0]?.connected}, limit=${mb2[0]?.dailyLimit}`);

    const count = await db.select({ count: sql`count(*)` }).from(campaignLeads).where(eq(campaignLeads.integrationId, mb1Id));
    log(`🔎 Leads on mb1: ${count[0].count}`);

    // --- TEST A: autoRedistribute Toggle ---
    log('\n--- Test A: autoRedistribute Toggle ---');
    await db.update(userOutreachSettings).set({ autoRedistribute: false }).where(eq(userOutreachSettings.userId, userId));
    await redistributionWorker.run();
    
    const [leadAfterA] = await db.select().from(campaignLeads).where(eq(campaignLeads.id, leadIds[0]));
    if (leadAfterA.integrationId === mb1Id) {
      log('✅ SUCCESS: Leads were NOT redistributed when toggle was OFF');
    } else {
      log('❌ FAILURE: Leads were redistributed despite toggle being OFF');
    }

    // --- TEST B: Capacity-Aware Redistribution ---
    log('\n--- Test B: Capacity-Aware Redistribution ---');
    
    // Reset leads back to mb1 for this test
    for (const id of leadIds) {
      await db.update(campaignLeads).set({ integrationId: mb1Id, status: 'pending' }).where(eq(campaignLeads.id, id));
    }
    
    await db.update(userOutreachSettings).set({ autoRedistribute: true }).where(eq(userOutreachSettings.userId, userId));
    
    // Temporarily disconnect user's other real integrations so only mb2 is the target
    const otherIntegrations = await db.select().from(integrations).where(
      and(eq(integrations.userId, userId), eq(integrations.connected, true))
    );
    const otherIds = otherIntegrations.filter(i => i.id !== mb1Id && i.id !== mb2Id).map(i => i.id);
    if (otherIds.length > 0) {
      await db.update(integrations).set({ connected: false }).where(inArray(integrations.id, otherIds));
    }
    
    // Call directly to bypass threshold
    const redistributedCount = await redistributionWorker.redistributeForUser(userId, failedMbs);
    log(`📊 Worker reported ${redistributedCount} leads redistributed`);

    // Restore other integrations
    if (otherIds.length > 0) {
      await db.update(integrations).set({ connected: true }).where(inArray(integrations.id, otherIds));
    }

    const redistributed = await db.select().from(campaignLeads).where(eq(campaignLeads.integrationId, mb2Id));
    log(`📊 Found ${redistributed.length} leads on mb2 in DB`);
    if (redistributed.length === 2) {
      log('✅ SUCCESS: Only 2 leads moved to mb2 (respecting its limit)');
    } else {
      log(`❌ FAILURE: Expected 2 leads on mb2, found ${redistributed.length}`);
    }

    // --- TEST C: Spam Risk Pausing ---
    log('\n--- Test C: Spam Risk Pausing ---');
    await db.delete(auditTrail).where(eq(auditTrail.integrationId, mb2Id));
    await db.delete(bounceTracker).where(eq(bounceTracker.integrationId, mb2Id));

    for (let i = 0; i < 7; i++) {
      await db.insert(auditTrail).values({
        userId,
        leadId: `88888888-8888-8888-8888-888888888880`,
        integrationId: mb2Id,
        action: 'ai_message_sent',
        details: {}
      });
    }
    for (let i = 0; i < 4; i++) {
        await bounceHandler.recordBounce({
          userId,
          leadId: `88888888-8888-8888-8888-888888888880`,
          integrationId: mb2Id,
          email: 'bounce@test.com',
          bounceType: 'hard',
          reason: 'Spam filter'
        });
    }

    const [mb2After] = await db.select().from(integrations).where(eq(integrations.id, mb2Id));
    if (mb2After.healthStatus === 'warning' && mb2After.mailboxPauseUntil) {
      log(`✅ SUCCESS: Mailbox mb2 PAUSED due to high bounce rate (${mb2After.spamRiskScore}%)`);
    } else {
      log(`❌ FAILURE: Mailbox mb2 NOT paused (status: ${mb2After.healthStatus})`);
    }

    log('\n✨ Phase 2 Verification Complete!');
    process.exit(0);

  } catch (err: any) {
    log('❌ FATAL ERROR: ' + err.message);
    process.exit(1);
  }
}

verifyPhase2();
