import { generateReply } from './ai-service.js';
import { db } from '../../db.js';
import { leads, auditTrail, followUpQueue, users, aiActionLogs } from '../../../shared/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { calendlyService } from '../integrations/calendly.js';
import { availabilityService } from '../calendar/availability-service.js';
import { objectionService } from './objection-handler.js';

export interface AgentActionDecision {
  action: 'send_payment_link' | 'send_invoice' | 'schedule_followup' | 'book_meeting' | 'request_info' | 'pause_nurture' | 'unknown';
  reasoning: string;
  delayDays: number;
  confidence: number;
  intentScore: number;
  emailSubject?: string;
  emailBody?: string;
  spacingReasoning?: string;
}

/**
 * Autonomous agent core mapping text summaries from Fathom 
 * directly into business logic actions (Next Best Action framework)
 */
export async function evaluateNextBestAction(leadId: string, summary: string): Promise<AgentActionDecision> {
  const leadMatch = await db.select().from(leads).where(eq(leads.id, leadId));
  if (leadMatch.length === 0) {
    return { action: 'unknown', reasoning: 'Lead not found', delayDays: 0, confidence: 0, intentScore: 0 };
  }
  const lead = leadMatch[0];

  const userMatch = await db.select().from(users).where(eq(users.id, lead.userId));
  const user = userMatch[0];
  const config = (user?.config as any) || {};

  const bookingLink = await calendlyService.getBookingLink(lead.userId);
  const suggestedSlots = await availabilityService.getSuggestedTimes(lead.userId);
  const formattedSlots = availabilityService.formatSlotsForAI(suggestedSlots);

  // Detect and format objections
  const playbook = objectionService.getPlaybookForSummary(summary);
  const objectionContext = objectionService.formatPlaybookForAI(playbook);

  const systemPrompt = `
You are an "Expert SDR Manager" AI at Audnix. You are NOT a dull assistant; you are a high-performing closer.
Your goal: Determine the single Next Best Action (NBA) from a call summary and draft a "Level 5" autonomous email that moves the needle.

### Context
- Expert/Sender: ${user?.name || 'the team'}
- Booking Link: ${bookingLink || 'Ask for availability'}
- Real-Time Availability (SUGGEST THESE): ${formattedSlots}

### Objection Handling (PRIORITIZE THIS)
${objectionContext}

### Decision rules for CLOSING (Expert Mode)
1. **Target 3-Email Conversion**: Do not waste time on "How are you?" or fluff. Be direct, value-driven, and assume the sale.
2. **Specific Availability**: If the action is "book_meeting", YOU MUST propose 2-3 specific times from the Availability list provided above. Example: "I checked my calendar and I'm free Wednesday at 2pm or Thursday at 10am. Does either work?"
3. **24/7 Autonomy**: You operate around the clock. Do NOT wait for 'business hours' to reply to hot leads. Respond ASAP whenever they are active, even at 2 AM or on weekends.
4. **Objection Handling**: If the lead mentions a competitor, focus on Audnix's unique Level 5 Autonomy. If they mention price, pivot to ROI.
5. **NO CHASING**: Set `delayDays` if the lead says "next month" or "traveling". Cite their specific reasoning.
6. **No Placeholders**: Never use [Name] or [Link]. Use the real data provided.

### Available Actions
- send_payment_link: Ready for checkout.
- send_invoice: Asked for formal billing.
- book_meeting: Agreed to follow-up/demo. Propose specific times + Link.
- schedule_followup: "Cool down" required. 
- request_info: Asked for pitch deck/case studies.
- pause_nurture: Said "No" or requested DNC.
- unknown: No clear signal.

### Output JSON Format
{
  "action": "...",
  "reasoning": "Internal strategic reasoning",
  "delayDays": number,
  "confidence": 0-1.0,
  "intentScore": 0-100,
  "emailSubject": "1-6 word punchy subject",
  "emailBody": "2-4 sentence expert email body. Lead with value. Include specific slots if booking.",
  "spacingReasoning": "Why this specific delay? Citing lead verbatim if possible."
}
`;

  const userPrompt = `Lead: ${lead.name} (${lead.company || 'Unknown'})\nPost Call Summary:\n${summary}`;

  let decision: AgentActionDecision = {
    action: 'unknown',
    reasoning: 'Failed to process AI logic',
    delayDays: 0,
    confidence: 0,
    intentScore: 0
  };

  try {
    const result = await generateReply(systemPrompt, userPrompt, { jsonMode: true, temperature: 0.1 });
    decision = JSON.parse(result.text);
  } catch (error) {
    console.error("[Autonomous Agent] Failed to parse JSON response:", error);
  }

  // 1. Check Global Engine Toggle
  if (!config.autonomousMode) {
    console.log(`ℹ️ [Autonomous Agent] Skipping action execution for Lead ${lead.email} because AI Engine is OFF.`);
    
    // Still log the decision to the feed (Simulated Mode)
    await db.insert(aiActionLogs).values({
      userId: lead.userId,
      leadId: lead.id,
      actionType: decision.action === 'book_meeting' ? 'calendar_booking' : 'follow_up',
      decision: 'skip',
      intentScore: decision.intentScore,
      confidence: decision.confidence,
      reasoning: `[SIMULATED] ${decision.reasoning} | Spacing: ${decision.spacingReasoning} (Skipped: AI Engine OFF)`,
      createdAt: new Date()
    });
    
    return decision;
  }

  // 2. Safety Check: Don't chase too hard (Wait at least 1 day between autonomous Fathom actions)
  const recentLogs = await db.select()
    .from(aiActionLogs)
    .where(and(eq(aiActionLogs.leadId, lead.id), eq(aiActionLogs.decision, 'act')))
    .orderBy(desc(aiActionLogs.createdAt))
    .limit(1);

  if (recentLogs.length > 0) {
    const hoursSinceLastAction = (Date.now() - new Date(recentLogs[0].createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastAction < 24 && decision.delayDays === 0) {
      console.log(`[Autonomous Agent] 🛡️ Anti-chase safety: Forcing 1-day delay for ${lead.email}`);
      decision.delayDays = 1;
    }
  }

  // 3. Log to Dashboard Feed
  await db.insert(aiActionLogs).values({
    userId: lead.userId,
    leadId: lead.id,
    actionType: decision.action === 'book_meeting' ? 'calendar_booking' : 'follow_up',
    decision: decision.action === 'unknown' ? 'skip' : 'act',
    intentScore: decision.intentScore,
    confidence: decision.confidence,
    reasoning: `${decision.reasoning} | Spacing: ${decision.spacingReasoning}`,
    createdAt: new Date()
  });

  // 4. Action Routing
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + (decision.delayDays || 0));

  if (['send_payment_link', 'send_invoice', 'book_meeting', 'schedule_followup', 'request_info'].includes(decision.action)) {
    const isReady = decision.action !== 'schedule_followup'; // schedule_followup is pure delay
    
    await db.insert(followUpQueue).values({
      userId: lead.userId,
      leadId: lead.id,
      channel: lead.channel || 'email',
      scheduledAt: scheduledDate,
      status: 'pending',
      context: {
        intent: decision.action,
        reasoning: decision.reasoning,
        suggestedSubject: decision.emailSubject,
        suggestedBody: decision.emailBody,
        source: 'fathom_autonomous_engine'
      }
    });

    // Auto-unpause if we decided to act
    if (lead.aiPaused) {
      await db.update(leads).set({ aiPaused: false }).where(eq(leads.id, lead.id));
    }
  } else if (decision.action === 'pause_nurture') {
    await db.update(leads)
      .set({ aiPaused: true, status: 'hardened' })
      .where(eq(leads.id, lead.id));
  }

  return decision;
}

