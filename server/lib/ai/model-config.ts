/**
 * Centralized AI Model Configuration
 * Ensures consistency across the entire application
 */

// Gemini Models - Use 2.0 Flash for latest capabilities, 1.5 as fallback
export const GEMINI_STABLE_MODEL = "gemini-2.0-flash";
export const GEMINI_LATEST_MODEL = "gemini-2.0-flash";
export const GEMINI_FALLBACK_MODEL = "gemini-1.5-flash";

// OpenAI Models
export const OPENAI_INTELLIGENCE_MODEL = "gpt-4o";     // Flagship for complex sales reasoning
export const OPENAI_FAST_MODEL = "gpt-4o-mini";        // Fast/Cheap for simple classification/tasks

// Z-AI (GLM) Models
export const Z_AI_STABLE_MODEL = "glm-4-plus";        // Latest GLM for reasoning/chat
export const Z_AI_FAST_MODEL = "glm-4-flash";         // Fast GLM for utility tasks

// Default active models based on service
export const MODELS = {
    sales_reasoning: process.env.Z_AI_API_KEY ? Z_AI_STABLE_MODEL : OPENAI_INTELLIGENCE_MODEL,
    intent_classification: process.env.Z_AI_API_KEY ? Z_AI_FAST_MODEL : OPENAI_FAST_MODEL,
    content_generation: process.env.Z_AI_API_KEY ? Z_AI_STABLE_MODEL : GEMINI_STABLE_MODEL,
    lead_intelligence: process.env.Z_AI_API_KEY ? Z_AI_STABLE_MODEL : OPENAI_INTELLIGENCE_MODEL,
    voice_assistant: OPENAI_FAST_MODEL,
    objection_handling: process.env.Z_AI_API_KEY ? Z_AI_STABLE_MODEL : OPENAI_INTELLIGENCE_MODEL,
    grammar_check: Z_AI_FAST_MODEL,
};
