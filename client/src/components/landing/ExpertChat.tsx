import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageCircle,
    X,
    Send,
    Bot,
    ChevronDown,
    Minus,
    ArrowUpRight,
    Globe,
    Rocket,
    Sparkles,
    Headphones,
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { Link } from "wouter";

interface Message {
    role: 'ai' | 'user';
    content: string;
}

const SUGGESTED_QUESTIONS = [
    { label: "How does it scale?", icon: Globe, query: "How does Audnix scale my client outreach?" },
    { label: "Book a demo", icon: Rocket, query: "How can I book a live demo?" },
    { label: "Pricing", icon: MessageSquare, query: "Tell me about the pricing tiers." },
    { label: "Support", icon: Headphones, query: "How do I contact support?" }
];

// 20 Preset Answers for fallback or common queries
const PRESET_ANSWERS: Record<string, string> = {
    "default": "I am the Audnix AI Assistant. I'm here to help you automate your sales outreach and scale your business with autonomous intelligence. What specific protocol can I assist you with?",
    "pricing": "Audnix offers flexible tiers starting from our Base Layer for individual closers to Enterprise Protocols for global sales teams. You can view full details in the 'Pricing' section.",
    "demo": "You can initialize a live demo by selecting 'Book a Demo' or by signing up for a free trial to explore the interface directly.",
    "scale": "Audnix scales by deploying multiple autonomous agents across Email and Instagram, handling thousands of conversations with zero human latency.",
    "support": "Our technical support team is available 24/7 via the 'Support' link in your dashboard or by emailing support@audnix.ai.",
    "how it works": "Audnix syncs with your brand's communication style, analyzes leads autonomously, handles objections using deterministic logic, and books meetings directly into your calendar.",
    "integrations": "Currently, we offer deep integrations with Gmail, Outlook, and Instagram, with more CRM bridges being deployed soon.",
    "security": "We use enterprise-grade SOC2 Type II encryption and deterministic logic to ensure every interaction is brand-safe and secure.",
    "leads": "You can import leads via CSV or sync directly from your existing CRM. Audnix then vectors them into high-priority conversion flows.",
    "objections": "Our objection mastery engine uses a neural layer to reframe prospect resistance into value-based outcomes, increasing close rates significantly.",
    "onboarding": "Onboarding takes less than 60 seconds. Simply sync your brand profile and activate the neural engine.",
    "latency": "Audnix operates with sub-800ms response times, ensuring you're always the first to reply to a prospect's inquiry.",
    "roi": "Most teams see a 3-5x increase in meeting volume within the first 30 days of activating the Audnix protocol.",
    "customization": "Every agent is uniquely tuned to your brand's tone, manual objection handling history, and specific offer parameters.",
    "training": "The AI architects responses based on your uploaded brand documents and historical closing patterns.",
    "compliance": "Audnix is fully compliant with GDPR and multi-regional privacy regulations.",
    "automation": "Our automation builder allows you to orchestrate human-like follow-up sequences that adapt to prospect sentiment in real-time.",
    "analytics": "The dashboard provides deep analytics on lead scoring, conversion velocity, and agent performance.",
    "setup": "Setup is completely frictionless. No complex coding required—just plug in your communication links and go.",
    "ai assistant": "I am your dedicated Audnix AI Assistant, here to provide guidance on all aspects of the platform.",
    "founder": "Audnix was architected by a team of sales operations engineers who realized legacy CRMs were the primary bottleneck to scaling high-ticket offers.",
    "market": "The intelligence layer is designed for high-growth sectors: Agencies, B2B Sales Teams, and Personal Brand Creators.",
    "future": "We are currently developing neural expansion packs that will allow Audnix to handle multi-stage complex negotiation without any human oversight.",
    "roi calculator": "Our ROI modeling tool uses historical industry data to project exactly how much revenue leakage you can recover by automating your follow-ups.",
    "objection mastery": "The Objection Library contains deterministic closing protocols for over 200 common B2B resistance patterns.",
    "automation builder": "You can orchestrate complex logic trees that trigger based on both prospect intent and sentiment shifts."
};

const TypingIndicator = () => (
    <div className="flex gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/5 w-fit">
        {[0, 1, 2].map((i) => (
            <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-blue-500"
            />
        ))}
    </div>
);

export function ExpertChat() {
    const { data: user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: "Hello! I am your Audnix AI Assistant. How can I help you scale today?" }
    ]);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const findPresetAnswer = (query: string) => {
        const lowerQuery = query.toLowerCase();
        for (const key in PRESET_ANSWERS) {
            if (lowerQuery.includes(key)) return PRESET_ANSWERS[key];
        }
        return PRESET_ANSWERS["default"];
    };

    const handleSend = async (customQuery?: string) => {
        const query = customQuery || input;
        if (!query.trim()) return;

        const userMsg: Message = { role: 'user', content: query };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            const response = await fetch('/api/expert-chat/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: query,
                    history: messages.slice(-5),
                    isAuthenticated: !!user
                })
            });

            if (!response.ok) throw new Error("Offline");

            const data = await response.json();
            setIsTyping(false);
            setMessages(prev => [...prev, { role: 'ai', content: data.content }]);
        } catch (error) {
            // Fallback to Preset Answers if API fails
            setTimeout(() => {
                setIsTyping(false);
                const answer = findPresetAnswer(query);
                setMessages(prev => [...prev, { role: 'ai', content: answer }]);
            }, 800);
        }
    };

    return (
        <>
            <AnimatePresence>
                {(!isOpen || isMinimized) && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => {
                            setIsOpen(true);
                            setIsMinimized(false);
                        }}
                        className="fixed md:bottom-10 md:right-10 bottom-6 right-6 z-[100] w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-xl hover:bg-blue-700 transition-all"
                    >
                        <MessageCircle className="w-8 h-8 text-white" />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                        animate={isMinimized
                            ? { opacity: 1, y: 550, scale: 0.8 }
                            : { opacity: 1, y: 0, scale: 1 }
                        }
                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                        className="fixed md:bottom-10 md:right-10 bottom-6 right-6 z-[100] w-[400px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[80vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-gray-100"
                    >
                        {/* Header */}
                        <div className="p-6 bg-blue-600 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm">Audnix AI Assistant</h4>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                        <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <Minus className="w-4 h-4 text-white" />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`
                                        max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed
                                        ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm'}
                                    `}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            {isTyping && <TypingIndicator />}
                        </div>

                        {/* Suggestions */}
                        {!isTyping && messages.length < 3 && (
                            <div className="px-6 pb-2 flex flex-wrap gap-2">
                                {SUGGESTED_QUESTIONS.map((q) => (
                                    <button
                                        key={q.label}
                                        onClick={() => handleSend(q.query)}
                                        className="px-3 py-1.5 rounded-lg bg-gray-100 text-[10px] font-bold text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center gap-1.5"
                                    >
                                        <q.icon className="w-3 h-3" />
                                        {q.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-6 bg-white border-t border-gray-100">
                            <div className="flex gap-3 items-center">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-100 px-5 h-12 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-800"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={isTyping || !input.trim()}
                                    className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
