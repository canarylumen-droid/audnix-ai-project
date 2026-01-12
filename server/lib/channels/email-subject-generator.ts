import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmailSubject(userId: string, content: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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
