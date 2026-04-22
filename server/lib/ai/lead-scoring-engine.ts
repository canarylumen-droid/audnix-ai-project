import type { Lead, Message } from '../../../shared/schema.js';
import type { IntentAnalysis } from './intent-analyzer.js';
import { storage } from '../../storage.js';

export type LeadScoreCategory = 'A' | 'B' | 'C';

export interface LeadScoreResult {
  score: number;
  category: LeadScoreCategory;
  reasons: string[];
}

/**
 * AI Lead Scoring Engine (Phase 38)
 * 
 * Heuristically evaluates lead quality based on:
 * 1. Firmographic Data (Company size, industry)
 * 2. Interaction Depth (Message count, questions)
 * 3. Sentiment & Intent (Interested, ready to buy)
 * 4. BANT Signals (Budget, Authority, Need, Timeline)
 */
export class LeadScoringEngine {
  
  /**
   * Calculate a comprehensive score for a lead
   */
  async calculateScore(lead: any, messages: any[], intent?: any): Promise<LeadScoreResult> {
    let score = 0;
    const reasons: string[] = [];

    // --- 1. FIRMOGRAPHIC (30 points) ---
    const metadata = lead.metadata || {};
    const companySize = metadata.companySize || 'Unknown';
    
    if (companySize.includes('51-200') || companySize.includes('201-500')) {
      score += 25;
      reasons.push('Ideal company size (Mid-market)');
    } else if (companySize.includes('500+')) {
      score += 30;
      reasons.push('High-value Enterprise lead');
    } else if (companySize.includes('11-50')) {
      score += 15;
      reasons.push('Growth-stage company');
    }

    if (metadata.industry?.toLowerCase().includes('saas') || metadata.industry?.toLowerCase().includes('tech')) {
      score += 10;
      reasons.push('High-fit industry (Tech/SaaS)');
    }

    // --- 2. INTERACTION DEPTH (30 points) ---
    const inboundMessages = messages.filter(m => m.direction === 'inbound');
    const msgCount = inboundMessages.length;

    if (msgCount >= 5) {
      score += 30;
      reasons.push('Deeply engaged (5+ replies)');
    } else if (msgCount >= 3) {
      score += 20;
      reasons.push('Engaged (3+ replies)');
    } else if (msgCount >= 1) {
      score += 5;
      reasons.push('Initial engagement');
    }

    // --- 3. INTENT & SENTIMENT (40 points) ---
    if (intent) {
      if (intent.readyToBuy) {
        score += 40;
        reasons.push('Explicit "Ready to Buy" signal');
      } else if (intent.wantsToSchedule) {
        score += 30;
        reasons.push('Wants to schedule a demo');
      } else if (intent.isInterested) {
        score += 15;
        reasons.push('Expressed positive interest');
      }

      if (intent.hasObjection) {
        score -= 5;
        reasons.push('Has active objections');
      }

      if (intent.sentiment === 'positive') {
        score += 10;
      } else if (intent.sentiment === 'negative') {
        score -= 20;
        reasons.push('Negative sentiment detected');
      }
    }

    // Final normalization
    const finalScore = Math.max(0, Math.min(100, score));
    
    let category: LeadScoreCategory = 'C';
    if (finalScore >= 85) category = 'A';
    else if (finalScore >= 60) category = 'B';

    return { score: finalScore, category, reasons };
  }

  /**
   * Update lead score in database and handle notifications
   */
  async updateAndNotify(leadId: string): Promise<void> {
    const lead = await storage.getLeadById(leadId);
    if (!lead) return;

    const messages = await storage.getMessages(leadId);
    // Fetch last intent from metadata
    const lastIntent = (lead.metadata as any)?.lastIntent;

    const result = await this.calculateScore(lead, messages, lastIntent);

    // Update lead
    await storage.updateLead(leadId, {
      score: result.score,
      metadata: {
        ...lead.metadata,
        scoreCategory: result.category,
        scoreReasons: result.reasons,
        lastScoredAt: new Date().toISOString()
      }
    });

    // Notify User for Category A
    if (result.category === 'A' && (lead.metadata as any)?.scoreCategory !== 'A') {
      await storage.createNotification({
        userId: lead.userId,
        type: 'conversion',
        title: '🔥 High-Value Lead Detected!',
        message: `${lead.name} from ${lead.company || 'their company'} just hit a Score of ${result.score}!`,
        metadata: { leadId, score: result.score }
      });
    }
  }
}

export const leadScoringEngine = new LeadScoringEngine();
