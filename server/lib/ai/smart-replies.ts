
import OpenAI from 'openai';
import { storage } from '../../storage';
import type { Lead, Message } from '@shared/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key'
});

const isDemoMode = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key';

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
  if (isDemoMode) {
    return getDemoReplies(lastMessage.body);
  }

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
      model: 'gpt-4o-mini',
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
    return getDemoReplies(lastMessage.body);
  }
}

function getDemoReplies(lastMessage: string): SmartReply[] {
  const lower = lastMessage.toLowerCase();

  if (lower.includes('price') || lower.includes('cost')) {
    return [
      {
        id: 'demo-1',
        text: "Our pricing starts at $49/mo with a 3-day free trial. Would you like to see a demo?",
        tone: 'professional',
        useCase: 'Pricing inquiry',
        confidence: 0.9
      },
      {
        id: 'demo-2',
        text: "Great question! Let's hop on a quick call so I can show you the value. When works for you?",
        tone: 'friendly',
        useCase: 'Build relationship',
        confidence: 0.85
      },
      {
        id: 'demo-3',
        text: "Limited spots available this week! Book a demo now and get 20% off your first month.",
        tone: 'urgent',
        useCase: 'Create urgency',
        confidence: 0.8
      }
    ];
  }

  if (lower.includes('interested') || lower.includes('tell me more')) {
    return [
      {
        id: 'demo-1',
        text: "I'd love to share more! When can we schedule a quick 15-min call?",
        tone: 'professional',
        useCase: 'Book demo',
        confidence: 0.9
      },
      {
        id: 'demo-2',
        text: "Awesome! Let me send you a quick video showing how it works. Sound good?",
        tone: 'friendly',
        useCase: 'Share resource',
        confidence: 0.85
      },
      {
        id: 'demo-3',
        text: "Perfect timing! We have 3 spots left for our onboarding this week. Ready to get started?",
        tone: 'urgent',
        useCase: 'Push for action',
        confidence: 0.8
      }
    ];
  }

  return [
    {
      id: 'demo-1',
      text: "Thanks for your message! How can I help you today?",
      tone: 'professional',
      useCase: 'General response',
      confidence: 0.7
    },
    {
      id: 'demo-2',
      text: "Hey! Great to hear from you. What questions do you have?",
      tone: 'friendly',
      useCase: 'Casual follow-up',
      confidence: 0.75
    },
    {
      id: 'demo-3',
      text: "Let's connect! When's a good time for a quick call this week?",
      tone: 'urgent',
      useCase: 'Book meeting',
      confidence: 0.65
    }
  ];
}
