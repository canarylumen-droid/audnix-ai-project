import OpenAI from 'openai';
import { storage } from '../../storage.js';
import type { Lead, Message } from '../../../shared/schema.js';

// Initialize OpenAI if key is present, otherwise use fallback
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

if (!openai) {
  console.warn('⚠️ OpenAI API Key missing. Smart replies will be disabled.');
}

const isDemoMode = false;

export interface SmartReply {
  id: string;
  text: string;
  tone: 'professional' | 'friendly' | 'urgent' | 'helpful';
  useCase: string;
  confidence: number;
}

/**
 * Generate smart reply suggestions based on conversation context
 */
export async function generateSmartReplies(
  leadId: string,
  lastMessage: Message
): Promise<SmartReply[]> {

  const lead = await storage.getLeadById(leadId);
  if (!lead) {
    throw new Error('Lead not found');
  }

  const messages = await storage.getMessagesByLeadId(leadId);
  const conversationContext = messages.slice(-5).map(m => ({
    role: m.direction === 'inbound' ? 'user' : 'assistant',
    content: m.body
  }));

  try {
    if (!openai) {
      return [];
    }

    const prompt = `You are a sales expert generating quick reply suggestions for a conversation.

Lead: ${lead.name}
Channel: ${lead.channel}
Last Message: "${lastMessage.body}"

Generate 3 different reply options with different tones:

1. PROFESSIONAL - Formal, business-appropriate
2. FRIENDLY - Warm, conversational, approachable
3. URGENT - Creates FOMO, pushes for action

Each reply should:
- Be under 100 characters
- Address the last message directly
- Move the conversation forward
- Include a clear CTA when appropriate

Return JSON array:
[
  {
    "text": "reply text here",
    "tone": "professional|friendly|urgent",
    "useCase": "when to use this reply",
    "confidence": 0.0-1.0
  }
]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a sales reply expert. Generate concise, effective quick replies.' },
        ...conversationContext as any,
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 400,
      temperature: 0.8
    });

    const result = JSON.parse(response.choices[0].message.content || '{"replies":[]}');
    const replies = result.replies || [];

    return replies.map((reply: any, index: number) => ({
      id: `reply-${Date.now()}-${index}`,
      text: reply.text,
      tone: reply.tone,
      useCase: reply.useCase,
      confidence: reply.confidence
    }));
  } catch (error) {
    console.error('Smart reply generation error:', error);
    throw error;
  }
}

