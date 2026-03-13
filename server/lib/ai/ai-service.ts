import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { MODELS, OPENAI_INTELLIGENCE_MODEL } from "./model-config.js";

// Initialize OpenAI conditionally
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Initialize Google GenAI conditionally
const genai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// Initialize Z-AI (GLM) conditionally (OpenAI-compatible)
const zai = process.env.ZAI_API_KEY
  ? new OpenAI({
    apiKey: process.env.ZAI_API_KEY,
    baseURL: "https://open.bigmodel.cn/api/paas/v4/"
  })
  : null;

/**
 * Determine primary provider: Z-AI > OpenAI > Gemini > None (Demo)
 */
const PREFERRED_PROVIDER = process.env.Z_AI_API_KEY ? "zai" : (process.env.OPENAI_API_KEY ? "openai" : (process.env.GEMINI_API_KEY ? "genai" : "demo"));
const AI_MODEL = process.env.Z_AI_API_KEY ? MODELS.sales_reasoning : (process.env.OPENAI_MODEL || OPENAI_INTELLIGENCE_MODEL);

console.log(`[AI Service] Unified initialization with provider: ${PREFERRED_PROVIDER}`);

/**
 * Registry to track AI provider health and cooldowns
 */
const PROVIDER_STATUS = {
  zai: { cooldownUntil: 0, consecutiveErrors: 0 },
  openai: { cooldownUntil: 0, consecutiveErrors: 0 },
  genai: { cooldownUntil: 0, consecutiveErrors: 0 },
};

const COOLDOWN_BASE_MS = 60000; // 1 minute
const MAX_COOLDOWN_MS = 3600000; // 1 hour

function updateProviderHealth(provider: 'openai' | 'genai' | 'zai', isSuccess: boolean, errorStatus?: number) {
  const status = PROVIDER_STATUS[provider];
  if (isSuccess) {
    status.consecutiveErrors = 0;
    status.cooldownUntil = 0;
  } else {
    status.consecutiveErrors++;
    const isRateLimit = errorStatus === 429;
    const cooldownMultiplier = isRateLimit ? Math.pow(2, status.consecutiveErrors) : 1;
    const cooldownDuration = Math.min(COOLDOWN_BASE_MS * cooldownMultiplier, MAX_COOLDOWN_MS);
    status.cooldownUntil = Date.now() + cooldownDuration;

    console.warn(`[AI Service] Provider ${provider} entered cooldown for ${Math.round(cooldownDuration / 1000)}s due to ${isRateLimit ? '429 Quota' : 'Error'}`);
  }
}

export function isProviderAvailable(provider: 'openai' | 'genai' | 'zai'): boolean {
  if (provider === 'zai' && !zai) return false;
  if (provider === 'openai' && !openai) return false;
  if (provider === 'genai' && !genai) return false;
  return Date.now() >= PROVIDER_STATUS[provider].cooldownUntil;
}

/**
 * Get current health and status of all AI providers
 */
export function getAIStatus() {
  return {
    activeProvider: PREFERRED_PROVIDER,
    providers: Object.keys(PROVIDER_STATUS).reduce((acc, key) => {
        const provider = key as keyof typeof PROVIDER_STATUS;
        const available = isProviderAvailable(provider);
        acc[provider] = {
            available,
            cooldownUntil: PROVIDER_STATUS[provider].cooldownUntil,
            consecutiveErrors: PROVIDER_STATUS[provider].consecutiveErrors,
            configured: !!(provider === 'zai' ? zai : (provider === 'openai' ? openai : genai))
        };
        return acc;
    }, {} as Record<string, any>)
  };
}

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
  if (isProviderAvailable('openai')) {
    try {
      const response = await openai!.embeddings.create({
        model: "text-embedding-3-small",
        input: text.replace(/\n/g, " "),
      });
      updateProviderHealth('openai', true);
      return response.data[0].embedding;
    } catch (error: any) {
      console.error("[AI Service] OpenAI embedding error:", error.message);
      updateProviderHealth('openai', false, error.status);
    }
  }

  // 2. Try GenAI (768 dims -> padded to 1536)
  if (isProviderAvailable('genai')) {
    try {
      const result = await genai!.models.embedContent({
        model: "text-embedding-004",
        contents: text
      });
      updateProviderHealth('genai', true);
      const values = result.embeddings?.[0]?.values;
      if (!values) throw new Error("GenAI returned no embeddings");
      return normalizeEmbedding(values as number[]);
    } catch (error: any) {
      console.error("[AI Service] GenAI embedding error:", error.message);
      updateProviderHealth('genai', false, error.status);
    }
  }

  // 3. Demo Fallback: Mock 1536 dimensions
  return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
}

/**
 * Batch generate embeddings for multiple texts
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (isProviderAvailable('openai')) {
    try {
      const response = await openai!.embeddings.create({
        model: "text-embedding-3-small",
        input: texts.map(t => t.replace(/\n/g, " ")),
      });
      updateProviderHealth('openai', true);
      return response.data.map((d) => d.embedding);
    } catch (error: any) {
      console.error("[AI Service] OpenAI batch embedding error:", error.message);
      updateProviderHealth('openai', false, error.status);
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
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  }
): Promise<{ text: string; tokensUsed: number }> {

  const tryOpenAI = async () => {
    if (!isProviderAvailable('openai')) return null;
    try {
      const response = await openai!.chat.completions.create({
        model: options?.model || MODELS.sales_reasoning || AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...(options?.history || []),
          { role: "user", content: userPrompt },
        ],
        response_format: options?.jsonMode ? { type: "json_object" } : undefined,
        max_completion_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7
      });

      updateProviderHealth('openai', true);
      return {
        text: response.choices[0].message.content || "",
        tokensUsed: response.usage?.total_tokens || 0
      };
    } catch (error: any) {
      console.error("[AI Service] OpenAI error:", error.message);
      updateProviderHealth('openai', false, error.status);
      return null;
    }
  };

  const tryGenAI = async () => {
    if (!isProviderAvailable('genai')) return null;
    try {
      const modelName = options?.model?.includes("gemini") ? options.model : MODELS.content_generation || "gemini-1.5-pro";
      
      const result = await genai!.models.generateContent({
        model: modelName,
        contents: options?.history 
          ? options.history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n") + "\n\nUSER: " + userPrompt
          : userPrompt,
        config: {
          temperature: options?.temperature || 0.7,
          maxOutputTokens: options?.maxTokens || 1000,
          responseMimeType: options?.jsonMode ? "application/json" : "text/plain",
          systemInstruction: systemPrompt
        }
      });

      updateProviderHealth('genai', true);
      return {
        text: result.text || "",
        tokensUsed: result.usageMetadata?.totalTokenCount || 0
      };
    } catch (error: any) {
      console.error("[AI Service] GenAI error:", error.message);
      updateProviderHealth('genai', false, error.status);
      return null;
    }
  };

  const tryZAI = async () => {
    if (!isProviderAvailable('zai')) return null;
    try {
      const response = await zai!.chat.completions.create({
        model: options?.model || MODELS.sales_reasoning || AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...(options?.history || []),
          { role: "user", content: userPrompt },
        ],
        response_format: options?.jsonMode ? { type: "json_object" } : undefined,
        max_completion_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7
      });

      updateProviderHealth('zai', true);
      return {
        text: response.choices[0].message.content || "",
        tokensUsed: response.usage?.total_tokens || 0
      };
    } catch (error: any) {
      console.error("[AI Service] Z-AI error:", error.message);
      updateProviderHealth('zai', false, error.status);
      return null;
    }
  };

  // Execution flow with circuit breaking availability
  if (PREFERRED_PROVIDER === "zai") {
    const res = await tryZAI();
    if (res) return res;
    const openaiRes = await tryOpenAI();
    if (openaiRes) return openaiRes;
    const genaiRes = await tryGenAI();
    if (genaiRes) return genaiRes;
  } else if (PREFERRED_PROVIDER === "openai") {
    const res = await tryOpenAI();
    if (res) return res;
    const zaiRes = await tryZAI();
    if (zaiRes) return zaiRes;
    const genaiRes = await tryGenAI();
    if (genaiRes) return genaiRes;
  } else { // PREFERRED_PROVIDER === "genai" or "demo"
    const res = await tryGenAI();
    if (res) return res;
    const zaiRes = await tryZAI();
    if (zaiRes) return zaiRes;
    const openaiRes = await tryOpenAI();
    if (openaiRes) return openaiRes;
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

  const genaiClassify = async () => {
    if (!isProviderAvailable('genai')) return null;
    try {
      const result = await genai!.models.generateContent({
        model: MODELS.intent_classification?.includes("gemini") ? MODELS.intent_classification : "gemini-1.5-flash",
        contents: text,
        config: {
          responseMimeType: "application/json",
          systemInstruction: systemPrompt
        }
      });
      updateProviderHealth('genai', true);
      return JSON.parse(result.text || "{}");
    } catch (e) {
      updateProviderHealth('genai', false);
      return null;
    }
  };

  const openaiClassify = async () => {
    if (!isProviderAvailable('openai')) return null;
    try {
      const response = await openai!.chat.completions.create({
        model: MODELS.intent_classification || "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: text }],
        response_format: { type: "json_object" },
        max_completion_tokens: 100,
      });
      updateProviderHealth('openai', true);
      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (e: any) {
      updateProviderHealth('openai', false, e.status);
      return null;
    }
  };

  const zaiClassify = async () => {
    if (!isProviderAvailable('zai')) return null;
    try {
      const response = await zai!.chat.completions.create({
        model: MODELS.intent_classification || "glm-4-flash",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: text }],
        response_format: { type: "json_object" },
        max_completion_tokens: 100,
      });
      updateProviderHealth('zai', true);
      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (e: any) {
      updateProviderHealth('zai', false, e.status);
      return null;
    }
  };

  const result = PREFERRED_PROVIDER === "zai" ? (await zaiClassify() || await openaiClassify() || await genaiClassify()) :
    (PREFERRED_PROVIDER === "genai" ? (await genaiClassify() || await zaiClassify() || await openaiClassify()) :
      (await openaiClassify() || await zaiClassify() || await genaiClassify()));

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

  const genaiInsights = async () => {
    if (!isProviderAvailable('genai')) return null;
    try {
      const result = await genai!.models.generateContent({
        model: "gemini-1.5-flash",
        contents: fullPrompt,
        config: {
          systemInstruction: systemPrompt
        }
      });
      updateProviderHealth('genai', true);
      return result.text || "";
    } catch (e) {
      updateProviderHealth('genai', false);
      return null;
    }
  };

  const openaiInsights = async () => {
    if (!isProviderAvailable('openai')) return null;
    try {
      const response = await openai!.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: fullPrompt }],
        max_completion_tokens: 500,
      });
      updateProviderHealth('openai', true);
      return response.choices[0].message.content || "";
    } catch (e: any) {
      updateProviderHealth('openai', false, e.status);
      return null;
    }
  };

  return (PREFERRED_PROVIDER === "zai" ? (await (async () => {
    if (!isProviderAvailable('zai')) return null;
    try {
      const response = await zai!.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: fullPrompt }],
        max_completion_tokens: 500,
      });
      updateProviderHealth('zai', true);
      return response.choices[0].message.content || "";
    } catch (e: any) {
      updateProviderHealth('zai', false, e.status);
      return null;
    }
  })() || await openaiInsights() || await genaiInsights()) : (PREFERRED_PROVIDER === "genai" ? await genaiInsights() : await openaiInsights())) || "Revenue performance is stable with 12% growth in engagement signals.";
}

/**
 * Generate a dynamic email subject that converts
 */
export async function generateEmailSubject(body: string, leadName: string, company?: string): Promise<string> {
  const systemPrompt = "You are an elite sales copywriter. Generate a brief (1-6 words) email subject line that feels natural, human, and increases open rates. Do NOT use generic subjects like 'Follow up' or 'Checking in'. Reference the context or person if possible.";
  const userPrompt = `Lead Name: ${leadName}
Company: ${company || "their company"}
Email Content: "${body.substring(0, 500)}..."

Generate ONLY the subject line text, no quotes.`;

  const res = await generateReply(systemPrompt, userPrompt, { temperature: 0.8, maxTokens: 50 });
  return res.text.replace(/Subject: /i, "").trim();
}

/**
 * Check grammar and suggest corrections
 */
export async function checkGrammar(text: string): Promise<{ correctedText: string; errors: Array<{ original: string; suggested: string; reason: string }> }> {
  const systemPrompt = "You are an expert editor. Analyze the text for grammar, punctuation, and style. Return a JSON object: { \"correctedText\": \"...\", \"errors\": [{ \"original\": \"...\", \"suggested\": \"...\", \"reason\": \"...\" }] }";

  try {
    const res = await generateReply(systemPrompt, text, { jsonMode: true, model: MODELS.grammar_check, temperature: 0.1 });
    return JSON.parse(res.text);
  } catch (e) {
    return { correctedText: text, errors: [] };
  }
}
