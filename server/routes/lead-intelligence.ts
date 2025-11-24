/* @ts-nocheck */
import express, { Router } from "express";
import { calculateLeadScore, findDuplicateLeads, enrichLeadCompany, addTimelineEvent, addLeadTag, setCustomFieldValue } from "../lib/ai/lead-management";
import { detectLeadIntent, suggestSmartReply, detectObjection, predictDealAmount, assessChurnRisk, generateLeadIntelligenceDashboard } from "../lib/ai/lead-intelligence";
import { generateOptimizedMessage } from "../lib/ai/universal-sales-agent";

const router: Router = express.Router();

// ============ LEAD SCORING ============
router.post("/score", async (req, res) => {
  try {
    const { lead, messages } = req.body;
    const score = await calculateLeadScore(lead, messages);
    
    res.json({
      lead_id: lead.id,
      score,
      tier: score >= 80 ? "hot" : score >= 60 ? "warm" : "cold",
      message: score >= 80 ? "🔥 HOT LEAD - Close ASAP" : score >= 60 ? "🔥 Warm lead - nurture" : "❄️ Cold lead - follow-up",
    });
  } catch (error) {
    console.error("Error scoring lead:", error);
    res.status(500).json({ error: "Failed to score lead" });
  }
});

// ============ LEAD INTENT DETECTION ============
router.post("/intent", async (req, res) => {
  try {
    const { lead, messages } = req.body;
    const intent = await detectLeadIntent(messages || [], lead);
    
    res.json({
      lead_id: lead.id,
      ...intent,
      action: intent.intentLevel === "high" ? "📞 CALL NOW - they're ready" : "📧 Send case study",
    });
  } catch (error) {
    console.error("Error detecting intent:", error);
    res.status(500).json({ error: "Failed to detect intent" });
  }
});

// ============ SMART REPLY SUGGESTIONS ============
router.post("/smart-reply", async (req, res) => {
  try {
    const { lead, lastMessageFromLead, brandContext, conversationHistory } = req.body;
    const suggestions = await suggestSmartReply(
      lastMessageFromLead,
      lead,
      brandContext || {},
      conversationHistory || []
    );
    
    res.json({
      lead_id: lead.id,
      suggestions,
      recommendation: suggestions[0]?.reply || "No suggestions available",
    });
  } catch (error) {
    console.error("Error generating smart reply:", error);
    res.status(500).json({ error: "Failed to generate reply suggestions" });
  }
});

// ============ OBJECTION DETECTION ============
router.post("/detect-objection", async (req, res) => {
  try {
    const { messageText, leadId } = req.body;
    const objection = await detectObjection(messageText);
    
    res.json({
      lead_id: leadId,
      ...objection,
      action: `🚨 OBJECTION DETECTED: ${objection.objectType}`,
    });
  } catch (error) {
    console.error("Error detecting objection:", error);
    res.status(500).json({ error: "Failed to detect objection" });
  }
});

// ============ DEAL AMOUNT PREDICTION ============
router.post("/predict-deal", async (req, res) => {
  try {
    const { lead, messages } = req.body;
    const prediction = await predictDealAmount(lead, messages || []);
    
    res.json({
      lead_id: lead.id,
      ...prediction,
      expectedCloseDate: prediction.expectedCloseDate?.toISOString(),
      confidence_label: prediction.confidence >= 80 ? "High" : prediction.confidence >= 50 ? "Medium" : "Low",
    });
  } catch (error) {
    console.error("Error predicting deal:", error);
    res.status(500).json({ error: "Failed to predict deal amount" });
  }
});

// ============ CHURN RISK ASSESSMENT ============
router.post("/churn-risk", async (req, res) => {
  try {
    const { lead, messages, daysAsCustomer } = req.body;
    const churnRisk = await assessChurnRisk(lead, messages || [], daysAsCustomer || 0);
    
    res.json({
      lead_id: lead.id,
      ...churnRisk,
      urgency: churnRisk.churnRiskLevel === "high" ? "🚨 ACT IMMEDIATELY" : "✅ Monitor",
    });
  } catch (error) {
    console.error("Error assessing churn risk:", error);
    res.status(500).json({ error: "Failed to assess churn risk" });
  }
});

// ============ COMPLETE LEAD INTELLIGENCE DASHBOARD ============
router.post("/intelligence-dashboard", async (req, res) => {
  try {
    const { lead, messages } = req.body;
    const dashboard = await generateLeadIntelligenceDashboard(lead, messages || []);
    
    res.json({
      lead_id: lead.id,
      ...dashboard,
    });
  } catch (error) {
    console.error("Error generating dashboard:", error);
    res.status(500).json({ error: "Failed to generate intelligence dashboard" });
  }
});

// ============ FIND DUPLICATES ============
router.post("/find-duplicates", async (req, res) => {
  try {
    const { lead, userLeads } = req.body;
    const duplicates = await findDuplicateLeads(lead, userLeads || []);
    
    res.json({
      lead_id: lead.id,
      duplicates_found: duplicates.length,
      duplicates: duplicates.map((d) => ({
        duplicate_lead_id: d.lead.id,
        match_score: d.matchScore,
        match_fields: d.matchFields,
        suggested_action: d.matchScore >= 90 ? "⚠️ MERGE - likely duplicate" : "👀 REVIEW - possible duplicate",
      })),
    });
  } catch (error) {
    console.error("Error finding duplicates:", error);
    res.status(500).json({ error: "Failed to find duplicates" });
  }
});

// ============ COMPANY ENRICHMENT ============
router.post("/enrich-company", async (req, res) => {
  try {
    const { lead } = req.body;
    const enrichment = await enrichLeadCompany(lead);
    
    res.json({
      lead_id: lead.id,
      enrichment,
      action: "📊 Company data enriched - use for personalization",
    });
  } catch (error) {
    console.error("Error enriching company:", error);
    res.status(500).json({ error: "Failed to enrich company data" });
  }
});

// ============ ADD TAG ============
router.post("/tag", async (req, res) => {
  try {
    const { leadId, tagName } = req.body;
    await addLeadTag(leadId, tagName);
    
    res.json({
      lead_id: leadId,
      tag_added: tagName,
      message: `✅ Tag "${tagName}" added`,
    });
  } catch (error) {
    console.error("Error adding tag:", error);
    res.status(500).json({ error: "Failed to add tag" });
  }
});

// ============ SET CUSTOM FIELD ============
router.post("/custom-field", async (req, res) => {
  try {
    const { leadId, fieldName, value } = req.body;
    await setCustomFieldValue(leadId, fieldName, value);
    
    res.json({
      lead_id: leadId,
      field_set: fieldName,
      value,
      message: `✅ Custom field "${fieldName}" set`,
    });
  } catch (error) {
    console.error("Error setting custom field:", error);
    res.status(500).json({ error: "Failed to set custom field" });
  }
});

// ============ LOG TIMELINE EVENT ============
router.post("/timeline-event", async (req, res) => {
  try {
    const { leadId, actionType, actionData, actorId } = req.body;
    await addTimelineEvent(leadId, actionType, actionData, actorId);
    
    res.json({
      lead_id: leadId,
      action_logged: actionType,
      message: `✅ Timeline event logged`,
    });
  } catch (error) {
    console.error("Error logging timeline:", error);
    res.status(500).json({ error: "Failed to log timeline event" });
  }
});

// ============ GENERATE OPTIMIZED MESSAGE WITH INTELLIGENCE ============
router.post("/generate-message-with-intelligence", async (req, res) => {
  try {
    const { lead, brandContext, testimonials, stage } = req.body;

    // Get lead intelligence first
    const intelligence = await generateLeadIntelligenceDashboard(lead, []);

    // Generate optimized message using intelligence
    const message = await generateOptimizedMessage(lead, brandContext || {}, testimonials || [], stage || "cold");

    res.json({
      lead_id: lead.id,
      message: message.message,
      quality: message.quality,
      intelligence: {
        intent: intelligence.intent.intentLevel,
        predicted_deal: intelligence.predictions.predictedAmount,
        churn_risk: intelligence.churnRisk.churnRiskLevel,
        next_action: intelligence.nextBestAction,
      },
      suggestion: `📧 Send to ${lead.name} → ${intelligence.nextBestAction}`,
    });
  } catch (error) {
    console.error("Error generating message with intelligence:", error);
    res.status(500).json({ error: "Failed to generate message" });
  }
});

export default router;
