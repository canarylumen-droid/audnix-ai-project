/* @ts-nocheck */
import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import OpenAI from "openai";

const router = Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-key",
});

/**
 * POST /api/ai/suggest-best
 * INSTANT: Generate best sales-ready copy based on context
 * (No waiting for 7 days - works RIGHT NOW)
 */
router.post("/suggest-best", requireAuth, async (req, res) => {
  try {
    const { leadProfile, brandContext, analysisData, messageType } = req.body;

    if (!leadProfile || !brandContext) {
      return res.status(400).json({ error: "Missing lead or brand context" });
    }

    // Build context for AI
    const prompt = `You are a world-class sales closer. Generate the BEST sales-ready message RIGHT NOW.

LEAD:
- Name: ${leadProfile.firstName}
- Company: ${leadProfile.company}
- Industry: ${leadProfile.industry}
- Pain Point: ${leadProfile.painPoint || "Unknown"}

YOUR BUSINESS:
- Company: ${brandContext.companyName}
- What you do: ${brandContext.businessDescription}
- Target: ${brandContext.targetAudience}
- Tone: ${brandContext.tone}
- Offer: ${brandContext.offer}
${analysisData ? `- Brand Clarity: ${analysisData.overall_score}%` : ""}

MESSAGE TYPE: ${messageType || "cold_outreach"}

RULES:
1. NO fluff. NO corporate speak.
2. Personalize with their company or industry.
3. Show you understand THEIR specific problem.
4. Lead with the benefit (not features).
5. ONE clear next step ("call" OR "question" OR "look at").
6. Keep under 100 words.
7. Confidence tone. No apologies. No "I think."
8. Make them feel like a winner, not a prospect.

Generate 3 OPTIONS ranked by sales effectiveness:

OPTION A (Most Direct - Highest Close Rate):
[message]

OPTION B (Most Consultative - Best for Consideration):
[message]

OPTION C (Most ROI-Focused - Best for Decision Makers):
[message]

For each, include 2-line reasoning why it works.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 800,
    });

    const suggestions = response.choices[0].message.body || "";

    res.json({
      success: true,
      suggestions,
      lead: leadProfile.firstName,
      messageType,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

/**
 * POST /api/ai/suggest-instant-follow-up
 * Generate instant follow-up based on lead response
 */
router.post("/suggest-instant-follow-up", requireAuth, async (req, res) => {
  try {
    const { lastMessage, leadProfile, brandContext, conversationHistory } = req.body;

    if (!lastMessage || !leadProfile) {
      return res.status(400).json({ error: "Missing message or lead" });
    }

    const prompt = `Lead just said: "${lastMessage}"

Lead: ${leadProfile.firstName} at ${leadProfile.company}
Your offer: ${brandContext.businessDescription}

Generate the BEST 1-line response to keep momentum. Make it feel natural, not salesy.

Requirements:
- Under 20 words
- Confident tone
- Keep conversation going
- Lead them closer to decision

Response:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    });

    const instantReply = response.choices[0].message.body || "";

    res.json({
      success: true,
      instant_reply: instantReply,
      lead: leadProfile.firstName,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error generating follow-up:", error);
    res.status(500).json({ error: "Failed to generate follow-up" });
  }
});

export default router;
