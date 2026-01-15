import OpenAI from 'openai';

// Initialize OpenAI if key is present, otherwise use fallback
import { MODELS } from '../ai/model-config.js';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function generateEmailSubject(userId: string, content: string): Promise<string> {
  try {
    if (!openai) {
      throw new Error("OpenAI not initialized");
    }

    const response = await (openai as OpenAI).chat.completions.create({
      model: MODELS.intent_classification,
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `Generate a professional, compelling email subject line for this email body. Keep it under 60 characters and make it engaging:\n\n${content.substring(0, 500)}`
        }
      ]
    });

    const subject = response.choices[0].message.content?.trim() || 'Hello';
    return subject.replace(/^["']|["']$/g, ''); // Remove quotes if any
  } catch (error) {
    console.warn('Failed to generate email subject with AI, using default:', error);
    return 'Message from Your Business';
  }
}
