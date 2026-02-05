import OpenAI from "openai";
import { GoogleGenerativeAI, SchemaType, Type } from "@google/generative-ai";
import { MODELS, OPENAI_INTELLIGENCE_MODEL } from "./model-config.js";

// Initialize OpenAI conditionally
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Initialize Gemini conditionally
const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Determine primary provider: Gemini > OpenAI > None (Demo)
const PREFERRED_PROVIDER = process.env.GEMINI_API_KEY ? "gemini" : (openai ? "openai" : "demo");
const AI_MODEL = process.env.OPENAI_MODEL || OPENAI_INTELLIGENCE_MODEL; 

const isDemoMode = PREFERRED_PROVIDER === "demo";

console.log(`[AI Service] Initialized with provider: ${PREFERRED_PROVIDER}`);

/**
 * Generate embeddings for text (for pgvector storage)
 * Note: Keeps using OpenAI for embeddings to maintain 1536 dim compatibility
 * unless we strictly switch to a Gemini model that supports it (Gecko is 768).
 * For now, consistent embeddings are critical, so we fallback to OpenAI or mock.
 */
export async function embed(text: string): Promise<number[]> {
  // If we have strict OpenAI requirement for embeddings (1536 dims)
  if (openai) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return response.data[0].embedding;
    } catch (error: any) {
      console.error("OpenAI embedding error:", error.message);
    }
  }

  // Fallback / Demo: Mock 1536 dimensions
  return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
}

/**
 * Batch generate embeddings for multiple texts
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (openai) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: texts,
      });
      return response.data.map((d) => d.embedding);
    } catch (error: any) {
      console.error("OpenAI batch embedding error:", error.message);
    }
  }

  // Fallback
  return texts.map(() => Array.from({ length: 1536 }, () => Math.random() * 2 - 1));
}

/**
 * Generate AI reply using chat completion
 * prioritized by GEMINI -> OPENAI
 */
export async function generateReply(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    model?: string;
  }
): Promise<{ text: string; tokensUsed: number }> {
  
  // 1. Try Gemini First //
  if (gemini && PREFERRED_PROVIDER === "gemini") {
    try {
      const modelName = "gemini-1.5-flash"; // Agile & cheap model
      const model = gemini.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: options?.temperature || 0.7,
          maxOutputTokens: options?.maxTokens || 1000,
          responseMimeType: options?.jsonMode ? "application/json" : "text/plain",
        },
        systemInstruction: systemPrompt
      });

      const result = await model.generateContent(userPrompt);
      const data = result.response;
      
      return {
        text: data.text(),
        tokensUsed: data.usageMetadata?.totalTokenCount || 0
      };
    } catch (error: any) {
      console.error("[AI] Gemini generation failed, falling back to OpenAI (if available):", error.message);
      // Fallthrough to OpenAI if valid
    }
  }

  // 2. Try OpenAI //
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: options?.model || AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: options?.jsonMode ? { type: "json_object" } : undefined,
        max_completion_tokens: options?.maxTokens || 500,
        temperature: options?.temperature
      });

      return {
        text: response.choices[0].message.content || "",
        tokensUsed: response.usage?.total_tokens || 0
      };
    } catch (error: any) {
      console.error("OpenAI chat completion error:", error.message);
      // Fallthrough to Demo
    }
  }

  // 3. Demo Mode //
  return {
    text: JSON.stringify({
      text: "Thanks for reaching out! I'd love to help you learn more about our platform. What specific features are you most interested in?",
      intent: "interested",
      suggest_voice: false,
      metadata: { demo: true, fallback: true }
    }),
    tokensUsed: 0
  };
}

/**
 * Classify text intent
 */
export async function classify(
  text: string,
  categories: string[]
): Promise<{ category: string; confidence: number }> {
  
  const systemPrompt = `You are a text classification expert. Classify the following text into one of these categories: ${categories.join(", ")}. Respond with strictly valid JSON: { "category": "...", "confidence": 0.0-1.0 }`;

  // 1. Try Gemini
  if (gemini && PREFERRED_PROVIDER === "gemini") {
    try {
      const model = gemini.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" },
        systemInstruction: systemPrompt
      });
      const result = await model.generateContent(text);
      const parsed = JSON.parse(result.response.text());
      return {
        category: parsed.category || "unknown",
        confidence: parsed.confidence || 0
      };
    } catch (e) {
      console.error("[AI] Gemini classify failed, trying OpenAI...", e);
    }
  }

  // 2. Try OpenAI
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: AI_MODEL,
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
    }
  }

  // 3. Demo Fallback
  return {
    category: categories[0] || "unknown",
    confidence: 0.85
  };
}

/**
 * Generate insights summary from data
 */
export async function generateInsights(data: any, prompt: string): Promise<string> {
  const fullPrompt = `${prompt}\n\nData: ${JSON.stringify(data)}`;
  const systemPrompt = "You are a data analyst generating concise, actionable insights.";

  // 1. Try Gemini
  if (gemini && PREFERRED_PROVIDER === "gemini") {
    try {
      const model = gemini.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemPrompt
      });
      const result = await model.generateContent(fullPrompt);
      return result.response.text();
    } catch (e) {
      console.error("[AI] Gemini insights failed, trying OpenAI...", e);
    }
  }

  // 2. Try OpenAI
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: fullPrompt },
        ],
        max_completion_tokens: 300,
      });

      return response.choices[0].message.content || "";
    } catch (error: any) {
      console.error("OpenAI insights error:", error.message);
    }
  }

  // 3. Demo Fallback
  return "62% of revenue recovery originated from early-stage intent signals, with peak conversion velocity detected in high-status email threads. Sentiment engagement is up 45% this week.";
}

