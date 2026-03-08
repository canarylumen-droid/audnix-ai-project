import { storage } from '../../storage.js';
import { generateAIReply } from './conversation-ai.js';
import { db } from '../../db.js';
import { leads, messages, integrations, emailMessages } from '../../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import type { IntentAnalysis } from './intent-analyzer.js';
// No longer using sendEmail directly, utilizing failover system instead

interface AutomatedEmailJob {
  userId: string;
  leadId: string;
  recipientEmail: string;
  subject: string;
  scheduledAt: Date;
  context: {
    lastMessage: string;
    intent?: IntentAnalysis;
    messageCount: number;
    threadId?: string;
  };
}

const pendingEmailReplies = new Map<string, NodeJS.Timeout>();

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
        if (pendingEmailReplies.has(leadId)) return;

        const existingJob = await storage.getPendingFollowUp(leadId);
        if (existingJob) return;

        // For email, we wait slightly longer to appear human (5-15 mins)
        const delayMs = (5 + Math.random() * 10) * 60 * 1000;
        const scheduledAt = new Date(Date.now() + delayMs);

        console.log(`[EMAIL_AUTO] Scheduling reply for ${leadId} in ${Math.round(delayMs / 60000)}m`);

        const timeoutId = setTimeout(async () => {
            pendingEmailReplies.delete(leadId);
            await executeAutomatedEmailReply({
                userId,
                leadId,
                recipientEmail,
                subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
                scheduledAt,
                context: {
                    lastMessage,
                    intent,
                    messageCount: 1, // Will be fetched from history
                    threadId
                }
            });
        }, delayMs);

        pendingEmailReplies.set(leadId, timeoutId);

        await storage.createFollowUp({
            userId,
            leadId,
            channel: 'email',
            status: 'pending',
            scheduledAt: scheduledAt,
            context: {
                last_message: lastMessage,
                intent,
                thread_id: threadId
            }
        });
    } catch (error) {
        console.error('[EMAIL_AUTO] Error scheduling email reply:', error);
    }
}

async function executeAutomatedEmailReply(job: AutomatedEmailJob): Promise<void> {
    try {
        const lead = await storage.getLeadById(job.leadId);
        if (!lead || lead.aiPaused) return;

        const user = await storage.getUserById(job.userId);
        const config = (user?.config as any) || {};
        if (config.autonomousMode === false) return;

        const conversationHistory = await storage.getMessagesByLeadId(job.leadId);
        
        const aiResult = await generateAIReply(
            lead,
            conversationHistory,
            'email'
        );

        if (!aiResult.text) return;

        // Send the email using failover system
        const { multiProviderEmailFailover } = await import('../email/multi-provider-failover.js');
        const sentRes = await multiProviderEmailFailover.send({
            to: job.recipientEmail,
            subject: job.subject,
            html: aiResult.text
        }, job.userId);

        if (sentRes.success) {
            await storage.createMessage({
                userId: job.userId,
                leadId: job.leadId,
                body: aiResult.text,
                provider: 'email',
                direction: 'outbound',
                threadId: job.context.threadId || undefined,
                metadata: {
                    automated: true,
                    intent: job.context.intent,
                    provider: sentRes.provider
                }
            });

            await storage.updateLead(job.leadId, {
                status: 'replied',
                lastMessageAt: new Date()
            });

            console.log(`[EMAIL_AUTO] Successfully sent automated email to ${lead.email} via ${sentRes.provider}`);
        } else {
            console.error(`[EMAIL_AUTO] Failed to send automated email: ${sentRes.error}`);
        }

    } catch (error) {
        console.error('[EMAIL_AUTO] Error executing email reply:', error);
    }
}
