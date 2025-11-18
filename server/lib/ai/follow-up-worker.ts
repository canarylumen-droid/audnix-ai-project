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
      // Execute comment automation follow-ups first
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

      // Generate AI reply
      const aiReply = await this.generateFollowUp(lead, conversationHistory, brandContext);

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
            lastMessageAt: new Date()
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
   * Generate AI follow-up message
   */
  private async generateFollowUp(
    lead: Lead, 
    history: Message[], 
    brandContext: any
  ): Promise<string> {
    const systemPrompt = "You are an AI assistant helping with lead follow-ups. Generate natural, human-like messages based on the context provided.";
    const userPrompt = this.buildFollowUpPrompt(lead, history, brandContext);

    const result = await generateReply(systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 200,
      jsonMode: false
    });

    return result.text;
  }

  /**
   * Build follow-up prompt with context
   */
  private buildFollowUpPrompt(lead: Lead, history: Message[], brandContext: any): string {
    const firstName = lead.preferred_name || lead.name.split(' ')[0];
    const channelContext = this.getChannelContext(lead.channel);

    // Build conversation history string
    const historyStr = history
      .slice(-5) // Last 5 messages
      .map(msg => `${msg.role === 'user' ? 'Lead' : 'You'}: ${msg.content}`)
      .join('\n');

    return `You are an AI assistant helping with lead follow-ups for ${brandContext.businessName || 'a business'}.

BRAND VOICE:
${brandContext.voiceRules || '- Be friendly and professional\n- Keep messages concise\n- Focus on value'}

LEAD INFORMATION:
- Name: ${firstName}
- Channel: ${lead.channel}
- Status: ${lead.status}
- Follow-up #: ${(lead.metadata as any)?.follow_up_count + 1 || 1}
- Tags: ${lead.tags?.join(', ') || 'none'}

CONVERSATION HISTORY:
${historyStr || 'This is the first message'}

${channelContext}

RULES:
1. ALWAYS address the lead by their first name (${firstName})
2. Keep message under 150 characters for SMS/WhatsApp, under 200 for Instagram
3. Be conversational and human-like
4. If this is follow-up #1, introduce yourself briefly
5. If this is follow-up #3+, consider being more direct or offering something specific
6. Never mention you're an AI
7. End with a soft call-to-action or question
8. Match the tone to the channel (Instagram: casual, Email: professional)

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
        return 'CHANNEL: Email - More formal, can be slightly longer, include subject line';
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
        brandSnippets: []
      };
    }

    // Get brand embeddings
    const brandData = await db
      .select()
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

    return {
      businessName: user?.company || 'Your Business',
      voiceRules: user?.replyTone ? `Be ${user.replyTone}` : 'Be professional',
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
              await sendWhatsAppMessage(userId, lead.phone, content);
              return true;
            }
            break;

          case 'email':
            if (lead.email) {
              await sendEmail(userId, lead.email, content, 'Follow-up');
              return true;
            }
            break;
        }
      } catch (error) {
        console.error(`Failed to send via ${channel}:`, error);
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
      provider: 'instagram',
      metadata: {},
      createdAt: new Date()
    });
  }

  /**
   * Schedule next follow-up with human-like timing based on lead temperature
   */
  private async scheduleNextFollowUp(userId: string, leadId: string, lead: Lead) {
    if (!db) return;

    // Don't schedule if already followed up 5+ times
    if (((lead.metadata as any)?.follow_up_count || 0) >= 5) {
      return;
    }

    // Don't schedule if lead is converted or not interested
    if (['converted', 'not_interest ed', 'uninterested'].includes(lead.status)) {
      return;
    }

    // Get conversation history to assess lead temperature
    const messages = await this.getConversationHistory(leadId);
    const leadTemperature = this.assessLeadTemperature(lead, messages);

    // Calculate next follow-up time with intelligent randomization
    const baseDelay = this.getFollowUpDelay(lead.followUpCount || 0, leadTemperature);
    const jitter = this.getRandomizationWindow(leadTemperature);
    const delayMs = baseDelay * (1 + jitter);

    const scheduledAt = new Date(Date.now() + delayMs);

    console.log(`📅 Scheduling ${leadTemperature} lead follow-up in ${Math.round(delayMs / 60000)} minutes`);

    // Create next job
    await db.insert(followUpQueue).values({
      userId,
      leadId,
      channel: lead.channel,
      scheduledAt,
      context: {
        follow_up_number: ((lead.metadata as any)?.follow_up_count || 0) + 1,
        previous_status: lead.status,
        temperature: leadTemperature,
        scheduled_time: scheduledAt.toISOString()
      }
    });
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
   */
  private getFollowUpDelay(followUpCount: number, temperature: 'hot' | 'warm' | 'cold'): number {
    // Hot leads - respond quickly
    if (temperature === 'hot') {
      const hotDelays = {
        0: 30 * 60 * 1000,         // 30 minutes
        1: 2 * 60 * 60 * 1000,     // 2 hours
        2: 4 * 60 * 60 * 1000,     // 4 hours
        3: 12 * 60 * 60 * 1000,    // 12 hours
        4: 24 * 60 * 60 * 1000     // 1 day
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