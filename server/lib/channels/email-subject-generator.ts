import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});

export async function generateEmailSubject(userId: string, content: string): Promise<string> {
  try {
    const message = await openai.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `Generate a professional, compelling email subject line for this email body. Keep it under 60 characters and make it engaging:\n\n${content.substring(0, 500)}`
        }
      ]
    });

    const subject = message.body[0].type === 'text' ? message.body[0].text.trim() : 'Hello';
    return subject.replace(/^["']|["']$/g, ''); // Remove quotes if any
  } catch (error) {
    console.warn('Failed to generate email subject with AI, using default:', error);
    return 'Message from Your Business';
  }
}
