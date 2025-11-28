import { storage } from '../../storage.js';
import type { Lead, Message } from '@shared/schema';

export interface AnalyticsInsights {
  period: string;
  trends: {
    leadGrowth: number;
    conversionGrowth: number;
    engagementGrowth: number;
  };
  predictions: {
    expectedConversions: number;
    projectedRevenue: number;
    riskLeads: string[];
  };
  recommendations: string[];
  topPerformers: {
    channels: Array<{ channel: string; performance: number }>;
    times: Array<{ hour: number; conversions: number }>;
  };
}

/**
 * Generate advanced analytics insights
 */
export async function generateAnalyticsInsights(
  userId: string,
  period: string = '30d'
): Promise<AnalyticsInsights> {
  const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const allLeads = await storage.getLeads({ userId, limit: 10000 });
  const leads = allLeads.filter(l => new Date(l.createdAt) >= startDate);

  // Calculate trends
  const trends = await calculateTrends(userId, daysBack);

  // Generate predictions
  const predictions = await generatePredictions(leads);

  // Generate recommendations
  const recommendations = await generateRecommendations(leads, trends);

  // Find top performers
  const topPerformers = await findTopPerformers(leads);

  return {
    period,
    trends,
    predictions,
    recommendations,
    topPerformers
  };
}

async function calculateTrends(userId: string, daysBack: number) {
  const previousPeriodStart = new Date();
  previousPeriodStart.setDate(previousPeriodStart.getDate() - (daysBack * 2));
  const currentPeriodStart = new Date();
  currentPeriodStart.setDate(currentPeriodStart.getDate() - daysBack);

  const allLeads = await storage.getLeads({ userId, limit: 10000 });

  const previousLeads = allLeads.filter(l => {
    const date = new Date(l.createdAt);
    return date >= previousPeriodStart && date < currentPeriodStart;
  });

  const currentLeads = allLeads.filter(l => {
    const date = new Date(l.createdAt);
    return date >= currentPeriodStart;
  });

  const leadGrowth = calculateGrowth(previousLeads.length, currentLeads.length);
  const conversionGrowth = calculateGrowth(
    previousLeads.filter(l => l.status === 'converted').length,
    currentLeads.filter(l => l.status === 'converted').length
  );

  // Calculate engagement (messages per lead)
  const previousEngagement = previousLeads.length > 0 ? 
    await getAverageMessageCount(previousLeads.map(l => l.id)) : 0;
  const currentEngagement = currentLeads.length > 0 ? 
    await getAverageMessageCount(currentLeads.map(l => l.id)) : 0;
  const engagementGrowth = calculateGrowth(previousEngagement, currentEngagement);

  return {
    leadGrowth,
    conversionGrowth,
    engagementGrowth
  };
}

function calculateGrowth(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

async function getAverageMessageCount(leadIds: string[]): Promise<number> {
  if (leadIds.length === 0) return 0;
  
  let totalMessages = 0;
  for (const leadId of leadIds) {
    const messages = await storage.getMessagesByLeadId(leadId);
    totalMessages += messages.length;
  }
  
  return totalMessages / leadIds.length;
}

async function generatePredictions(leads: Lead[]) {
  const hotLeads = leads.filter(l => l.metadata?.temperature === 'hot');
  const warmLeads = leads.filter(l => l.metadata?.temperature === 'warm');

  // Predict conversions (hot: 60%, warm: 30%)
  const expectedConversions = Math.round(
    (hotLeads.length * 0.6) + (warmLeads.length * 0.3)
  );

  // Project revenue (assuming average deal size)
  const avgDealSize = 500; // This could be configurable
  const projectedRevenue = expectedConversions * avgDealSize;

  // Identify at-risk leads (warm/hot but no recent activity)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  const riskLeads = [...hotLeads, ...warmLeads]
    .filter(l => {
      const lastMessage = l.lastMessageAt ? new Date(l.lastMessageAt) : new Date(l.createdAt);
      return lastMessage < oneDayAgo;
    })
    .map(l => l.id)
    .slice(0, 10);

  return {
    expectedConversions,
    projectedRevenue,
    riskLeads
  };
}

async function generateRecommendations(leads: Lead[], trends: any): Promise<string[]> {
  const recommendations: string[] = [];

  // Lead growth recommendation
  if (trends.leadGrowth < 0) {
    recommendations.push('📉 Lead generation is declining. Consider increasing marketing efforts or checking integration connections.');
  } else if (trends.leadGrowth > 50) {
    recommendations.push('📈 Lead growth is strong! Ensure you have enough follow-up capacity.');
  }

  // Conversion recommendation
  if (trends.conversionGrowth < -10) {
    recommendations.push('⚠️ Conversion rate dropping. Review AI responses and consider adjusting messaging.');
  }

  // Channel recommendations
  const byChannel = leads.reduce((acc: any, lead) => {
    acc[lead.channel] = acc[lead.channel] || { total: 0, converted: 0 };
    acc[lead.channel].total++;
    if (lead.status === 'converted') acc[lead.channel].converted++;
    return acc;
  }, {});

  const bestChannel = Object.entries(byChannel)
    .map(([channel, data]: [string, any]) => ({
      channel,
      rate: data.total > 0 ? (data.converted / data.total) * 100 : 0
    }))
    .sort((a, b) => b.rate - a.rate)[0];

  if (bestChannel) {
    recommendations.push(`🎯 ${bestChannel.channel} has the highest conversion rate (${bestChannel.rate.toFixed(1)}%). Focus more efforts here.`);
  }

  // Engagement recommendation
  const coldLeads = leads.filter(l => l.status === 'cold').length;
  if (coldLeads > leads.length * 0.3) {
    recommendations.push(`❄️ ${coldLeads} leads went cold. Consider re-engagement campaigns with fresh angles.`);
  }

  return recommendations;
}

async function findTopPerformers(leads: Lead[]) {
  // Channel performance
  const byChannel = leads.reduce((acc: any, lead) => {
    acc[lead.channel] = acc[lead.channel] || { total: 0, converted: 0 };
    acc[lead.channel].total++;
    if (lead.status === 'converted') acc[lead.channel].converted++;
    return acc;
  }, {});

  const channels = Object.entries(byChannel)
    .map(([channel, data]: [string, any]) => ({
      channel,
      performance: data.total > 0 ? Math.round((data.converted / data.total) * 100) : 0
    }))
    .sort((a, b) => b.performance - a.performance);

  // Time-based performance (best hours for conversions)
  const times: Array<{ hour: number; conversions: number }> = [];
  for (let hour = 0; hour < 24; hour++) {
    const conversions = leads.filter(l => {
      if (l.status !== 'converted' || !l.lastMessageAt) return false;
      const messageHour = new Date(l.lastMessageAt).getHours();
      return messageHour === hour;
    }).length;
    times.push({ hour, conversions });
  }
  times.sort((a, b) => b.conversions - a.conversions);

  return {
    channels: channels.slice(0, 5),
    times: times.slice(0, 5)
  };
}
