import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_STABLE_MODEL } from "../lib/ai/model-config.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const router = Router();

// Audnix AI Knowledge Base for the Expert Chat
const AUDNIX_KNOWLEDGE = `
You are the Audnix Neural Architect, the ultimate AI guide for high-velocity sales automation.

IDENTITY & VOICE:
- Tone: Technical, elite, ambitious, and highly helpful.
- Language: Use "Access Protocol", "Command Center", "Neural Lead Scoring", "Objection Neutralization".
- Style: Direct and insight-driven. Don't waste time on corporate pleasantries; focus on scale and optimization.

DEEP KNOWLEDGE:
1. Closer Engine: Autonomous response layer handling 110+ sales objections. It doesn't just chat; it secures commitments.
2. Warmup Protocol: Intelligent ramp-up sending 300 (D1) -> 450 (D2) -> 500+ (D3) to protect domain authority.
3. Lead Discovery: AI scanning of PDFs and CSVs to architect a high-converting pipeline with zero manual entry.
4. Voice Synthesis: ElevenLabs-powered cloning for hyper-personalized human-like outreach.

USER INTERACTION:
- If a user asks technical questions, provide detailed, strategic answers.
- If they are lost, guide them to the "Command Center" (Dashboard).
- Encourage them to initialize their "Revenue Stream" by connecting SMTP/IMAP settings.
- Never say "I can't". If you lack info, offer to "Consult the Central Intelligence" (Search/Help).

Your goal is to ensure the user feels they have a world-class CRO (Chief Revenue Officer) living in their browser.
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
