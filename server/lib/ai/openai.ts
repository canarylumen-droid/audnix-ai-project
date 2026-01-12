// Flagship model is gpt-4o for high-performance sales intelligence
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const isDemoMode = process.env.DISABLE_EXTERNAL_API === "true" || !process.env.OPENAI_API_KEY || !openai;
export const AI_MODEL = process.env.OPENAI_MODEL || "gpt-4o"; // Latest flagship for production
const model = AI_MODEL;

/**
 * Generate embeddings for text (for pgvector storage)
 * @param text - Text to embed
 * @returns Vector embedding
 */
export async function embed(text: string): Promise<number[]> {
  if (isDemoMode) {
    // Return mock embedding (1536 dimensions for text-embedding-3-small)
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
  }

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return response.data[0].embedding;
  } catch (error: any) {
    console.error("OpenAI embedding error:", error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Batch generate embeddings for multiple texts
 * @param texts - Array of texts to embed
 * @returns Array of embeddings
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (isDemoMode) {
    return texts.map(() => Array.from({ length: 1536 }, () => Math.random() * 2 - 1));
  }

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
    });

    return response.data.map((d) => d.embedding);
  } catch (error: any) {
    console.error("OpenAI batch embedding error:", error.message);
    throw new Error(`Failed to generate batch embeddings: ${error.message}`);
  }
}

/**
 * Generate AI reply using chat completion
 * @param systemPrompt - System instructions
 * @param userPrompt - User message/context
 * @param options - Additional options
 * @returns AI response with structured output
 */
export async function generateReply(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }
): Promise<{ text: string; tokensUsed: number }> {
  if (isDemoMode) {
    return {
      text: JSON.stringify({
        text: "Thanks for reaching out! I'd love to help you learn more about our platform. What specific features are you most interested in?",
        intent: "interested",
        suggest_voice: false,
        metadata: { demo: true }
      }),
      tokensUsed: 50
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: options?.jsonMode ? { type: "json_object" } : undefined,
      max_completion_tokens: options?.maxTokens || 500,
    });

    return {
      text: response.choices[0].message.content || "",
      tokensUsed: response.usage?.total_tokens || 0
    };
  } catch (error: any) {
    console.error("OpenAI chat completion error:", error.message);
    throw new Error(`Failed to generate reply: ${error.message}`);
  }
}

/**
 * Classify text intent
 * @param text - Text to classify
 * @param categories - Possible categories
 * @returns Classification result
 */
export async function classify(
  text: string,
  categories: string[]
): Promise<{ category: string; confidence: number }> {
  if (isDemoMode) {
    return {
      category: categories[0] || "unknown",
      confidence: 0.85
    };
  }

  try {
    const systemPrompt = `You are a text classification expert. Classify the following text into one of these categories: ${categories.join(", ")}. Respond with JSON: { "category": "...", "confidence": 0.0-1.0 }`;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 100,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      category: result.category || "unknown",
      confidence: Math.max(0, Math.min(1, result.confidence || 0))
    };
  } catch (error: any) {
    console.error("OpenAI classification error:", error.message);
    return { category: "unknown", confidence: 0 };
  }
}

/**
 * Generate insights summary from data
 * @param data - Data to analyze
 * @param prompt - Custom prompt template
 * @returns Generated insights
 */
export async function generateInsights(data: any, prompt: string): Promise<string> {
  if (isDemoMode) {
    return "62% of revenue recovery originated from early-stage intent signals, with peak conversion velocity detected in high-status email threads. Sentiment engagement is up 45% this week.";
  }

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are a data analyst generating concise, actionable insights." },
        { role: "user", content: `${prompt}\n\nData: ${JSON.stringify(data)}` },
      ],
      max_completion_tokens: 300,
    });

    return response.choices[0].message.content || "";
  } catch (error: any) {
    console.error("OpenAI insights error:", error.message);
    throw new Error(`Failed to generate insights: ${error.message}`);
  }
}
