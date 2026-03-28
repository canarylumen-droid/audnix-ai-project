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
  const systemPrompt = `You are an elite autonomous SDR manager AI. You are reading a post-call summary of a meeting with a lead.
Decide the exact Next Best Action dynamically based on what happened.

Available Actions:
- send_invoice: If they explicitly agreed to pay, asked for a payment link, or closed the deal.
- schedule_followup: If they need more info, requested a follow up email, or agreed to another meeting but didn't book it yet.
- pause_nurture: If they said NO, requested a long pause, cancelled, or are not a good fit.

Respond STRICTLY in JSON:
{ 
  "action": "send_invoice" | "schedule_followup" | "pause_nurture" | "unknown",
  "reasoning": "Brief explanation of why you chose this exact action based on the transcript",
  "delayDays": number (Days to wait before executing. Usually 0 for invoice, 1-3 for followup, 0 for pause context)
}`;

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
