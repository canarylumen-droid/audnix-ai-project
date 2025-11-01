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

    // Get plan limits in minutes
    const planLimits = {
      trial: 0, // No voice for trial
      starter: 100, // 100 minutes (~1.5 hours)
      pro: 400, // 400 minutes (~6.5 hours)
      enterprise: 1000 // 1000 minutes (~16+ hours)
    };

    // Calculate total balance: plan minutes + topup minutes - used minutes
    const planMinutes = planLimits[user.plan as keyof typeof planLimits] || 0;
    const topupMinutes = user.voiceMinutesTopup || 0;
    const usedMinutes = user.voiceMinutesUsed || 0;
    const totalBalance = planMinutes + topupMinutes - usedMinutes;

    // Convert estimated seconds to minutes
    const estimatedMinutes = estimatedSeconds / 60;

    return {
      allowed: totalBalance >= estimatedMinutes && totalBalance > 0,
      remaining: Math.max(0, totalBalance)
    };
  }

  /**
   * Update voice usage for user (convert seconds to minutes)
   */
  private async trackVoiceUsage(userId: string, secondsUsed: number): Promise<void> {
    const user = await storage.getUserById(userId);
    if (!user) return;

    // Convert seconds to minutes
    const minutesUsed = secondsUsed / 60;
    const currentUsage = user.voiceMinutesUsed || 0;
    const newTotal = currentUsage + minutesUsed;

    await storage.updateUser(userId, {
      voiceMinutesUsed: newTotal
    });

    console.log(`📊 Voice usage tracked: ${minutesUsed.toFixed(2)} minutes (${secondsUsed}s) for user ${userId} (total: ${newTotal.toFixed(2)} minutes)`);
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
    leadId: string,
    maxDuration: number = 15
  ): Promise<{
    success: boolean;
    audioUrl?: string;
    secondsUsed?: number;
    error?: string;
  }> {
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

      // Generate AI text response with character limit for ~15 seconds
      // Average speaking rate: 150 words/min = 2.5 words/sec = ~37 words for 15 seconds
      const maxWords = Math.floor((maxDuration / 60) * 150);
      const aiResponse = await this.generateVoiceScript(lead, messages, maxWords);

      // Estimate duration from word count (average 2.5 words per second for natural speech)
      const wordCount = aiResponse.split(/\s+/).length;
      const estimatedDuration = Math.ceil(wordCount / 2.5);

      // Check voice limit with estimated duration
      const limitCheck = await this.checkVoiceLimit(userId, estimatedDuration);
      if (!limitCheck.allowed) {
        return { 
          success: false, 
          error: `Voice limit exceeded. Remaining: ${limitCheck.remaining.toFixed(1)} minutes. Top up or upgrade plan for more.` 
        };
      }

      // Get user's cloned voice ID or use default
      const user = await storage.getUserById(userId);
      const voiceId = user?.voiceCloneId || undefined;

      // Generate voice with ElevenLabs
      const voiceData = await this.elevenlabs.textToSpeech(aiResponse, { voiceId });

      // Verify actual duration doesn't exceed remaining limit
      const finalLimitCheck = await this.checkVoiceLimit(userId, voiceData.duration);
      if (!finalLimitCheck.allowed) {
        return { 
          success: false, 
          error: `Voice generation exceeded limit. Generated ${(voiceData.duration / 60).toFixed(2)} minutes but only ${finalLimitCheck.remaining.toFixed(1)} minutes remaining.` 
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
        // WhatsApp via Twilio
        const integrations = await storage.getIntegrations(userId);
        const waIntegration = integrations.find(i => i.provider === 'whatsapp' && i.connected);

        if (!waIntegration) {
          return { success: false, error: 'WhatsApp not connected' };
        }

        // Decrypt credentials from integration
        const decryptedMetaJson = decrypt(waIntegration.encryptedMeta);
        const decryptedMeta = JSON.parse(decryptedMetaJson);
        const accountSid = decryptedMeta.accountSid;
        const authToken = decryptedMeta.authToken;
        const fromNumber = decryptedMeta.fromNumber;

        if (!accountSid || !authToken || !fromNumber) {
          return { success: false, error: 'WhatsApp/Twilio credentials incomplete' };
        }

        const whatsapp = new WhatsAppProvider({
          accountSid,
          authToken,
          fromNumber
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
        body: `[Voice Note] ${aiResponse}`,
        audioUrl,
        metadata: { 
          isAiGenerated: true, 
          voiceNote: true,
          duration: voiceData.duration,
          messageId 
        }
      });

      // Track usage - CRITICAL: Actually deduct minutes from balance
      await this.trackVoiceUsage(userId, voiceData.duration);

      // Create usage audit log
      await storage.createUsageTopup({
        userId,
        type: 'voice',
        amount: -(voiceData.duration / 60), // Negative for usage
        metadata: {
          leadId: lead.id,
          leadName: lead.name,
          channel: lead.channel,
          audioUrl,
          duration: voiceData.duration
        }
      });

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
   * Generate voice script with natural human speech patterns
   * Note: ElevenLabs does not support laughter/emotional sounds in synthesis
   * We focus on natural conversational language instead
   */
  private async generateVoiceScript(lead: any, history: any[], maxWords: number = 37): Promise<string> {
    // Analyze conversation mood
    const recentMessages = history.slice(-3).map(m => m.body.toLowerCase()).join(' ');
    const isSerious = /problem|issue|concern|worried|upset/.test(recentMessages);
    
    const prompt = `
      You are an influencer/creator speaking naturally to ${lead.name || 'there'} on ${lead.channel}.
      
      Conversation history:
      ${history.map(msg => `${msg.sender === 'ai' ? 'You' : lead.name}: ${msg.body}`).join('\n')}

      VOICE SCRIPT RULES:
      1. Sound like a REAL human having a conversation - natural speech patterns
      2. Keep it to ${maxWords} words max (15 seconds when spoken)
      3. ${isSerious ? 'Keep tone professional and empathetic' : 'Keep tone warm and conversational'}
      4. Use natural pauses: "you know", "I mean", "honestly"
      5. Professional but warm - you're an expert who's approachable
      6. NO robotic phrases, NO sales scripts
      7. Write ONLY what should be spoken - no stage directions or actions
      
      BANNED PHRASES:
      - "I'm reaching out"
      - "Just wanted to touch base"
      - "Circle back"
      - Any *action* markers like *laughs* or *chuckles*
      
      Generate a natural voice script (plain text only, no formatting):
    `;
    
    return await generateVoiceScript(lead, history, prompt);
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

        // Try to send voice note (first 15-second clip)
        const result1 = await this.generateAndSendVoiceNote(userId, lead.id, 15);

        if (result1.success) {
          results.sent++;
          // Add delay between sends to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));

          // If the first clip was successful, try sending the second one
          // Check lead status again to ensure they haven't opted out
          const updatedLead = await storage.getLeadById(lead.id);
          const updatedMessages = await storage.getMessages(lead.id);
          const secondDecision = await this.shouldSendVoiceNote(updatedLead!, updatedMessages);

          if (secondDecision.shouldSend) {
            const result2 = await this.generateAndSendVoiceNote(userId, lead.id, 15);
            if (result2.success) {
              results.sent++;
            } else {
              results.skipped++;
              if (result2.error) {
                results.errors.push(`${updatedLead!.name}: Second voice note failed - ${result2.error}`);
              }
            }
          } else {
            results.skipped++;
            results.errors.push(`${updatedLead!.name}: Skipped second voice note due to status change - ${secondDecision.reason}`);
          }
        } else {
          results.skipped++;
          if (result1.error) {
            results.errors.push(`${lead.name}: ${result1.error}`);
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