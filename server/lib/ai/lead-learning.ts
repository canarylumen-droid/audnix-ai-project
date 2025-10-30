
import { supabaseAdmin } from '../supabase-admin';

interface LeadScore {
  score: number;
  factors: {
    engagement: number;
    responseTime: number;
    sentiment: number;
    intent: number;
  };
  recommendations: string[];
}

/**
 * Analyze and score leads based on conversation patterns
 */
export async function analyzeLeadBehavior(leadId: string): Promise<LeadScore> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  // Get conversation history
  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true });

  if (!messages || messages.length === 0) {
    return {
      score: 0,
      factors: { engagement: 0, responseTime: 0, sentiment: 0, intent: 0 },
      recommendations: ['No conversation data available']
    };
  }

  // Calculate engagement score
  const engagement = calculateEngagementScore(messages);
  
  // Calculate response time score
  const responseTime = calculateResponseTimeScore(messages);
  
  // Calculate sentiment score
  const sentiment = calculateSentimentScore(messages);
  
  // Calculate intent score
  const intent = calculateIntentScore(messages);
  
  // Overall score (weighted average)
  const score = Math.round(
    engagement * 0.3 + 
    responseTime * 0.2 + 
    sentiment * 0.25 + 
    intent * 0.25
  );

  // Generate recommendations
  const recommendations = generateRecommendations(score, {
    engagement,
    responseTime,
    sentiment,
    intent
  });

  // Update lead score in database
  await supabaseAdmin
    .from('leads')
    .update({
      score,
      last_analyzed: new Date().toISOString()
    })
    .eq('id', leadId);

  return {
    score,
    factors: { engagement, responseTime, sentiment, intent },
    recommendations
  };
}

function calculateEngagementScore(messages: any[]): number {
  const totalMessages = messages.length;
  const leadMessages = messages.filter(m => m.direction === 'inbound').length;
  
  if (totalMessages === 0) return 0;
  
  const engagementRatio = leadMessages / totalMessages;
  return Math.round(engagementRatio * 100);
}

function calculateResponseTimeScore(messages: any[]): number {
  const responseTimes: number[] = [];
  
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].direction === 'outbound' && messages[i-1].direction === 'inbound') {
      const timeDiff = new Date(messages[i].created_at).getTime() - 
                      new Date(messages[i-1].created_at).getTime();
      responseTimes.push(timeDiff / 1000 / 60); // in minutes
    }
  }
  
  if (responseTimes.length === 0) return 50;
  
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  
  // Score: faster responses = higher score
  if (avgResponseTime < 5) return 100;
  if (avgResponseTime < 15) return 80;
  if (avgResponseTime < 60) return 60;
  if (avgResponseTime < 180) return 40;
  return 20;
}

function calculateSentimentScore(messages: any[]): number {
  const positiveWords = ['great', 'good', 'excellent', 'yes', 'interested', 'love', 'perfect'];
  const negativeWords = ['no', 'not', 'bad', 'terrible', 'never', 'stop', 'unsubscribe'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  messages.forEach(msg => {
    const text = msg.content.toLowerCase();
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++;
    });
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++;
    });
  });
  
  const total = positiveCount + negativeCount;
  if (total === 0) return 50;
  
  return Math.round((positiveCount / total) * 100);
}

function calculateIntentScore(messages: any[]): number {
  const buyingSignals = ['price', 'cost', 'buy', 'purchase', 'when', 'how much', 'demo', 'trial'];
  
  let signalCount = 0;
  const recentMessages = messages.slice(-10); // Last 10 messages
  
  recentMessages.forEach(msg => {
    const text = msg.content.toLowerCase();
    buyingSignals.forEach(signal => {
      if (text.includes(signal)) signalCount++;
    });
  });
  
  return Math.min(100, signalCount * 20);
}

function generateRecommendations(score: number, factors: any): string[] {
  const recommendations: string[] = [];
  
  if (score >= 80) {
    recommendations.push('🔥 Hot lead! Schedule a demo or send pricing immediately');
  } else if (score >= 60) {
    recommendations.push('✅ Warm lead - Continue nurturing with valuable content');
  } else if (score >= 40) {
    recommendations.push('📊 Moderate interest - Try re-engagement campaign');
  } else {
    recommendations.push('🔄 Low engagement - Consider different approach or pause outreach');
  }
  
  if (factors.responseTime < 50) {
    recommendations.push('⏰ Improve response time to increase engagement');
  }
  
  if (factors.sentiment < 50) {
    recommendations.push('😊 Focus on building positive rapport');
  }
  
  if (factors.intent > 60) {
    recommendations.push('💰 Strong buying signals detected - Move to close');
  }
  
  return recommendations;
}

/**
 * Start real-time lead learning worker
 */
export function startLeadLearning() {
  console.log('🧠 Starting lead learning system...');
  
  // Analyze all leads every hour
  setInterval(async () => {
    if (!supabaseAdmin) return;
    
    try {
      const { data: leads } = await supabaseAdmin
        .from('leads')
        .select('id')
        .limit(100);
      
      if (leads) {
        for (const lead of leads) {
          await analyzeLeadBehavior(lead.id);
        }
        console.log(`✅ Analyzed ${leads.length} leads`);
      }
    } catch (error) {
      console.error('Lead learning error:', error);
    }
  }, 60 * 60 * 1000); // Every hour
}
