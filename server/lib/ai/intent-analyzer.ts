import { supabaseAdmin } from '../supabase-admin';

export interface IntentAnalysis {
  isInterested: boolean;
  isNegative: boolean;
  hasQuestion: boolean;
  hasObjection: boolean;
  wantsToSchedule: boolean;
  readyToBuy: boolean;
  needsMoreInfo: boolean;
  confidence: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  suggestedAction: string;
  keywords: string[];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});

/**
 * Analyze lead message intent using GPT-4
 */
export async function analyzeLeadIntent(
  message: string,
  lead: any
): Promise<IntentAnalysis> {
  try {
    // Get conversation history for context
    const { data: history } = supabaseAdmin ? 
      await supabaseAdmin
        .from('messages')
        .select('content, role')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })
        .limit(5) :
      { data: null };

    const conversationContext = history?.map(m => 
      `${m.role === 'user' ? 'Lead' : 'Agent'}: ${m.content}`
    ).reverse().join('\n');

    const prompt = `Analyze this lead message for sales intent and sentiment.

Lead Information:
- Name: ${lead.name}
- Channel: ${lead.channel}
- Current Status: ${lead.status}
- Tags: ${lead.tags?.join(', ') || 'none'}

Conversation History:
${conversationContext || 'No prior conversation'}

Latest Message: "${message}"

Analyze and return a JSON object with these exact fields:
{
  "isInterested": boolean (shows buying interest),
  "isNegative": boolean (rejection or complaint),
  "hasQuestion": boolean (asking for information),
  "hasObjection": boolean (price, timing, feature concerns),
  "wantsToSchedule": boolean (wants meeting/call/demo),
  "readyToBuy": boolean (ready to purchase/sign up),
  "needsMoreInfo": boolean (needs education),
  "confidence": number (0-1 confidence in analysis),
  "sentiment": "positive" | "negative" | "neutral",
  "suggestedAction": string (next best action),
  "keywords": string[] (important keywords/phrases)
}

Focus on buying signals like:
- "interested", "love it", "perfect", "need this"
- "how much", "pricing", "cost", "payment"
- "when can we", "schedule", "meet", "call", "demo"
- "sign up", "get started", "purchase", "buy"

Negative signals:
- "not interested", "no thanks", "unsubscribe", "stop"
- "too premium", "can't afford", "not now"
- "already have", "using another", "competitor"

Return ONLY valid JSON, no explanation.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a sales intent analyzer. Analyze messages and return JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_completion_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0].message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    const analysis = JSON.parse(response) as IntentAnalysis;
    
    // Save analysis to lead record
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('lead_analysis')
        .insert({
          lead_id: lead.id,
          message,
          analysis,
          created_at: new Date().toISOString()
        });
    }

    return analysis;

  } catch (error) {
    console.error('Error analyzing intent:', error);
    
    // Fallback to basic keyword analysis
    return performBasicIntentAnalysis(message);
  }
}

/**
 * Basic keyword-based intent analysis as fallback
 */
function performBasicIntentAnalysis(message: string): IntentAnalysis {
  const lowerMessage = message.toLowerCase();
  
  // Positive intent keywords
  const positiveKeywords = [
    'interested', 'yes', 'sure', 'love', 'great', 'perfect',
    'need', 'want', 'looking for', 'sounds good', 'tell me more',
    'how much', 'pricing', 'cost', 'when', 'available'
  ];
  
  // Negative intent keywords  
  const negativeKeywords = [
    'not interested', 'no', 'stop', 'unsubscribe', 'remove',
    'don\'t', 'cant', 'won\'t', 'never', 'spam', 'leave me alone'
  ];
  
  // Scheduling keywords
  const schedulingKeywords = [
    'schedule', 'meeting', 'call', 'demo', 'appointment',
    'calendar', 'book', 'available', 'free', 'talk'
  ];
  
  // Ready to buy keywords
  const buyingKeywords = [
    'buy', 'purchase', 'sign up', 'register', 'start',
    'get started', 'ready', 'let\'s do', 'deal', 'sold'
  ];

  const hasPositive = positiveKeywords.some(kw => lowerMessage.includes(kw));
  const hasNegative = negativeKeywords.some(kw => lowerMessage.includes(kw));
  const hasScheduling = schedulingKeywords.some(kw => lowerMessage.includes(kw));
  const hasBuying = buyingKeywords.some(kw => lowerMessage.includes(kw));
  const hasQuestion = lowerMessage.includes('?') || 
    ['what', 'how', 'when', 'where', 'why', 'who'].some(q => lowerMessage.includes(q));

  return {
    isInterested: hasPositive && !hasNegative,
    isNegative: hasNegative,
    hasQuestion,
    hasObjection: lowerMessage.includes('but') || lowerMessage.includes('however'),
    wantsToSchedule: hasScheduling,
    readyToBuy: hasBuying,
    needsMoreInfo: hasQuestion && !hasNegative,
    confidence: 0.6,
    sentiment: hasNegative ? 'negative' : hasPositive ? 'positive' : 'neutral',
    suggestedAction: hasBuying ? 'Close the deal' : 
                     hasScheduling ? 'Schedule meeting' :
                     hasPositive ? 'Send more info' :
                     hasNegative ? 'Remove from list' : 'Continue nurturing',
    keywords: []
  };
}

/**
 * Analyze conversation for auto-conversion
 */
export async function shouldAutoConvert(lead: any): Promise<boolean> {
  // Get recent messages
  const { data: messages } = supabaseAdmin ?
    await supabaseAdmin
      .from('messages')
      .select('content, role')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
      .limit(3) :
    { data: null };

  if (!messages || messages.length === 0) return false;

  // Check if last user message indicates strong buying intent
  const lastUserMessage = messages.find(m => m.role === 'user');
  if (!lastUserMessage) return false;

  const intent = await analyzeLeadIntent(lastUserMessage.content, lead);
  
  return (intent.readyToBuy && intent.confidence > 0.8) ||
         (intent.wantsToSchedule && intent.confidence > 0.7);
}

/**
 * Get AI-suggested tags for lead
 */
export async function suggestLeadTags(lead: any): Promise<string[]> {
  const tags: string[] = [];
  
  // Get all messages
  const { data: messages } = supabaseAdmin ?
    await supabaseAdmin
      .from('messages')
      .select('content')
      .eq('lead_id', lead.id)
      .eq('role', 'user') :
    { data: null };

  if (!messages || messages.length === 0) {
    return ['new', lead.channel];
  }

  const allMessages = messages.map(m => m.content).join(' ').toLowerCase();
  
  // Industry tags
  if (allMessages.match(/\b(saas|software|app|tech|startup)\b/)) tags.push('tech');
  if (allMessages.match(/\b(retail|shop|store|ecommerce)\b/)) tags.push('retail');
  if (allMessages.match(/\b(agency|marketing|advertising)\b/)) tags.push('agency');
  if (allMessages.match(/\b(real estate|property|realtor)\b/)) tags.push('real-estate');
  
  // Size tags
  if (allMessages.match(/\b(enterprise|corporate|large)\b/)) tags.push('enterprise');
  if (allMessages.match(/\b(small|smb|local)\b/)) tags.push('smb');
  if (allMessages.match(/\b(startup|new business)\b/)) tags.push('startup');
  
  // Urgency tags
  if (allMessages.match(/\b(asap|urgent|immediately|now)\b/)) tags.push('urgent');
  if (allMessages.match(/\b(q1|q2|q3|q4|quarter|month)\b/)) tags.push('timeline-defined');
  
  // Budget tags
  if (allMessages.match(/\b(budget|afford|price|cost)\b/)) tags.push('price-sensitive');
  if (allMessages.match(/\b(premium|best|quality|top)\b/)) tags.push('quality-focused');
  
  // Always include channel
  tags.push(lead.channel);
  
  return Array.from(new Set(tags));
}

/**
 * Analyze lead quality score
 */
export async function calculateLeadQualityScore(lead: any): Promise<{
  score: number;
  factors: {
    engagement: number;
    intent: number;
    fit: number;
    timing: number;
  };
  recommendation: string;
}> {
  // Get all interactions
  const { data: messages } = supabaseAdmin ?
    await supabaseAdmin
      .from('messages')
      .select('content, role, created_at')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false }) :
    { data: null };

  const { data: analyses } = supabaseAdmin ?
    await supabaseAdmin
      .from('lead_analysis')
      .select('analysis')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
      .limit(5) :
    { data: null };

  // Calculate engagement score
  const messageCount = messages?.length || 0;
  const responseRate = messages ? 
    messages.filter(m => m.role === 'user').length / Math.max(1, messages.filter(m => m.role === 'assistant').length) : 0;
  const engagementScore = Math.min(100, (messageCount * 10) + (responseRate * 30));

  // Calculate intent score
  const recentAnalyses = analyses?.map(a => a.analysis) || [];
  const avgConfidence = recentAnalyses.length > 0 ?
    recentAnalyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / recentAnalyses.length : 0;
  const positiveCount = recentAnalyses.filter(a => a.isInterested || a.wantsToSchedule || a.readyToBuy).length;
  const intentScore = (avgConfidence * 50) + (positiveCount * 10);

  // Calculate fit score (based on tags and profile)
  const fitScore = calculateFitScore(lead);

  // Calculate timing score
  const lastMessageDate = messages?.[0]?.created_at ? new Date(messages[0].created_at) : new Date(lead.created_at);
  const daysSinceLastMessage = (Date.now() - lastMessageDate.getTime()) / (1000 * 60 * 60 * 24);
  const timingScore = Math.max(0, 100 - (daysSinceLastMessage * 5));

  // Calculate overall score
  const overallScore = Math.round(
    (engagementScore * 0.3) +
    (intentScore * 0.4) +
    (fitScore * 0.2) +
    (timingScore * 0.1)
  );

  // Generate recommendation
  let recommendation = '';
  if (overallScore >= 80) {
    recommendation = 'Hot lead - prioritize immediate follow-up and schedule meeting';
  } else if (overallScore >= 60) {
    recommendation = 'Warm lead - continue nurturing with personalized content';
  } else if (overallScore >= 40) {
    recommendation = 'Cool lead - maintain regular touchpoints';
  } else {
    recommendation = 'Cold lead - add to long-term nurture campaign';
  }

  return {
    score: overallScore,
    factors: {
      engagement: Math.round(engagementScore),
      intent: Math.round(intentScore),
      fit: Math.round(fitScore),
      timing: Math.round(timingScore)
    },
    recommendation
  };
}

function calculateFitScore(lead: any): number {
  let score = 50; // Base score
  
  const tags = lead.tags || [];
  
  // High-value tags
  if (tags.includes('enterprise')) score += 20;
  if (tags.includes('quality-focused')) score += 15;
  if (tags.includes('urgent')) score += 15;
  if (tags.includes('timeline-defined')) score += 10;
  
  // Lower-value tags
  if (tags.includes('price-sensitive')) score -= 10;
  if (tags.includes('cold')) score -= 20;
  
  // Channel scoring
  if (lead.channel === 'instagram') score += 5;
  if (lead.channel === 'email') score += 10;
  if (lead.channel === 'whatsapp') score += 8;
  
  return Math.max(0, Math.min(100, score));
}