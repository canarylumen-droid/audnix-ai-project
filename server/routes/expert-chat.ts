import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_STABLE_MODEL } from "../lib/ai/model-config.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const router = Router();

// Audnix AI Knowledge Base for the Expert Chat
const AUDNIX_KNOWLEDGE = `
You are the Audnix Assistant, a high-performance neural interface designed to guide users through the Audnix ecosystem. 

PERSONALITY:
- Vibe: Next-gen, elite, efficient, and slightly tech-forward. 
- Speech Pattern: Direct and punchy. No corporate "yapping" or filler phrases. 
- Goal: Convert interest into revenue protocol (signup/engagement).

CORE CAPABILITIES:
1. Closer Engine: Autonomous neural layer for handling 110+ sales objections. It doesn't just chat; it closes.
2. Lead Intelligence: Real-time intent scoring and predictive behavior analysis.
3. Multi-Channel Outreach: Human-like engagement across Instagram and Email.
4. Scraping Protocol: Advanced lead discovery that scans millions of data points to find the perfect partner fit, investors, or high-ticket leads.
5. Voice Cloning: Personalized audio engagement using ElevenLabs integration.

PAGES & LINKS:
- Signup/Access: audnixai.com/auth
- Dashboard/Command Center: audnixai.com/dashboard
- Pricing/Resource Allocation: audnixai.com/#pricing

BEHAVIORAL RULES:
- Use terms like "Command Center", "Access Protocol", "Neural Engine", "Revenue Architect".
- If asked "what's this?", explain that Audnix is the world's first autonomous sales representative.
- Always encourage the user to "Initialize Access" (Signup).
- If isAuthenticated is true, welcome them back to their Command Center.
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
                content: "Initialization confirmed. I am the Audnix AI Assistant, your neural interface for autonomous sales. I can help you architect high-conversion outreach or troubleshoot your sales engine. What specific sector shall we optimize first?"
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            console.warn("[AI] Expert Chat: GEMINI_API_KEY is missing. Falling back to static knowledge.");
            return res.json({
                content: "I am currently in disconnected mode (API Sync Required). However, I can tell you that Audnix is the world's most advanced autonomous salesRepresentative. You should visit the Access Protocol (Signup) to initialize the full neural brain."
            });
        }

        // Use standardized stable model
        const model = genAI.getGenerativeModel({
            model: GEMINI_STABLE_MODEL,
            systemInstruction: AUDNIX_KNOWLEDGE
        });

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
        console.error('Expert Chat Neural Error:', error);

        // Specific error handling for more helpful fallbacks
        let errorContent = "I'm momentarily recalibrating. This usually happens during high neural load. Please try again or initialize your full account access.";

        if (error?.message?.includes('429')) {
            errorContent = "Neural pathways are currently congested (Rate Limited). Please wait 30 seconds while I optimize the bandwidth.";
        } else if (error?.message?.includes('Safety') || error?.message?.includes('HARM_CATEGORY')) {
            errorContent = "Query flagged by safety protocols. I am designed for elite sales performance within ethical boundaries. Please rephrase.";
        } else if (isAuthenticated) {
            errorContent = "I encountered a minor neural desync, commander. Your data is safe—please re-send that last directive.";
        }

        res.json({ content: errorContent });
    }
});

export default router;
