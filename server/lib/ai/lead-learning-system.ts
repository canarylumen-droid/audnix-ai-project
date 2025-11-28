interface SupabaseMessage {
  id: string;
  lead_id: string;
  user_id: string;
  provider: 'instagram' | 'whatsapp' | 'gmail' | 'email' | 'system';
  direction: 'inbound' | 'outbound';
  body: string;
  audio_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface SupabaseLead {
  id: string;
  user_id: string;
  external_id: string | null;
  name: string;
  channel: 'instagram' | 'whatsapp' | 'email';
  email: string | null;
  phone: string | null;
  status: 'new' | 'open' | 'replied' | 'converted' | 'not_interested' | 'cold';
  score: number;
  warm: boolean;
  last_message_at: string | null;
  ai_paused: boolean;
  pdf_confidence: number | null;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface LeadBehaviorPattern {
  userId: string;
  leadId: string;
  responseTime: number;
  messageLength: number;
  preferredTime: string;
  sentimentTrend: 'positive' | 'neutral' | 'negative';
  engagementScore: number;
  temperature: 'hot' | 'warm' | 'cold';
  conversionSignals: string[];
  objectionPatterns: string[];
  lastUpdated: string;
}

interface SemanticMemoryRecord {
  content: string;
}

export class LeadLearningSystem {
  
  async analyzeAndLearn(leadId: string, _newMessage?: unknown): Promise<void> {
    // Using Neon database for message storage - no Supabase needed
    try {
      // TODO: Fetch messages from Neon database via storage
      const messages = [];
      if (!messages || messages.length === 0) return;

      // Using Neon database for lead and semantic memory storage
      console.log(`✅ Learned behavior pattern for lead ${leadId}`);
    } catch (error) {
      console.error('Error in lead learning system:', error);
    }
  }

  private calculateBehaviorPattern(messages: SupabaseMessage[], lead: SupabaseLead): LeadBehaviorPattern {
    const userMessages = messages.filter((m: SupabaseMessage) => m.direction === 'inbound');
    
    let totalResponseTime = 0;
    let responseCount = 0;
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].direction === 'inbound' && messages[i - 1].direction === 'outbound') {
        const diff = new Date(messages[i].created_at).getTime() - new Date(messages[i - 1].created_at).getTime();
        totalResponseTime += diff / (1000 * 60);
        responseCount++;
      }
    }
    const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

    const avgMessageLength = userMessages.reduce((sum: number, m: SupabaseMessage) => sum + m.body.length, 0) / (userMessages.length || 1);

    const timeSlots: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    userMessages.forEach((m: SupabaseMessage) => {
      const hour = new Date(m.created_at).getHours();
      if (hour >= 6 && hour < 12) timeSlots.morning++;
      else if (hour >= 12 && hour < 17) timeSlots.afternoon++;
      else if (hour >= 17 && hour < 22) timeSlots.evening++;
      else timeSlots.night++;
    });
    const preferredTime = Object.entries(timeSlots).reduce((a, b) => a[1] > b[1] ? a : b)[0];

    const recentMessages = userMessages.slice(-5);
    const positiveWords = ['yes', 'great', 'thanks', 'perfect', 'interested', 'good', 'awesome'];
    const negativeWords = ['no', 'not', "don't", 'busy', 'later', 'expensive', 'stop'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    recentMessages.forEach((m: SupabaseMessage) => {
      const lower = m.body.toLowerCase();
      positiveWords.forEach((word: string) => { if (lower.includes(word)) positiveCount++; });
      negativeWords.forEach((word: string) => { if (lower.includes(word)) negativeCount++; });
    });
    
    const sentimentTrend: 'positive' | 'neutral' | 'negative' = positiveCount > negativeCount ? 'positive' : 
                          negativeCount > positiveCount ? 'negative' : 'neutral';

    const conversionSignals: string[] = [];
    const conversionPhrases = ['how much', 'price', 'buy', 'purchase', 'pay', 'link', 'checkout', 'demo', 'schedule'];
    userMessages.forEach((m: SupabaseMessage) => {
      const lower = m.body.toLowerCase();
      conversionPhrases.forEach((phrase: string) => {
        if (lower.includes(phrase) && !conversionSignals.includes(phrase)) {
          conversionSignals.push(phrase);
        }
      });
    });

    const objectionPatterns: string[] = [];
    const objectionPhrases = ['too expensive', 'not sure', 'need to think', 'maybe later', 'not now', 'not interested'];
    userMessages.forEach((m: SupabaseMessage) => {
      const lower = m.body.toLowerCase();
      objectionPhrases.forEach((phrase: string) => {
        if (lower.includes(phrase) && !objectionPatterns.includes(phrase)) {
          objectionPatterns.push(phrase);
        }
      });
    });

    let engagementScore = 50;
    
    if (avgResponseTime < 5) engagementScore += 20;
    else if (avgResponseTime < 30) engagementScore += 10;
    else if (avgResponseTime > 120) engagementScore -= 20;
    
    if (avgMessageLength > 100) engagementScore += 15;
    else if (avgMessageLength < 20) engagementScore -= 10;
    
    if (sentimentTrend === 'positive') engagementScore += 15;
    else if (sentimentTrend === 'negative') engagementScore -= 15;
    
    engagementScore += conversionSignals.length * 10;
    engagementScore -= objectionPatterns.length * 5;
    engagementScore = Math.max(0, Math.min(100, engagementScore));

    const temperature: 'hot' | 'warm' | 'cold' = 
      engagementScore > 70 ? 'hot' :
      engagementScore > 40 ? 'warm' : 'cold';

    return {
      userId: lead.user_id,
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

      const record = data as SemanticMemoryRecord;
      return JSON.parse(record.content) as LeadBehaviorPattern;
    } catch (error) {
      console.error('Error getting lead insights:', error);
      return null;
    }
  }
}

export const leadLearningSystem = new LeadLearningSystem();
