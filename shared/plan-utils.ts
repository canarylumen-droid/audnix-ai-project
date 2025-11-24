import { PRICING_TIERS, PricingTier } from './pricing-config';

export type PlanId = 'free' | 'trial' | 'starter' | 'pro' | 'enterprise';

export function isPaidPlan(planId: string | undefined): boolean {
  if (!planId) return false;
  return planId !== 'free' && planId !== 'trial';
}

export function getPlanTier(planId: string): PricingTier | undefined {
  return PRICING_TIERS.find(tier => tier.id === planId);
}

export function getPlanCapabilities(planId: string) {
  const tier = getPlanTier(planId);
  
  if (!tier) {
    return {
      leadsLimit: 0,
      voiceMinutes: 0,
      hasVoiceNotes: false,
      hasAnalytics: false,
      hasAutoBooking: false,
      hasObjectionHandling: false,
      hasAdvancedSequencing: false,
      hasTeamWorkflows: false,
      hasAPIAccess: false,
      hasPrioritySupport: false
    };
  }

  const hasVoiceNotes = tier.voiceMinutes > 0;
  const isPaid = isPaidPlan(planId);
  const isProOrAbove = ['pro', 'enterprise'].includes(planId);
  const isEnterprise = planId === 'enterprise';

  return {
    leadsLimit: tier.leadsLimit,
    voiceMinutes: tier.voiceMinutes,
    hasVoiceNotes,
    hasAnalytics: true, // FREE for all users - show preview for trial/free, full features for paid
    hasAutoBooking: isPaid,
    hasObjectionHandling: isPaid,
    hasAdvancedSequencing: isProOrAbove,
    hasTeamWorkflows: isEnterprise,
    hasAPIAccess: isEnterprise,
    hasPrioritySupport: isProOrAbove
  };
}

export type FeatureKey = 
  | 'voiceNotes'
  | 'analytics'
  | 'autoBooking'
  | 'objectionHandling'
  | 'advancedSequencing'
  | 'teamWorkflows'
  | 'apiAccess'
  | 'prioritySupport';

export function canAccessFeature(featureKey: FeatureKey, planId: string): boolean {
  const capabilities = getPlanCapabilities(planId);
  
  const featureMap: Record<FeatureKey, boolean> = {
    voiceNotes: capabilities.hasVoiceNotes,
    analytics: capabilities.hasAnalytics,
    autoBooking: capabilities.hasAutoBooking,
    objectionHandling: capabilities.hasObjectionHandling,
    advancedSequencing: capabilities.hasAdvancedSequencing,
    teamWorkflows: capabilities.hasTeamWorkflows,
    apiAccess: capabilities.hasAPIAccess,
    prioritySupport: capabilities.hasPrioritySupport
  };
  
  return featureMap[featureKey] || false;
}

export function getSortedPricingTiers(): PricingTier[] {
  return [...PRICING_TIERS].sort((a, b) => a.order - b.order);
}

export function isLimitReached(current: number, limit: number): boolean {
  return current >= limit;
}

export function shouldShowUpgradePrompt(planId: string, leadCount: number, voiceMinutesUsed: number): boolean {
  const capabilities = getPlanCapabilities(planId);
  const leadsNearLimit = capabilities.leadsLimit > 0 && leadCount >= capabilities.leadsLimit * 0.9;
  const voiceNearLimit = capabilities.voiceMinutes > 0 && voiceMinutesUsed >= capabilities.voiceMinutes * 0.9;
  
  return leadsNearLimit || voiceNearLimit || (!isPaidPlan(planId) && planId !== 'free');
}
