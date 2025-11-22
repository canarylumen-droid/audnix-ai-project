/* @ts-nocheck */
/**
 * Brand Personalization System
 * 
 * Injects user/brand context into messages to make them feel human and authentic:
 * - User's name in signatures
 * - User's company name in context
 * - User's voice/tone from settings
 * - Brand colors for email styling
 * - Custom closing lines
 */

import { storage } from '../../storage';

interface BrandContext {
  senderName: string;
  senderEmail?: string;
  companyName: string;
  voiceTone: string;
  brandColors?: { primary: string; secondary: string };
  closingLine?: string;
  timezone?: string;
}

/**
 * Get complete brand context for a user
 */
export async function getBrandPersonalization(userId: string): Promise<BrandContext> {
  try {
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return getDefaultContext();
    }

    return {
      senderName: user.firstName || user.email?.split('@')[0] || 'Team',
      senderEmail: user.email,
      companyName: user.company || 'Our Team',
      voiceTone: user.replyTone || 'professional and friendly',
      closingLine: user.metadata?.closingLine || `All the best,\n{{senderName}}`,
      timezone: user.timezone
    };
  } catch (error) {
    console.error('Error getting brand personalization:', error);
    return getDefaultContext();
  }
}

/**
 * Default context for fallback
 */
function getDefaultContext(): BrandContext {
  return {
    senderName: 'Team',
    companyName: 'Our Company',
    voiceTone: 'professional and friendly',
    closingLine: 'All the best,\nThe Team'
  };
}

/**
 * Personalize a message with brand context
 */
export function personalizeBrandContext(
  message: string,
  context: BrandContext
): string {
  let personalized = message;

  // Replace sender name
  personalized = personalized.replace(/{{sender\.name}}/g, context.senderName);
  personalized = personalized.replace(/{{senderName}}/g, context.senderName);
  
  // Replace company name
  personalized = personalized.replace(/{{company\.name}}/g, context.companyName);
  personalized = personalized.replace(/{{companyName}}/g, context.companyName);

  return personalized.trim();
}

/**
 * Build email signature with brand personalization
 */
export function buildEmailSignature(context: BrandContext): string {
  const signatureLine = context.closingLine || `Best regards,\n${context.senderName}`;
  
  return `
---
${signatureLine}

${context.senderEmail ? `${context.senderEmail}` : ''}
${context.companyName ? `${context.companyName}` : ''}
`.trim();
}

/**
 * Apply voice tone guidelines to message generation
 */
export function getVoiceToneGuidelines(tone: string): string {
  const guidelines: Record<string, string> = {
    'professional': 'Use formal language, avoid slang, maintain distance while being helpful',
    'friendly': 'Use casual language, add personality, be warm and approachable',
    'direct': 'Be to the point, minimize fluff, focus on the key message',
    'creative': 'Use storytelling, add metaphors, make it memorable',
    'analytical': 'Focus on data and logic, be precise, avoid emotion',
    'professional and friendly': 'Balance professionalism with warmth, be helpful without being distant',
    'casual': 'Use conversational language, relatable examples, natural flow'
  };

  return guidelines[tone] || guidelines['professional and friendly'];
}

/**
 * Format message for specific channel with brand context
 */
export async function formatChannelMessage(
  message: string,
  channel: 'email' | 'whatsapp' | 'instagram',
  userId: string,
  includeSignature: boolean = true
): Promise<string> {
  const context = await getBrandPersonalization(userId);
  let formatted = personalizeBrandContext(message, context);

  // Add channel-specific formatting
  switch (channel) {
    case 'email':
      if (includeSignature) {
        formatted += '\n' + buildEmailSignature(context);
      }
      break;

    case 'whatsapp':
      // WhatsApp: Keep signature light
      if (includeSignature && context.senderName !== 'Team') {
        formatted += `\n\n- ${context.senderName}`;
      }
      break;

    case 'instagram':
      // Instagram: Minimal signature
      formatted = formatted.trim();
      break;
  }

  return formatted;
}

/**
 * Get context-aware system prompt for message generation
 */
export function getContextAwareSystemPrompt(context: BrandContext, channel: string): string {
  const voiceGuidelines = getVoiceToneGuidelines(context.voiceTone);

  return `You are writing on behalf of ${context.senderName} from ${context.companyName}.

VOICE & TONE:
${voiceGuidelines}

SENDER INFO:
- Name: ${context.senderName}
- Company: ${context.companyName}

CHANNEL: ${channel}

RULES:
1. Always sign off as ${context.senderName}
2. Reference ${context.companyName} naturally if relevant
3. Match the tone: ${context.voiceTone}
4. Keep language natural and authentic
5. No corporate jargon unless necessary
6. Make it personal to the recipient`;
}
