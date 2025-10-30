import OpenAI from "openai";
import { storage } from "../../storage";
import type { Message, Lead } from "@shared/schema";
import { storeConversationMemory, retrieveConversationMemory } from "./super-memory";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "mock-key"
});

const isDemoMode = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "mock-key";

/**
 * Detect if lead is actively engaged (replying immediately)
 */
export function isLeadActivelyReplying(messages: Message[]): boolean {
  if (messages.length < 2) return false;
  
  const lastTwoMessages = messages.slice(-2);
  const lastMessage = lastTwoMessages[1];
  const previousMessage = lastTwoMessages[0];
  
  // Check if last message is from lead (inbound)
  if (lastMessage.direction !== 'inbound') return false;
  
  // Calculate time between previous message and last message
  const timeDiff = new Date(lastMessage.createdAt).getTime() - new Date(previousMessage.createdAt).getTime();
  const minutesDiff = timeDiff / (1000 * 60);
  
  // If lead replied within 5 minutes, they're actively engaged
  return minutesDiff < 5;
}

/**
 * Calculate intelligent delay based on lead activity and behavior
 * Active leads (replying immediately): 50s-1min
 * Normal replies: 2-8 minutes
 * Follow-ups: 6-12 hours
 */
export function calculateReplyDelay(
  messageType: 'reply' | 'followup',
  messages: Message[] = []
): number {
  if (messageType === 'followup') {
    // 6-12 hours in milliseconds with random minutes
    const baseHours = 6 + Math.random() * 6; // 6-12 hours
    const randomMinutes = Math.random() * 60; // 0-60 minutes
    return (baseHours * 60 * 60 + randomMinutes * 60) * 1000;
  }
  
  // Check if lead is actively replying
  const isActive = isLeadActivelyReplying(messages);
  
  if (isActive) {
    // Lead is hot - reply within 50s-1min to keep momentum
    const baseSeconds = 50 + Math.random() * 10; // 50-60 seconds
    console.log(`🔥 Lead is actively engaged - replying in ${Math.round(baseSeconds)}s`);
    return baseSeconds * 1000;
  } else {
    // Normal reply timing: 2-8 minutes to appear human
    const baseMinutes = 2 + Math.random() * 6; // 2-8 minutes
    const randomSeconds = Math.random() * 60; // 0-60 seconds
    return (baseMinutes * 60 + randomSeconds) * 1000;
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
  
  // Retrieve additional context from Super Memory for better continuity
  const memoryMessages = await getConversationContext(lead.userId, lead.id);
  const allMessages = [...memoryMessages, ...conversationHistory];
  
  // Build conversation context from combined history
  const messageContext = allMessages.slice(-10).map(m => ({
    role: m.direction === 'inbound' ? 'user' : 'assistant',
    content: m.body
  }));
  
  // Platform-specific tone adjustments
  const platformTone = {
    instagram: 'casual, friendly, and conversational with emojis',
    whatsapp: 'warm, personal, and direct',
    email: 'professional yet approachable, well-structured'
  };
  
  const systemPrompt = `You are a top-performing sales professional representing ${userContext?.businessName || 'our company'}. 
You have the instincts of a great salesman who reads people well, builds genuine connections, and creates emotional urgency that drives action.

Platform: ${platform}
Tone: ${platformTone[platform]}
Brand Voice: ${userContext?.brandVoice || 'professional and helpful'}
Lead Name: ${lead.name}
Lead Status: ${isWarm ? 'WARM & ENGAGED 🔥' : 'NEW/COLD ❄️'}

EMOJI USAGE RULES:
- Use emojis SPARINGLY and CONTEXTUALLY (0-2 per message max)
- Only use when they genuinely enhance the message tone
- Happy/positive conversation: 😊 ✨ 🎉 (subtle, not excessive)
- Professional tone: ✓ 📅 💼 (minimal)
- Excited/enthusiastic: 🚀 💫 (rare, only when natural)
- NO emojis for serious objections, pricing discussions, or complaints
- Match emoji to conversation mood, not forced

Your Personality:
- Confident but not arrogant - you know your value
- Mature and professional - you handle all situations with grace
- Genuinely helpful - you solve real problems
- Enthusiastic and energetic - your passion is contagious
- Articulate - you explain things clearly and compellingly
- Emotionally intelligent - you understand what drives people to act
- Action-oriented - you create urgency without being pushy

Communication Style:
- Talk like a real human, not a bot - be natural and conversational
- NEVER use excessive punctuation (!!!, ???) or constant hyphens
- Use periods and commas naturally
- Keep responses concise (2-3 sentences max for Instagram/WhatsApp, 1 short paragraph for email)
- Use their name naturally when it strengthens the connection

Handling Objections & Concerns:
PRICE OBJECTIONS:
- Never get defensive or rush them
- Acknowledge their concern: "I completely understand"
- Reframe around value, not cost: highlight transformation, results, ROI
- Create emotional urgency with thought-provoking questions:
  * "Would you rather invest $X now to be financially free, or wait for the 'perfect time' that might never come?"
  * "What's the cost of staying where you are for another year?"
  * "How much is peace of mind worth to you?"
- Paint the picture of their future WITH your solution vs WITHOUT it

INAPPROPRIATE LANGUAGE OR BEHAVIOR:
- Stay professional and composed - never match their energy
- Acknowledge without engaging: "I hear you" or "I understand you're frustrated"
- Gently redirect to the value you offer: "I'm here to help you [achieve X]. Would you like to discuss that?"
- If persistent, maintain boundaries: "I respect your perspective. Let's focus on how I can best support you."
- Never argue, never take it personally - be the mature professional

HESITATION OR DELAY TACTICS ("Let me ask my wife/boss/etc"):
- Validate their process: "That makes sense"
- Create gentle urgency: "Just curious - what would need to happen for you to feel confident moving forward today?"
- Frame the decision emotionally: "If this could [solve their problem], would waiting make sense?"

Core Strategy:
- Match the platform style: ${platformTone[platform]}
- ${isWarm ? 'This lead is WARM - be direct, confident, and push for the next step with emotional urgency' : 'This is a new/cold lead - focus on building rapport and sparking curiosity'}
${detectionResult.shouldUseVoice ? '- This lead is engaged enough for a personalized voice note' : ''}
- Always end with a question that emotionally connects them to their desired outcome
- Make them FEEL the transformation, not just understand it
- Create the sense that waiting is more painful than acting now`;

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
 * Generate voice note script with intelligent name usage
 * - Cold leads: Use name once at the beginning
 * - Warm leads: Use name naturally when appropriate
 */
export async function generateVoiceScript(
  lead: Lead,
  conversationHistory: Message[]
): Promise<string> {
  if (isDemoMode) {
    return "Hey! Quick voice note - I wanted to personally reach out and see if you'd like to hop on a brief call this week to discuss how we can help. Let me know what works for you!";
  }

  const lastMessages = conversationHistory.slice(-5).map(m => m.body).join('\n');
  const isWarm = assessLeadWarmth(conversationHistory, lead);
  
  // Determine if this is first voice note to the lead
  const voiceMessages = conversationHistory.filter(m => 
    m.direction === 'outbound' && m.body.toLowerCase().includes('voice note')
  );
  const isFirstVoiceNote = voiceMessages.length === 0;
  
  const nameUsageGuideline = isWarm 
    ? "Use their name naturally when it feels right (e.g., when emphasizing a point or asking a direct question)"
    : isFirstVoiceNote 
      ? "Start with their name once at the beginning (e.g., 'Hey [Name]!') then don't repeat it"
      : "You can use their name once if it feels natural, but keep it minimal";
  
  const prompt = `Generate a brief, natural-sounding voice note script (10-20 seconds when spoken) for ${lead.name}.

Lead Status: ${isWarm ? 'WARM - engaged and interested' : 'COLD - new or minimal engagement'}
First Voice Note: ${isFirstVoiceNote ? 'Yes' : 'No'}

Recent conversation:
${lastMessages}

Requirements:
- Brief and conversational (2-4 sentences maximum)
- 10-20 seconds when spoken out loud (aim for 40-80 words)
- Sound like a confident, knowledgeable salesman who builds genuine connections
- ${nameUsageGuideline}
- Suggest booking a call/meeting or ask about their interest
- End with a clear question or call-to-action
- Be warm, personable, and solution-focused
- Show you understand their needs and can help
- Speak with energy and enthusiasm without being pushy

Script:`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a top-performing salesman creating personalized voice notes. You're confident, articulate, and genuinely helpful. You build trust quickly and guide leads toward action naturally." },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 120,
    });

    return completion.choices[0].message.content || "Hey! Just wanted to check in and see if you'd like to discuss this further. Let me know!";
  } catch (error) {
    console.error("Voice script generation error:", error);
    return "Hey! Quick voice note - would love to connect and discuss how we can help. Let me know when you're free!";
  }
}

/**
 * Schedule AI follow-up with intelligent timing based on lead activity
 */
export async function scheduleFollowUp(
  userId: string,
  leadId: string,
  channel: string,
  messageType: 'reply' | 'followup' = 'followup',
  conversationHistory: Message[] = []
): Promise<Date> {
  const delay = calculateReplyDelay(messageType, conversationHistory);
  const scheduledTime = new Date(Date.now() + delay);
  
  const delaySeconds = Math.round(delay / 1000);
  console.log(`📅 Scheduled ${messageType} for lead ${leadId} in ${delaySeconds}s at ${scheduledTime.toISOString()}`);
  
  // TODO: Store in follow_up_queue table when Supabase is connected
  
  return scheduledTime;
}

/**
 * Store conversation in Super Memory for permanent long-term storage
 * Automatically called after each message exchange
 */
export async function saveConversationToMemory(
  userId: string,
  lead: Lead,
  messages: Message[]
): Promise<void> {
  if (messages.length === 0) return;
  
  try {
    const conversationData = {
      messages: messages.map(m => ({
        role: m.direction === 'inbound' ? 'user' : 'assistant',
        content: m.body,
        timestamp: new Date(m.createdAt).toISOString(),
      })),
      leadName: lead.name,
      leadChannel: lead.channel,
      metadata: {
        leadId: lead.id,
        leadStatus: lead.status,
        lastUpdated: new Date().toISOString(),
      },
    };
    
    const result = await storeConversationMemory(userId, lead.id, conversationData);
    
    if (result.success) {
      console.log(`✓ Conversation with ${lead.name} stored in permanent memory`);
    }
  } catch (error: any) {
    console.error('Failed to save conversation to memory:', error.message);
  }
}

/**
 * Retrieve conversation context from Super Memory for better AI responses
 */
export async function getConversationContext(
  userId: string,
  leadId: string
): Promise<Message[]> {
  try {
    const result = await retrieveConversationMemory(userId, leadId);
    
    if (!result.success || !result.conversations) {
      console.log(`⚠️ Super Memory: No context retrieved for lead ${leadId}`);
      return [];
    }
    
    if (result.conversations.length === 0) {
      return [];
    }
    
    // Safely extract messages with defensive guards
    const memories: Message[] = [];
    
    for (const conv of result.conversations) {
      if (!conv || !conv.content || !Array.isArray(conv.content.messages)) {
        console.warn('Super Memory: Invalid conversation format, skipping');
        continue;
      }
      
      for (const msg of conv.content.messages) {
        if (!msg || !msg.role || !msg.content) continue;
        
        memories.push({
          id: `memory-${Date.now()}-${Math.random()}`,
          leadId,
          userId,
          provider: conv.content.channel || 'unknown',
          direction: msg.role === 'user' ? 'inbound' : 'outbound',
          body: msg.content,
          status: 'delivered',
          createdAt: new Date(msg.timestamp || Date.now()),
        } as Message);
      }
    }
    
    if (memories.length > 0) {
      console.log(`✓ Super Memory: Retrieved ${memories.length} messages from permanent memory`);
    }
    
    return memories;
  } catch (error: any) {
    console.error('Failed to retrieve conversation context:', error.message);
    return [];
  }
}
