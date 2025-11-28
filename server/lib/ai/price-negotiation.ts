import { storage } from '../../storage.js';
import type { Lead, Message } from '../../../shared/schema.js';

interface PriceObjection {
  detected: boolean;
  severity: 'low' | 'medium' | 'high';
  keywords: string[];
  suggestedDiscount: number;
  response: string;
}

interface NegotiationHistory {
  discountsOffered: number[];
  acceptedDiscount?: number;
  finalPrice?: number;
}

const PRICE_OBJECTION_KEYWORDS = {
  high: ['too expensive', 'too much', 'can\'t afford', 'out of budget', 'overpriced', 'rip off'],
  medium: ['expensive', 'pricey', 'costly', 'high price', 'a lot of money'],
  low: ['cheaper', 'discount', 'deal', 'promo', 'sale', 'lower price', 'best price']
};

/**
 * Detect price objections in message
 */
export async function detectPriceObjection(message: string): Promise<PriceObjection> {
  const lowerMessage = message.toLowerCase();
  let severity: 'low' | 'medium' | 'high' = 'low';
  const foundKeywords: string[] = [];
  
  // Check high severity first
  for (const keyword of PRICE_OBJECTION_KEYWORDS.high) {
    if (lowerMessage.includes(keyword)) {
      severity = 'high';
      foundKeywords.push(keyword);
    }
  }
  
  // Check medium severity
  if (severity !== 'high') {
    for (const keyword of PRICE_OBJECTION_KEYWORDS.medium) {
      if (lowerMessage.includes(keyword)) {
        severity = 'medium';
        foundKeywords.push(keyword);
      }
    }
  }
  
  // Check low severity
  if (severity === 'low') {
    for (const keyword of PRICE_OBJECTION_KEYWORDS.low) {
      if (lowerMessage.includes(keyword)) {
        foundKeywords.push(keyword);
      }
    }
  }
  
  const detected = foundKeywords.length > 0;
  
  return {
    detected,
    severity,
    keywords: foundKeywords,
    suggestedDiscount: await calculateOptimalDiscount(severity, null),
    response: await generateNegotiationResponse(severity, null)
  };
}

/**
 * Calculate optimal discount based on lead score and objection severity
 */
export async function calculateOptimalDiscount(
  severity: 'low' | 'medium' | 'high',
  leadId: string | null
): Promise<number> {
  let baseDiscount = 0;
  
  // Base discount by severity
  switch (severity) {
    case 'high':
      baseDiscount = 15; // 15%
      break;
    case 'medium':
      baseDiscount = 10; // 10%
      break;
    case 'low':
      baseDiscount = 5; // 5%
      break;
  }
  
  // Adjust based on lead score
  if (leadId) {
    const lead = await storage.getLeadById(leadId);
    if (lead?.score) {
      if (lead.score >= 80) {
        baseDiscount += 5; // Hot lead - offer more
      } else if (lead.score < 40) {
        baseDiscount -= 3; // Cold lead - offer less
      }
    }
    
    // Check negotiation history
    const history = await getNegotiationHistory(leadId);
    if (history.discountsOffered.length > 0) {
      // Don't offer more than previous offer
      const maxOffered = Math.max(...history.discountsOffered);
      baseDiscount = Math.min(baseDiscount, maxOffered + 2);
    }
  }
  
  return Math.min(Math.max(baseDiscount, 5), 25); // Cap between 5-25%
}

/**
 * Generate negotiation response
 */
export async function generateNegotiationResponse(
  severity: 'low' | 'medium' | 'high',
  leadId: string | null
): Promise<string> {
  const discount = await calculateOptimalDiscount(severity, leadId);
  
  const responses = {
    high: [
      `I totally understand! Let me see what I can do... I can offer you ${discount}% off if you decide today! 🎉`,
      `I hear you! This is a premium product, but I can give you ${discount}% off to make it work for your budget 💰`,
      `Fair point! How about this - I'll give you ${discount}% off + free shipping if you order now? 📦`
    ],
    medium: [
      `I get it! Good news - I can offer you ${discount}% off this week only 🔥`,
      `Let me help with that - I can give you ${discount}% off as a first-time customer deal!`,
      `Great timing! We actually have a ${discount}% discount running right now 🎁`
    ],
    low: [
      `You're in luck! I can offer ${discount}% off today 😊`,
      `I can give you ${discount}% off as a special welcome discount!`,
      `How about ${discount}% off to get you started? 🚀`
    ]
  };
  
  const options = responses[severity];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Track negotiation history
 */
async function getNegotiationHistory(leadId: string): Promise<NegotiationHistory> {
  const lead = await storage.getLeadById(leadId);
  if (!lead?.metadata?.negotiationHistory) {
    return { discountsOffered: [] };
  }
  return lead.metadata.negotiationHistory as NegotiationHistory;
}

/**
 * Save negotiation attempt
 */
export async function saveNegotiationAttempt(
  leadId: string,
  discountOffered: number,
  accepted: boolean = false
): Promise<void> {
  const lead = await storage.getLeadById(leadId);
  if (!lead) return;
  
  const history = await getNegotiationHistory(leadId);
  history.discountsOffered.push(discountOffered);
  
  if (accepted) {
    history.acceptedDiscount = discountOffered;
  }
  
  await storage.updateLead(leadId, {
    metadata: {
      ...lead.metadata,
      negotiationHistory: history,
      lastNegotiation: new Date().toISOString()
    }
  });
}

/**
 * Learn optimal discount from successful conversions
 */
export async function learnOptimalDiscount(userId: string): Promise<number> {
  const leads = await storage.getLeads({ userId, limit: 1000 });
  const convertedLeads = leads.filter(l => l.status === 'converted');
  
  const acceptedDiscounts = convertedLeads
    .map(l => l.metadata?.negotiationHistory?.acceptedDiscount)
    .filter(d => d !== undefined) as number[];
  
  if (acceptedDiscounts.length === 0) return 10; // Default 10%
  
  // Calculate average successful discount
  const avgDiscount = acceptedDiscounts.reduce((sum, d) => sum + d, 0) / acceptedDiscounts.length;
  return Math.round(avgDiscount);
}
