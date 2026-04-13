import { generateReply } from "./ai-service.js";
import { extractJson } from "../utils/json-util.js";

export interface PostCallAnalysis {
  outcome: "closed" | "followed_up" | "lost" | "no_show";
  coaching: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    progressAudit?: string; // Phase 13: Did they follow up on past promises?
  };
  bant?: {
    budget?: string;
    authority?: string;
    need?: string;
    timeline?: string;
  };
  primaryObjection?: {
    category: "pricing" | "competitor" | "trust" | "timing" | "features" | "other";
    snippet: string;
  };
  sentimentPivot?: {
    quote: string;
    shift: "positive" | "negative";
  };
  talkRatio?: number; // Estimated % of time the salesperson talked (e.g. 75)
  bookingFailureReason?: string;
  suggestedAction: string;
  confidence: number;
}

const POST_CALL_SYSTEM_PROMPT = `You are an elite Sales Director and Performance Coach. 
Analyze the provided meeting transcript and summary to determine the call outcome, BANT framework, objections, conversational dynamics, and coaching.

OUTCOME DEFINITIONS:
- "closed": Active deal won, product purchased, or a specific follow-up meeting DEFINITIVELY booked and confirmed.
- "followed_up": Prospect is interested but no firm meeting booked yet. Requires more nurturing.
- "lost": Clear rejection, not a fit, or explicit request to stop contact.
- "no_show": The transcript indicates the host waited but the guest never arrived.

EXTRACTION REQUIREMENTS:
1. BANT: If explicitly stated, extract Budget (numbers), Authority (role), Need (core pain point), and Timeline.
2. OBJECTIONS: Identify the #1 explicit objection raised by the prospect (e.g., pricing, competitor, trust, timing). Extract the exact quote snippet.
3. CONVERSATIONAL DYNAMICS:
   - Talk Ratio: Estimate the percentage of time the Salesperson talked vs Prospect (return 0-100 as integer).
   - Sentiment Pivot: Find the exact quote where the conversation shifted explicitly positive or negative.
4. COACHING:
   - Identify 2-3 specific strengths in the salesperson's approach.
   - Identify 2-3 specific weaknesses or missed opportunities.
   - Provide 3 actionable improvements for the next call.
   - Progress Audit: If PAST CONTEXT is provided, grade if the salesperson followed up on prior promises.

SUGGESTED ACTION:
- Autonomously decide the single most effective next step (e.g., "Send personalized case study", "Book follow-up in 3 days", "Draft Battle Card").

Respond ONLY in JSON format matching the PostCallAnalysis schema.`;

export async function analyzeMeetingIntelligence(
  transcript: string,
  summary: string,
  pastContext?: string
): Promise<PostCallAnalysis> {
  const userPrompt = `
PAST CONTEXT (Previous Meeting Summaries):
${pastContext || "No prior meetings recorded."}

TRANSCRIPT:
${transcript.substring(0, 15000)}

SUMMARY:
${summary}

Analyze the call intelligence.`;

  try {
    const response = await generateReply(POST_CALL_SYSTEM_PROMPT, userPrompt, {
      jsonMode: true,
      temperature: 0.2,
    });

    const analysis = extractJson<PostCallAnalysis>(response.text);
    
    // Ensure default structure if AI misses anything, but preserve genuine analysis instead of mocking
    return {
      outcome: analysis.outcome || "followed_up",
      coaching: {
        strengths: analysis.coaching?.strengths || [],
        weaknesses: analysis.coaching?.weaknesses || [],
        improvements: analysis.coaching?.improvements || [],
        progressAudit: analysis.coaching?.progressAudit,
      },
      bant: analysis.bant,
      primaryObjection: analysis.primaryObjection,
      sentimentPivot: analysis.sentimentPivot,
      talkRatio: analysis.talkRatio,
      bookingFailureReason: analysis.bookingFailureReason,
      suggestedAction: analysis.suggestedAction || "Follow up via email",
      confidence: analysis.confidence || 0.8,
    };
  } catch (error) {
    console.error("[Post-Call Intelligence] Analysis failed:", error);
    // Throw error so the caller can mark analysis as failed instead of polluting the db with hardcoded mock data
    throw new Error(`Failed to generate meeting intelligence: ${(error as Error).message}`);
  }
}
