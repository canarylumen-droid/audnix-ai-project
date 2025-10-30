import { supabaseAdmin } from '../supabase-admin';
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
  follow_up_count: number;
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
      
      if (!supabaseAdmin) {
        console.warn('Supabase admin not configured - skipping queue processing');
        return;
      }

      // Get pending jobs that are scheduled for now or earlier
      const { data: jobs, error } = await supabaseAdmin
        .from('follow_up_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching queue jobs:', error);
        return;
      }

      if (!jobs || jobs.length === 0) {
        return;
      }

      console.log(`Processing ${jobs.length} follow-up jobs...`);

      // Process jobs in parallel
      await Promise.all(jobs.map(job => this.processJob(job)));
    } catch (error) {
      console.error('Queue processing error:', error);
    }
  }

  /**
   * Process a single follow-up job
   */
  private async processJob(job: FollowUpJob) {
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin not configured');
      }

      // Mark job as processing
      await supabaseAdmin
        .from('follow_up_queue')
        .update({ status: 'processing' })
        .eq('id', job.id);

      // Get lead details
      const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', job.leadId)
        .single();

      if (leadError || !lead) {
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
        await supabaseAdmin
          .from('leads')
          .update({
            status: 'replied',
            follow_up_count: lead.follow_up_count + 1,
            last_message_at: new Date().toISOString()
          })
          .eq('id', job.leadId);

        // Mark job as completed
        await supabaseAdmin
          .from('follow_up_queue')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        console.log(`Follow-up sent successfully for lead ${lead.name}`);

        // Schedule next follow-up if needed
        await this.scheduleNextFollowUp(job.userId, job.leadId, lead);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);

      // Update job with error
      await supabaseAdmin
        .from('follow_up_queue')
        .update({
          status: job.retryCount >= 3 ? 'failed' : 'pending',
          retry_count: job.retryCount + 1,
          error_message: (error as Error).message,
          scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Retry in 5 minutes
        })
        .eq('id', job.id);
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
- Follow-up #: ${lead.follow_up_count + 1}
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
    if (!supabaseAdmin) return [];

    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select('content, role, created_at')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(10);

    return messages || [];
  }

  /**
   * Get brand context for a user
   */
  private async getBrandContext(userId: string): Promise<any> {
    if (!supabaseAdmin) {
      return {
        businessName: 'Your Business',
        voiceRules: 'Be friendly and professional',
        brandSnippets: []
      };
    }

    // Get brand embeddings and settings
    const { data: brandData } = await supabaseAdmin
      .from('brand_embeddings')
      .select('content, metadata')
      .eq('user_id', userId)
      .limit(5);

    // Get user settings - using company and replyTone from schema
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('company, reply_tone')
      .eq('id', userId)
      .single();

    return {
      businessName: user?.company || 'Your Business',
      voiceRules: user?.reply_tone ? `Be ${user.reply_tone}` : 'Be professional',
      brandSnippets: brandData?.map(d => d.content) || []
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
    if (!supabaseAdmin) return;
    
    await supabaseAdmin
      .from('messages')
      .insert({
        user_id: userId,
        lead_id: leadId,
        content,
        role,
        channel: 'ai',
        created_at: new Date().toISOString()
      });
  }

  /**
   * Schedule next follow-up with human-like timing
   */
  private async scheduleNextFollowUp(userId: string, leadId: string, lead: Lead) {
    if (!supabaseAdmin) return;

    // Don't schedule if already followed up 5+ times
    if (lead.follow_up_count >= 5) {
      return;
    }

    // Don't schedule if lead is converted or not interested
    if (['converted', 'not_interested', 'uninterested'].includes(lead.status)) {
      return;
    }

    // Calculate next follow-up time with randomization
    const baseDelay = this.getFollowUpDelay(lead.follow_up_count);
    const jitter = Math.random() * 0.3 - 0.15; // ±15% randomization
    const delayMs = baseDelay * (1 + jitter);
    
    const scheduledAt = new Date(Date.now() + delayMs);

    // Create next job
    await supabaseAdmin
      .from('follow_up_queue')
      .insert({
        user_id: userId,
        lead_id: leadId,
        channel: lead.channel,
        scheduled_at: scheduledAt.toISOString(),
        context: {
          follow_up_number: lead.follow_up_count + 1,
          previous_status: lead.status
        }
      });
  }

  /**
   * Get follow-up delay based on follow-up count
   */
  private getFollowUpDelay(followUpCount: number): number {
    const delays = {
      0: 2 * 60 * 60 * 1000,      // 2 hours
      1: 24 * 60 * 60 * 1000,     // 1 day
      2: 2 * 24 * 60 * 60 * 1000, // 2 days
      3: 3 * 24 * 60 * 60 * 1000, // 3 days
      4: 7 * 24 * 60 * 60 * 1000  // 1 week
    };

    return delays[followUpCount as keyof typeof delays] || 7 * 24 * 60 * 60 * 1000;
  }
}

// Create singleton instance
export const followUpWorker = new FollowUpWorker();