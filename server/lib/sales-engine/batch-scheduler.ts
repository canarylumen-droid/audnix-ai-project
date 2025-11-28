/**
 * Batch Scheduler - Intelligent batching with randomization
 * Sends leads in human-like patterns to maximize deliverability
 */

import {
  OUTREACH_STRATEGY,
  getRandomInterval,
  getRandomBatchSize,
  LeadQuality,
  rankLeadQuality,
  DELIVERABILITY_RULES,
} from './outreach-strategy.js';

export interface ScheduledBatch {
  batchId: string;
  segmentId: keyof typeof OUTREACH_STRATEGY;
  leadIds: string[];
  scheduledTime: Date;
  intervalBetweenLeads: number; // milliseconds
  status: 'pending' | 'sending' | 'completed' | 'failed';
  sentCount: number;
  failedCount: number;
}

export interface SendSchedule {
  totalLeads: number;
  totalBatches: number;
  segmentDistribution: Record<string, number>;
  estimatedCompletionDate: Date;
  batchSchedules: ScheduledBatch[];
}

/**
 * Generate 5-day send schedule across all segments
 * Optimized for: deliverability, humanization, revenue maximization
 */
export function generateSendSchedule(
  leadsBySegment: Record<string, string[]>,
  startTime: Date = new Date()
): SendSchedule {
  const batchSchedules: ScheduledBatch[] = [];
  const segmentDistribution: Record<string, number> = {};

  let currentTime = new Date(startTime);
  let totalLeads = 0;

  // Process each segment
  Object.entries(leadsBySegment).forEach(([segmentId, leadIds]) => {
    const segment = OUTREACH_STRATEGY[segmentId as keyof typeof OUTREACH_STRATEGY];
    if (!segment || leadIds.length === 0) return;

    segmentDistribution[segmentId] = leadIds.length;
    totalLeads += leadIds.length;

    const leadsRemaining = [...leadIds];
    let day = 0;

    // Spread across days
    while (leadsRemaining.length > 0 && day < segment.spreadDays) {
      // 2-4 batches per day per segment
      const batchesPerDay = Math.random() > 0.5 ? 2 : 3;

      for (let i = 0; i < batchesPerDay && leadsRemaining.length > 0; i++) {
        // Randomize batch size to avoid pattern
        const batchSize = getRandomBatchSize(
          leadsRemaining.length,
          Math.floor(segment.dailyLimit / batchesPerDay) - 30,
          Math.floor(segment.dailyLimit / batchesPerDay) + 30
        );

        const batchLeads = leadsRemaining.splice(0, batchSize);
        const intervalMs =
          getRandomInterval(segment.intervalMin, segment.intervalMax) * 60 * 1000;

        batchSchedules.push({
          batchId: `${segmentId}_day${day}_batch${i}_${Date.now()}`,
          segmentId: segmentId as keyof typeof OUTREACH_STRATEGY,
          leadIds: batchLeads,
          scheduledTime: new Date(currentTime),
          intervalBetweenLeads: intervalMs,
          status: 'pending',
          sentCount: 0,
          failedCount: 0,
        });

        // Space out batches throughout the day (9 AM - 6 PM)
        currentTime = new Date(
          currentTime.getTime() +
            getRandomInterval(90, 240) * 60 * 1000 // 90-240 min between batches
        );
      }

      // Next day, 8-10 AM
      day++;
      const nextDay = new Date(currentTime);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
      currentTime = nextDay;
    }
  });

  return {
    totalLeads,
    totalBatches: batchSchedules.length,
    segmentDistribution,
    estimatedCompletionDate: currentTime,
    batchSchedules: batchSchedules.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime()),
  };
}

/**
 * Check if batch is safe to send (deliverability checks)
 */
export function isDeliverableSafe(
  batch: ScheduledBatch,
  recentSendHistory: { hour: number; count: number }[]
): boolean {
  const now = new Date();
  const currentHour = now.getHours();

  // 1. Skip quiet hours
  if (DELIVERABILITY_RULES.respectedQuietHours.includes(currentHour)) {
    return false;
  }

  // 2. Check hourly limit
  const thisHourSends = recentSendHistory.find((h) => h.hour === currentHour)?.count || 0;
  if (thisHourSends >= DELIVERABILITY_RULES.maxPerHour) {
    return false;
  }

  // 3. Check daily limit
  const dailySends = recentSendHistory.reduce((sum, h) => sum + h.count, 0);
  if (dailySends >= DELIVERABILITY_RULES.maxPerDay) {
    return false;
  }

  // 4. Check min interval since last batch
  if (batch.scheduledTime > now && batch.scheduledTime.getTime() - now.getTime() < DELIVERABILITY_RULES.minIntervalMs) {
    return false;
  }

  return true;
}

/**
 * Segment leads by quality for tiered outreach
 * Hot leads → Enterprise, Warm → Pro, Cold → Starter
 */
export function segmentLeadsByQuality(
  leads: Array<{ id: string; data: Record<string, any> }>
): Record<string, string[]> {
  const segments: Record<string, string[]> = {
    ENTERPRISE: [],
    PRO: [],
    STARTER: [],
    TRIAL: [],
  };

  leads.forEach(({ id, data }) => {
    const quality = rankLeadQuality(data);
    const tier = quality.tier;

    if (tier === 'hot') {
      segments.ENTERPRISE.push(id);
    } else if (tier === 'warm') {
      segments.PRO.push(id);
    } else if (Math.random() > 0.3) {
      // 70% of cold goes to Starter
      segments.STARTER.push(id);
    } else {
      // 30% of cold to Trial (faster conversion)
      segments.TRIAL.push(id);
    }
  });

  return segments;
}

/**
 * Revenue-weighted scheduling
 * Prioritize high-value segments early, reorder internally
 */
export function optimizeForRevenue(
  schedule: SendSchedule
): ScheduledBatch[] {
  const SEGMENT_PRIORITY: Record<string, number> = {
    ENTERPRISE: 4, // Highest ROI per lead
    PRO: 3,
    STARTER: 2,
    TRIAL: 1, // Lowest priority (but quick upsell)
  };

  return schedule.batchSchedules.sort((a, b) => {
    const priorityA = SEGMENT_PRIORITY[a.segmentId] || 0;
    const priorityB = SEGMENT_PRIORITY[b.segmentId] || 0;

    if (priorityA !== priorityB) {
      return priorityB - priorityA; // Higher priority first
    }

    // Same priority → earlier time
    return a.scheduledTime.getTime() - b.scheduledTime.getTime();
  });
}

/**
 * Format schedule for display/logging
 */
export function formatScheduleForLogging(schedule: SendSchedule): string {
  const lines = [
    '📊 5-DAY HUMANIZED OUTREACH SCHEDULE',
    `Total Leads: ${schedule.totalLeads}`,
    `Total Batches: ${schedule.totalBatches}`,
    `Completion by: ${schedule.estimatedCompletionDate.toLocaleString()}`,
    '',
    '📈 Segment Breakdown:',
  ];

  Object.entries(schedule.segmentDistribution).forEach(([segment, count]) => {
    const expectedRevenue =
      OUTREACH_STRATEGY[segment as keyof typeof OUTREACH_STRATEGY]?.expectedRevenue || 0;
    lines.push(
      `  ${segment}: ${count} leads → ~$${expectedRevenue.toLocaleString('en-US', {
        maximumFractionDigits: 0,
      })}`
    );
  });

  lines.push('', '⏰ First 24 Hours:');
  const firstDay = schedule.batchSchedules.filter(
    (b) => b.scheduledTime.getTime() - schedule.batchSchedules[0].scheduledTime.getTime() < 86400000
  );
  lines.push(`  ${firstDay.length} batches scheduled`);
  lines.push(`  ${firstDay.reduce((sum, b) => sum + b.leadIds.length, 0)} leads`);

  return lines.join('\n');
}

/**
 * Calculate estimated revenue from schedule
 */
export function estimateRevenue(schedule: SendSchedule): number {
  let total = 0;

  Object.entries(schedule.segmentDistribution).forEach(([segment, count]) => {
    const strategySegment = OUTREACH_STRATEGY[segment as keyof typeof OUTREACH_STRATEGY];
    if (strategySegment) {
      total += count * strategySegment.conversionRate * strategySegment.price;
    }
  });

  return total;
}
