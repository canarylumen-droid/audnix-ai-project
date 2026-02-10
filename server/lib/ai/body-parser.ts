import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_STABLE_MODEL } from "./model-config.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ParsedEmailBody {
    name: string;
    email: string;
    company?: string;
    job_title?: string;
    intent: string;
    summary: string;
    urgency: 'low' | 'medium' | 'high';
    sentiment: 'positive' | 'neutral' | 'negative';
}

/**
 * Parses raw email body into structured JSON using AI
 */
export async function parseEmailBody(body: string): Promise<ParsedEmailBody> {
    const model = genAI.getGenerativeModel({ model: GEMINI_STABLE_MODEL });

    const prompt = `
    Extract structured lead information from the following email body. 
    Return ONLY a JSON object with the following fields:
    - name: Full name of the sender
    - email: Email address of the sender
    - company: Company name (if mentioned)
    - job_title: Job title (if mentioned)
    - intent: Brief description of why they are reaching out
    - summary: A 1-sentence summary of the message
    - urgency: One of: low, medium, high
    - sentiment: One of: positive, neutral, negative

    Email Body:
    """
    ${body}
    """
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up response text to ensure it's valid JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to extract JSON from AI response");
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error("Error parsing email body with AI:", error);
        throw new Error("AI parsing failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
}
