import OpenAI from "openai";
import { storage } from "../../storage";
import type { Message, Lead } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "mock-key"
});

const isDemoMode = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "mock-key";

/**
 * Calculate human-like delay based on message type and context
 * Reply to messages: 2-8 minutes
 * Follow-ups: 6-12 hours
 */
export function calculateReplyDelay(messageType: 'reply' | 'followup'): number {
  if (messageType === 'reply') {
    // 2-8 minutes in milliseconds with random seconds
    const baseMinutes = 2 + Math.random() * 6; // 2-8 minutes
    const randomSeconds = Math.random() * 60; // 0-60 seconds
    return (baseMinutes * 60 + randomSeconds) * 1000;
  } else {
    // 6-12 hours in milliseconds with random minutes
    const baseHours = 6 + Math.random() * 6; // 6-12 hours
    const randomMinutes = Math.random() * 60; // 0-60 minutes
    return (baseHours * 60 * 60 + randomMinutes * 60) * 1000;
  }
}

/**
 * Determine if a lead is "warm" based on engagement
 */
export function assessLeadWarmth(messages: Message[], lead: Lead): boolean {
  if (messages.length < 3) return false;
  
  // Count inbound messages (lead engagement)
  const inboundCount = messages.filter(m => m.direction === 'inbound').length;
  
  // Check if they've replied multiple times
  if (inboundCount >= 2) return true;
  
  // Check if last message was recent (within 24 hours)
  const lastMessage = messages[messages.length - 1];
  const hoursSinceLastMessage = (Date.now() - new Date(lastMessage.createdAt).getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceLastMessage < 24 && inboundCount >= 1) return true;
  
  return false;
}

/**
 * Detect conversation intent and update lead status automatically
 */
export function detectConversationStatus(messages: Message[]): {
  status: 'new' | 'open' | 'replied' | 'converted' | 'not_interested' | 'cold';
  shouldUseVoice: boolean;
} {
  if (messages.length === 0) {
    return { status: 'new', shouldUseVoice: false };
  }

  const lastMessages = messages.slice(-5);
  const combinedText = lastMessages.map(m => m.body.toLowerCase()).join(' ');
  const lastMessage = messages[messages.length - 1];
  const inboundMessages = messages.filter(m => m.direction === 'inbound');
  
  // Conversion signals
  const conversionKeywords = ['yes', 'deal', 'interested', 'buy', 'purchase', 'book', 'schedule', 'when can', 'let\'s do it', 'sign me up', 'i\'m in'];
  const notInterestedKeywords = ['no thanks', 'not interested', 'stop', 'unsubscribe', 'don\'t contact', 'leave me alone'];
  const bookingKeywords = ['calendar', 'appointment', 'meeting', 'call', 'demo', 'when are you free'];
  
  // Check for conversion - ONLY check inbound message content
  // Get text from ONLY inbound messages (exclude outbound prompts)
  const inboundText = inboundMessages.map(m => m.body.toLowerCase()).join(' ');
  const hasConversionSignal = conversionKeywords.some(kw => inboundText.includes(kw));
  
  if (hasConversionSignal && inboundMessages.length > 0) {
    return { status: 'converted', shouldUseVoice: false };
  }
  
  // Check for not interested - also only in inbound messages
  const hasRejectionSignal = notInterestedKeywords.some(kw => inboundText.includes(kw));
  if (hasRejectionSignal) {
    return { status: 'not_interested', shouldUseVoice: false };
  }

  // Check time since last message for cold leads
  const lastMessageTime = new Date(lastMessage.createdAt);
  const hoursSinceLastMessage = (Date.now() - lastMessageTime.getTime()) / (1000 * 60 * 60);
  
  // Lead has replied - determine if warm enough for voice
  if (inboundMessages.length > 0) {
    const wantsBooking = bookingKeywords.some(kw => combinedText.includes(kw));
    const shouldUseVoice = inboundMessages.length >= 2 || wantsBooking;
    return { status: 'replied', shouldUseVoice };
  }
  
  // No inbound messages yet - check timing for lifecycle progression
  if (lastMessage.direction === 'outbound') {
    // Cold: No response after 72+ hours
    if (hoursSinceLastMessage > 72) {
      return { status: 'cold', shouldUseVoice: false };
    }
    // Open: Sent but within 72 hours, awaiting response
    // This covers both < 24 hours AND 24-72 hour range
    return { status: 'open', shouldUseVoice: false };
  }
  
  // Default: new lead (first contact not yet made)
  return { status: 'new', shouldUseVoice: false };
}

/**
 * Generate AI response with platform-specific tone
 */
export async function generateAIReply(
  lead: Lead,
  conversationHistory: Message[],
  platform: 'instagram' | 'whatsapp' | 'email',
  userContext?: { businessName?: string; brandVoice?: string }
): Promise<{ text: string; useVoice: boolean }> {
  
  if (isDemoMode) {
    const demoResponses = [
      "Hey! Thanks for reaching out. I'd love to learn more about what you're looking for.",
      "That sounds great! When would be a good time for a quick call to discuss this further?",
      "I appreciate your interest! Let me share some details that might help...",
      "Perfect timing! I've helped others in similar situations. Would you like to see some examples?",
    ];
    return {
      text: demoResponses[Math.floor(Math.random() * demoResponses.length)],
      useVoice: false
    };
  }
  
  // Assess if lead is warm and should get voice note
  const isWarm = assessLeadWarmth(conversationHistory, lead);
  const detectionResult = detectConversationStatus(conversationHistory);
  
  // Build conversation context
  const messageContext = conversationHistory.slice(-10).map(m => ({
    role: m.direction === 'inbound' ? 'user' : 'assistant',
    content: m.body
  }));
  
  // Platform-specific tone adjustments
  const platformTone = {
    instagram: 'casual, friendly, and conversational with emojis',
    whatsapp: 'warm, personal, and direct',
    email: 'professional yet approachable, well-structured'
  };
  
  const systemPrompt = `You are a professional sales AI assistant representing ${userContext?.businessName || 'our company'}. 
Your goal is to nurture leads, answer questions, and guide them towards booking a meeting or making a purchase.

Platform: ${platform}
Tone: ${platformTone[platform]}
Brand Voice: ${userContext?.brandVoice || 'professional and helpful'}
Lead Name: ${lead.name}

Guidelines:
- Keep responses concise (2-3 sentences max for Instagram/WhatsApp, 1 short paragraph for email)
- Sound human and personable, not robotic
- If they express interest, suggest booking a call or meeting
- If they ask pricing/details, provide value first then offer to discuss further
- Always end with a clear call-to-action or question
- For ${platform}: ${platformTone[platform]}
- ${isWarm ? 'This lead is WARM - be more direct and suggest next steps' : 'This is a new lead - focus on building rapport'}
${detectionResult.shouldUseVoice ? '- This lead is engaged enough for a voice note if appropriate' : ''}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messageContext as any
      ],
      temperature: 0.8,
      max_tokens: platform === 'email' ? 300 : 150,
    });

    const responseText = completion.choices[0].message.content || "";
    
    return {
      text: responseText,
      useVoice: detectionResult.shouldUseVoice && isWarm
    };
  } catch (error: any) {
    console.error("AI reply generation error:", error.message);
    return {
      text: "Thanks for your message! Let me get back to you shortly with more details.",
      useVoice: false
    };
  }
}

/**
 * Generate voice note script (10-15 seconds max)
 */
export async function generateVoiceScript(
  lead: Lead,
  conversationHistory: Message[]
): Promise<string> {
  if (isDemoMode) {
    return "Hey! Quick voice note - I wanted to personally reach out and see if you'd like to hop on a brief call this week to discuss how we can help. Let me know what works for you!";
  }

  const lastMessages = conversationHistory.slice(-5).map(m => m.body).join('\n');
  
  const prompt = `Generate a brief, natural-sounding voice note script (10-15 seconds when spoken) for ${lead.name}.

Recent conversation:
${lastMessages}

Requirements:
- Very brief and conversational (max 2-3 sentences)
- Sound natural when spoken out loud
- Personally address them by name
- Suggest booking a call/meeting or ask about their interest
- End with a clear question or call-to-action

Script:`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a sales professional creating brief, natural voice note scripts." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    return completion.choices[0].message.content || "Hey! Just wanted to check in and see if you'd like to discuss this further. Let me know!";
  } catch (error) {
    console.error("Voice script generation error:", error);
    return "Hey! Quick voice note - would love to connect and discuss how we can help. Let me know when you're free!";
  }
}

/**
 * Schedule AI follow-up with human-like timing
 */
export async function scheduleFollowUp(
  userId: string,
  leadId: string,
  channel: string,
  messageType: 'reply' | 'followup' = 'followup'
): Promise<Date> {
  const delay = calculateReplyDelay(messageType);
  const scheduledTime = new Date(Date.now() + delay);
  
  console.log(`📅 Scheduled ${messageType} for lead ${leadId} at ${scheduledTime.toISOString()}`);
  
  // TODO: Store in follow_up_queue table when Supabase is connected
  
  return scheduledTime;
}
