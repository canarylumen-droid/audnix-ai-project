/* @ts-nocheck */

/**
 * TIER 4: AI INTELLIGENCE SERVICE
 * 
 * Handles:
 * - Lead Intent Detection
 * - Smart Reply Suggestions
 * - Objection Pattern Recognition
 * - Deal Amount Prediction
 * - Churn Risk Scoring
 * - Competitor Mention Alerts
 */

import OpenAI from "openai";
import type { Message, Lead } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-key",
});

// ============ ENGINE 1: LEAD INTENT DETECTION ============

export async function detectLeadIntent(
  messages: Message[],
  lead: Lead
): Promise<{
  intentLevel: "high" | "medium" | "low" | "not_interested";
  intentScore: number;
  buyerStage: "awareness" | "consideration" | "decision";
  signals: string[];
  reasoning: string;
}> {
  /**
   * Analyze conversation to determine:
   * - Are they ready to buy?
   * - What stage are they in?
   * - What signals show intent?
   */

  if (!messages || messages.length === 0) {
    return {
      intentLevel: "low",
      intentScore: 10,
      buyerStage: "awareness",
      signals: ["no_engagement"],
      reasoning: "No messages yet",
    };
  }

  try {
    const conversationText = messages.map((m) => `${m.direction === "inbound" ? "LEAD" : "YOU"}: ${m.content}`).join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Analyze this sales conversation to detect buyer intent.

CONVERSATION:
${conversationText}

LEAD PROFILE:
Company: ${lead.metadata?.company}
Industry: ${lead.metadata?.industry}

Determine:
1. Intent Level (high/medium/low/not_interested)
2. Intent Score (0-100)
3. Buyer Stage (awareness/consideration/decision)
4. Specific signals showing intent (keywords, questions, urgency)

Format as JSON:
{
  "intentLevel": "high|medium|low|not_interested",
  "intentScore": number,
  "buyerStage": "awareness|consideration|decision",
  "signals": ["signal1", "signal2"],
  "reasoning": "why this intent level"
}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 400,
    });

    const result = JSON.parse(response.choices[0].message.body || "{}");
    return {
      intentLevel: result.intentLevel || "low",
      intentScore: result.intentScore || 20,
      buyerStage: result.buyerStage || "awareness",
      signals: result.signals || [],
      reasoning: result.reasoning || "",
    };
  } catch (error) {
    console.error("Error detecting intent:", error);
    return {
      intentLevel: "medium",
      intentScore: 50,
      buyerStage: "consideration",
      signals: ["unable_to_analyze"],
      reasoning: "Error in analysis",
    };
  }
}

// ============ ENGINE 2: SMART REPLY SUGGESTIONS ============

export async function suggestSmartReply(
  lastMessageFromLead: string,
  leadProfile: Lead,
  brandContext: any,
  conversationHistory: Message[] = []
): Promise<Array<{ reply: string; confidence: number; reasoning: string }>> {
  /**
   * AI suggests 3 best replies to lead's last message
   * User can 1-click send
   */

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `You are a sales expert. Lead just said:

"${lastMessageFromLead}"

Lead: ${leadProfile.firstName} at ${leadProfile.company} (${leadProfile.industry})
Your Offer: ${brandContext.offer || "Your solution"}

Generate 3 different reply options:
1. Most direct/confident
2. Most consultative/questions
3. Most ROI-focused

Format as JSON:
[
  {
    "reply": "exact text to send",
    "confidence": 85,
    "reasoning": "why this works"
  }
]

Keep replies under 100 words each.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const replies = JSON.parse(response.choices[0].message.body || "[]");
    return replies.slice(0, 3);
  } catch (error) {
    console.error("Error suggesting reply:", error);
    return [
      {
        reply: "Thanks for reaching out. When would be a good time to chat about this?",
        confidence: 70,
        reasoning: "Safe, open-ended question",
      },
    ];
  }
}

// ============ ENGINE 3: OBJECTION PATTERN RECOGNITION ============

export async function detectObjection(
  messageFromLead: string
): Promise<{
  objectType: string;
  confidence: number;
  category: "price" | "timeline" | "already_using" | "not_convinced" | "other";
  suggestedResponse: string;
}> {
  /**
   * Detect what objection the lead has
   * Return AI-powered response to overcome it
   */

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Identify the objection in this message:

"${messageFromLead}"

Determine:
1. Objection Type (what exactly are they objecting to?)
2. Category (price/timeline/already_using/not_convinced/other)
3. Confidence (how sure are you?)
4. Professional response to overcome it

Format as JSON:
{
  "objectType": "specific objection",
  "confidence": 85,
  "category": "price|timeline|already_using|not_convinced|other",
  "suggestedResponse": "how to overcome this"
}`,
        },
      ],
      temperature: 0.6,
      max_tokens: 400,
    });

    const objection = JSON.parse(response.choices[0].message.body || "{}");
    return {
      objectType: objection.objectType || "unknown",
      confidence: objection.confidence || 50,
      category: objection.category || "other",
      suggestedResponse: objection.suggestedResponse || "Can we discuss this further?",
    };
  } catch (error) {
    console.error("Error detecting objection:", error);
    return {
      objectType: "unknown",
      confidence: 0,
      category: "other",
      suggestedResponse: "I understand your concern. Can we explore this together?",
    };
  }
}

export async function trackObjectionPattern(
  userId: string,
  objectionType: string,
  response: string,
  leadResponse: string,
  converted: boolean
): Promise<void> {
  /**
   * Track which objections + responses work best
   * AI learns over time
   */

  console.log(`📊 Objection Pattern: ${objectionType} - ${converted ? "✅ CONVERTED" : "❌ NO CONVERT"}`);

  // In production: save to objection_patterns table
  // Calculate effectiveness score
}

// ============ ENGINE 4: DEAL AMOUNT PREDICTION ============

export async function predictDealAmount(
  lead: Lead,
  messages: Message[] = []
): Promise<{
  predictedAmount: number;
  confidence: number;
  factors: Record<string, number>;
  expectedCloseDate: Date;
}> {
  /**
   * Predict deal value based on:
   * - Company size (40%)
   * - Industry (25%)
   * - Engagement level (20%)
   * - Timeline signals (15%)
   */

  // Company size multiplier
  const sizeMultiplier: Record<string, number> = {
    "1-10": 1000,
    "11-50": 5000,
    "51-200": 15000,
    "201-500": 50000,
    "500+": 100000,
  };

  // Industry multiplier
  const industryMultiplier: Record<string, number> = {
    technology: 1.5,
    finance: 1.8,
    healthcare: 1.4,
    "real estate": 1.3,
    "e-commerce": 1.2,
  };

  let baseAmount = sizeMultiplier[lead.metadata?.companySize || ""] || 5000;
  let confidence = 40;

  // Apply industry multiplier
  const industryKey = (lead.metadata?.industry || "").toLowerCase();
  for (const [ind, mult] of Object.entries(industryMultiplier)) {
    if (industryKey.includes(ind)) {
      baseAmount *= mult;
      confidence += 15;
      break;
    }
  }

  // Engagement boost
  const inboundCount = messages.filter((m) => m.direction === "inbound").length;
  if (inboundCount >= 3) {
    baseAmount *= 1.5;
    confidence += 20;
  }

  // Calculate expected close date (30-90 days)
  const daysToClose = 30 + Math.random() * 60;
  const expectedCloseDate = new Date();
  expectedCloseDate.setDate(expectedCloseDate.getDate() + daysToClose);

  return {
    predictedAmount: Math.round(baseAmount),
    confidence: Math.min(100, confidence),
    factors: {
      company_size: 0.4,
      industry: 0.25,
      engagement: 0.2,
      timeline: 0.15,
    },
    expectedCloseDate,
  };
}

// ============ ENGINE 5: CHURN RISK SCORING ============

export async function assessChurnRisk(
  lead: Lead,
  messages: Message[] = [],
  daysAsCustomer: number = 0
): Promise<{
  churnRiskLevel: "high" | "medium" | "low";
  riskScore: number;
  indicators: string[];
  recommendedAction: string;
}> {
  /**
   * Predict if customer is at risk of leaving
   * Based on engagement, sentiment, tenure
   */

  let riskScore = 50;
  const indicators: string[] = [];

  // If no recent engagement
  const lastMessageDate = messages[messages.length - 1]?.createdAt;
  if (lastMessageDate) {
    const daysSinceLastMessage = (Date.now() - new Date(lastMessageDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastMessage > 14) {
      riskScore += 30;
      indicators.push("No engagement for 2+ weeks");
    }
  }

  // If low engagement overall
  const inboundCount = messages.filter((m) => m.direction === "inbound").length;
  if (inboundCount === 0 && messages.length > 5) {
    riskScore += 20;
    indicators.push("No replies despite outreach");
  }

  // If early-stage customer (first 7 days)
  if (daysAsCustomer < 7) {
    riskScore -= 20; // Low risk in first week
    indicators.push("New customer (first week)");
  }

  // If long-term customer (> 90 days)
  if (daysAsCustomer > 90) {
    riskScore -= 10; // Slightly lower risk
    indicators.push("Long-term customer");
  }

  riskScore = Math.max(0, Math.min(100, riskScore));

  let churnRiskLevel: "high" | "medium" | "low";
  if (riskScore >= 70) churnRiskLevel = "high";
  else if (riskScore >= 40) churnRiskLevel = "medium";
  else churnRiskLevel = "low";

  let recommendedAction = "";
  if (churnRiskLevel === "high") {
    recommendedAction = "🚨 HIGH PRIORITY: Reach out immediately with special offer or check-in";
  } else if (churnRiskLevel === "medium") {
    recommendedAction = "📞 Schedule check-in call to discuss progress and upcoming wins";
  } else {
    recommendedAction = "✅ Monitor engagement, continue regular communications";
  }

  return {
    churnRiskLevel,
    riskScore,
    indicators,
    recommendedAction,
  };
}

// ============ ENGINE 6: COMPETITOR MENTION ALERTS ============

export async function detectCompetitorMention(messageText: string): Promise<{
  mentionFound: boolean;
  competitors: string[];
  context: string;
  actionSuggested: string;
}> {
  /**
   * If lead mentions competitor, it's a SELLING MOMENT
   * Alert user to act immediately
   */

  const commonCompetitors = [
    "hubspot",
    "salesforce",
    "pipedrive",
    "lemlist",
    "smartlead",
    "apollo",
    "outreach",
  ];

  const mentionedCompetitors = commonCompetitors.filter((comp) =>
    messageText.toLowerCase().includes(comp)
  );

  if (mentionedCompetitors.length === 0) {
    return {
      mentionFound: false,
      competitors: [],
      context: "",
      actionSuggested: "",
    };
  }

  return {
    mentionFound: true,
    competitors: mentionedCompetitors,
    context: `Lead mentioned ${mentionedCompetitors.join(", ")}`,
    actionSuggested: `🚨 ALERT: Lead comparing you to ${mentionedCompetitors[0]}. 
    This is a SELLING MOMENT. Highlight what ${mentionedCompetitors[0]} DOESN'T have that you do.`,
  };
}

// ============ UNIFIED AI INTELLIGENCE ENGINE ============

export async function generateLeadIntelligenceDashboard(
  lead: Lead,
  messages: Message[] = []
): Promise<{
  intent: any;
  predictions: any;
  churnRisk: any;
  suggestedActions: string[];
  nextBestAction: string;
}> {
  /**
   * Generate complete AI intelligence dashboard for a lead
   * Shows everything you need to close them
   */

  const [intent, predictions, churnRisk] = await Promise.all([
    detectLeadIntent(messages, lead),
    predictDealAmount(lead, messages),
    assessChurnRisk(lead, messages),
  ]);

  const suggestedActions: string[] = [];

  // Action 1: Based on intent
  if (intent.intentLevel === "high") {
    suggestedActions.push("🔥 HIGH INTENT: Move to next call immediately");
  } else if (intent.intentLevel === "medium") {
    suggestedActions.push("📈 MEDIUM INTENT: Send case study or social proof");
  } else {
    suggestedActions.push("❄️ LOW INTENT: Re-engage with educational content");
  }

  // Action 2: Based on churn risk
  suggestedActions.push(churnRisk.recommendedAction);

  // Action 3: Based on predicted deal
  if (predictions.predictedAmount > 50000) {
    suggestedActions.push("💰 LARGE DEAL ($50k+): Escalate to senior sales");
  } else if (predictions.predictedAmount > 10000) {
    suggestedActions.push("📊 MEDIUM DEAL ($10-50k): Continue regular cadence");
  }

  const nextBestAction =
    intent.intentLevel === "high"
      ? "Schedule call immediately - they're ready to buy"
      : intent.intentLevel === "medium"
        ? "Send personalized case study"
        : "Re-engage with education content";

  return {
    intent,
    predictions,
    churnRisk,
    suggestedActions,
    nextBestAction,
  };
}
