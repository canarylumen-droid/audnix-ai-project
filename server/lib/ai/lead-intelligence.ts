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
import type { ConversationMessage, LeadProfile, BrandContext } from "../../../shared/types.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-key",
});

export interface IntentDetectionResult {
  intentLevel: "high" | "medium" | "low" | "not_interested";
  intentScore: number;
  buyerStage: "awareness" | "consideration" | "decision";
  signals: string[];
  reasoning: string;
}

export interface SmartReplyOption {
  reply: string;
  confidence: number;
  reasoning: string;
}

export interface ObjectionDetectionResult {
  objectType: string;
  confidence: number;
  category: "price" | "timeline" | "already_using" | "not_convinced" | "other";
  suggestedResponse: string;
}

export interface DealPrediction {
  predictedAmount: number;
  confidence: number;
  factors: Record<string, number>;
  expectedCloseDate: Date;
}

export interface ChurnRiskAssessment {
  churnRiskLevel: "high" | "medium" | "low";
  riskScore: number;
  indicators: string[];
  recommendedAction: string;
}

export interface CompetitorMentionResult {
  mentionFound: boolean;
  competitors: string[];
  context: string;
  actionSuggested: string;
}

export interface LeadIntelligenceDashboard {
  intent: IntentDetectionResult;
  predictions: DealPrediction;
  churnRisk: ChurnRiskAssessment;
  suggestedActions: string[];
  nextBestAction: string;
}

// ============ ENGINE 1: LEAD INTENT DETECTION ============

export async function detectLeadIntent(
  messages: ConversationMessage[],
  lead: LeadProfile
): Promise<IntentDetectionResult> {
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
    const conversationText = messages
      .map((m) => `${m.direction === "inbound" ? "LEAD" : "YOU"}: ${m.body}`)
      .join("\n");

    const company = lead.metadata?.company as string | undefined;
    const industry = lead.metadata?.industry as string | undefined;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Analyze this sales conversation to detect buyer intent.

CONVERSATION:
${conversationText}

LEAD PROFILE:
Company: ${company || "Unknown"}
Industry: ${industry || "Unknown"}

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

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) {
      throw new Error("Empty response from OpenAI");
    }

    const result = JSON.parse(messageContent) as {
      intentLevel?: string;
      intentScore?: number;
      buyerStage?: string;
      signals?: string[];
      reasoning?: string;
    };

    return {
      intentLevel: (result.intentLevel as IntentDetectionResult["intentLevel"]) || "low",
      intentScore: result.intentScore || 20,
      buyerStage: (result.buyerStage as IntentDetectionResult["buyerStage"]) || "awareness",
      signals: result.signals || [],
      reasoning: result.reasoning || "",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error detecting intent:", errorMessage);
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
  leadProfile: LeadProfile,
  brandContext: BrandContext,
  conversationHistory: ConversationMessage[] = []
): Promise<SmartReplyOption[]> {
  try {
    const firstName = leadProfile.name?.split(" ")[0] || "there";
    const company = leadProfile.metadata?.company as string | undefined;
    const industry = leadProfile.metadata?.industry as string | undefined;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `You are a sales expert. Lead just said:

"${lastMessageFromLead}"

Lead: ${firstName} at ${company || "their company"} (${industry || "their industry"})
Your Offer: ${brandContext.productInfo?.name || "Your solution"}

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

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) {
      throw new Error("Empty response from OpenAI");
    }

    const replies = JSON.parse(messageContent) as SmartReplyOption[];
    return replies.slice(0, 3);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error suggesting reply:", errorMessage);
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
): Promise<ObjectionDetectionResult> {
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

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) {
      throw new Error("Empty response from OpenAI");
    }

    const objection = JSON.parse(messageContent) as {
      objectType?: string;
      confidence?: number;
      category?: string;
      suggestedResponse?: string;
    };

    return {
      objectType: objection.objectType || "unknown",
      confidence: objection.confidence || 50,
      category: (objection.category as ObjectionDetectionResult["category"]) || "other",
      suggestedResponse: objection.suggestedResponse || "Can we discuss this further?",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error detecting objection:", errorMessage);
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
  console.log(`📊 Objection Pattern: ${objectionType} - ${converted ? "✅ CONVERTED" : "❌ NO CONVERT"}`);
}

// ============ ENGINE 4: DEAL AMOUNT PREDICTION ============

export async function predictDealAmount(
  lead: LeadProfile,
  messages: ConversationMessage[] = []
): Promise<DealPrediction> {
  const sizeMultiplier: Record<string, number> = {
    "1-10": 1000,
    "11-50": 5000,
    "51-200": 15000,
    "201-500": 50000,
    "500+": 100000,
  };

  const industryMultiplier: Record<string, number> = {
    technology: 1.5,
    finance: 1.8,
    healthcare: 1.4,
    "real estate": 1.3,
    "e-commerce": 1.2,
  };

  const companySize = (lead.metadata?.companySize as string) || "";
  const industry = (lead.metadata?.industry as string) || "";

  let baseAmount = sizeMultiplier[companySize] || 5000;
  let confidence = 40;

  const industryKey = industry.toLowerCase();
  for (const [ind, mult] of Object.entries(industryMultiplier)) {
    if (industryKey.includes(ind)) {
      baseAmount *= mult;
      confidence += 15;
      break;
    }
  }

  const inboundCount = messages.filter((m) => m.direction === "inbound").length;
  if (inboundCount >= 3) {
    baseAmount *= 1.5;
    confidence += 20;
  }

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
  lead: LeadProfile,
  messages: ConversationMessage[] = [],
  daysAsCustomer: number = 0
): Promise<ChurnRiskAssessment> {
  let riskScore = 50;
  const indicators: string[] = [];

  const lastMessageDate = messages[messages.length - 1]?.createdAt;
  if (lastMessageDate) {
    const daysSinceLastMessage = (Date.now() - new Date(lastMessageDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastMessage > 14) {
      riskScore += 30;
      indicators.push("No engagement for 2+ weeks");
    }
  }

  const inboundCount = messages.filter((m) => m.direction === "inbound").length;
  if (inboundCount === 0 && messages.length > 5) {
    riskScore += 20;
    indicators.push("No replies despite outreach");
  }

  if (daysAsCustomer < 7) {
    riskScore -= 20;
    indicators.push("New customer (first week)");
  }

  if (daysAsCustomer > 90) {
    riskScore -= 10;
    indicators.push("Long-term customer");
  }

  riskScore = Math.max(0, Math.min(100, riskScore));

  let churnRiskLevel: ChurnRiskAssessment["churnRiskLevel"];
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

export async function detectCompetitorMention(
  messageText: string
): Promise<CompetitorMentionResult> {
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
  lead: LeadProfile,
  messages: ConversationMessage[] = []
): Promise<LeadIntelligenceDashboard> {
  const [intent, predictions, churnRisk] = await Promise.all([
    detectLeadIntent(messages, lead),
    predictDealAmount(lead, messages),
    assessChurnRisk(lead, messages),
  ]);

  const suggestedActions: string[] = [];

  if (intent.intentLevel === "high") {
    suggestedActions.push("🔥 HIGH INTENT: Move to next call immediately");
  } else if (intent.intentLevel === "medium") {
    suggestedActions.push("📈 MEDIUM INTENT: Send case study or social proof");
  } else {
    suggestedActions.push("❄️ LOW INTENT: Re-engage with educational content");
  }

  suggestedActions.push(churnRisk.recommendedAction);

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
