import { storage } from '../../storage.js';
import type { Integration } from '../../../shared/schema.js';

/**
 * Phase 11: Domain Warmup & Load Balancing Service
 *
 * Prevents spam-folder placement by enforcing progressive send limits
 * for newly connected email accounts.
 *
 * Warmup Schedule:
 *   Day 1-2  : max 5 emails / day
 *   Day 3-5  : max 20 emails / day
 *   Day 6-10 : max 50 emails / day
 *   Day 11+  : normal provider limits apply
 */

interface WarmupStatus {
  isWarmingUp: boolean;
  dailyLimit: number;
  daysSinceConnected: number;
  reason?: string;
}

class WarmupService {
  private readonly WARMUP_STAGES: Array<{ maxDays: number; limit: number }> = [
    { maxDays: 2,  limit: 5  },
    { maxDays: 5,  limit: 20 },
    { maxDays: 10, limit: 50 },
  ];

  private readonly FULL_WARMUP_DAYS = 10;

  /**
   * Returns the effective daily send limit for a mailbox integration.
   * If the mailbox is warming up, this will be lower than the provider max.
   */
  getWarmupStatus(integration: Integration, providerMax: number): WarmupStatus {
    const createdAt = integration.createdAt
      ? new Date(integration.createdAt)
      : new Date();

    const daysSinceConnected = Math.floor(
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if still in warmup period
    for (const stage of this.WARMUP_STAGES) {
      if (daysSinceConnected <= stage.maxDays) {
        return {
          isWarmingUp: true,
          dailyLimit: stage.limit,
          daysSinceConnected,
          reason: `Warmup Day ${daysSinceConnected + 1}/${this.FULL_WARMUP_DAYS} – limit capped at ${stage.limit}/day to protect sender reputation`,
        };
      }
    }

    // Past warmup – use normal provider limits
    return {
      isWarmingUp: false,
      dailyLimit: providerMax,
      daysSinceConnected,
    };
  }

  /**
   * Given a list of mailboxes with their sent counts, apply warmup limits.
   * Returns the effective cap for each mailbox.
   */
  applyWarmupLimits(
    mailboxes: Array<Integration & { sentCount: number; limit: number }>
  ): Array<Integration & { sentCount: number; limit: number; warmupCapped: boolean }> {
    return mailboxes.map((mb) => {
      const warmup = this.getWarmupStatus(mb, mb.limit);

      if (warmup.isWarmingUp && warmup.dailyLimit < mb.limit) {
        console.log(
          `[WarmupService] ⚠️ Mailbox ${mb.id} (${mb.provider}) – ${warmup.reason}`
        );
        return {
          ...mb,
          limit: warmup.dailyLimit,
          warmupCapped: true,
        };
      }

      return { ...mb, warmupCapped: false };
    });
  }

  /**
   * Quick check: is this integration currently in warmup?
   */
  isWarming(integration: Integration): boolean {
    return this.getWarmupStatus(integration, 999).isWarmingUp;
  }
}

export const warmupService = new WarmupService();
