import { supabaseAdmin } from '../supabase-admin.js';
import { storage } from '../../storage.js';
import { generateAIReply, calculateReplyDelay, isLeadActivelyReplying } from './conversation-ai.js';
import { InstagramOAuth } from '../oauth/instagram.js';
import { sendInstagramMessage } from '../channels/instagram.js';
import { db } from '../../db.js';
import { leads, messages, integrations } from '../../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import type { IntentAnalysis } from './intent-analyzer.js';

interface AutomatedReplyJob {
  userId: string;
  leadId: string;
  recipientId: string;
  channel: 'instagram';
  scheduledAt: Date;
  context: {
    lastMessage: string;
    intent?: IntentAnalysis;
    messageCount: number;
  };
}

interface Lead {
  id: string;
  userId: string;
  name: string;
  channel: string;
  status: string;
  externalId: string | null;
  email?: string | null;
  phone?: string | null;
  tags?: string[];
  aiPaused?: boolean;
  metadata?: Record<string, unknown>;
}

interface Message {
  id: string;
  body: string;
  direction: 'inbound' | 'outbound';
  createdAt: Date;
}

const pendingReplies = new Map<string, NodeJS.Timeout>();

const instagramOAuth = new InstagramOAuth();

export async function scheduleAutomatedDMReply(
  userId: string,
  leadId: string,
  recipientId: string,
  lastMessage: string,
  intent?: IntentAnalysis
): Promise<void> {
  try {
    console.log(`[DM_AUTO] Scheduling automated reply for lead ${leadId}`);

    if (pendingReplies.has(leadId)) {
      console.log(`[DM_AUTO] Reply already pending for lead ${leadId}, skipping duplicate`);
      return;
    }

    if (supabaseAdmin) {
      const { data: existingJob } = await supabaseAdmin
        .from('dm_automation_queue')
        .select('id')
        .eq('lead_id', leadId)
        .eq('status', 'scheduled')
        .limit(1);

      if (existingJob && existingJob.length > 0) {
        console.log(`[DM_AUTO] Reply already scheduled in queue for lead ${leadId}, skipping`);
        return;
      }
    }

    const conversationHistory = await getConversationHistory(leadId);

    const delayMs = calculateSmartDelay(intent, conversationHistory);
    const scheduledAt = new Date(Date.now() + delayMs);

    console.log(`[DM_AUTO] Reply scheduled in ${Math.round(delayMs / 1000)}s at ${scheduledAt.toISOString()}`);

    const timeoutId = setTimeout(async () => {
      pendingReplies.delete(leadId);
      await executeAutomatedReply({
        userId,
        leadId,
        recipientId,
        channel: 'instagram',
        scheduledAt,
        context: {
          lastMessage,
          intent,
          messageCount: conversationHistory.length + 1
        }
      });
    }, delayMs);

    pendingReplies.set(leadId, timeoutId);

    if (supabaseAdmin) {
      await supabaseAdmin
        .from('dm_automation_queue')
        .insert({
          user_id: userId,
          lead_id: leadId,
          recipient_id: recipientId,
          channel: 'instagram',
          status: 'scheduled',
          scheduled_at: scheduledAt.toISOString(),
          context: {
            last_message: lastMessage,
            intent,
            message_count: conversationHistory.length + 1
          },
          created_at: new Date().toISOString()
        })
        .then(({ error }) => {
          if (error) {
            console.log('[DM_AUTO] Queue logging info:', error.message);
          }
        });
    }

  } catch (error) {
    console.error('[DM_AUTO] Error scheduling automated reply:', error);
  }
}

function calculateSmartDelay(intent?: IntentAnalysis, history?: Message[]): number {
  const MIN_DELAY = 2 * 60 * 1000;
  const MAX_DELAY = 8 * 60 * 1000;

  let minDelay = MIN_DELAY;
  let maxDelay = MAX_DELAY;

  if (intent?.readyToBuy || intent?.wantsToSchedule) {
    minDelay = 2 * 60 * 1000;
    maxDelay = 3 * 60 * 1000;
  } else if (intent?.isInterested) {
    minDelay = 2 * 60 * 1000;
    maxDelay = 4 * 60 * 1000;
  } else if (intent?.hasObjection) {
    minDelay = 3 * 60 * 1000;
    maxDelay = 5 * 60 * 1000;
  } else if (intent?.hasQuestion) {
    minDelay = 2 * 60 * 1000;
    maxDelay = 5 * 60 * 1000;
  } else {
    const isActiveConversation = history && history.length > 0 &&
      (Date.now() - new Date(history[history.length - 1].createdAt).getTime()) < 5 * 60 * 1000;

    if (isActiveConversation) {
      minDelay = 2 * 60 * 1000;
      maxDelay = 4 * 60 * 1000;
    }
  }

  minDelay = Math.max(minDelay, MIN_DELAY);
  maxDelay = Math.min(maxDelay, MAX_DELAY);

  return minDelay + Math.random() * (maxDelay - minDelay);
}

async function executeAutomatedReply(job: AutomatedReplyJob): Promise<void> {
  try {
    console.log(`[DM_AUTO] Executing automated reply for lead ${job.leadId}`);

    const lead = await storage.getLeadById(job.leadId);
    if (!lead) {
      console.error(`[DM_AUTO] Lead ${job.leadId} not found`);
      return;
    }

    if (lead.aiPaused) {
      console.log(`[DM_AUTO] AI paused for lead ${lead.name}, skipping reply`);
      await updateQueueStatus(job.leadId, 'skipped', 'AI paused by user');
      return;
    }

    if (lead.status === 'not_interested' || lead.status === 'converted') {
      console.log(`[DM_AUTO] Lead ${lead.name} is ${lead.status}, skipping reply`);
      await updateQueueStatus(job.leadId, 'skipped', `Lead status: ${lead.status}`);
      return;
    }

    const conversationHistory = await getConversationHistory(job.leadId);

    const aiResult = await generateAIReply(
      {
        ...lead,
        userId: job.userId,
        externalId: job.recipientId
      } as any,
      conversationHistory.map(m => ({
        ...m,
        leadId: job.leadId,
        userId: job.userId,
        channel: 'instagram',
        metadata: null
      })) as any[],
      'instagram'
    );

    if (!aiResult.text || aiResult.text.trim().length === 0) {
      console.error('[DM_AUTO] Empty AI response generated');
      await updateQueueStatus(job.leadId, 'failed', 'Empty AI response');
      return;
    }

    console.log(`[DM_AUTO] Generated AI reply: "${aiResult.text.substring(0, 100)}..."`);

    const sent = await sendInstagramReply(job.userId, job.recipientId, aiResult.text);

    if (sent) {
      await storage.createMessage({
        userId: job.userId,
        leadId: job.leadId,
        body: aiResult.text,
        provider: 'instagram',
        direction: 'outbound',
        metadata: {
          automated: true,
          intent: job.context.intent,
          use_voice: aiResult.useVoice
        }
      });

      await storage.updateLead(job.leadId, {
        status: 'replied',
        lastMessageAt: new Date()
      });

      await updateQueueStatus(job.leadId, 'sent', null);

      console.log(`[DM_AUTO] Successfully sent automated reply to ${lead.name}`);

      if (supabaseAdmin) {
        await supabaseAdmin
          .from('recent_activities')
          .insert({
            user_id: job.userId,
            lead_id: job.leadId,
            activity_type: 'ai_reply_sent',
            channel: 'instagram',
            description: `AI sent: "${aiResult.text.substring(0, 50)}..."`,
            metadata: {
              automated: true,
              reply_delay_seconds: Math.round((Date.now() - job.scheduledAt.getTime()) / 1000),
              intent: job.context.intent
            },
            created_at: new Date().toISOString()
          });
      }
    } else {
      console.error('[DM_AUTO] Failed to send Instagram reply');
      await updateQueueStatus(job.leadId, 'failed', 'Instagram send failed');
    }

  } catch (error) {
    console.error('[DM_AUTO] Error executing automated reply:', error);
    await updateQueueStatus(job.leadId, 'failed', String(error));
  }
}

async function sendInstagramReply(userId: string, recipientId: string, message: string): Promise<boolean> {
  try {
    const tokenData = await instagramOAuth.getValidToken(userId);
    if (!tokenData) {
      console.error('[DM_AUTO] No valid Instagram token for user');
      return false;
    }

    const instagramAccountId = await getInstagramAccountId(userId);
    if (!instagramAccountId) {
      console.error('[DM_AUTO] No Instagram account ID found for user');
      return false;
    }

    await sendInstagramMessage(
      tokenData,
      instagramAccountId,
      recipientId,
      message
    );

    return true;
  } catch (error) {
    console.error('[DM_AUTO] Instagram send error:', error);
    return false;
  }
}

async function getInstagramAccountId(userId: string): Promise<string | null> {
  if (!db) return null;

  try {
    const userIntegrations = await db
      .select()
      .from(integrations)
      .where(and(
        eq(integrations.userId, userId),
        eq(integrations.provider, 'instagram'),
        eq(integrations.connected, true)
      ))
      .limit(1);

    if (userIntegrations.length > 0) {
      const metadata = userIntegrations[0].metadata as Record<string, unknown> | null;
      return metadata?.instagramAccountId as string || null;
    }

    return null;
  } catch (error) {
    console.error('[DM_AUTO] Error getting Instagram account ID:', error);
    return null;
  }
}

async function getConversationHistory(leadId: string): Promise<Message[]> {
  if (!db) return [];

  try {
    const messageHistory = await db
      .select({
        id: messages.id,
        body: messages.body,
        direction: messages.direction,
        createdAt: messages.createdAt
      })
      .from(messages)
      .where(eq(messages.leadId, leadId))
      .orderBy(messages.createdAt)
      .limit(20);

    return messageHistory.map((m: { id: string; body: string; direction: string; createdAt: Date }) => ({
      id: m.id,
      body: m.body,
      direction: m.direction as 'inbound' | 'outbound',
      createdAt: m.createdAt
    }));
  } catch (error) {
    console.error('[DM_AUTO] Error getting conversation history:', error);
    return [];
  }
}

async function updateQueueStatus(leadId: string, status: string, errorMessage: string | null): Promise<void> {
  if (!supabaseAdmin) return;

  try {
    await supabaseAdmin
      .from('dm_automation_queue')
      .update({
        status,
        error_message: errorMessage,
        processed_at: new Date().toISOString()
      })
      .eq('lead_id', leadId)
      .eq('status', 'scheduled');
  } catch (error) {
    console.log('[DM_AUTO] Queue status update info:', error);
  }
}

export function cancelPendingReply(leadId: string): boolean {
  const timeoutId = pendingReplies.get(leadId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    pendingReplies.delete(leadId);
    console.log(`[DM_AUTO] Cancelled pending reply for lead ${leadId}`);
    return true;
  }
  return false;
}

export function getPendingRepliesCount(): number {
  return pendingReplies.size;
}

export async function checkUserAutomationSettings(userId: string): Promise<{
  enabled: boolean;
  minDelayMinutes: number;
  maxDelayMinutes: number;
}> {
  const defaultSettings = {
    enabled: true,
    minDelayMinutes: 2,
    maxDelayMinutes: 8
  };

  try {
    const user = await storage.getUser(userId);
    if (!user) return defaultSettings;

    const metadata = user.metadata as Record<string, unknown> | null;
    return {
      enabled: metadata?.dmAutomationEnabled !== false,
      minDelayMinutes: (metadata?.dmMinDelayMinutes as number) || 2,
      maxDelayMinutes: (metadata?.dmMaxDelayMinutes as number) || 8
    };
  } catch (error) {
    console.error('[DM_AUTO] Error checking automation settings:', error);
    return defaultSettings;
  }
}
