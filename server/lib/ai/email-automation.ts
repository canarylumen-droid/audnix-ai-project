import { storage } from '../../storage.js';
import type { IntentAnalysis } from './intent-analyzer.js';

/**
 * Schedule an automated email reply based on intent
 */
export async function scheduleAutomatedEmailReply(
  userId: string,
  leadId: string,
  recipientEmail: string,
  subject: string,
  lastMessage: string,
  intent?: IntentAnalysis,
  threadId?: string
): Promise<void> {
    try {
        const existingJob = await storage.getPendingFollowUp(leadId);
        if (existingJob) return;

        // For email, we wait slightly longer to appear human (5-15 mins)
        const delayMs = (5 + Math.random() * 10) * 60 * 1000;
        const scheduledAt = new Date(Date.now() + delayMs);

        console.log(`[EMAIL_AUTO] Scheduling reply for ${leadId} in ${Math.round(delayMs / 60000)}m at ${scheduledAt.toISOString()}`);

        await storage.createFollowUp({
            userId,
            leadId,
            channel: 'email',
            status: 'pending',
            scheduledAt: scheduledAt,
            context: {
                last_message: lastMessage,
                intent,
                thread_id: threadId,
                subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`
            }
        });
    } catch (error) {
        console.error('[EMAIL_AUTO] Error scheduling email reply:', error);
    }
}
