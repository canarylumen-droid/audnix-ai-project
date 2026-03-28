import { generateReply } from './ai-service.js';
import { db } from '../../db.js';
import { leads, auditTrail, followUpQueue } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';

export interface AgentActionDecision {
  action: 'send_invoice' | 'schedule_followup' | 'pause_nurture' | 'unknown';
  reasoning: string;
  delayDays: number;
}

/**
 * Autonomous agent core mapping text summaries from Fathom 
 * directly into business logic actions (Next Best Action framework)
 */
export async function evaluateNextBestAction(leadId: string, summary: string): Promise<AgentActionDecision> {
  const systemPrompt = `
You are an elite SDR Manager AI. Determine the single Next Best Action (NBA) from a post-call summary.

### Available Actions (Mutually Exclusive)
- send_invoice: Lead explicitly committed to buying or requested payment details.
- schedule_followup: Lead is interested but not yet closed (e.g., requested info, agreed to reconnect, showed intent).
- pause_nurture: Lead is disqualified, explicitly rejected, or requested a long-term delay.
- unknown: Summary is unclear or lacks sufficient signals.

### Decision Rules
1. Prioritize strongest intent: send_invoice > schedule_followup > pause_nurture.
2. Use the MOST RECENT and EXPLICIT signal if conflicts exist.
3. Be conservative: when in doubt, default to schedule_followup over send_invoice.

### Delay Logic
- send_invoice: 0 days.
- schedule_followup: 1–3 days based on urgency (default 1).
- Others: 0 days.

### Output Format (JSON ONLY)
{
  "action": "send_invoice" | "schedule_followup" | "pause_nurture" | "unknown",
  "reasoning": "Specific signal(s) supporting this decision",
  "delayDays": number
}
`;

  const userPrompt = `Post Call Summary:\n${summary}`;

  let decision: AgentActionDecision = {
    action: 'unknown',
    reasoning: 'Failed to process AI logic',
    delayDays: 0
  };

  try {
    const result = await generateReply(systemPrompt, userPrompt, { jsonMode: true, temperature: 0.1 });
    decision = JSON.parse(result.text);
  } catch (error) {
    console.error("[Autonomous Agent] Failed to parse JSON response:", error);
    return decision;
  }

  // Execute the autonomous action
  const leadMatch = await db.select().from(leads).where(eq(leads.id, leadId));
  if (leadMatch.length > 0) {
    const lead = leadMatch[0];
    
    // 1. Audit Logging
    await db.insert(auditTrail).values({
      userId: lead.userId,
      leadId: lead.id,
      action: 'ai_autonomous_decision',
      details: {
        decision: decision.action,
        reasoning: decision.reasoning,
        delayDays: decision.delayDays
      }
    });

    console.log(`🤖 AI Decision for Lead ${lead.email}: ${decision.action} (Delay: ${decision.delayDays}d). Reason: ${decision.reasoning}`);

    // 2. Action Routing
    if (decision.action === 'schedule_followup' || decision.action === 'send_invoice') {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + (decision.delayDays || 0));

      await db.insert(followUpQueue).values({
        userId: lead.userId,
        leadId: lead.id,
        channel: 'email',
        scheduledAt: scheduledDate,
        status: 'pending',
        context: {
          intent: decision.action,
          reasoning: decision.reasoning,
          source: 'fathom_webhook_autonomous_engine'
        }
      });
      
      // Unpause them if they were paused
      if (lead.aiPaused) {
        await db.update(leads).set({ aiPaused: false }).where(eq(leads.id, lead.id));
      }
      
    } else if (decision.action === 'pause_nurture') {
      await db.update(leads)
        .set({ aiPaused: true, status: 'hardened' })
        .where(eq(leads.id, lead.id));
    }
  }

  return decision;
}
