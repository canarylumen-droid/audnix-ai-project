
import { db } from '../../db.js';
import { 
  pendingPayments, 
  users, 
  leads, 
  type PendingPayment,
  type User,
  type Lead
} from '../../../shared/schema.js';
import { eq, and, lt } from 'drizzle-orm';
import { sendEmail } from '../channels/email.js';
import { wsSync } from '../websocket-sync.js';
import { generateReply, generateEmailSubject } from '../ai/ai-service.js';

// ───────────────────────────────────────────────────
// SYSTEM PROMPT: Enterprise Payment Follow-up Engine
// The AI uses this to craft all follow-up emails.
// It understands the context, tone, and sequence depth.
// ───────────────────────────────────────────────────
const PAYMENT_FOLLOWUP_SYSTEM_PROMPT = `
You are an elite sales closer and communication expert writing on behalf of a business owner.

Your task is to write a highly personalized, short follow-up email to a prospect who verbally agreed to pay on a sales call but has not yet completed payment via the checkout link that was sent to them.

## Rules
- Keep it SHORT (2-4 sentences max per section). No walls of text.
- Be WARM, professional, and subtly humorous — not desperate or pushy.
- Sound like a REAL human, not a bot. Never use "Hi there" or "I hope this finds you well."
- Reference the fact that they agreed on the call — remind them of *their own* decision.
- Include 2-3 relevant emojis naturally in the text (not at the start of every line).
- Use a light waiting/anticipation theme in the copy (e.g., inbox open, coffee cooling, time ticking).
- NEVER mention specific dollar amounts unless provided.
- NEVER use generic CTAs like "Let me know if you have questions."
- End with a natural, confident sign-off.

## Sequences
Depending on the follow-up round (1st or 2nd), adjust the urgency:
- Round 1 (48h after send): Light touch. Friendly reminder. Assume they are just busy.
- Round 2 (72h after send): Slightly more direct. Reference that you are still holding their spot. Assume they forgot.

## Output Format
Return ONLY the email body text (no subject line). Plain text with paragraph breaks using \\n\\n.
`;

export class EmojiFollowupWorker {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("🚀 [EmojiFollowupWorker] Online - AI-powered payment follow-ups active");
    
    // Tick every hour
    this.interval = setInterval(() => this.tick(), 60 * 60 * 1000);
    // Initial tick after a short delay so the DB is ready
    setTimeout(() => this.tick(), 15000);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.isRunning = false;
    console.log("🛑 [EmojiFollowupWorker] Stopped");
  }

  async tick() {
    try {
      const now = new Date();
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Find 'sent' payments that haven't had a follow-up recently
      const activePayments = await db.select()
        .from(pendingPayments)
        .where(
          and(
            eq(pendingPayments.status, 'sent'),
            lt(pendingPayments.updatedAt, fortyEightHoursAgo)
          )
        );

      if (activePayments.length > 0) {
        console.log(`[EmojiFollowupWorker] 🔍 Found ${activePayments.length} payment(s) requiring follow-up`);
      }

      for (const payment of activePayments) {
        const [user] = await db.select().from(users).where(eq(users.id, payment.userId)).limit(1);
        const [lead] = await db.select().from(leads).where(eq(leads.id, payment.leadId)).limit(1);

        if (!user || !lead || !lead.email) {
          console.warn(`[EmojiFollowupWorker] ⚠ Skipping payment ${payment.id}: missing user or lead email`);
          continue;
        }

        // Respect the user's toggle for AI follow-ups
        if (!user.aiStickerFollowupsEnabled) {
          console.log(`[EmojiFollowupWorker] ⏸ AI follow-ups disabled for user ${user.id}, skipping`);
          continue;
        }

        const hoursElapsed = (now.getTime() - new Date(payment.updatedAt).getTime()) / (1000 * 60 * 60);
        
        // Determine which follow-up round this is
        let followUpRound: 1 | 2;
        if (hoursElapsed >= 72) {
          followUpRound = 2;
        } else if (hoursElapsed >= 48) {
          followUpRound = 1;
        } else {
          continue; // Not yet time
        }

        console.log(`[EmojiFollowupWorker] 🤖 Generating Round ${followUpRound} AI follow-up for ${lead.email}`);

        // Build rich context for the AI to personalize deeply
        const userPrompt = `
Write a Round ${followUpRound} payment follow-up email for this prospect.

## Prospect Context
- Name: ${lead.name}
- Company: ${lead.company || 'their company'}
- They agreed to pay on a sales call
- They were sent a checkout link but have not completed payment
- Hours since link was sent: approximately ${Math.round(hoursElapsed)} hours

## Sender Context
- Your name (the sender): ${user.name || 'The team'}
- Business name: ${user.businessName || user.name || 'us'}
${payment.amountDetected ? `- Approximate deal value discussed: $${payment.amountDetected}` : ''}

## Prior Email Already Sent
${payment.readyToGoEmail
  ? `The following checkout email was already sent to this prospect. DO NOT repeat phrases, wording, or the same opener from this email:\n\n---\n${payment.readyToGoEmail.substring(0, 600)}\n---`
  : 'No prior email on record.'}

## Instructions
- Round ${followUpRound === 1 ? '1: Friendly 48h check-in. Light touch, assume they are busy.' : '2: 72h follow-up. More direct. Reference that you are holding their spot.'}
- Acknowledge that a previous message was sent — but do NOT quote it directly.
- End the email naturally without a formal closing like "Best regards" — just the sender's name on its own line.
- Include 2-3 waiting-themed emojis (⌛, ☕, 💭, 🏃, 📩) woven naturally into the text.

Return ONLY the email body. No subject line.
`;

        try {
          const { text: aiBody } = await generateReply(
            PAYMENT_FOLLOWUP_SYSTEM_PROMPT,
            userPrompt,
            { 
              temperature: 0.75, // Slightly creative for personality
              maxTokens: 300     // Keep emails short and punchy
            }
          );

          // Use AI to generate a matching subject line
          const subject = await generateEmailSubject(aiBody, lead.name, lead.company || undefined);

          console.log(`[EmojiFollowupWorker] 📧 Dispatching follow-up to ${lead.email} | Subject: "${subject}"`);

          await sendEmail(user.id, lead.email, aiBody, subject, {
            leadId: lead.id,
            isRaw: false
          });

          // Stamp updatedAt to prevent re-sending on next hourly tick
          await db.update(pendingPayments)
            .set({ updatedAt: new Date() })
            .where(eq(pendingPayments.id, payment.id));

          wsSync.notifyLeadsUpdated(user.id, { event: 'UPDATE', leadId: lead.id });

          console.log(`[EmojiFollowupWorker] ✅ Round ${followUpRound} follow-up sent for payment ${payment.id}`);

        } catch (aiError) {
          console.error(`[EmojiFollowupWorker] ❌ AI generation failed for payment ${payment.id}:`, aiError);
          // Do NOT update updatedAt — allow retry on next tick
        }
      }
    } catch (error) {
      console.error("[EmojiFollowupWorker] ❌ Tick error:", error);
    }
  }
}

export const emojiFollowupWorker = new EmojiFollowupWorker();
