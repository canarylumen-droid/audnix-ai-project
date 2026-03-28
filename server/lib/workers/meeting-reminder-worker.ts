import { db } from '../../db.js';
import { calendarBookings, users, leads, aiActionLogs } from '../../../shared/schema.js';
import { eq, and, or, gt, lt, isNull } from 'drizzle-orm';
import { storage } from '../../storage.js';
import { sendEmail } from '../channels/email.js';
import { generateReply } from '../ai/ai-service.js';
import { workerHealthMonitor } from '../monitoring/worker-health.js';
import { quotaService } from '../monitoring/quota-service.js';

export class MeetingReminderWorker {
  private isRunning: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 600000; // Increased to 10m to protect DB quota (Neon)

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('✅ Meeting Reminder Worker started (10m polling)');
    
    this.pollingInterval = setInterval(() => this.checkAndSendReminders(), this.POLL_INTERVAL_MS);
    this.checkAndSendReminders();
  }

  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isRunning = false;
  }

  private async checkAndSendReminders(): Promise<void> {
    if (quotaService.isRestricted()) {
      console.log('[MeetingReminder] Skipping check: Database quota restricted');
      return;
    }
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 65 * 60 * 1000); // 65 min buffer
      
      // Find bookings starting in the next ~hour, or that were recently marked 'no_show', or just ended in the past 2 hours
      const upcomingBookings = await db.select().from(calendarBookings).where(
        or(
          and(
            eq(calendarBookings.status, 'scheduled'),
            gt(calendarBookings.startTime, new Date(now.getTime() - 10 * 60 * 1000)), // up to 10 mins past start
            lt(calendarBookings.startTime, oneHourFromNow)
          ),
          eq(calendarBookings.status, 'no_show'),
          and(
            eq(calendarBookings.status, 'scheduled'),
            lt(calendarBookings.endTime, now),
            gt(calendarBookings.endTime, new Date(now.getTime() - 120 * 60 * 1000))
          )
        )
      );

      for (const booking of upcomingBookings) {
        const metadata = booking.metadata as any || {};
        const reminder45m = metadata.reminder45m_sent;
        const reminder5m = metadata.reminder5m_sent;
        const noShowHandled = metadata.no_show_handled;

        const minutesUntil = Math.round((new Date(booking.startTime).getTime() - now.getTime()) / 60000);
        const minutesSince = Math.round((now.getTime() - new Date(booking.startTime).getTime()) / 60000);

        // 45 Minute Reminder (40-55 mins before)
        if (minutesUntil <= 55 && minutesUntil >= 40 && !reminder45m && booking.status === 'scheduled') {
          await this.sendReminder(booking, '45-minute');
          await this.markReminderSent(booking.id, 'reminder45m_sent');
        }
        
        // 5 Minute Reminder (0-15 mins before)
        if (minutesUntil <= 15 && minutesUntil >= 0 && !reminder5m && booking.status === 'scheduled') {
          await this.sendReminder(booking, '5-minute');
          await this.markReminderSent(booking.id, 'reminder5m_sent');
        }

        // No-Show Reschedule (30 mins after scheduled start time OR marked explicitly as no_show by Fathom)
        if (booking.status === 'no_show' && minutesSince >= 30 && minutesSince <= 120 && !noShowHandled) {
          await this.sendRescheduleEmail(booking);
          await this.markReminderSent(booking.id, 'no_show_handled');
        }

        // Post-Meeting Autonomous Action via Fathom (Checks completed meetings)
        if (booking.status === 'scheduled' && now.getTime() > new Date(booking.endTime).getTime() && !metadata.post_meeting_handled) {
          await this.processPostMeetingSummary(booking);
          await this.markReminderSent(booking.id, 'post_meeting_handled');
        }
      }

      workerHealthMonitor.recordSuccess('meeting-reminder-worker');
    } catch (error: any) {
      console.error('[MeetingReminder] Error:', error);
      quotaService.reportDbError(error);
      workerHealthMonitor.recordError('meeting-reminder-worker', error?.message || 'Unknown error');
    }
  }

  private async sendReminder(booking: any, type: string): Promise<void> {
    const user = await storage.getUserById(booking.userId);
    if (!user) return;

    const lead = booking.leadId ? await storage.getLeadById(booking.leadId) : null;
    const recipientName = booking.attendeeName || lead?.name || 'there';
    const recipientEmail = booking.attendeeEmail || lead?.email;

    if (!recipientEmail) return;

    console.log(`[MeetingReminder] Sending ${type} reminder to ${recipientEmail} for "${booking.title}"`);

    const history = lead?.id ? await storage.getMessagesByLeadId(lead.id) : [];
    const historyStr = history.slice(-3).map(m => `${m.direction === 'inbound' ? 'Lead' : 'AI'}: ${m.body}`).join('\n');

    const systemPrompt = `
You are a high-performing AI sales assistant specialized in writing concise, professional meeting reminders.

Your goals:
- Maximize clarity, professionalism, and response rates
- Keep messages brief, natural, and human-like
- Personalize when relevant, without sounding forced
- Use soft, action-oriented phrasing (e.g., "Feel free to pick a time that works best for you") to increase reply rates

Strict rules:
- Output must be 1–2 sentences maximum
- No emojis, no fluff, no filler phrases
- Maintain a confident, polite, and professional tone
- Do NOT invent details that are not provided
- Only use context if it is clearly relevant and adds value
- Always include the meeting time and link (if available)

Output only the final message. No explanations.
`;

    const prompt = `
Write a ${type} meeting reminder.

Details:
- Meeting title: ${booking.title}
- Time: ${new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
- Meeting link: ${booking.meetingUrl || 'Not provided'}
- Recipient name: ${recipientName}
- Sender business: ${user.company || user.businessName || 'Our Team'}

Context from previous conversation:
${historyStr || 'None'}

Instructions:
- If useful, reference a small, relevant detail from the conversation to personalize the message
- If no useful context exists, skip personalization
- Keep the message clear, direct, and natural
- Avoid sounding robotic or overly formal
`;

    const { text } = await generateReply(systemPrompt, prompt);

    await sendEmail(
      booking.userId,
      recipientEmail,
      text,
      `Reminder: ${booking.title} in ${type}`,
      { isHtml: true, leadId: booking.leadId }
    );
  }

  private async sendRescheduleEmail(booking: any): Promise<void> {
    const user = await storage.getUserById(booking.userId);
    if (!user) return;

    const lead = booking.leadId ? await storage.getLeadById(booking.leadId) : null;
    const recipientName = booking.attendeeName || lead?.name || 'there';
    const recipientEmail = booking.attendeeEmail || lead?.email;

    if (!recipientEmail) return;

    console.log(`[MeetingReminder] Sending no-show reschedule email to ${recipientEmail} for "${booking.title}"`);

    const calendarLink = (user as any).calendlyLink || (user as any).calendarLink;
    const bookingCta = calendarLink ? `Link: ${calendarLink}` : `Please reply to let us know when works best.`;
    const systemPrompt = `
You are a high-performing AI sales assistant specialized in writing concise, professional meeting reminders.

Your goals:
- Maximize clarity, professionalism, and response rates
- Keep messages brief, natural, and human-like
- Personalize when relevant, without sounding forced
- Use soft, action-oriented phrasing (e.g., "Feel free to pick a time that works best for you") to increase reply rates

Strict rules:
- Output must be 1–2 sentences maximum
- No emojis, no fluff, no filler phrases
- Maintain a confident, polite, and professional tone
- Do NOT invent details that are not provided
- Only use context if it is clearly relevant and adds value
- Always include the meeting time and link (if available)

Output only the final message. No explanations.
`;

    const prompt = `
Write a polite, frictionless missed-meeting follow-up email.

Context:
- Meeting title: ${booking.title}
- Recipient name: ${recipientName}
- Sender business: ${user.company || user.businessName || 'Our Team'}
- Reschedule link / CTA: ${bookingCta}

Instructions:
- Assume the recipient was busy; do not assign blame or mention "missing" the meeting negatively
- Keep tone calm, understanding, and professional
- Keep it 2 sentences maximum (3 only if absolutely necessary)
- Make rescheduling feel easy and low-pressure
- Include the CTA naturally in the message
- Do NOT sound pushy, salesy, or passive-aggressive
- Do NOT invent details

Output requirements:
- Output only the final email message
- No subject line, no placeholders, no extra commentary
- Single short paragraph
`;

    const { text } = await generateReply(systemPrompt, prompt);

    await sendEmail(
      booking.userId,
      recipientEmail,
      text,
      `Missed you for ${booking.title} - Reschedule?`,
      { isHtml: true, leadId: booking.leadId }
    );
  }

  private async processPostMeetingSummary(booking: any): Promise<void> {
    const fathomApiKey = process.env.FATHOM_API_KEY;
    if (!fathomApiKey || !booking.externalEventId) return;

    const user = await storage.getUserById(booking.userId);
    const lead = booking.leadId ? await storage.getLeadById(booking.leadId) : null;
    
    if (!user || !lead || !lead.email) return;

    try {
      console.log(`[MeetingReminder] Querying Fathom API for completed meeting ${booking.externalEventId}`);
      // Query Fathom for the transcript/summary of the completed call
      const fathomRes = await fetch(`https://api.fathom.video/v1/calls?event_id=${booking.externalEventId}`, {
        headers: { 'Authorization': `Bearer ${fathomApiKey}` }
      });

      if (!fathomRes.ok) {
        console.warn(`[MeetingReminder] Fathom API wait: Call summary not ready or 404 for ${booking.externalEventId}`);
        // Let it retry next tick if it's just delayed
        return;
      }

      const callData = await fathomRes.json();
      
      // Handle actual Fathom no-show status detection
      if (callData.data && callData.data[0]?.status === 'no_show') {
         await db.update(calendarBookings).set({ status: 'no_show' }).where({ id: booking.id });
         return; // The no-show handler will pick it up
      }

      const summary = callData.data?.[0]?.summary || callData.data?.[0]?.transcript;
      
      // If Fathom doesn't have the summary or transcript yet, abort and try again later
      if (!summary) {
         console.warn(`[MeetingReminder] Fathom summary/transcript not available yet for ${booking.externalEventId}`);
         return;
      }

      const systemPrompt = `You are an autonomous sales AI. Analyze the Fathom call summary. 
Decide the exact next email to send. 
Do NOT chase. Be helpful. 
Respond ONLY with a JSON object: { "action": "invoice" | "follow_up" | "wait", "emailSubject": "...", "emailBody": "...", "reasoning": "..." }`;
      
      const prompt = `Call Summary: ${summary}\nLead Name: ${lead.name}\nBusiness: ${user.company || user.businessName || 'Our Team'}\nDecide next step.`;

      const aiDecisionStr = await generateReply(systemPrompt, prompt);
      
      let decision;
      try {
        // Strip markdown if AI wraps it
        const cleanedStr = aiDecisionStr.text.replace(/```json\n?|\n?```/gi, '').trim();
        decision = JSON.parse(cleanedStr);
      } catch (e) {
        console.warn(`[MeetingReminder] JSON parse error for AI decision fallback:`, e);
        return; // Skip and avoid sending garbage
      }

      // Record AI decision
      await db.insert(aiActionLogs).values({
        userId: booking.userId,
        leadId: booking.leadId,
        actionType: 'follow_up',
        decision: decision.action === 'wait' ? 'wait' : 'act',
        confidence: 0.95,
        reasoning: decision.reasoning || `Analyzed Fathom call summary. Selected action: ${decision.action}.`
      });

      // Execute action if not waiting
      if (decision.action !== 'wait' && decision.emailBody) {
         console.log(`[MeetingReminder] Autonomous AI executing post-meeting action (${decision.action}) for ${lead.email}`);
         await sendEmail(
            booking.userId,
            lead.email,
            decision.emailBody,
            decision.emailSubject || "Following up on our call",
            { isHtml: true, leadId: lead.id }
         );
      }
      
      // Mark booking as completed via Fathom
      await db.update(calendarBookings).set({ status: 'completed' }).where(eq(calendarBookings.id, booking.id));

    } catch (err) {
      console.error(`[MeetingReminder] Error processing Fathom post-meeting summary:`, err);
    }
  }

  private async markReminderSent(id: string, field: string): Promise<void> {
    const booking = await db.select().from(calendarBookings).where(eq(calendarBookings.id, id)).limit(1);
    if (booking.length === 0) return;

    const metadata = booking[0].metadata as any || {};
    await db.update(calendarBookings)
      .set({ 
        metadata: { ...metadata, [field]: true, last_reminder_at: new Date().toISOString() } 
      })
      .where(eq(calendarBookings.id, id));
  }
}

export const meetingReminderWorker = new MeetingReminderWorker();
