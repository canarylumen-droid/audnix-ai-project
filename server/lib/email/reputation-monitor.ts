import { db } from '../../db.js';
import { integrations, bounceTracker, domainVerifications } from '../../../shared/schema.js';
import { eq, and, sql, gte, desc } from 'drizzle-orm';
import { decrypt } from '../crypto/encryption.js';
import { wsSync } from '../websocket-sync.js';

/**
 * Calculates a 0-100 reputation score mapping bounces to penalty weights
 * and updates the mailbox / integration
 */
export async function calculateReputationScore(integrationId: string): Promise<number> {
  const mailboxMatch = await db.select().from(integrations).where(eq(integrations.id, integrationId));
  if (mailboxMatch.length === 0) return 100;
  const mailbox = mailboxMatch[0];

  let score = 100;

  // 1. Check bounces in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentBounces = await db.select().from(bounceTracker)
    .where(
      and(
        eq(bounceTracker.integrationId, integrationId),
        gte(bounceTracker.createdAt, sevenDaysAgo)
      )
    );

  const hardBounces = recentBounces.filter((b: any) => b.bounceType === 'hard').length;
  const softBounces = recentBounces.filter((b: any) => b.bounceType === 'soft').length;
  const spamComplaints = recentBounces.filter((b: any) => b.bounceType === 'spam').length;

  // 2. RECOVERY LOGIC: Check if mailbox was healthy recently
  const lastBounce = recentBounces.length > 0 
    ? Math.max(...recentBounces.map((b: any) => new Date(b.createdAt).getTime()))
    : 0;
  
  const hoursSinceLastBounce = lastBounce > 0 
    ? (Date.now() - lastBounce) / (1000 * 60 * 60)
    : 168; // Max 7 days

  // Base Penalty weights
  score -= (hardBounces * 7); // -7 per hard bounce
  score -= (softBounces * 3); // -3 per soft bounce
  score -= (spamComplaints * 25); // -25 per spam placement (CRITICAL)

  // 1.5 DNS Health Check Penalty (Unified Source of Truth)
  let domain = '';
  try {
    const meta = JSON.parse(decrypt(mailbox.encryptedMeta));
    // For OAuth it is meta.user, for SMTP it is meta.user or meta.email
    const emailStr = meta.user || meta.email || (mailbox as any).email || '';
    if (emailStr && emailStr.includes('@')) {
      domain = emailStr.split('@')[1];
    }
  } catch (e) {
    console.warn(`[Reputation Monitor] Could not decrypt meta for mailbox ${mailbox.id}`);
  }

  if (domain) {
    const [latestDns] = await db.select()
      .from(domainVerifications)
      .where(eq(domainVerifications.domain, domain))
      .orderBy(desc(domainVerifications.createdAt))
      .limit(1);

    if (latestDns) {
      const result = latestDns.verificationResult as any;
      if (result) {
        // If SPF/DKIM/DMARC are missing or failing, apply a significant penalty
        if (result.spf && !result.spf.found) {
          score -= 15;
          console.log(`⚠️ [Reputation Monitor] Mailbox ${mailbox.id} penalty: Missing SPF (-15)`);
        }
        if (result.dkim && !result.dkim.found) {
          score -= 15;
          console.log(`⚠️ [Reputation Monitor] Mailbox ${mailbox.id} penalty: Missing DKIM (-15)`);
        }
        if (result.dmarc && !result.dmarc.found) {
          score -= 15;
          console.log(`⚠️ [Reputation Monitor] Mailbox ${mailbox.id} penalty: Missing DMARC (-15)`);
        }
      }
    }
  }

  // Recovery bonus: +1 point per 6 hours of clean sending (max +30)
  const recoveryBonus = Math.min(30, Math.floor(hoursSinceLastBounce / 6));
  score += recoveryBonus;

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  const currentSpamRisk = (100 - score) / 100; // 0.0 to 1.0

  let newDailyLimit = mailbox.dailyLimit || 50;
  let newWarmupStatus = mailbox.warmupStatus || 'active';
  
  if (score < 40) {
    // 🔴 Reputation extremely low -> trigger an autonomous pause
    newWarmupStatus = 'paused';
    newDailyLimit = Math.max(5, Math.floor(newDailyLimit * 0.5)); // Slash limit immediately
    console.warn(`🔴 [Reputation Monitor] Mailbox ${mailbox.id} reputation is critical (${score}/100). Status strictly paused.`);
  } else if (score < 70) {
    // 🟠 Warning: Minor reputation hit -> Conservative throttling
    newDailyLimit = Math.max(10, Math.floor(newDailyLimit * 0.8));
    console.warn(`🟠 [Reputation Monitor] Mailbox ${mailbox.id} caution: Throttling limit to ${newDailyLimit} due to minor reputation dip.`);
  } else if (score > 90 && newWarmupStatus !== 'paused') {
    // 🟢 Excellent Reputation: Autonomous Warmup Spike (Level 5)
    // Scale up by +10% or +15 emails / day toward the 300 cap
    if (newDailyLimit < 300) {
      const increment = Math.max(15, Math.floor(newDailyLimit * 0.1));
      newDailyLimit = Math.min(300, newDailyLimit + increment);
      console.log(`🚀 [Reputation Monitor] Excellent Health (${score}/100). Spiking ${mailbox.id} warmup limit to ${newDailyLimit}/day.`);
    }
  }

  if (score > 60 && newWarmupStatus === 'paused') {
    // 🟢 Auto-recovery: Unpause if reputation improves significantly
    newWarmupStatus = 'active';
    console.log(`🟢 [Reputation Monitor] Mailbox ${mailbox.id} reputation recovered (${score}/100). Resuming outreach.`);
  }

  await db.update(integrations).set({
    reputationScore: score,
    spamRiskScore: currentSpamRisk,
    warmupStatus: newWarmupStatus as any,
    dailyLimit: newDailyLimit,
    updatedAt: new Date()
  }).where(eq(integrations.id, integrationId));

  // Notify UI
  wsSync.broadcastToUser(mailbox.userId, { 
    type: 'reputation_updated', 
    payload: { integrationId, score, status: newWarmupStatus } 
  });
  wsSync.notifyStatsUpdated(mailbox.userId);

  return score;
}

/**
 * Sweeps all active connected mailboxes natively to re-score
 */
export async function checkReputationForAllMailboxes() {
  const activeMailboxes = await db.select().from(integrations).where(
    sql`provider IN ('gmail', 'outlook', 'custom_email') AND connected = true`
  );

  for (const mailbox of activeMailboxes) {
    try {
      await calculateReputationScore(mailbox.id);
    } catch (e) {
      console.error(`Failed to calculate reputation for ${mailbox.id}`, e);
    }
  }
}
