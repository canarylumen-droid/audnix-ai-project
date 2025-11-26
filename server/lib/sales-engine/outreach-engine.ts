/**
 * Outreach Engine - The brain that orchestrates everything
 * Combines: Strategy, Message Rotation, Batch Scheduling, Deliverability
 */

import { generateSendSchedule, optimizeForRevenue, estimateRevenue, ScheduledBatch, SendSchedule } from './batch-scheduler';
import { getNextTemplate, personalizeMessage, shouldRotateTemplate } from './message-rotator';
import { rankLeadQuality } from './outreach-strategy';
import type { MessageTemplate } from './message-rotator';

export interface OutreachCampaign {
  campaignId: string;
  name: string;
  totalLeads: number;
  startTime: Date;
  schedule: SendSchedule;
  optimizedBatches: ScheduledBatch[];
  estimatedRevenue: number;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  metrics: {
    totalSent: number;
    totalFailed: number;
    totalReplies: number;
    totalConversions: number;
    totalRevenue: number;
  };
}

export interface LeadOutreachState {
  leadId: string;
  email: string;
  name: string;
  company: string;
  segmentId: string;
  leadQuality: ReturnType<typeof rankLeadQuality>;
  sendHistory: {
    timestamp: Date;
    templateId: string;
    messageType: string;
    success: boolean;
  }[];
  replied: boolean;
  converted: boolean;
  plan?: string;
  revenue?: number;
  bounced: boolean;
  lastFollowup?: Date;
  nextFollowup?: Date;
}

/**
 * Create outreach campaign from lead list
 */
export async function createOutreachCampaign(
  leads: Array<{ id: string; email: string; name: string; company: string; data: Record<string, any> }>,
  campaignName: string
): Promise<OutreachCampaign> {
  const campaignId = `campaign_${Date.now()}`;

  // Segment leads by quality tier
  const leadsByQuality = segmentByQuality(leads);

  // Generate base schedule
  const schedule = generateSendSchedule(leadsByQuality);

  // Optimize for revenue (reorder batches)
  const optimizedBatches = optimizeForRevenue(schedule);

  // Calculate estimated revenue
  const estimatedRevenue = estimateRevenue(schedule);

  return {
    campaignId,
    name: campaignName,
    totalLeads: leads.length,
    startTime: new Date(),
    schedule,
    optimizedBatches,
    estimatedRevenue,
    status: 'draft',
    metrics: {
      totalSent: 0,
      totalFailed: 0,
      totalReplies: 0,
      totalConversions: 0,
      totalRevenue: 0,
    },
  };
}

/**
 * Segment leads by quality for tiered outreach
 */
function segmentByQuality(
  leads: Array<{ id: string; email: string; name: string; company: string; data: Record<string, any> }>
): Record<string, string[]> {
  const segments: Record<string, string[]> = {
    ENTERPRISE: [],
    PRO: [],
    STARTER: [],
    TRIAL: [],
  };

  leads.forEach(({ id, data }) => {
    const quality = rankLeadQuality(data);

    if (quality.tier === 'hot') {
      segments.ENTERPRISE.push(id);
    } else if (quality.tier === 'warm') {
      segments.PRO.push(id);
    } else {
      // 70% cold → Starter (slower warmup), 30% → Trial (quick upsell)
      segments[Math.random() > 0.3 ? 'STARTER' : 'TRIAL'].push(id);
    }
  });

  return segments;
}

/**
 * Get next message for a lead
 * Handles: Message type progression, template rotation, personalization
 */
export function getNextOutreachMessage(
  leadState: LeadOutreachState,
  leadEmail: string,
  leadData: Record<string, string>
): { template: MessageTemplate; message: string } {
  const sendCount = leadState.sendHistory.length;

  // Message sequence: Hook → Value → Social Proof → Urgency → Followup
  const messageTypes = ['hook', 'value', 'social_proof', 'urgency', 'followup'];

  // For initial sends: cycle through types
  let messageType: any = messageTypes[Math.min(sendCount, messageTypes.length - 1)];

  // Determine if we need template rotation (every 3rd send to same lead)
  const needsRotation = shouldRotateTemplate(sendCount, messageType);

  // Get template
  const previousId = leadState.sendHistory[sendCount - 1]?.templateId;
  const template = getNextTemplate(messageType, needsRotation ? previousId : undefined);

  // Personalize
  const message = personalizeMessage(template, leadData);

  return { template, message };
}

/**
 * Calculate follow-up timing based on segment
 */
export function getFollowupTiming(segmentId: string, sendAttempt: number): Date {
  const followupOffsets = {
    TRIAL: [12, 24], // 12h, 24h
    STARTER: [24, 48], // 24h, 48h
    PRO: [48, 72], // 48h, 72h
    ENTERPRISE: [48, 96, 168], // 2d, 3d, 7d
  };

  const offsets = followupOffsets[segmentId as keyof typeof followupOffsets] || [24, 48];
  const hoursOffset = offsets[Math.min(sendAttempt - 1, offsets.length - 1)] || offsets[offsets.length - 1];

  const nextFollowup = new Date();
  nextFollowup.setHours(nextFollowup.getHours() + hoursOffset);

  return nextFollowup;
}

/**
 * Format campaign metrics for logging
 */
export function formatCampaignMetrics(campaign: OutreachCampaign): string {
  const lines = [
    '📈 OUTREACH CAMPAIGN METRICS',
    `Campaign: ${campaign.name} (${campaign.campaignId})`,
    `Status: ${campaign.status}`,
    '',
    '📊 Volume:',
    `  Total Leads: ${campaign.totalLeads}`,
    `  Batches: ${campaign.optimizedBatches.length}`,
    `  Spread Over: ${campaign.schedule.estimatedCompletionDate.toLocaleDateString()}`,
    '',
    '💰 Revenue Projection:',
    `  Estimated Revenue: $${campaign.estimatedRevenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
    `  Based on: ${Object.entries(campaign.schedule.segmentDistribution)
      .map(([seg, count]) => `${seg}: ${count}`)
      .join(', ')}`,
    '',
    '✉️ Current Progress:',
    `  Sent: ${campaign.metrics.totalSent}`,
    `  Failed: ${campaign.metrics.totalFailed}`,
    `  Replies: ${campaign.metrics.totalReplies}`,
    `  Conversions: ${campaign.metrics.totalConversions}`,
    `  Revenue Generated: $${campaign.metrics.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
  ];

  return lines.join('\n');
}

/**
 * Safety guardrails - prevent oversending and reputation damage
 */
export const SAFETY_GUARDRAILS = {
  maxSendsPerHour: 100,
  maxSendsPerDay: 1000,
  minIntervalBetweenBatches: 60, // 60 minutes
  maxFollowupsPerLead: 3,
  bounceRateThreshold: 0.05, // 5% bounce = pause
  spamComplaintThreshold: 0.01, // 1% complaints = review
  autoStopOnHighBounceRate: true,
  requireApprovalAbove: 5000, // Manual review for >5k sends
};

/**
 * Pre-flight checks before launching campaign
 */
export function validateCampaignSafety(campaign: OutreachCampaign): { safe: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (campaign.totalLeads > SAFETY_GUARDRAILS.requireApprovalAbove) {
    warnings.push(
      `⚠️  Campaign has ${campaign.totalLeads} leads (>5k). Requires manual approval for safety.`
    );
  }

  if (campaign.schedule.totalBatches < 3) {
    warnings.push('⚠️  Very few batches - consider spreading leads more to improve deliverability.');
  }

  if (campaign.estimatedRevenue < 5000) {
    warnings.push('ℹ️  Estimated revenue is below $5k target. Check lead quality or adjust messaging.');
  }

  return {
    safe: warnings.length === 0 || warnings.every((w) => !w.includes('CRITICAL')),
    warnings,
  };
}
