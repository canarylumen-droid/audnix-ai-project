import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_STABLE_MODEL } from "../lib/ai/model-config.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const router = Router();

// Audnix Knowledge Base
const AUDNIX_KNOWLEDGE = `
You are the Audnix Support Assistant. You provide helpful, clear, and professional guidance for the Audnix sales platform.

IDENTITY & VOICE:
- Tone: Professional, helpful, and standard SaaS support style.
- Language: Plain English. Avoid overly technical jargon or "neural" metaphors unless necessary.
- Style: Direct and insight-driven.

DEEP KNOWLEDGE:
1. Sales Engine: Automates email and Instagram outreach.
2. Warmup: Safely ramps up email accounts.
3. Leads: Supports CSV/PDF uploads with automated verification.
4. Voice: ElevenLabs integration for personalized messages.

Your goal is to ensure the user gets their questions answered clearly and efficiently.
`;

router.post('/chat', async (req: Request, res: Response) => {
    let isAuthenticated = false;
    try {
        if (!req.body) {
            return res.json({ content: "Protocol error: Empty communication packet. Please retry." });
        }

        const { message, history = [] } = req.body;
        isAuthenticated = req.body.isAuthenticated === true;

        if (!message) {
            return res.status(400).json({ error: 'Message payload required' });
        }

        // Logic for the first user message (after the initial system welcome)
        // If history is just the initial AI welcome message (length 1)
        const isFirstUserMessage = history.length <= 1;
        const greetingWords = ['hi', 'hello', 'hey', 'greetings', 'yo', 'hi there'];
        const isGreeting = greetingWords.some(word => message.toLowerCase().trim().startsWith(word));

        if (isFirstUserMessage && isGreeting) {
            return res.json({
                content: "Hello! I'm your Audnix Support Assistant. I can help you set up your outreach, manage leads, or troubleshoot your settings. How can I help you today?"
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            console.warn("[AI] Expert Chat: GEMINI_API_KEY is missing. Falling back to static knowledge.");
            return res.json({
                content: "I am currently in disconnected mode (API Sync Required). However, I can tell you that Audnix is the world's most advanced autonomous salesRepresentative. You should visit the Access Protocol (Signup) to initialize the full neural brain."
            });
        }

        // Use standardized stable model with fallback
        let model;
        try {
            model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                systemInstruction: AUDNIX_KNOWLEDGE
            });
        } catch (e) {
            console.warn("[AI] Gemini 1.5 failed, falling back to 2.0");
            model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash-exp",
                systemInstruction: AUDNIX_KNOWLEDGE
            });
        }

        // Preset Answers for standard SaaS support
        const PRESET_ANSWERS: Record<string, string> = {
            "pricing": "Audnix offers flexible plans: Starter, Pro, and Enterprise. Check the 'Billing' section in your Command Center for details.",
            "smtp": "To initialize your revenue stream, navigate to Settings > Email Integration and provide your SMTP/IMAP credentials.",
            "leads": "You can upload leads via CSV or PDF. Our Neural Lead Scoring will then analyze and verify them automatically.",
        };

        const lowerMessage = message.toLowerCase();
        for (const [key, answer] of Object.entries(PRESET_ANSWERS)) {
            if (lowerMessage.includes(key)) {
                return res.json({ content: answer });
            }
        }

        // Gemini requires the first message in history to be from the 'user' role.
        let sanitizedHistory = history.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: String(m.content) }]
        }));

        if (sanitizedHistory.length > 0 && sanitizedHistory[0].role === 'model') {
            sanitizedHistory = sanitizedHistory.slice(1);
        }

        const chat = model.startChat({
            history: sanitizedHistory,
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const content = response.text() || "Neural processing interrupted. Please re-send your inquiry.";

        res.json({ content });
    } catch (error: any) {
        console.error('Expert Chat Error:', error);

        // Specific error handling for more helpful fallbacks
        let errorContent = "I'm having a bit of trouble connecting right now. Please try again in a moment.";

        if (error?.message?.includes('429')) {
            errorContent = "I'm receiving too many requests at once. Please wait a few seconds and try again.";
        } else if (error?.message?.includes('Safety') || error?.message?.includes('HARM_CATEGORY')) {
            errorContent = "I can't answer that specific question due to safety filters. Is there something else I can help with?";
        }

        res.json({ content: errorContent });
    }
});

export default router;
