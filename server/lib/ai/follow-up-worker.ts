/* @ts-nocheck */
import { supabaseAdmin } from '../supabase-admin';
import { db } from '../../db';
import { followUpQueue, leads, messages, users, brandEmbeddings } from '@shared/schema';
import { eq, and, lte, asc } from 'drizzle-orm';
import { generateReply } from './openai';
import { InstagramOAuth } from '../oauth/instagram';
import { sendInstagramMessage } from '../channels/instagram';
import { sendWhatsAppMessage } from '../channels/whatsapp';
import { sendEmail } from '../channels/email';
import { executeCommentFollowUps } from './comment-detection';
import { storage } from '../../storage';
import MultiChannelOrchestrator from '../multi-channel-orchestrator';
import DayAwareSequence from './day-aware-sequence';
import { getMessageScript, personalizeScript } from './message-scripts';
import { getBrandPersonalization, formatChannelMessage, getContextAwareSystemPrompt } from './brand-personalization';
import { multiProviderEmailFailover } from '../email/multi-provider-failover';

interface FollowUpJob {
  id: string;
  userId: string;
  leadId: string;
  channel: string;
  context: any;
  retryCount: number;
}

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  channel: string;
  status: string;
  tags?: string[];
  preferred_name?: string;
  timezone?: string;
  metadata?: Record<string, any>;
  follow_up_count?: number;
  externalId?: string;
  lastMessageAt?: Date | null; // Added for best reply hour calculation
}

interface Message {
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

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
  start() {
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
  stop() {
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
  private async processQueue() {
    try {
      // Execute comment automation re-connects first
      await executeCommentFollowUps();

      if (!db) {
        console.warn('Database not configured - skipping queue processing');
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

  // @ts-ignore - job parameter type mismatch
      // Process jobs in parallel
      await Promise.all(jobs.map(job => this.processJob(job as any)));
    } catch (error) {
      console.error('Queue processing error:', error);
    }
  }

  /**
   * Process a single follow-up job
   */
  private async processJob(job: FollowUpJob) {
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
      const [lead] = await db
        .select()
        .from(leads)
        .where(eq(leads.id, job.leadId))
        .limit(1);

      if (!lead) {
        throw new Error('Lead not found');
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
      const aiReply = await this.generateFollowUp(lead, conversationHistory, brandContext, campaignDay, lead.createdAt || new Date(), job.userId);

      // Send the message
      const sent = await this.sendMessage(job.userId, lead, aiReply, job.channel);

      if (sent) {
        // Save message to database
        await this.saveMessage(job.userId, job.leadId, aiReply, 'assistant');

        // Update lead status and follow-up count
        await db
          .update(leads)
          .set({
            status: 'replied',
            metadata: {
              ...lead.metadata,
              follow_up_count: ((lead.metadata as any)?.follow_up_count || 0) + 1
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
      console.error(`Error processing job ${job.id}:`, error);

      // Update job with error
      if (db) {
        await db
          .update(followUpQueue)
          .set({
            status: job.retryCount >= 3 ? 'failed' : 'pending',
            errorMessage: (error as Error).message,
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
    brandContext: any,
    campaignDay: number = 0,
    campaignDayCreated: Date = new Date(),
    userId?: string
  ): Promise<string> {
    // Get message script for this stage
    const script = getMessageScript(lead.channel as 'email' | 'whatsapp' | 'instagram', campaignDay);
    
    // Get brand personalization
    let personalizationContext = null;
    if (userId) {
      personalizationContext = await getBrandPersonalization(userId);
    }

    // Use day-aware sequence for context-aware prompt
    const dayAwareContext = {
      campaignDay,
      previousMessages: history.map(msg => ({
        sentAt: new Date(msg.created_at),
        body: msg.content,
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

    const userPrompt = this.buildFollowUpPrompt(lead, history, brandContext, script);

    const result = await generateReply(systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 200,
      jsonMode: false
    });

    // Format with brand personalization
    let finalMessage = result.text;
    if (personalizationContext) {
      finalMessage = await formatChannelMessage(finalMessage, lead.channel as 'email' | 'whatsapp' | 'instagram', userId || '', lead.channel === 'email');
    }

    return finalMessage;
  }

  /**
   * Build follow-up prompt with context and message script
   */
  private buildFollowUpPrompt(lead: Lead, history: Message[], brandContext: any, script?: any): string {
    const firstName = lead.preferred_name || lead.name.split(' ')[0];
    const channelContext = this.getChannelContext(lead.channel);
    
    // Include message script guidelines if available
    let scriptGuidance = '';
    if (script) {
      scriptGuidance = `
SCRIPT GUIDANCE (use as reference, not required):
- Tone: ${script.tone}
- Structure: ${script.structure}`;
    }

    // Build conversation history string
    const historyStr = history
      .slice(-5) // Last 5 messages
      .map(msg => `${msg.role === 'user' ? 'Lead' : 'You'}: ${msg.content}`)
      .join('\n');

    // Determine follow-up number
    const followUpNumber = ((lead.metadata as any)?.follow_up_count || 0) + 1;

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

    return `You are an AI assistant helping with lead re-connects for ${brandContext.businessName || 'a business'}.

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
3. Keep message under 150 characters for SMS/WhatsApp, under 200 for Instagram. Emails can be longer but concise.
4. Be conversational and human-like.
5. If this is follow-up #1, introduce yourself briefly.
6. If this is follow-up #3+, consider being more direct or offering something specific.
7. Never mention you're an AI.
8. End with a soft call-to-action or question.
9. Match the tone to the channel (Instagram: casual, WhatsApp: friendly professional, Email: professional).
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
      case 'whatsapp':
        return 'CHANNEL: WhatsApp - Be friendly but professional, okay to use 1-2 emojis';
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
        content: messages.body,
        role: messages.direction,
        created_at: messages.createdAt
      })
      .from(messages)
      .where(eq(messages.leadId, leadId))
      .orderBy(asc(messages.createdAt))
  // @ts-ignore - msg parameter type mismatch
      .limit(10);

    return messageHistory.map(msg => ({
      content: msg.content,
      role: msg.role === 'inbound' ? 'user' : 'assistant',
      created_at: msg.created_at.toISOString()
    })) as Message[];
  }

  /**
   * Get brand context for a user
   */
  private async getBrandContext(userId: string): Promise<any> {
    if (!db) {
      return {
        businessName: 'Your Business',
        voiceRules: 'Be friendly and professional',
        brandColors: '#007bff', // Default fallback color
        brandSnippets: []
      };
    }

    // Get brand embeddings (assuming this table has color information)
    const brandData = await db
      .select({ snippet: brandEmbeddings.snippet, color: brandEmbeddings.color })
      .from(brandEmbeddings)
      .where(eq(brandEmbeddings.userId, userId))
      .limit(5);

    // Get user settings
    const [user] = await db
      .select({
        company: users.company,
        replyTone: users.replyTone
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Extract brand colors, prioritize specific colors if available, else use a default
    const brandColors = brandData && brandData.length > 0 && brandData[0].color
      ? brandData[0].color
      : '#007bff'; // Default brand color

    return {
  // @ts-ignore - d parameter type mismatch
      businessName: user?.company || 'Your Business',
      voiceRules: user?.replyTone ? `Be ${user.replyTone}` : 'Be professional',
      brandColors: brandColors,
      brandSnippets: brandData?.map(d => d.snippet) || []
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
              const token = await this.instagramOAuth.getValidToken(userId);
              if (token) {
                await sendInstagramMessage(token, lead.externalId, content);
                return true;
              }
            }
            break;

          case 'whatsapp':
            if (lead.phone) {
              try {
                // Try to send message - the channel handler will check permissions
                await sendWhatsAppMessage(userId, lead.phone, content);
                console.log(`✅ WhatsApp message sent to ${lead.name} (${lead.phone})`);
                return true;
              } catch (error: any) {
                // Handle specific messaging window errors
                if (error.message.includes('24 hours') || error.message.includes('not messaged you')) {
                  console.warn(`⚠️ WhatsApp follow-up blocked for ${lead.name}: ${error.message}`);
                  
                  // Update lead metadata
                  await db
                    .update(leads)
                    .set({
                      metadata: {
                        ...(lead.metadata || {}),
                        last_follow_up_failed: new Date().toISOString(),
                        follow_up_failure_reason: 'messaging_window_restriction',
                        needs_manual_outreach: true
                      } as any
                    })
                    .where(eq(leads.id, lead.id));
                  
                  // Try next channel instead of failing
                  continue;
                }
                
                // Re-throw other errors
                throw error;
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
      } catch (error: any) {
        console.error(`Failed to send via ${channel}:`, error);
        // WhatsApp specific error handling for 24-hour window
        if (channel === 'whatsapp' && error.message && error.message.includes('24 hours')) {
          console.warn(`⚠️ WhatsApp API error for ${lead.name} (${lead.phone}): ${error.message}`);
          // Update lead metadata to indicate the need for a template message
          await db
            .update(leads)
            .set({
              metadata: {
                ...(lead.metadata || {}),
                last_follow_up_failed: new Date().toISOString(),
                follow_up_failure_reason: '24_hour_window_expired',
                needs_template_message: true
              } as any
            })
            .where(eq(leads.id, lead.id));
          // Continue to the next channel if available, or this job will eventually fail
          continue;
        }
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
    if (preferred !== 'whatsapp' && lead.phone) channels.push('whatsapp');
    if (preferred !== 'email' && lead.email) channels.push('email');
    if (preferred !== 'instagram' && lead.externalId) channels.push('instagram');

    return channels;
  }

  /**
   * Save message to database
   */
  private async saveMessage(
    userId: string,
    leadId: string,
    content: string,
    role: 'user' | 'assistant'
  ) {
    if (!db) return;

    await db.insert(messages).values({
      userId,
      leadId,
      body: content,
      direction: role === 'user' ? 'inbound' : 'outbound',
      provider: 'automated', // Generic provider for AI messages
      metadata: {},
      createdAt: new Date()
    });
  }

  /**
   * Schedule next follow-up with multi-channel orchestration and day-aware timing
   * 
   * Human-like timing:
   * - Email: Day 1 (24h), Day 2 (48h), Day 5, Day 7
   * - WhatsApp: Day 3, Day 6 (only if email opened or ignored)
   * - Instagram: Day 5, Day 8 (failover if email + WhatsApp failed)
   */
  private async scheduleNextFollowUp(
    userId: string,
    leadId: string,
    lead: Lead
  ): Promise<void> {
    if (!db) return;

    // Don't schedule if already followed up 5+ times
    if (((lead.metadata as any)?.follow_up_count || 0) >= 5) {
      return;
    }

    // Don't schedule if lead is converted or not interested
    if (['converted', 'not_interested', 'uninterested'].includes(lead.status)) {
      return;
    }

    // Get conversation history to assess lead temperature
    const messages = await this.getConversationHistory(leadId);
    const leadTemperature = this.assessLeadTemperature(lead, messages);

    // Use multi-channel orchestrator to get next re-connects with proper timing
    const campaignCreatedAt = lead.createdAt || new Date();
    const schedules = MultiChannelOrchestrator.calculateNextSchedule(leadId, campaignCreatedAt, lead.channel);

    // Schedule the next follow-up from the orchestrator
    if (schedules.length > 0) {
      const nextSchedule = schedules[0]; // Get the first pending schedule
      const followUpCount = ((lead.metadata as any)?.follow_up_count || 0) + 1;

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
  private assessLeadTemperature(lead: Lead, messages: Message[]): 'hot' | 'warm' | 'cold' {
    // Hot lead indicators
    const recentMessages = messages.filter(m => {
      const hoursSince = (Date.now() - new Date(m.created_at).getTime()) / (1000 * 60 * 60);
      return hoursSince < 24;
    });

    const inboundInLast24h = recentMessages.filter(m => m.role === 'user').length;
    const hasEngagementScore = (lead.metadata as any)?.behavior_pattern?.engagementScore;
    const engagementScore = hasEngagementScore || 0;

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
      const hotDelays = {
        0: 24 * 60 * 60 * 1000,    // 24 hours (Day 1 - initial follow-up)
        1: 48 * 60 * 60 * 1000,    // 48 hours (Day 2 - second follow-up)
        2: 120 * 60 * 60 * 1000,   // 5 days (Day 5 - re-engagement)
        3: 168 * 60 * 60 * 1000,   // 7 days (Day 7 - final touch)
        4: 336 * 60 * 60 * 1000    // 14 days (archive if no response)
      };
      return hotDelays[followUpCount as keyof typeof hotDelays] || 24 * 60 * 60 * 1000;
    }

    // Warm leads - moderate timing
    if (temperature === 'warm') {
      const warmDelays = {
        0: 2 * 60 * 60 * 1000,      // 2 hours
        1: 6 * 60 * 60 * 1000,      // 6 hours
        2: 24 * 60 * 60 * 1000,     // 1 day
        3: 2 * 24 * 60 * 60 * 1000, // 2 days
        4: 3 * 24 * 60 * 60 * 1000  // 3 days
      };
      return warmDelays[followUpCount as keyof typeof warmDelays] || 3 * 24 * 60 * 60 * 1000;
    }

    // Cold leads - slower, more spaced out
    const coldDelays = {
      0: 4 * 60 * 60 * 1000,      // 4 hours
      1: 24 * 60 * 60 * 1000,     // 1 day
      2: 3 * 24 * 60 * 60 * 1000, // 3 days
      3: 5 * 24 * 60 * 60 * 1000, // 5 days
      4: 7 * 24 * 60 * 60 * 1000  // 1 week
    };
    return coldDelays[followUpCount as keyof typeof coldDelays] || 7 * 24 * 60 * 60 * 1000;
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