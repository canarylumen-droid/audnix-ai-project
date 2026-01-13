import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

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
3. Multi-Channel Outreach: Human-like engagement across Instagram, WhatsApp, and Email.
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
    try {
        // Defensive check for missing body
        if (!req.body) {
            return res.json({ content: "I'm momentarily recalibrating. Please try again." });
        }

        const { message, history = [], isAuthenticated = false, userEmail = null } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.json({
                content: "I am currently in disconnected mode (Syncing API Key). However, I can still tell you that Audnix is the world's most advanced autonomous sales engine. You should visit the Access Protocol (Signup) to get started."
            });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            systemInstruction: AUDNIX_KNOWLEDGE
        });

        const chat = model.startChat({
            history: history.map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            })),
        });

        const result = await chat.sendMessage(message);
        const content = result.response.text() || "I'm having trouble retrieving the protocol response. Please try again.";

        res.json({ content });
    } catch (error) {
        console.error('Expert Chat Error:', error);
        res.json({ content: "I'm momentarily recalibrating. Please try again or sign up to experience the full neural engine." });
    }
});

export default router;
