import { db } from '../../db.js';
import { calendarBookings, users, leads } from '../../../shared/schema.js';
import { eq, and, gt, lt, isNull } from 'drizzle-orm';
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
      
      // Find bookings starting in the next ~hour that haven't had a reminder
      const upcomingBookings = await db.select().from(calendarBookings).where(
        and(
          eq(calendarBookings.status, 'scheduled'),
          gt(calendarBookings.startTime, now),
          lt(calendarBookings.startTime, oneHourFromNow)
        )
      );

      for (const booking of upcomingBookings) {
        const metadata = booking.metadata as any || {};
        const reminder1hr = metadata.reminder1hr_sent;
        const reminder45m = metadata.reminder45m_sent;

        const minutesUntil = Math.round((new Date(booking.startTime).getTime() - now.getTime()) / 60000);

        // 1 Hour Reminder (60-70 mins before)
        if (minutesUntil <= 70 && minutesUntil >= 60 && !reminder1hr) {
          await this.sendReminder(booking, '1-hour');
          await this.markReminderSent(booking.id, 'reminder1hr_sent');
        }
        
        // 45 Minute Reminder (40-50 mins before)
        if (minutesUntil <= 50 && minutesUntil >= 40 && !reminder45m) {
          await this.sendReminder(booking, '45-minute');
          await this.markReminderSent(booking.id, 'reminder45m_sent');
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

    const systemPrompt = "You are a professional sales assistant. Craft a short, personalized meeting reminder.";
    const prompt = `Craft a short, punchy ${type} reminder for an upcoming meeting.
    Meeting: ${booking.title}
    Time: ${new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    Link: ${booking.meetingUrl || 'N/A'}
    Recipient: ${recipientName}
    Business: ${user.company || user.businessName || 'Our Team'}
    
    RECENT CONVERSATION CONTEXT:
    ${historyStr || 'No previous history available.'}
    
    INSTRUCTION: Mention something small from the context if it makes sense to sound more human. Keep it under 2-3 sentences. Professional and helpful.`;

    const { text } = await generateReply(systemPrompt, prompt);

    await sendEmail(
      booking.userId,
      recipientEmail,
      text,
      `Reminder: ${booking.title} in ${type}`,
      { isHtml: true, leadId: booking.leadId }
    );
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
