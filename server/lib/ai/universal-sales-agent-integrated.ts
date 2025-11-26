/* @ts-nocheck */

/**
 * INTEGRATION LAYER
 * Connects Universal Sales Agent with TIER 1 & TIER 4 Features
 * 
 * When generating messages, ALSO consider:
 * - Lead intent (are they ready?)
 * - Deal prediction (what's the deal worth?)
 * - Churn risk (are they slipping?)
 * - Smart objection handling
 */

import { generateOptimizedMessage, universalSalesAI } from "./universal-sales-agent";
import { calculateLeadScore } from "./lead-management";
import { detectLeadIntent, suggestSmartReply, predictDealAmount, assessChurnRisk } from "./lead-intelligence";

export async function generateContextAwareMessage(
  lead: any,
  brandContext: any,
  testimonials: any[],
  messages: any[] = []
) {
  /**
   * Generate message that considers:
   * 1. Lead score (warm/hot/cold)
   * 2. Lead intent (ready to buy?)
   * 3. Deal prediction (what's it worth?)
   * 4. Churn risk (are they slipping?)
   */

  // Get all insights in parallel
  const [score, intent, prediction, churnRisk] = await Promise.all([
    calculateLeadScore(lead, messages),
    detectLeadIntent(messages, lead),
    predictDealAmount(lead, messages),
    assessChurnRisk(lead, messages),
  ]);

  // Determine message stage based on intelligence
  let stage = "cold";
  if (score >= 80 && intent.intentLevel === "high") stage = "closing";
  else if (score >= 60 && intent.buyerStage === "decision") stage = "objection";
  else if (score >= 50) stage = "follow_up";

  // Generate base message
  const baseMessage = await generateOptimizedMessage(lead, brandContext, testimonials, stage);

  // Enhance message based on intelligence
  let enhancedMessage = baseMessage.message;

  // If high deal value, mention ROI more
  if (prediction.predictedAmount > 50000) {
    enhancedMessage = enhancedMessage.replace(/results/i, "significant ROI improvement - we're talking $50k+ impact");
  }

  // If churn risk is high, add urgency
  if (churnRisk.churnRiskLevel === "high") {
    enhancedMessage = "⏰ Quick check-in: " + enhancedMessage;
  }

  // If intent is high, add confidence
  if (intent.intentLevel === "high") {
    enhancedMessage = enhancedMessage.replace(/\?$/, "? (Perfect timing - let's move forward)");
  }

  // Learn from this generation
  await universalSalesAI.learnFromInteraction({
    leadId: lead.id,
    messageType: stage,
    leadResponse: "sent", // will be updated when lead responds
    sentiment: "neutral",
    timestamp: new Date(),
  });

  return {
    message: enhancedMessage,
    quality: baseMessage.quality,
    intelligence: {
      score,
      intent: intent.intentLevel,
      dealValue: prediction.predictedAmount,
      churnRisk: churnRisk.churnRiskLevel,
    },
    explanation: `Score: ${score}/100 | Intent: ${intent.intentLevel} | Deal: $${prediction.predictedAmount} | Risk: ${churnRisk.churnRiskLevel}`,
    autonomousClosing: "Enabled - AI will autonomously respond to objections to close deals",
  };
}

export async function handleLeadResponseWithLearning(
  lead: any,
  theirMessage: string,
  messages: any[]
) {
  /**
   * When lead responds:
   * 1. Detect if they're interested
   * 2. Detect any objections
   * 3. AUTONOMOUSLY RESPOND TO OBJECTIONS (turn them into closes)
   * 4. Learn for next time
   */

  // Import autonomous responder
  const { generateAutonomousObjectionResponse, recordObjectionLearning } = require("./autonomous-objection-responder");

  // Get intent immediately
  const intent = await detectLeadIntent(messages, lead);

  // AUTONOMOUS OBJECTION HANDLING: If they said "no", "maybe", or raised objection
  let autonomousResponse = null;
  if (intent.intentLevel === "low" || intent.intentLevel === "not_interested" || 
      theirMessage.toLowerCase().includes("let me") || 
      theirMessage.toLowerCase().includes("not sure") ||
      theirMessage.toLowerCase().includes("no") ||
      theirMessage.toLowerCase().includes("maybe") ||
      theirMessage.toLowerCase().includes("think")) {
    
    // GENERATE AUTONOMOUS CLOSING RESPONSE
    autonomousResponse = await generateAutonomousObjectionResponse(theirMessage, {
      leadName: lead.name || "there",
      leadCompany: lead.company,
      leadIndustry: lead.metadata?.industry || "general",
      previousMessages: messages.map((m: any) => ({ role: m.senderType, content: m.body })),
      brandName: lead.brandName || "Our platform",
      userIndustry: lead.userIndustry || "all",
      pdfContext: lead.pdfContext,
    });

    // Record what we learned
    await recordObjectionLearning({
      leadId: lead.id,
      industry: lead.metadata?.industry || "general",
      objectionType: "identified",
      responseUsed: autonomousResponse.response,
      leadReply: theirMessage,
      dealClosed: false, // Will update when they respond again
    });
  }

  // Get smart reply suggestions (backup)
  const smartReplies = await suggestSmartReply(theirMessage, lead, {}, messages);

  // Learn from this interaction
  await universalSalesAI.learnFromInteraction({
    leadId: lead.id,
    messageType: intent.intentLevel === "high" ? "follow_up" : "objection_response",
    leadResponse: intent.intentLevel === "high" ? "interested" : "objection",
    sentiment: theirMessage.includes("!") || theirMessage.includes("?") ? "positive" : "neutral",
    timestamp: new Date(),
    whatWorked: autonomousResponse ? "autonomous objection closed" : autonomousResponse ? "interest increased" : smartReplies[0],
  });

  return {
    intent,
    suggestedReplies: smartReplies,
    autonomousResponse: autonomousResponse || null,
    nextAction: autonomousResponse 
      ? "Send autonomous closing response - turn objection to YES" 
      : intent.intentLevel === "high" ? "Schedule call" : "Send case study",
  };
}

export async function autoGenerateFollowUp(lead: any, messages: any[], daysSinceLastContact: number) {
  /**
   * Automatically generate best follow-up based on:
   * - Lead score
   * - Intent level  
   * - Days since last contact
   * - Deal value
   */

  const score = await calculateLeadScore(lead, messages);
  const intent = await detectLeadIntent(messages, lead);

  // Skip if too hot (already in conversation)
  if (messages[messages.length - 1] && daysSinceLastContact < 1) {
    return { action: "skip", reason: "Lead responded recently" };
  }

  // Follow up cadence based on score
  let shouldFollowUp = false;
  let followUpType = "";

  if (score >= 80) {
    // Hot lead: follow up if 2+ days
    shouldFollowUp = daysSinceLastContact >= 2;
    followUpType = "urgency";
  } else if (score >= 60) {
    // Warm lead: follow up if 5+ days
    shouldFollowUp = daysSinceLastContact >= 5;
    followUpType = "value";
  } else {
    // Cold lead: follow up if 10+ days
    shouldFollowUp = daysSinceLastContact >= 10;
    followUpType = "new_angle";
  }

  if (!shouldFollowUp) {
    return { action: "wait", days_until_next_followup: Math.ceil(daysSinceLastContact) };
  }

  // Generate contextual follow-up
  let followUpMessage = "";

  if (followUpType === "urgency") {
    followUpMessage = `Quick update: We've helped ${lead.metadata?.industry} companies like yours see results in 30 days. Timeline working for you?`;
  } else if (followUpType === "value") {
    followUpMessage = `Sarah, wanted to share a case study that might be relevant to ${lead.metadata?.company}. Similar company: 40% faster results. Worth a 5-min chat?`;
  } else {
    followUpMessage = `Different angle on ${lead.metadata?.company}: Most of your competitors are missing one key thing. Can I show you?`;
  }

  return {
    action: "send_followup",
    message: followUpMessage,
    type: followUpType,
    reasoning: `Score ${score}/100, Intent: ${intent.intentLevel}, Days since contact: ${daysSinceLastContact}`,
  };
}
