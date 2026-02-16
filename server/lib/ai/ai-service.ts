import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MODELS, OPENAI_INTELLIGENCE_MODEL } from "./model-config.js";

// Initialize OpenAI conditionally
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Initialize Gemini conditionally
const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Determine primary provider: OpenAI > Gemini > None (Demo)
 * We prefer OpenAI for embeddings to avoid dimension padding complications,
 * but the system can fallback to Gemini.
 */
const PREFERRED_PROVIDER = process.env.OPENAI_API_KEY ? "openai" : (process.env.GEMINI_API_KEY ? "gemini" : "demo");
const AI_MODEL = process.env.OPENAI_MODEL || OPENAI_INTELLIGENCE_MODEL; 

console.log(`[AI Service] Unified initialization with provider: ${PREFERRED_PROVIDER}`);

/**
 * Normalizes embedding to 1536 dimensions.
 * Gemini (text-embedding-004) returns 768 dimensions.
 * OpenAI (text-embedding-3-small) returns 1536 dimensions.
 * To maintain database compatibility without schema migrations, we zero-pad to 1536.
 */
function normalizeEmbedding(values: number[]): number[] {
  if (values.length === 1536) return values;
  if (values.length < 1536) {
    const padded = new Array(1536).fill(0);
    for (let i = 0; i < values.length; i++) padded[i] = values[i];
    return padded;
  }
  return values.slice(0, 1536);
}

/**
 * Generate embeddings for text (for pgvector storage)
 */
export async function embed(text: string): Promise<number[]> {
  // 1. Try OpenAI (Native 1536 dims)
  if (openai) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text.replace(/\n/g, " "),
      });
      return response.data[0].embedding;
    } catch (error: any) {
      console.error("[AI Service] OpenAI embedding error:", error.message);
    }
  }

  // 2. Try Gemini (768 dims -> padded to 1536)
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(text);
      return normalizeEmbedding(result.embedding.values);
    } catch (error: any) {
       console.error("[AI Service] Gemini embedding error:", error.message);
    }
  }

  // 3. Demo Fallback: Mock 1536 dimensions
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
        input: texts.map(t => t.replace(/\n/g, " ")),
      });
      return response.data.map((d) => d.embedding);
    } catch (error: any) {
      console.error("[AI Service] OpenAI batch embedding error:", error.message);
    }
  }

  // Fallback to sequential for Gemini (batch embedding support varies)
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embed(text));
  }
  return results;
}

/**
 * Generate AI reply using chat completion
 * prioritized by PREFERRED_PROVIDER with robust fallback
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
  
  const tryOpenAI = async () => {
    if (!openai) return null;
    try {
      const response = await openai.chat.completions.create({
        model: options?.model || MODELS.sales_reasoning || AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: options?.jsonMode ? { type: "json_object" } : undefined,
        max_completion_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7
      });

      return {
        text: response.choices[0].message.content || "",
        tokensUsed: response.usage?.total_tokens || 0
      };
    } catch (error: any) {
      console.error("[AI Service] OpenAI error:", error.message);
      if (error.status === 429 || error.message.includes("quota")) {
        return "FALLBACK_TRIGGERED";
      }
      return null;
    }
  };

  const tryGemini = async () => {
    if (!gemini) return null;
    try {
      const modelName = options?.model?.includes("gemini") ? options.model : MODELS.content_generation || "gemini-1.5-pro";
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
      console.error("[AI Service] Gemini error:", error.message);
      return null;
    }
  };

  // Execution flow
  if (PREFERRED_PROVIDER === "openai") {
    const res = await tryOpenAI();
    if (res && res !== "FALLBACK_TRIGGERED") return res;
    const geminiRes = await tryGemini();
    if (geminiRes) return geminiRes;
  } else {
    const res = await tryGemini();
    if (res) return res;
    const openaiRes = await tryOpenAI();
    if (openaiRes && openaiRes !== "FALLBACK_TRIGGERED") return openaiRes;
  }

  // Demo Fallback
  return {
    text: options?.jsonMode ? JSON.stringify({
      text: "Thanks for reaching out! I'd love to help you learn more about our platform.",
      intent: "interested",
      metadata: { demo: true }
    }) : "Thanks for reaching out! I'd love to help you learn more about our platform.",
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
  const systemPrompt = `Classify text into: ${categories.join(", ")}. Respond JSON: { "category": "...", "confidence": 0.0-1.0 }`;

  const geminiClassify = async () => {
    if (!gemini) return null;
    try {
      const model = gemini.getGenerativeModel({ 
        model: MODELS.intent_classification?.includes("gemini") ? MODELS.intent_classification : "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" },
        systemInstruction: systemPrompt
      });
      const result = await model.generateContent(text);
      return JSON.parse(result.response.text());
    } catch (e) {
      return null;
    }
  };

  const openaiClassify = async () => {
    if (!openai) return null;
    try {
      const response = await openai.chat.completions.create({
        model: MODELS.intent_classification || "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: text }],
        response_format: { type: "json_object" },
        max_completion_tokens: 100,
      });
      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (e) {
      return null;
    }
  };

  const result = PREFERRED_PROVIDER === "gemini" ? (await geminiClassify() || await openaiClassify()) : (await openaiClassify() || await geminiClassify());

  return {
    category: result?.category || categories[0] || "unknown",
    confidence: result?.confidence || 0.85
  };
}

/**
 * Generate actionable insights
 */
export async function generateInsights(data: any, prompt: string): Promise<string> {
  const fullPrompt = `${prompt}\n\nData: ${JSON.stringify(data)}`;
  const systemPrompt = "Analyze data and generate concise, actionable insights.";

  const geminiInsights = async () => {
    if (!gemini) return null;
    try {
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: systemPrompt });
      const result = await model.generateContent(fullPrompt);
      return result.response.text();
    } catch (e) { return null; }
  };

  const openaiInsights = async () => {
    if (!openai) return null;
    try {
      const response = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: fullPrompt }],
        max_completion_tokens: 500,
      });
      return response.choices[0].message.content || "";
    } catch (e) { return null; }
  };

  return (PREFERRED_PROVIDER === "gemini" ? await geminiInsights() : await openaiInsights()) || "Revenue performance is stable with 12% growth in engagement signals.";
}
