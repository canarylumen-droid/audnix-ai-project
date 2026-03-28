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

  // Penalty weights
  score -= (hardBounces * 5); // -5 per hard bounce
  score -= (softBounces * 2); // -2 per soft bounce
  score -= (spamComplaints * 20); // -20 per spam placement

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  const currentSpamRisk = (100 - score) / 100; // 0.0 to 1.0

  let newWarmupStatus = mailbox.warmupStatus || 'active';
  
  if (score < 50) {
    // 🔴 Reputation extremely low -> trigger an autonomous pause
    newWarmupStatus = 'paused';
    console.warn(`🔴 [Reputation Monitor] Mailbox ${mailbox.id} reputation is critical (${score}/100). Status strictly paused.`);
  }

  await db.update(integrations).set({
    reputationScore: score,
    spamRiskScore: currentSpamRisk,
    warmupStatus: newWarmupStatus
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
