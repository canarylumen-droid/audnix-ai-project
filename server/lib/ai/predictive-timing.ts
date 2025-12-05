import type { MessageDirection } from '../../../shared/types.js';

interface ConversationMessage {
  body: string;
  direction: MessageDirection;
  createdAt: Date;
}

interface LeadBehavior {
  averageResponseTimeMs?: number;
  preferredHours?: number[];
  preferredDays?: number[];
  engagementScore?: number;
  lastActiveAt?: Date;
  timezone?: string;
}

interface PredictiveTimingResult {
  optimalSendTime: Date;
  confidence: number;
  reason: string;
  adjustedForTimezone: boolean;
}

export class PredictiveTimingAnalyzer {
  
  static analyzeConversation(messages: ConversationMessage[]): LeadBehavior {
    if (messages.length === 0) {
      return {};
    }

    const inboundMessages = messages.filter(m => m.direction === 'inbound');
    
    const responseTimeDeltas: number[] = [];
    for (let i = 1; i < messages.length; i++) {
      const current = messages[i];
      const previous = messages[i - 1];
      
      if (current.direction === 'inbound' && previous.direction === 'outbound') {
        const delta = current.createdAt.getTime() - previous.createdAt.getTime();
        if (delta > 0 && delta < 7 * 24 * 60 * 60 * 1000) {
          responseTimeDeltas.push(delta);
        }
      }
    }

    const averageResponseTimeMs = responseTimeDeltas.length > 0
      ? responseTimeDeltas.reduce((a, b) => a + b, 0) / responseTimeDeltas.length
      : undefined;

    const hours = inboundMessages.map(m => m.createdAt.getHours());
    const hourCounts: Record<number, number> = {};
    hours.forEach(h => { hourCounts[h] = (hourCounts[h] || 0) + 1; });
    
    const preferredHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    const days = inboundMessages.map(m => m.createdAt.getDay());
    const dayCounts: Record<number, number> = {};
    days.forEach(d => { dayCounts[d] = (dayCounts[d] || 0) + 1; });
    
    const preferredDays = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => parseInt(day));

    const recentMessages = inboundMessages.filter(m => {
      const hoursSince = (Date.now() - m.createdAt.getTime()) / (1000 * 60 * 60);
      return hoursSince < 72;
    });
    
    const engagementScore = Math.min(100, recentMessages.length * 20 + 
      (averageResponseTimeMs && averageResponseTimeMs < 3600000 ? 30 : 0));

    const lastActiveAt = inboundMessages.length > 0
      ? inboundMessages[inboundMessages.length - 1].createdAt
      : undefined;

    return {
      averageResponseTimeMs,
      preferredHours,
      preferredDays,
      engagementScore,
      lastActiveAt
    };
  }

  static predictOptimalTiming(
    behavior: LeadBehavior,
    baseDelayMs: number,
    temperature: 'hot' | 'warm' | 'cold'
  ): PredictiveTimingResult {
    let optimalTime = new Date(Date.now() + baseDelayMs);
    let confidence = 0.5;
    let reason = 'Default timing based on lead temperature';
    let adjustedForTimezone = false;

    if (behavior.averageResponseTimeMs && behavior.averageResponseTimeMs > 0) {
      const responseHours = behavior.averageResponseTimeMs / (1000 * 60 * 60);
      
      if (responseHours < 1) {
        optimalTime = new Date(Date.now() + Math.min(baseDelayMs, 2 * 60 * 60 * 1000));
        confidence = 0.8;
        reason = 'Fast responder - reduced delay';
      } else if (responseHours > 24) {
        optimalTime = new Date(Date.now() + Math.max(baseDelayMs, 24 * 60 * 60 * 1000));
        confidence = 0.7;
        reason = 'Slow responder - increased delay';
      }
    }

    if (behavior.preferredHours && behavior.preferredHours.length > 0) {
      const preferredHour = behavior.preferredHours[0];
      const currentHour = new Date().getHours();
      
      if (optimalTime.getHours() !== preferredHour) {
        let hoursUntilPreferred = preferredHour - currentHour;
        if (hoursUntilPreferred < 0) hoursUntilPreferred += 24;
        
        const adjustedTime = new Date(Date.now() + hoursUntilPreferred * 60 * 60 * 1000);
        
        if (adjustedTime > optimalTime) {
          optimalTime = adjustedTime;
          confidence = Math.min(0.9, confidence + 0.1);
          reason += ` | Adjusted to preferred hour (${preferredHour}:00)`;
        }
      }
    }

    if (behavior.preferredDays && behavior.preferredDays.length > 0) {
      const preferredDay = behavior.preferredDays[0];
      const currentDay = new Date().getDay();
      
      if (currentDay !== preferredDay && temperature !== 'hot') {
        let daysUntilPreferred = preferredDay - currentDay;
        if (daysUntilPreferred < 0) daysUntilPreferred += 7;
        
        if (daysUntilPreferred <= 2) {
          const adjustedTime = new Date(optimalTime.getTime() + daysUntilPreferred * 24 * 60 * 60 * 1000);
          optimalTime = adjustedTime;
          confidence = Math.min(0.9, confidence + 0.1);
          reason += ` | Shifted to preferred day`;
        }
      }
    }

    const hour = optimalTime.getHours();
    const day = optimalTime.getDay();
    
    if (hour < 8 || hour > 21) {
      if (hour < 8) {
        optimalTime.setHours(9, 0, 0, 0);
      } else {
        optimalTime.setDate(optimalTime.getDate() + 1);
        optimalTime.setHours(9, 0, 0, 0);
      }
      reason += ' | Adjusted to business hours';
    }
    
    if (day === 0 || day === 6) {
      const daysToMonday = day === 0 ? 1 : 2;
      optimalTime.setDate(optimalTime.getDate() + daysToMonday);
      optimalTime.setHours(9, 0, 0, 0);
      reason += ' | Shifted from weekend to Monday';
    }

    if (temperature === 'hot') {
      confidence = Math.min(0.95, confidence + 0.15);
    } else if (temperature === 'cold') {
      confidence = Math.max(0.3, confidence - 0.1);
    }

    const jitterMs = (Math.random() - 0.5) * 2 * 30 * 60 * 1000;
    optimalTime = new Date(optimalTime.getTime() + jitterMs);

    return {
      optimalSendTime: optimalTime,
      confidence,
      reason,
      adjustedForTimezone
    };
  }

  static getSmartScheduleTime(
    messages: ConversationMessage[],
    baseDelayMs: number,
    temperature: 'hot' | 'warm' | 'cold'
  ): Date {
    const behavior = this.analyzeConversation(messages);
    const prediction = this.predictOptimalTiming(behavior, baseDelayMs, temperature);
    
    console.log(`Predictive timing: ${prediction.reason} (confidence: ${(prediction.confidence * 100).toFixed(0)}%)`);
    
    return prediction.optimalSendTime;
  }
}

export default PredictiveTimingAnalyzer;
