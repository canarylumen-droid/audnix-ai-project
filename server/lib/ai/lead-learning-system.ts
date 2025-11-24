/* @ts-nocheck */

import { supabaseAdmin } from '../supabase-admin';
import type { Lead, Message } from '@shared/schema';

interface LeadBehaviorPattern {
  userId: string;
  leadId: string;
  responseTime: number; // average in minutes
  messageLength: number; // average characters
  preferredTime: string; // "morning" | "afternoon" | "evening" | "night"
  sentimentTrend: 'positive' | 'neutral' | 'negative';
  engagementScore: number; // 0-100
  conversionSignals: string[];
  objectionPatterns: string[];
  lastUpdated: string;
}

/**
 * Real-time lead learning system
 * Analyzes conversation patterns and learns lead behavior
 */
export class LeadLearningSystem {
  
  /**
   * Analyze and update lead behavior patterns in real-time
   */
  async analyzeAndLearn(leadId: string, newMessage: Message): Promise<void> {
    if (!supabaseAdmin) return;

    try {
      // Get all messages for this lead
      const { data: messages } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (!messages || messages.length === 0) return;

      // Get lead info
      const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (!lead) return;

      // Calculate behavior patterns
      const pattern = this.calculateBehaviorPattern(messages as Message[], lead);

      // Save to semantic memory for AI context
      await supabaseAdmin
        .from('semantic_memory')
        .upsert({
          user_id: lead.userId,
          lead_id: leadId,
          content: JSON.stringify(pattern),
          metadata: {
            type: 'behavior_pattern',
            updated_at: new Date().toISOString()
          }
        });

      // Update lead engagement score
      await supabaseAdmin
        .from('leads')
        .update({
          engagement_score: pattern.engagementScore,
          metadata: {
            ...lead.metadata,
            behavior_pattern: pattern
          }
        })
        .eq('id', leadId);

      console.log(`✅ Learned behavior pattern for lead ${leadId}`);
    } catch (error) {
      console.error('Error in lead learning system:', error);
    }
  }

  /**
   * Calculate comprehensive behavior pattern from messages
   */
  private calculateBehaviorPattern(messages: Message[], lead: Lead): LeadBehaviorPattern {
    const userMessages = messages.filter(m => m.direction === 'inbound');
    
    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].direction === 'inbound' && messages[i - 1].direction === 'outbound') {
        const diff = new Date(messages[i].createdAt).getTime() - new Date(messages[i - 1].createdAt).getTime();
        totalResponseTime += diff / (1000 * 60); // convert to minutes
        responseCount++;
      }
    }
    const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

    // Calculate average message length
    const avgMessageLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / (userMessages.length || 1);

    // Determine preferred time (analyze message timestamps)
    const timeSlots = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    userMessages.forEach(m => {
      const hour = new Date(m.createdAt).getHours();
      if (hour >= 6 && hour < 12) timeSlots.morning++;
      else if (hour >= 12 && hour < 17) timeSlots.afternoon++;
      else if (hour >= 17 && hour < 22) timeSlots.evening++;
      else timeSlots.night++;
    });
    const preferredTime = Object.entries(timeSlots).reduce((a, b) => a[1] > b[1] ? a : b)[0] as string;

    // Analyze sentiment trend
    const recentMessages = userMessages.slice(-5);
    const positiveWords = ['yes', 'great', 'thanks', 'perfect', 'interested', 'good', 'awesome'];
    const negativeWords = ['no', 'not', "don't", 'busy', 'later', 'expensive', 'stop'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    recentMessages.forEach(m => {
      const lower = m.content.toLowerCase();
      positiveWords.forEach(word => { if (lower.includes(word)) positiveCount++; });
      negativeWords.forEach(word => { if (lower.includes(word)) negativeCount++; });
    });
    
    const sentimentTrend = positiveCount > negativeCount ? 'positive' : 
                          negativeCount > positiveCount ? 'negative' : 'neutral';

    // Detect conversion signals
    const conversionSignals: string[] = [];
    const conversionPhrases = ['how much', 'price', 'buy', 'purchase', 'pay', 'link', 'checkout', 'demo', 'schedule'];
    userMessages.forEach(m => {
      const lower = m.content.toLowerCase();
      conversionPhrases.forEach(phrase => {
        if (lower.includes(phrase) && !conversionSignals.includes(phrase)) {
          conversionSignals.push(phrase);
        }
      });
    });

    // Detect objection patterns
    const objectionPatterns: string[] = [];
    const objectionPhrases = ['too expensive', 'not sure', 'need to think', 'maybe later', 'not now', 'not interested'];
    userMessages.forEach(m => {
      const lower = m.content.toLowerCase();
      objectionPhrases.forEach(phrase => {
        if (lower.includes(phrase) && !objectionPatterns.includes(phrase)) {
          objectionPatterns.push(phrase);
        }
      });
    });

    // Calculate engagement score (0-100)
    let engagementScore = 50; // base score
    
    // Fast responder = engaged
    if (avgResponseTime < 5) engagementScore += 20;
    else if (avgResponseTime < 30) engagementScore += 10;
    else if (avgResponseTime > 120) engagementScore -= 20;
    
    // Longer messages = more engaged
    if (avgMessageLength > 100) engagementScore += 15;
    else if (avgMessageLength < 20) engagementScore -= 10;
    
    // Positive sentiment = engaged
    if (sentimentTrend === 'positive') engagementScore += 15;
    else if (sentimentTrend === 'negative') engagementScore -= 15;
    
    // Conversion signals = highly engaged
    engagementScore += conversionSignals.length * 10;
    
    // Objections = less engaged
    engagementScore -= objectionPatterns.length * 5;
    
    // Clamp between 0-100
    engagementScore = Math.max(0, Math.min(100, engagementScore));

    // Determine lead temperature based on engagement
    const temperature: 'hot' | 'warm' | 'cold' = 
      engagementScore > 70 ? 'hot' :
      engagementScore > 40 ? 'warm' : 'cold';

    return {
      userId: lead.userId,
      leadId: lead.id,
      responseTime: Math.round(avgResponseTime),
      messageLength: Math.round(avgMessageLength),
      preferredTime,
      sentimentTrend,
      engagementScore: Math.round(engagementScore),
      temperature,
      conversionSignals,
      objectionPatterns,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get learned insights for a lead
   */
  async getLeadInsights(leadId: string): Promise<LeadBehaviorPattern | null> {
    if (!supabaseAdmin) return null;

    try {
      const { data } = await supabaseAdmin
        .from('semantic_memory')
        .select('content')
        .eq('lead_id', leadId)
        .eq('metadata->>type', 'behavior_pattern')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!data) return null;

      return JSON.parse(data.content as string);
    } catch (error) {
      console.error('Error getting lead insights:', error);
      return null;
    }
  }
}

export const leadLearningSystem = new LeadLearningSystem();
