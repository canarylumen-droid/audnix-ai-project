import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageCircle,
    X,
    Send,
    Bot,
    ShieldCheck,
    Sparkles,
    ChevronDown,
    Minus,
    ArrowUpRight,
    Headphones,
    Brain,
    Rocket,
    Globe,
    Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { Link } from "wouter";

interface Message {
    role: 'ai' | 'user';
    content: string;
}

const SUGGESTED_QUESTIONS = [
    { label: "How does it scale?", icon: Globe, query: "Explain the global scaling architecture and multi-channel orchestration." },
    { label: "Book a demo", icon: Rocket, query: "I want to see a live demo of the closer engine in action." },
    { label: "Pricing tiers", icon: Sparkles, query: "What are the different pricing tiers and enterprise options?" },
    { label: "Support link", icon: Headphones, query: "How do I contact support or get technical help?" }
];

const TypingIndicator = () => (
    <div className="flex gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/5 w-fit">
        {[0, 1, 2].map((i) => (
            <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-primary"
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
        { role: 'ai', content: "Neural Interface Established. I am the Audnix Architect. How can I help you deploy autonomous sales intelligence today?" }
    ]);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-popup after 10 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isOpen && !sessionStorage.getItem('chat_interacted')) {
                setIsOpen(true);
            }
        }, 10000);
        return () => clearTimeout(timer);
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (customQuery?: string) => {
        const query = customQuery || input;
        if (!query.trim()) return;

        sessionStorage.setItem('chat_interacted', 'true');
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
                    history: messages.slice(-5), // Send last 5 for context
                    isAuthenticated: !!user,
                    userEmail: user?.email
                })
            });

            const data = await response.json();
            setIsTyping(false);
            setMessages(prev => [...prev, { role: 'ai', content: data.content }]);
        } catch (error) {
            console.error("Chat failure:", error);
            setIsTyping(false);
            setMessages(prev => [...prev, { role: 'ai', content: "Protocol interruption detected. Please try re-initializing." }]);
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            setIsOpen(true);
                            setIsMinimized(false);
                        }}
                        className="fixed bottom-10 right-10 z-[100] w-20 h-20 rounded-[2rem] bg-primary flex items-center justify-center shadow-[0_20px_60px_rgba(var(--primary),0.4)] cursor-none group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                        <MessageCircle className="w-8 h-8 text-black relative z-10" />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                            className="absolute -inset-1 border border-white/20 rounded-[2rem] opacity-50"
                        />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9, rotateX: 20 }}
                        animate={isMinimized
                            ? { opacity: 1, y: 550, scale: 0.8, x: 100 }
                            : { opacity: 1, y: 0, scale: 1, rotateX: 0 }
                        }
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className={`fixed bottom-10 right-10 z-[100] w-[450px] max-w-[95vw] h-[650px] glass-premium rounded-[3rem] border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden pointer-events-auto backdrop-blur-3xl`}
                    >
                        {/* Interactive Background Elements */}
                        <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />
                        <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

                        {/* Header */}
                        <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-10 bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    animate={isTyping ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30 relative"
                                >
                                    <Cpu className="w-7 h-7" />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black" />
                                </motion.div>
                                <div>
                                    <h4 className="text-white font-black uppercase tracking-widest text-[12px] flex items-center gap-2">
                                        Architect <span className="text-[10px] py-1 px-2 rounded-lg bg-white/5 text-white/40 border border-white/5">V4.2</span>
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60">NEURAL SYNC ACTIVE</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-none"
                                >
                                    <Minus className="w-5 h-5 text-white/40" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors cursor-none group"
                                >
                                    <X className="w-5 h-5 text-white/40 group-hover:text-primary" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide relative z-10">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`
                                        max-w-[85%] p-6 rounded-[2rem] text-[15px] font-medium leading-relaxed
                                        ${msg.role === 'user'
                                            ? 'bg-primary text-black rounded-tr-none shadow-[0_10px_30px_rgba(var(--primary),0.2)]'
                                            : 'bg-white/[0.03] text-white/90 border border-white/5 rounded-tl-none backdrop-blur-md'}
                                    `}>
                                        {msg.content}

                                        {/* Auto-render action buttons if links detected */}
                                        {msg.role === 'ai' && msg.content.includes('Signup') && !user && (
                                            <div className="mt-6">
                                                <Link href="/auth">
                                                    <Button className="w-full h-12 rounded-xl bg-primary text-black font-black uppercase tracking-widest text-[10px] gap-2">
                                                        Access Protocol <ArrowUpRight className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                        {msg.role === 'ai' && msg.content.includes('Dashboard') && user && (
                                            <div className="mt-6">
                                                <Link href="/dashboard">
                                                    <Button className="w-full h-12 rounded-xl bg-white text-black font-black uppercase tracking-widest text-[10px] gap-2">
                                                        Launch Interface <ArrowUpRight className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {isTyping && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <TypingIndicator />
                                </motion.div>
                            )}
                        </div>

                        {/* Suggestions Layer */}
                        {!isTyping && messages.length < 4 && (
                            <div className="px-8 pb-4 flex flex-wrap gap-2 relative z-10">
                                {SUGGESTED_QUESTIONS.map((q) => (
                                    <motion.button
                                        key={q.label}
                                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)" }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleSend(q.query)}
                                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary transition-all flex items-center gap-2 cursor-none"
                                    >
                                        <q.icon className="w-3 h-3" />
                                        {q.label}
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-8 border-t border-white/5 relative z-10 bg-black/60 shadow-[0_-20px_40px_rgba(0,0,0,0.4)]">
                            <div className="flex gap-4 p-2 bg-white/[0.03] rounded-3xl border border-white/5 focus-within:border-primary/50 transition-all">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Consult with the Architect..."
                                    className="flex-1 bg-transparent px-4 h-14 text-sm font-medium text-white placeholder:text-white/20 outline-none cursor-none"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSend()}
                                    disabled={isTyping || !input.trim()}
                                    className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-primary transition-all shadow-xl cursor-none disabled:opacity-50"
                                >
                                    <Send className="w-6 h-6" />
                                </motion.button>
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/10 italic">
                                Nexus Protocol Active :: v4.28 Stable
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
