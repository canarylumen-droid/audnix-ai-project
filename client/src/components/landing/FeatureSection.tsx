import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap, Shield, MessageSquare, Target, Cpu, TrendingUp, ChevronRight, Lock, Database } from "lucide-react";

const FEATURES = [
    {
        id: "memory",
        title: "Permanent Active Memory",
        icon: Brain,
        short: "The AI remembers every detail about every lead, forever.",
        description: "Unlike generic ChatGPT wrappers, Audnix uses a stateful vector database (Pinecone) to store lead context. If a lead mentions their budget in June, the AI will remember it in December. No more asking the same questions twice.",
        outcomes: [
            "100% Lead Context Retention",
            "Eliminate 'Bot Amnesia'",
            "Hyper-Personalized Follow-ups"
        ],
        details: [
            "Neural Embedding of Every Interaction",
            "Cross-Channel Knowledge Sync",
            "Automated Prospect Persona Building"
        ]
    },
    {
        id: "objection",
        title: "Dynamic Objection Graph",
        icon: Target,
        short: "Deterministic logic for handling price, time, and trust.",
        description: "We don't leave objections to chance. Our engine uses a 'Decision Tree' architecture that maps out 50+ common objections personalized to your offer. The AI doesn't just 'chat'; it negotiates toward a specific goal.",
        outcomes: [
            "3x Higher Booking Rate",
            "Deflect Price Objections Instantly",
            "Founder-Level Negotiation Logic"
        ],
        details: [
            "Recursive Loop Objection Handling",
            "Sentiment-Triggered Pivot Logic",
            "Custom 'Never-Say' Guardrails"
        ]
    },
    {
        id: "persona",
        title: "Neural Persona Sync",
        icon: Zap,
        short: "An AI that sounds exactly like you (or your best rep).",
        description: "Upload your past emails, DM history, and video transcripts. Audnix clones your vocabulary, slang, and emoji usage. Your fans and leads will feel like they're talking to a human, because the AI is trained on one.",
        outcomes: [
            "Indistinguishable from Human",
            "Maintains Brand Identity 24/7",
            "Scalable 1-on-1 Intimacy"
        ],
        details: [
            "Style-Transfer Neural Modeling",
            "Slang & Terminology Customization",
            "Variable Latency (Natural Typing Speed)"
        ]
    },
    {
        id: "safety",
        title: "Deterministic Safety Layer",
        icon: Shield,
        short: "Zero risk of hallucinations or prompt injection.",
        description: "Enterprise-grade guardrails ensure the AI never makes false promises, never quotes wrong prices, and never gets 'tricked' into saying something offensive. We use a secondary 'Validator' LLM to check every message.",
        outcomes: [
            "100% Compliance Guarantee",
            "Zero Brand Damage Risk",
            "Automated Message Validation"
        ],
        details: [
            "Dual-Model Verification Flow",
            "PII (Sensitive Data) Masking",
            "Strict Output Boundary Enforcement"
        ]
    },
    {
        id: "omnichannel",
        title: "Omnichannel Intelligence",
        icon: MessageSquare,
        short: "One brain, spreading across all lead sources.",
        description: "Whether the lead comes from an Instagram DM, a LinkedIn message, or a Cold Email, Audnix maintains a single unified record. If they move from IG to Email, the conversation continues seamlessly.",
        outcomes: [
            "Unified Lead Journey",
            "Zero Lead Wastage",
            "Cross-Platform Retargeting"
        ],
        details: [
            "Direct Instagram/Meta API Integration",
            "SMTP/IMAP Smart Sync",
            "Real-time CRM Data Streaming"
        ]
    },
    {
        id: "closing",
        title: "High-Ticket Closer Protocol",
        icon: TrendingUp,
        short: "Qualified meetings only. No tire-kickers.",
        description: "The goal is ROI. The AI acts as a sophisticated SDR, grilling leads on their budget, timeline, and decision-making power before ever presenting your calendar link. It filters the noise so you only talk to buyers.",
        outcomes: [
            "10-20 Hours Saved Weekly",
            "100% Calendar Efficiency",
            "Automatic Lead Scoring"
        ],
        details: [
            "Budget Qualification Logic",
            "Decision Maker Identification",
            "Direct Calendar (Calendly) Booking"
        ]
    }
];

export function FeatureSection() {
    const [activeFeature, setActiveFeature] = useState(FEATURES[0]);

    return (
        <section id="features" className="py-60 px-4 bg-black relative">
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-32">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-12 inline-block shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                    >
                        Neural Architecture
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.85] mb-8 uppercase"
                    >
                        Engineered <br /> To <span className="text-primary">Win.</span>
                    </motion.h2>
                    <p className="text-white/40 text-xl font-medium max-w-2xl mx-auto leading-tight">
                        Generic AI chats are toys. Audnix is an autonomous revenue engine built on a sophisticated neural stack.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Master List */}
                    <div className="space-y-4">
                        {FEATURES.map((feature, i) => (
                            <motion.button
                                key={feature.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                whileHover={{ scale: 1.02, x: 10 }}
                                whileTap={{ scale: 0.98 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5, ease: "circOut" }}
                                onClick={() => setActiveFeature(feature)}
                                className={`w-full text-left p-8 rounded-[2rem] border transition-all duration-500 group relative overflow-hidden ${activeFeature.id === feature.id
                                    ? "bg-primary/10 border-primary/30 shadow-[0_20px_40px_-10px_rgba(0,210,255,0.2)]"
                                    : "bg-white/[0.02] border-white/5 hover:border-white/20"
                                    }`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${activeFeature.id === feature.id ? "bg-primary text-black shadow-[0_0_20px_rgba(0,210,255,0.5)]" : "bg-white/5 text-white/40 group-hover:text-white"
                                        }`}>
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`text-xl font-black uppercase tracking-tight mb-2 ${activeFeature.id === feature.id ? "text-white" : "text-white/40"
                                            }`}>
                                            {feature.title}
                                        </h3>
                                        <p className="text-white/20 text-xs font-bold uppercase tracking-wider line-clamp-1">
                                            {feature.short}
                                        </p>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 transition-all duration-500 ${activeFeature.id === feature.id ? "text-primary opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                                        }`} />
                                </div>
                                {activeFeature.id === feature.id && (
                                    <motion.div
                                        layoutId="feature-active-glint"
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer"
                                    />
                                )}
                            </motion.button>
                        ))}
                    </div>

                    {/* Detail View */}
                    <div className="lg:sticky lg:top-32 perspective-1000">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeFeature.id}
                                initial={{ opacity: 0, rotateY: -10, x: 20 }}
                                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                                exit={{ opacity: 0, rotateY: 10, x: -20 }}
                                whileHover={{ rotateY: 2, rotateX: -2 }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                className="p-12 rounded-[3.5rem] bg-[#050505] border border-white/10 relative overflow-hidden h-full shadow-2xl"
                            >
                                {/* Decorative Glow */}
                                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 blur-[120px] rounded-full -z-10" />
                                <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/5 blur-[120px] rounded-full -z-10" />

                                <div className="space-y-12 relative z-10">
                                    <div className="flex items-center gap-8">
                                        <motion.div
                                            initial={{ scale: 0.8 }}
                                            animate={{ scale: 1 }}
                                            className="w-24 h-24 rounded-[2rem] bg-primary flex items-center justify-center text-black shadow-[0_0_50px_rgba(0,210,255,0.4)]"
                                        >
                                            <activeFeature.icon className="w-12 h-12" />
                                        </motion.div>
                                        <h3 className="text-5xl font-black text-white leading-[0.9] uppercase tracking-tighter">
                                            {activeFeature.title}
                                        </h3>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="h-px w-20 bg-primary/30" />
                                        <p className="text-white/70 text-2xl font-medium leading-tight tracking-tight">
                                            {activeFeature.description}
                                        </p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-12">
                                        <div className="space-y-8 p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/60">Business ROI</h4>
                                            <ul className="space-y-6">
                                                {activeFeature.outcomes.map((item, i) => (
                                                    <motion.li
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.4 + (i * 0.1) }}
                                                        className="flex items-center gap-4 text-sm font-bold text-white group/item"
                                                    >
                                                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(0,210,255,1)]" />
                                                        <span className="group-hover/item:text-primary transition-colors">{item}</span>
                                                    </motion.li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="space-y-8 p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Active Specs</h4>
                                            <ul className="space-y-6">
                                                {activeFeature.details.map((item, i) => (
                                                    <motion.li
                                                        key={i}
                                                        initial={{ opacity: 0, x: 10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.6 + (i * 0.1) }}
                                                        className="flex items-center gap-4 text-xs font-bold text-white/40 leading-relaxed font-mono"
                                                    >
                                                        <Cpu className="w-3 h-3 text-primary/30" />
                                                        {item}
                                                    </motion.li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}
