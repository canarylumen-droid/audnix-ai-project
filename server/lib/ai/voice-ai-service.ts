import { ElevenLabsProvider } from '../providers/elevenlabs';
import { InstagramProvider } from '../providers/instagram';
import { WhatsAppProvider } from '../providers/whatsapp';
import { storage } from '../../storage';
import { generateVoiceScript, assessLeadWarmth, detectConversationStatus } from './conversation-ai';
import { uploadToSupabase } from '../file-upload';
import { decrypt } from '../crypto/encryption';
import type { Lead, Message, User } from '@shared/schema';

/**
 * Voice AI Service
 * Intelligently generates and sends AI voice notes to warm leads
 * on Instagram and WhatsApp, respecting plan limits
 */
export class VoiceAIService {
  private elevenlabs: ElevenLabsProvider;

  constructor() {
    this.elevenlabs = new ElevenLabsProvider();
  }

  /**
   * Check if user has enough voice minutes remaining
   */
  private async checkVoiceLimit(userId: string, estimatedSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return { allowed: false, remaining: 0 };
    }

    // Get plan limits
    const planLimits = {
      trial: 0, // No voice for trial
      starter: 100, // 100 seconds (as per pricing: 100 voice minutes = 6000 seconds, but we're using 100 as in stripe.ts)
      pro: 400, // 400 seconds
      enterprise: 1500 // 1500 seconds
    };

    const limit = planLimits[user.plan as keyof typeof planLimits] || 0;
    const used = user.voiceSecondsUsed || 0;
    const remaining = Math.max(0, limit - used);

    return {
      allowed: remaining >= estimatedSeconds,
      remaining
    };
  }

  /**
   * Update voice usage for user
   */
  private async trackVoiceUsage(userId: string, secondsUsed: number): Promise<void> {
    const user = await storage.getUserById(userId);
    if (!user) return;

    const currentUsage = user.voiceSecondsUsed || 0;
    await storage.updateUser(userId, {
      voiceSecondsUsed: currentUsage + secondsUsed
    });

    console.log(`📊 Voice usage tracked: ${secondsUsed}s for user ${userId} (total: ${currentUsage + secondsUsed}s)`);
  }

  /**
   * Determine if lead should receive a voice note
   * Based on warmth, engagement, and channel
   */
  async shouldSendVoiceNote(
    lead: Lead,
    messages: Message[]
  ): Promise<{ shouldSend: boolean; reason: string }> {
    // Only Instagram and WhatsApp support voice
    if (lead.channel !== 'instagram' && lead.channel !== 'whatsapp') {
      return { shouldSend: false, reason: 'Channel does not support voice messages' };
    }

    // Check if lead is warm
    const isWarm = assessLeadWarmth(messages, lead);
    if (!isWarm) {
      return { shouldSend: false, reason: 'Lead is not warm enough' };
    }

    // Check conversation status
    const status = detectConversationStatus(messages);
    if (!status.shouldUseVoice) {
      return { shouldSend: false, reason: 'Conversation does not indicate voice would help' };
    }

    // Check if already converted or not interested
    if (status.status === 'converted' || status.status === 'not_interested') {
      return { shouldSend: false, reason: `Lead status is ${status.status}` };
    }

    return { shouldSend: true, reason: 'Lead is warm and engaged, voice will increase conversion' };
  }

  /**
   * Generate and send AI voice note
   */
  async generateAndSendVoiceNote(
    userId: string,
    leadId: string
  ): Promise<{ success: boolean; error?: string; audioUrl?: string; secondsUsed?: number }> {
    try {
      // Get lead and messages
      const lead = await storage.getLeadById(leadId);
      if (!lead) {
        return { success: false, error: 'Lead not found' };
      }

      const messages = await storage.getMessages(leadId);

      // Check if should send voice
      const decision = await this.shouldSendVoiceNote(lead, messages);
      if (!decision.shouldSend) {
        return { success: false, error: decision.reason };
      }

      // Generate voice script (10-20 seconds)
      const script = await this.generateVoiceScript(lead, messages);
      
      // Estimate duration from word count (average 2.5 words per second for natural speech)
      const wordCount = script.split(/\s+/).length;
      const estimatedDuration = Math.ceil(wordCount / 2.5);

      // Check voice limit with estimated duration
      const limitCheck = await this.checkVoiceLimit(userId, estimatedDuration);
      if (!limitCheck.allowed) {
        return { 
          success: false, 
          error: `Voice limit exceeded. Remaining: ${limitCheck.remaining} seconds. Upgrade plan for more.` 
        };
      }

      // Get user's cloned voice ID or use default
      const user = await storage.getUserById(userId);
      const voiceId = user?.voiceCloneId || undefined;

      // Generate voice with ElevenLabs
      const voiceData = await this.elevenlabs.textToSpeech(script, { voiceId });

      // Verify actual duration doesn't exceed remaining limit
      const finalLimitCheck = await this.checkVoiceLimit(userId, voiceData.duration);
      if (!finalLimitCheck.allowed) {
        return { 
          success: false, 
          error: `Voice generation exceeded limit. Generated ${voiceData.duration}s but only ${finalLimitCheck.remaining}s remaining.` 
        };
      }

      // Upload audio to storage
      const fileName = `voice_${leadId}_${Date.now()}.mp3`;
      const audioUrl = await uploadToSupabase(voiceData.audioBuffer, fileName, 'audio/mpeg');

      // Send voice message based on channel
      let messageId: string;
      if (lead.channel === 'instagram') {
        const integrations = await storage.getIntegrations(userId);
        const igIntegration = integrations.find(i => i.provider === 'instagram' && i.connected);
        
        if (!igIntegration) {
          return { success: false, error: 'Instagram not connected' };
        }

        // Decrypt credentials from integration
        const decryptedMetaJson = decrypt(igIntegration.encryptedMeta);
        const decryptedMeta = JSON.parse(decryptedMetaJson);
        const accessToken = decryptedMeta.tokens?.access_token || decryptedMeta.accessToken;
        const pageId = decryptedMeta.tokens?.page_id || decryptedMeta.pageId;

        if (!accessToken || !pageId) {
          return { success: false, error: 'Instagram credentials incomplete' };
        }

        const instagram = new InstagramProvider({
          access_token: accessToken,
          page_id: pageId
        });
        
        const result = await instagram.sendAudioMessage(lead.externalId || '', audioUrl);
        messageId = result.messageId;
      } else {
        // WhatsApp
        const integrations = await storage.getIntegrations(userId);
        const waIntegration = integrations.find(i => i.provider === 'whatsapp' && i.connected);
        
        if (!waIntegration) {
          return { success: false, error: 'WhatsApp not connected' };
        }

        // Decrypt credentials from integration
        const decryptedMetaJson = decrypt(waIntegration.encryptedMeta);
        const decryptedMeta = JSON.parse(decryptedMetaJson);
        const accessToken = decryptedMeta.tokens?.access_token || decryptedMeta.accessToken;
        const phoneNumberId = decryptedMeta.tokens?.phone_number_id || decryptedMeta.phoneNumberId;

        if (!accessToken || !phoneNumberId) {
          return { success: false, error: 'WhatsApp credentials incomplete' };
        }

        const whatsapp = new WhatsAppProvider({
          access_token: accessToken,
          phone_number_id: phoneNumberId
        });
        
        const result = await whatsapp.sendAudioMessage(lead.phone || '', audioUrl);
        messageId = result.messageId;
      }

      // Save message to database
      await storage.createMessage({
        leadId: lead.id,
        userId,
        provider: lead.channel as any,
        direction: 'outbound',
        body: `[Voice Note] ${script}`,
        audioUrl,
        metadata: { 
          isAiGenerated: true, 
          voiceNote: true,
          duration: voiceData.duration,
          messageId 
        }
      });

      // Track usage
      await this.trackVoiceUsage(userId, voiceData.duration);

      // Update lead's last message time
      await storage.updateLead(leadId, {
        lastMessageAt: new Date()
      });

      console.log(`🎙️ Voice note sent to ${lead.name} on ${lead.channel} (${voiceData.duration}s)`);

      return { 
        success: true, 
        audioUrl, 
        secondsUsed: voiceData.duration 
      };

    } catch (error: any) {
      console.error('Voice AI Service error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to generate and send voice note' 
      };
    }
  }

  /**
   * Generate voice script (10-20 seconds as requested)
   */
  private async generateVoiceScript(lead: Lead, messages: Message[]): Promise<string> {
    // Use existing function but ensure it's optimized for 10-20 seconds
    return await generateVoiceScript(lead, messages);
  }

  /**
   * Clone user's voice from uploaded samples
   */
  async cloneUserVoice(
    userId: string, 
    audioBuffers: Buffer[]
  ): Promise<{ success: boolean; voiceId?: string; error?: string }> {
    try {
      const user = await storage.getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Clone voice with ElevenLabs
      const result = await this.elevenlabs.cloneVoice(
        `${user.name || user.email}'s Voice`, 
        audioBuffers
      );

      // Save voice ID to user profile
      await storage.updateUser(userId, {
        voiceCloneId: result.voiceId
      });

      console.log(`🎤 Voice cloned successfully for user ${userId}: ${result.voiceId}`);

      return { success: true, voiceId: result.voiceId };
    } catch (error: any) {
      console.error('Voice cloning error:', error);
      return { success: false, error: error.message || 'Failed to clone voice' };
    }
  }

  /**
   * Batch process: Send voice notes to all eligible warm leads
   */
  async sendVoiceNotesToWarmLeads(userId: string): Promise<{
    processed: number;
    sent: number;
    skipped: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: [] as string[]
    };

    try {
      // Get all user's leads
      const leads = await storage.getLeads({ userId, limit: 1000 });

      for (const lead of leads) {
        results.processed++;

        // Get messages for this lead
        const messages = await storage.getMessages(lead.id);

        // Check if should send
        const decision = await this.shouldSendVoiceNote(lead, messages);
        
        if (!decision.shouldSend) {
          results.skipped++;
          continue;
        }

        // Try to send voice note
        const result = await this.generateAndSendVoiceNote(userId, lead.id);
        
        if (result.success) {
          results.sent++;
          // Add delay between sends to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          results.skipped++;
          if (result.error) {
            results.errors.push(`${lead.name}: ${result.error}`);
          }
        }
      }

    } catch (error: any) {
      console.error('Batch voice sending error:', error);
      results.errors.push(`Batch error: ${error.message}`);
    }

    return results;
  }
}

export const voiceAI = new VoiceAIService();
