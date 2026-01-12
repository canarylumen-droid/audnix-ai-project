import OpenAI from 'openai';
import { storage } from '../../storage.js';
import { type Message } from '../../../shared/schema.js';

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

export interface Lead {
  id: string | number;
  name: string;
  channel: string;
  status: string;
  tags?: string[];
  created_at?: string;
}



interface AnalysisRecord {
  analysis: IntentAnalysis;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze lead message intent using GPT-4
 */
export async function analyzeLeadIntent(
  message: string,
  lead: Lead
): Promise<IntentAnalysis> {
  try {
    const conversationContext = '';

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
- "too expensive", "can't afford", "not now"
- "already have", "using another", "competitor"

Return ONLY valid JSON, no explanation.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an elite sales intent analyzer. Analyze messages and return raw JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_completion_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0].message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(response) as IntentAnalysis;

    // Neural Tagging Integration
    const tags = await suggestLeadTags(lead, message, analysis);

    // Store analysis and tags via Drizzle storage
    await storage.updateLead(lead.id.toString(), {
      tags: tags,
      metadata: {
        ...(lead as any).metadata,
        lastIntensity: analysis.confidence,
        lastIntent: analysis.sentiment,
        suggestedAction: analysis.suggestedAction,
        intentAnalysis: analysis
      }
    });

    return analysis;

  } catch (error) {
    console.error('Error analyzing intent:', error);
    return performBasicIntentAnalysis(message);
  }
}

/**
 * Basic keyword-based intent analysis as fallback
 */
function performBasicIntentAnalysis(message: string): IntentAnalysis {
  const lowerMessage = message.toLowerCase();

  const positiveKeywords = [
    'interested', 'yes', 'sure', 'love', 'great', 'perfect',
    'need', 'want', 'looking for', 'sounds good', 'tell me more',
    'how much', 'pricing', 'cost', 'when', 'available'
  ];

  const negativeKeywords = [
    'not interested', 'no', 'stop', 'unsubscribe', 'remove',
    'don\'t', 'cant', 'won\'t', 'never', 'spam', 'leave me alone'
  ];

  const schedulingKeywords = [
    'schedule', 'meeting', 'call', 'demo', 'appointment',
    'calendar', 'book', 'available', 'free', 'talk'
  ];

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



export async function suggestLeadTags(lead: Lead, latestMessage?: string, analysis?: IntentAnalysis): Promise<string[]> {
  try {
    const messages = await storage.getMessagesByLeadId(lead.id.toString());
    const history = messages?.slice(-5).map(m => `${m.direction === 'inbound' ? 'Lead' : 'AI'}: ${m.body}`).join('\n') || 'No history';

    const prompt = `Analyze this conversation and suggest 3-5 technical tags for this lead.
    
    Lead: ${lead.name}
    Channel: ${lead.channel}
    Current Tags: ${lead.tags?.join(', ') || 'none'}
    
    Conversation History:
    ${history}
    
    ${latestMessage ? `Latest Message: "${latestMessage}"` : ''}
    ${analysis ? `AI Analysis: ${JSON.stringify(analysis)}` : ''}

    Rules:
    - Include industry tags (e.g., "SaaS", "Real Estate", "Ecommerce")
    - Include intent tags (e.g., "High Intent", "Price Sensitive", "Technical Buyer")
    - Include status tags (e.g., "Decision Maker", "Information Seeker")
    - Return a string array of tags only.
    
    Example: ["SaaS", "High Intent", "Decision Maker", "Q1 Timeline"]
    Return JSON: { "tags": ["string"] }`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: 'You are a neural lead tagger.' }, { role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message?.content || '{"tags": []}');
    const newTags = Array.from(new Set([...(lead.tags || []), ...(result.tags || [])]));
    return newTags.slice(0, 10); // Limit to 10 tags
  } catch (error) {
    console.error('Neural tagging error:', error);
    return lead.tags || [];
  }
}

/**
 * Analyze lead quality score
 */
export async function calculateLeadQualityScore(lead: Lead): Promise<{
  score: number;
  factors: {
    engagement: number;
    intent: number;
    fit: number;
    timing: number;
  };
  recommendation: string;
}> {
  const messages = await storage.getMessagesByLeadId(lead.id.toString());
  const analyses = (lead as any).metadata?.intentAnalysis ? [(lead as any).metadata.intentAnalysis] : [];

  const messageCount = messages?.length || 0;
  const responseRate = messages ?
    messages.filter((m: Message) => m.direction === 'inbound').length / Math.max(1, messages.filter((m: Message) => m.direction === 'outbound').length) : 0;
  const engagementScore = Math.min(100, (messageCount * 10) + (responseRate * 30));

  const recentAnalyses = analyses?.map((a: AnalysisRecord) => a.analysis) || [];
  const avgConfidence = recentAnalyses.length > 0 ?
    recentAnalyses.reduce((sum: number, a: IntentAnalysis) => sum + (a.confidence || 0), 0) / recentAnalyses.length : 0;
  const positiveCount = recentAnalyses.filter((a: IntentAnalysis) => a.isInterested || a.wantsToSchedule || a.readyToBuy).length;
  const intentScore = (avgConfidence * 50) + (positiveCount * 10);

  const fitScore = calculateFitScore(lead);

  const lastMessageDate = messages?.[0]?.createdAt ? new Date(messages[0].createdAt) : new Date(lead.created_at || Date.now());
  const daysSinceLastMessage = (Date.now() - lastMessageDate.getTime()) / (1000 * 60 * 60 * 24);
  const timingScore = Math.max(0, 100 - (daysSinceLastMessage * 5));

  const overallScore = Math.round(
    (engagementScore * 0.3) +
    (intentScore * 0.4) +
    (fitScore * 0.2) +
    (timingScore * 0.1)
  );

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

function calculateFitScore(lead: Lead): number {
  let score = 50;

  const tags = lead.tags || [];

  if (tags.includes('enterprise')) score += 20;
  if (tags.includes('quality-focused')) score += 15;
  if (tags.includes('urgent')) score += 15;
  if (tags.includes('timeline-defined')) score += 10;

  if (tags.includes('price-sensitive')) score -= 10;
  if (tags.includes('cold')) score -= 20;

  if (lead.channel === 'instagram') score += 5;
  if (lead.channel === 'email') score += 10;
  if (lead.channel === 'whatsapp') score += 8;

  return Math.max(0, Math.min(100, score));
}
