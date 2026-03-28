import { db } from '../../db.js';
import { integrations, bounceTracker } from '../../../shared/schema.js';
import { eq, and, sql, gte } from 'drizzle-orm';

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

  const hardBounces = recentBounces.filter(b => b.bounceType === 'hard').length;
  const softBounces = recentBounces.filter(b => b.bounceType === 'soft').length;
  const spamComplaints = recentBounces.filter(b => b.bounceType === 'spam').length;

  // 2. RECOVERY LOGIC: Check if mailbox was healthy recently
  const lastBounce = recentBounces.length > 0 
    ? Math.max(...recentBounces.map(b => new Date(b.createdAt).getTime()))
    : 0;
  
  const hoursSinceLastBounce = lastBounce > 0 
    ? (Date.now() - lastBounce) / (1000 * 60 * 60)
    : 168; // Max 7 days

  // Base Penalty weights
  score -= (hardBounces * 7); // -7 per hard bounce
  score -= (softBounces * 3); // -3 per soft bounce
  score -= (spamComplaints * 25); // -25 per spam placement (CRITICAL)

  // Recovery bonus: +1 point per 6 hours of clean sending (max +30)
  const recoveryBonus = Math.min(30, Math.floor(hoursSinceLastBounce / 6));
  score += recoveryBonus;

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  const currentSpamRisk = (100 - score) / 100; // 0.0 to 1.0

  let newDailyLimit = mailbox.dailyLimit || 50;
  
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
    warmupStatus: newWarmupStatus,
    dailyLimit: newDailyLimit,
    updatedAt: new Date()
  }).where(eq(integrations.id, integrationId));

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
