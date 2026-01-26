/**
 * Centralized AI Model Configuration
 * Ensures consistency across the entire application
 */

// Gemini Models - Standardize on stable model IDs
export const GEMINI_STABLE_MODEL = "gemini-1.5-flash"; // Removed -latest to avoid versioning issues
export const GEMINI_LATEST_MODEL = "gemini-2.0-flash-exp"; // 2.0 experimental
export const GEMINI_FALLBACK_MODEL = "gemini-1.5-pro"; 

// OpenAI Models
export const OPENAI_INTELLIGENCE_MODEL = "gpt-4o";     // Flagship for complex sales reasoning
export const OPENAI_FAST_MODEL = "gpt-4o-mini";        // Fast/Cheap for simple classification/tasks

// Default active models based on service
export const MODELS = {
    sales_reasoning: OPENAI_INTELLIGENCE_MODEL,
    intent_classification: OPENAI_FAST_MODEL,
    content_generation: GEMINI_STABLE_MODEL,
    lead_intelligence: OPENAI_INTELLIGENCE_MODEL,
    voice_assistant: OPENAI_FAST_MODEL,
    objection_handling: OPENAI_INTELLIGENCE_MODEL,
};
