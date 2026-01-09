import { db } from '../../db.js';
import { followUpQueue, leads, messages, users, brandEmbeddings, integrations } from '../../../shared/schema.js';
import { eq, and, lte, asc } from 'drizzle-orm';
import { generateReply } from './openai.js';
import { InstagramOAuth } from '../oauth/instagram.js';
import { sendInstagramMessage } from '../channels/instagram.js';

import { sendEmail } from '../channels/email.js';
import { executeCommentFollowUps } from './comment-detection.js';
import { storage } from '../../storage.js';
import MultiChannelOrchestrator from '../multi-channel-orchestrator.js';
import DayAwareSequence from './day-aware-sequence.js';
import { getMessageScript, personalizeScript } from './message-scripts.js';
import { getBrandPersonalization, formatChannelMessage, getContextAwareSystemPrompt } from './brand-personalization.js';
import { multiProviderEmailFailover } from '../email/multi-provider-failover.js';
import { decrypt } from '../crypto/encryption.js';
import type {
  BrandContext,
  ChannelType,
  LeadStatus,
  MessageDirection,
  ProviderType
} from '../../../shared/types.js';

interface FollowUpJob {
  id: string;
  userId: string;
  leadId: string;
  channel: string;
  context: Record<string, unknown>;
  retryCount: number;
}

interface LocalLead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  channel: string;
  status: string;
  tags?: string[];
  preferred_name?: string;
  timezone?: string;
  metadata?: Record<string, unknown>;
  follow_up_count?: number;
  externalId?: string | null;
  lastMessageAt?: Date | null;
  warm?: boolean;
  createdAt?: Date;
  aiPaused?: boolean;
  updatedAt?: Date;
}

interface LocalMessage {
  body: string;
  direction: MessageDirection;
  createdAt: Date;
  role?: 'user' | 'assistant';
  created_at?: string;
}

interface DatabaseMessage {
  body: string;
  direction: string;
  createdAt: Date;
}

interface BrandSnippetData {
  snippet: string;
  metadata?: Record<string, unknown>;
}

interface UserBrandData {
  company: string | null;
  replyTone: string | null;
  metadata: Record<string, unknown>;
}

interface FollowUpSchedule {
  channel: ChannelType;
  sequenceNumber: number;
  scheduledFor: Date;
}

type Lead = LocalLead;
type Message = LocalMessage;

export class FollowUpWorker {
  private isRunning: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private instagramOAuth: InstagramOAuth;

  constructor() {
    this.instagramOAuth = new InstagramOAuth();
  }

  /**
   * Start the worker to process follow-up queue
   */
  start(): void {
    if (this.isRunning) {
      console.log('Follow-up worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting follow-up worker...');

    // Process queue every 30 seconds
    this.processingInterval = setInterval(async () => {
      await this.processQueue();
    }, 30000);

    // Process immediately on start
    this.processQueue();
  }

  /**
   * Stop the worker
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isRunning = false;
    console.log('Follow-up worker stopped');
  }

  /**
   * Process pending jobs in the queue
   */
  private async processQueue(): Promise<void> {
    try {
      // Execute comment automation follow-ups first
      await executeCommentFollowUps();

      if (!db) {
        return;
      }

      // Get pending jobs from Neon database
      const jobs = await db
        .select()
        .from(followUpQueue)
        .where(
          and(
            eq(followUpQueue.status, 'pending'),
            lte(followUpQueue.scheduledAt, new Date())
          )
        )
        .orderBy(asc(followUpQueue.scheduledAt))
        .limit(10);

      if (!jobs || jobs.length === 0) {
        return;
      }

      console.log(`Processing ${jobs.length} follow-up jobs...`);

      // Process jobs in parallel with proper typing
      await Promise.all(jobs.map((job: typeof jobs[0]) => {
        const ctx = job.context as Record<string, unknown>;
        const typedJob: FollowUpJob = {
          id: job.id,
          userId: job.userId,
          leadId: job.leadId,
          channel: job.channel,
          context: ctx,
          retryCount: typeof ctx?.retryCount === 'number' ? ctx.retryCount : 0
        };
        return this.processJob(typedJob);
      }));
    } catch (error) {
      console.error('Queue processing error:', error);
    }
  }

  /**
   * Process a single follow-up job
   */
  private async processJob(job: FollowUpJob): Promise<void> {
    try {
      if (!db) {
        throw new Error('Database not configured');
      }

      // Mark job as processing
      await db
        .update(followUpQueue)
        .set({ status: 'processing' })
        .where(eq(followUpQueue.id, job.id));

      // Get lead details
      const leadResults = await db
        .select()
        .from(leads)
        .where(eq(leads.id, job.leadId))
        .limit(1);

      const dbLead = leadResults[0];
      if (!dbLead) {
        throw new Error('Lead not found');
      }

      // Convert database lead to local type
      const lead: Lead = {
        id: dbLead.id,
        name: dbLead.name,
        email: dbLead.email,
        phone: dbLead.phone,
        channel: dbLead.channel,
        status: dbLead.status,
        tags: dbLead.tags as string[],
        metadata: dbLead.metadata as Record<string, unknown>,
        externalId: dbLead.externalId,
        lastMessageAt: dbLead.lastMessageAt,
        warm: dbLead.warm,
        createdAt: dbLead.createdAt,
        aiPaused: dbLead.aiPaused,
        updatedAt: dbLead.updatedAt
      };

      // CHECK: User has opted out of AI messages
      if (lead.aiPaused) {
        console.log(`⏸️  Skipping follow-up for lead ${lead.name} (AI paused by user)`);
        // Mark job as completed without sending
        await db
          .update(followUpQueue)
          .set({
            status: 'completed',
            processedAt: new Date()
          })
          .where(eq(followUpQueue.id, job.id));
        return;
      }

      // Get conversation history
      const conversationHistory = await this.getConversationHistory(job.leadId);

      // Get user's brand context
      const brandContext = await this.getBrandContext(job.userId);

      // Calculate campaign day (how many days since lead was created)
      const campaignDay = Math.floor(
        (Date.now() - (lead.createdAt?.getTime() || Date.now())) / (1000 * 60 * 60 * 24)
      );

      // Generate AI reply with day-aware context and brand personalization
      let aiReply = await this.generateFollowUp(lead, conversationHistory, brandContext, campaignDay, lead.createdAt || new Date(), job.userId);

      // Prepend disclaimer for legal compliance
      try {
        const { prependDisclaimerToMessage } = await import('./disclaimer-generator.js');
        const { messageWithDisclaimer } = prependDisclaimerToMessage(
          aiReply,
          job.channel as 'email' | 'sms' | 'voice',
          brandContext?.businessName || 'Audnix'
        );
        aiReply = messageWithDisclaimer;
      } catch (disclaimerError) {
        console.warn('Failed to add disclaimer:', disclaimerError);
        // Continue without disclaimer rather than failing the entire message
      }

      // Send the message
      const sent = await this.sendMessage(job.userId, lead, aiReply, job.channel);

      if (sent) {
        // Save message to database
        const savedMessage = await this.saveMessage(job.userId, job.leadId, aiReply, 'assistant');

        // UPDATE: Log to audit trail
        try {
          const { AuditTrailService } = await import('../audit-trail-service.js');
          await AuditTrailService.logAiMessageSent(
            job.userId,
            job.leadId,
            savedMessage?.id || '',
            job.channel,
            aiReply,
            ((lead.metadata as Record<string, unknown>)?.follow_up_count as number || 0) + 1
          );
        } catch (auditError) {
          console.error('Failed to log audit trail:', auditError);
        }

        // Update lead status and follow-up count
        await db
          .update(leads)
          .set({
            status: 'replied',
            metadata: {
              ...(lead.metadata || {}),
              follow_up_count: ((lead.metadata as Record<string, unknown>)?.follow_up_count as number || 0) + 1
            },
            lastMessageAt: new Date() // Update last message time
          })
          .where(eq(leads.id, job.leadId));

        // Mark job as completed
        await db
          .update(followUpQueue)
          .set({
            status: 'completed',
            processedAt: new Date()
          })
          .where(eq(followUpQueue.id, job.id));

        console.log(`Follow-up sent successfully for lead ${lead.name}`);

        // Schedule next follow-up if needed
        await this.scheduleNextFollowUp(job.userId, job.leadId, lead);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error processing job ${job.id}:`, error);

      // Update job with error
      if (db) {
        await db
          .update(followUpQueue)
          .set({
            status: job.retryCount >= 3 ? 'failed' : 'pending',
            errorMessage: errorMessage,
            scheduledAt: new Date(Date.now() + 5 * 60 * 1000)
          })
          .where(eq(followUpQueue.id, job.id));
      }
    }
  }

  /**
   * Generate AI follow-up message with day-aware context and brand personalization
   */
  private async generateFollowUp(
    lead: Lead,
    history: Message[],
    brandContext: BrandContext,
    campaignDay: number = 0,
    campaignDayCreated: Date = new Date(),
    userId?: string
  ): Promise<string> {
    // Get message script for this stage
    const script = getMessageScript(lead.channel as 'email' | 'instagram', campaignDay);

    // Get brand personalization
    let personalizationContext = null;
    if (userId) {
      personalizationContext = await getBrandPersonalization(userId);
    }

    // Use day-aware sequence for context-aware prompt
    const dayAwareContext = {
      campaignDay,
      previousMessages: history.map((msg: Message) => ({
        sentAt: msg.createdAt,
        body: msg.body,
      })),
      leadEngagement: this.assessLeadTemperature(lead, history),
      leadName: lead.preferred_name || lead.name.split(' ')[0],
      brandName: brandContext.businessName || 'Your Business',
      userSenderName: personalizationContext?.senderName || brandContext.senderName,
    };

    // Build system prompt with brand context
    let systemPrompt = DayAwareSequence.buildSystemPrompt(dayAwareContext);
    if (personalizationContext) {
      systemPrompt = getContextAwareSystemPrompt(personalizationContext, lead.channel);
    }

    const userPrompt = this.buildFollowUpPrompt(lead, history, brandContext, script ?? undefined);

    const result = await generateReply(systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 200,
      jsonMode: false
    });

    // Format with brand personalization
    let finalMessage = result.text;
    if (personalizationContext) {
      finalMessage = await formatChannelMessage(finalMessage, lead.channel as 'email' | 'instagram', userId || '', lead.channel === 'email');
    }

    return finalMessage;
  }

  /**
   * Build follow-up prompt with context and message script
   */
  private buildFollowUpPrompt(lead: Lead, history: Message[], brandContext: BrandContext, script?: { tone?: string; structure?: string }): string {
    const firstName = lead.preferred_name || lead.name.split(' ')[0];
    const channelContext = this.getChannelContext(lead.channel);

    // Include message script guidelines if available
    let scriptGuidance = '';
    if (script) {
      scriptGuidance = `
SCRIPT GUIDANCE (use as reference, not required):
- Tone: ${script.tone || 'professional'}
- Structure: ${script.structure || 'conversational'}`;
    }

    // Build conversation history string
    const historyStr = history
      .slice(-5) // Last 5 messages
      .map((msg: Message) => `${msg.direction === 'inbound' ? 'Lead' : 'You'}: ${msg.body}`)
      .join('\n');

    // Determine follow-up number
    const followUpNumber = ((lead.metadata as Record<string, unknown>)?.follow_up_count as number || 0) + 1;

    // Determine email subject for email channel
    let emailSubject = '';
    if (lead.channel === 'email') {
      emailSubject = `Regarding Your Inquiry with ${brandContext.businessName}`;
      // Basic subject line generation based on content (can be improved)
      if (historyStr.length > 0) {
        const firstLine = historyStr.split('\n')[0];
        if (firstLine.length < 50) {
          emailSubject = firstLine;
        } else {
          emailSubject = firstLine.substring(0, 50) + '...';
        }
      }
    }

    return `You are an AI assistant helping with lead follow-ups for ${brandContext.businessName || 'a business'}.

BRAND INFORMATION:
- Business Name: ${brandContext.businessName || 'Your Business'}
- Brand Colors: ${brandContext.brandColors || '#000000'} (Use these for email styling)
- Brand Voice: ${brandContext.voiceRules || '- Be friendly and professional\n- Keep messages concise\n- Focus on value'}

LEAD INFORMATION:
- Name: ${firstName}
- Channel: ${lead.channel}
- Status: ${lead.status}
- Follow-up #: ${followUpNumber}
- Tags: ${lead.tags?.join(', ') || 'none'}

CONVERSATION HISTORY:
${historyStr || 'This is the first message'}

${channelContext}${scriptGuidance}

RULES:
1. ALWAYS address the lead by their first name (${firstName})
2. For email, generate a subject line using brand info and conversation context. Example: "Subject: ${emailSubject}"
3. Keep message under 200 for Instagram. Emails can be longer but concise.
4. Be conversational and human-like.
5. If this is follow-up #1, introduce yourself briefly.
6. If this is follow-up #3+, consider being more direct or offering something specific.
7. Never mention you're an AI.
8. End with a soft call-to-action or question.
9. Match the tone to the channel (Instagram: casual, Email: professional).
10. For emails, use the provided brand colors for styling (e.g., button backgrounds, links).

Generate a natural follow-up message:`;
  }

  /**
   * Get channel-specific context
   */
  private getChannelContext(channel: string): string {
    switch (channel) {
      case 'instagram':
        return 'CHANNEL: Instagram DM - Be casual, use emojis sparingly, keep it brief';

      case 'email':
        return 'CHANNEL: Email - More formal, can be slightly longer, include subject line and professional branding';
      default:
        return '';
    }
  }

  /**
   * Get conversation history for a lead
   */
  private async getConversationHistory(leadId: string): Promise<Message[]> {
    if (!db) return [];

    const messageHistory = await db
      .select({
        body: messages.body,
        direction: messages.direction,
        createdAt: messages.createdAt
      })
      .from(messages)
      .where(eq(messages.leadId, leadId))
      .orderBy(asc(messages.createdAt))
      .limit(10);

    return messageHistory.map((msg: DatabaseMessage): Message => ({
      body: msg.body,
      direction: msg.direction as MessageDirection,
      createdAt: msg.createdAt,
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      created_at: msg.createdAt.toISOString()
    }));
  }

  /**
   * Get brand context for a user
   */
  private async getBrandContext(userId: string): Promise<BrandContext> {
    if (!db) {
      return {
        businessName: 'Your Business',
        voiceRules: 'Be friendly and professional',
        brandColors: '#007bff',
        brandSnippets: []
      };
    }

    // Get brand embeddings for brand knowledge
    const brandData = await db
      .select({ snippet: brandEmbeddings.snippet, metadata: brandEmbeddings.metadata })
      .from(brandEmbeddings)
      .where(eq(brandEmbeddings.userId, userId))
      .limit(5);

    // Get user settings
    const userResults = await db
      .select({
        company: users.company,
        replyTone: users.replyTone,
        metadata: users.metadata
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = userResults[0] as UserBrandData | undefined;

    // Extract brand colors from user metadata, or use default
    const userMetadata = user?.metadata as Record<string, unknown> | null;
    const brandColors = (userMetadata?.brandColors as string) || '#007bff';

    return {
      businessName: user?.company || 'Your Business',
      voiceRules: user?.replyTone ? `Be ${user.replyTone}` : 'Be professional',
      brandColors: brandColors,
      brandSnippets: brandData?.map((d: BrandSnippetData) => d.snippet) || []
    };
  }

  /**
   * Send message through appropriate channel
   */
  private async sendMessage(
    userId: string,
    lead: Lead,
    content: string,
    preferredChannel: string
  ): Promise<boolean> {
    const channels = this.getChannelPriority(preferredChannel, lead);

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'instagram':
            if (lead.externalId) {
              const tokenData = await this.instagramOAuth.getValidToken(userId);
              if (tokenData) {
                const instagramAccountId = await this.getInstagramAccountId(userId);
                if (instagramAccountId) {
                  await sendInstagramMessage(tokenData, instagramAccountId, lead.externalId, content);
                  return true;
                }
              }
            }
            break;



          case 'email':
            if (lead.email) {
              // Assume sendEmail can handle HTML and branding
              await sendEmail(userId, lead.email, content, 'Follow-up');
              return true;
            }
            break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to send via ${channel}:`, error);
        // WhatsApp specific error handling for 24-hour window

        // Re-throw other errors to mark the job as failed after retries
        throw error;
      }
    }

    return false;
  }

  /**
   * Get channel priority for sending
   */
  private getChannelPriority(preferred: string, lead: Lead): string[] {
    const channels = [preferred];

    // Add fallback channels
    if (preferred !== 'email' && lead.email) channels.push('email');
    if (preferred !== 'instagram' && lead.externalId) channels.push('instagram');

    return channels;
  }

  /**
   * Get Instagram business account ID for a user
   */
  private async getInstagramAccountId(userId: string): Promise<string | null> {
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

      const integration = userIntegrations[0];
      if (!integration || !integration.encryptedMeta) {
        return null;
      }

      const decrypted = decrypt(integration.encryptedMeta);
      const meta = JSON.parse(decrypted) as { instagramBusinessAccountId?: string; pageId?: string };
      return meta.instagramBusinessAccountId || meta.pageId || null;
    } catch (error) {
      console.error('Error fetching Instagram account ID:', error);
      return null;
    }
  }

  /**
   * Save message to database
   */
  private async saveMessage(
    userId: string,
    leadId: string,
    content: string,
    role: 'user' | 'assistant'
  ): Promise<{ id: string } | undefined> {
    if (!db) return undefined;

    const result = await db.insert(messages).values({
      userId,
      leadId,
      body: content,
      direction: role === 'user' ? 'inbound' : 'outbound',
      provider: 'system',
      metadata: {},
      createdAt: new Date()
    }).returning({ id: messages.id });

    return result[0];
  }

  /**
   * Schedule next follow-up with multi-channel orchestration and day-aware timing
   * 
   * Human-like timing:
   * - Email: Day 1 (24h), Day 2 (48h), Day 5, Day 7
   * - Instagram: Day 5, Day 8 (failover if email failed)
   */
  private async scheduleNextFollowUp(
    userId: string,
    leadId: string,
    lead: Lead
  ): Promise<void> {
    if (!db) return;

    // Don't schedule if already followed up 5+ times
    if (((lead.metadata as Record<string, unknown>)?.follow_up_count as number || 0) >= 5) {
      return;
    }

    // Don't schedule if lead is converted or not interested
    if (['converted', 'not_interested', 'uninterested'].includes(lead.status)) {
      return;
    }

    // Get conversation history to assess lead temperature
    const messageHistory = await this.getConversationHistory(leadId);
    const leadTemperature = this.assessLeadTemperature(lead, messageHistory);

    // Use multi-channel orchestrator to get next follow-ups with proper timing
    const campaignCreatedAt = lead.createdAt || new Date();
    const schedules = MultiChannelOrchestrator.calculateNextSchedule(leadId, campaignCreatedAt, lead.channel) as FollowUpSchedule[];

    // Schedule the next follow-up from the orchestrator
    if (schedules.length > 0) {
      const nextSchedule = schedules[0]; // Get the first pending schedule
      const followUpCount = ((lead.metadata as Record<string, unknown>)?.follow_up_count as number || 0) + 1;

      console.log(`📅 Scheduling ${leadTemperature} lead - Channel: ${nextSchedule.channel}, Sequence: ${nextSchedule.sequenceNumber}, Time: ${nextSchedule.scheduledFor.toISOString()}`);

      // Create follow-up job with multi-channel context
      await db.insert(followUpQueue).values({
        userId,
        leadId,
        channel: nextSchedule.channel,
        scheduledAt: nextSchedule.scheduledFor,
        context: {
          follow_up_number: followUpCount,
          previous_status: lead.status,
          temperature: leadTemperature,
          campaign_day: Math.floor(
            (Date.now() - campaignCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
          ),
          sequence_number: nextSchedule.sequenceNumber,
          multi_channel: true, // Flag for multi-channel processing
          scheduled_time: nextSchedule.scheduledFor.toISOString()
        }
      });
    }
  }


  /**
   * Assess lead temperature based on engagement patterns
   */
  private assessLeadTemperature(lead: Lead, messageHistory: Message[]): 'hot' | 'warm' | 'cold' {
    // Hot lead indicators
    const recentMessages = messageHistory.filter((m: Message) => {
      const hoursSince = (Date.now() - new Date(m.createdAt).getTime()) / (1000 * 60 * 60);
      return hoursSince < 24;
    });

    const inboundInLast24h = recentMessages.filter((m: Message) => m.direction === 'inbound').length;
    const metadata = lead.metadata as Record<string, unknown> | undefined;
    const behaviorPattern = metadata?.behavior_pattern as Record<string, unknown> | undefined;
    const engagementScore = (behaviorPattern?.engagementScore as number) || 0;

    // HOT: Recent activity + high engagement
    if (inboundInLast24h >= 2 || engagementScore > 70) {
      return 'hot';
    }

    // WARM: Some recent activity or medium engagement
    if (inboundInLast24h >= 1 || (engagementScore > 40 && lead.warm)) {
      return 'warm';
    }

    // COLD: Low activity or declining engagement
    return 'cold';
  }

  /**
   * Get follow-up delay based on follow-up count and lead temperature
   * HUMAN RHYTHM TIMING:
   * - Email Day 1: 24 hours (not 4 hours - avoids desperation vibes)
   * - Email Day 2: 48 hours  
   * - Email Day 3: Day 5 (120 hours)
   * - Email Day 4: Day 7 (168 hours)
   * 
   * Multi-channel spacing:
   * - Email → +48 hours WhatsApp → +72 hours IG DM
   */
  private getFollowUpDelay(followUpCount: number, temperature: 'hot' | 'warm' | 'cold'): number {
    // Hot leads - respond quickly but HUMAN (not desperate)
    if (temperature === 'hot') {
      const hotDelays: Record<number, number> = {
        0: 24 * 60 * 60 * 1000,    // 24 hours (Day 1 - initial follow-up)
        1: 48 * 60 * 60 * 1000,    // 48 hours (Day 2 - second follow-up)
        2: 120 * 60 * 60 * 1000,   // 5 days (Day 5 - re-engagement)
        3: 168 * 60 * 60 * 1000,   // 7 days (Day 7 - final touch)
        4: 336 * 60 * 60 * 1000    // 14 days (archive if no response)
      };
      return hotDelays[followUpCount] || 24 * 60 * 60 * 1000;
    }

    // Warm leads - moderate timing
    if (temperature === 'warm') {
      const warmDelays: Record<number, number> = {
        0: 2 * 60 * 60 * 1000,      // 2 hours
        1: 6 * 60 * 60 * 1000,      // 6 hours
        2: 24 * 60 * 60 * 1000,     // 1 day
        3: 2 * 24 * 60 * 60 * 1000, // 2 days
        4: 3 * 24 * 60 * 60 * 1000  // 3 days
      };
      return warmDelays[followUpCount] || 3 * 24 * 60 * 60 * 1000;
    }

    // Cold leads - slower, more spaced out
    const coldDelays: Record<number, number> = {
      0: 4 * 60 * 60 * 1000,      // 4 hours
      1: 24 * 60 * 60 * 1000,     // 1 day
      2: 3 * 24 * 60 * 60 * 1000, // 3 days
      3: 5 * 24 * 60 * 60 * 1000, // 5 days
      4: 7 * 24 * 60 * 60 * 1000  // 1 week
    };
    return coldDelays[followUpCount] || 7 * 24 * 60 * 60 * 1000;
  }

  /**
   * Get randomization window based on lead temperature
   */
  private getRandomizationWindow(temperature: 'hot' | 'warm' | 'cold'): number {
    // Hot leads: ±10% variance (stay responsive)
    if (temperature === 'hot') {
      return Math.random() * 0.2 - 0.1;
    }

    // Warm leads: ±20% variance (natural timing)
    if (temperature === 'warm') {
      return Math.random() * 0.4 - 0.2;
    }

    // Cold leads: ±30% variance (more unpredictable, human-like)
    return Math.random() * 0.6 - 0.3;
  }
}

// Create singleton instance
export const followUpWorker = new FollowUpWorker();

/**
 * Schedule initial follow-up for newly imported leads
 * This is called from CSV/PDF import to ensure all leads get systematic outreach
 */
export async function scheduleInitialFollowUp(
  userId: string,
  leadId: string,
  channel: 'email' | 'whatsapp' | 'instagram' | 'manual'
): Promise<boolean> {
  if (!db) {
    console.warn('Database not available for follow-up scheduling');
    return false;
  }

  try {
    // Map channel to proper follow-up channel
    const followUpChannel = channel === 'manual' ? 'email' : channel;

    // Schedule first follow-up in 2-4 hours (gives time for immediate manual review)
    const initialDelay = (2 + Math.random() * 2) * 60 * 60 * 1000; // 2-4 hours
    const scheduledTime = new Date(Date.now() + initialDelay);

    await db.insert(followUpQueue).values({
      userId,
      leadId,
      channel: followUpChannel,
      scheduledAt: scheduledTime,
      context: {
        follow_up_number: 1,
        source: 'import',
        temperature: 'warm', // Default to warm for imported leads
        campaign_day: 0,
        sequence_number: 1,
        initial_outreach: true
      }
    });

    console.log(`📅 Scheduled initial follow-up for imported lead ${leadId} at ${scheduledTime.toISOString()}`);
    return true;
  } catch (error) {
    console.error('Error scheduling initial follow-up:', error);
    return false;
  }
}
