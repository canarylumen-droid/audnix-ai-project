import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const router = Router();

// Audnix AI Knowledge Base for the Expert Chat
const AUDNIX_KNOWLEDGE = `
You are the Audnix Assistant. 
Your goal is to help visitors understand how Audnix AI can architect their revenue engine.

CORE MISSION:
Audnix AI provides autonomous AI sales agents that handle lead generation, qualification, and closing on Instagram and Email. 
We bridge the gap between "interest" and "confirmed revenue" without human intervention.

KEY FEATURES:
1. Closer Engine: Our specialized neural layer for handling sales objections (Timing, Price, Fit, etc.) and forcing decision-making. Non-yapping, deterministic closing logic.
2. Lead Intelligence: Real-time intent scoring. We don't just track history; we predict the future.
3. Multi-Channel Flow: Orchestrated outreach across Instagram and Email that looks and feels 100% human.
4. Brand Sync: Users upload PDFs or docs, and our AI adopts their brand's precise tone and knowledge.
5. Live Audit Trail: Full transparency. Users can watch their AI work in real-time.

PAGES & LINKS (Use these for CTAs):
- Signup/Login: audnixai.com/auth
- Dashboard: audnixai.com/dashboard
- Pricing: audnixai.com/#pricing
- ROI Calculator: audnixai.com/#calc

BEHAVIOR RULES:
- Style: Professional, next-gen, elite, slightly tech-heavy but clear. 
- Tone: Confident, helpful, efficient. 
- NO AI YAPPING. No "As an AI language model." No em-dashes if possible. Direct, plain text.
- If they ask for support, tell them to email support@audnixai.com.
- If they are logged in (you can assume from the prompt context), give them direct dashboard links.
- If they need to get started, send them to the Access Protocol (Signup).

KNOWLEDGE OF SIGNED-IN STATE:
The user will pass 'isAuthenticated' and 'userEmail' in the context. 
If isAuthenticated is true, greet them and offer to jump into specific dashboard features like the Closer Engine or Lead Intelligence.
If false, emphasize that they need to initialize their Access Protocol by signing up.
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
            model: "gemini-1.5-flash",
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
