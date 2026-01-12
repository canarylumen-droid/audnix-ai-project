import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import {
    Database, Lock, Activity, Zap,
    Shield, Globe, Terminal, Cpu,
    FileJson, MessageSquare
} from "lucide-react";

interface Step {
    id: string;
    title: string;
    headline: string;
    desc: string;
    tech: string[];
    color: string;
}

const STEPS: Step[] = [
    {
        id: "01",
        title: "Sync Your Identity",
        headline: "Upload your brain, not just scripts.",
        desc: "We don't want you to write 100 'If/Then' rules. Instead, simply upload your existing assets: PDF Offers, Past Sales Call Transcripts, and Website URLs. Our neural engine analyzes your tone, pricing structure, and unique selling propositions in seconds using Vector Embedding.",
        tech: ["PDF/Docx Ingestion", "Voice Pattern Analysis", "Semantic Indexing"],
        color: "#3b82f6"
    },
    {
        id: "02",
        title: "Connect Channels",
        headline: "Bank-level secure integration.",
        desc: "Link your Instagram and Email accounts via official O-Auth APIs. We never handle your raw passwords. Once connected, Audnix installs a 'Listener' hook that intercepts DMs and emails in real-time, filtering out spam and prioritizing high-value leads immediately.",
        tech: ["AES-256 Encryption", "Official Meta Partner API", "SMTP Relay"],
        color: "#10b981"
    },
    {
        id: "03",
        title: "Define The Protocol",
        headline: "You set the goal, AI finds the path.",
        desc: "Tell the AI what you want: 'Book a call for anyone with >$5k budget' or 'Sell the $97 course to anyone asking about fitness'. You can also set strict 'Guardrails' (topics to avoid) and 'Never-Say' lists to ensure brand safety at all times.",
        tech: ["Goal-Seeking Agents", "Safety Boundary Logic", "Sentiment Thresholds"],
        color: "#a855f7"
    },
    {
        id: "04",
        title: "Activate Closing Loop",
        headline: "Wake up to revenue, not unread messages.",
        desc: "Turn the system on. The AI begins 'farming' your inbox. It qualifies leads, handles price objections, follows up with 'ghosts' using human-like timing, and sends the final booking link only when the prospect is ready to buy.",
        tech: ["24/7 Runtime", "Auto-Objection Handling", "Revenue Attribution"],
        color: "#00d2ff"
    }
];

export function HowItWorksSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const activeIndex = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [0, 0, 1, 2, 3]);

    // Smoother step progress for animations
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

    return (
        <section ref={containerRef} className="relative bg-black min-h-[400vh] py-20">
            {/* Sticky Background Logic */}
            <div className="sticky top-0 h-screen w-full flex flex-col lg:flex-row items-center justify-center overflow-hidden px-4 md:px-12">

                {/* Left Side: Text Content (Scrolling) */}
                <div className="w-full lg:w-1/2 h-full flex flex-col justify-center relative z-20">
                    <div className="max-w-xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="px-5 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.4em] inline-block mb-12 shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                        >
                            Implementation Protocol
                        </motion.div>

                        <div className="relative h-[400px]">
                            {STEPS.map((step, idx) => (
                                <StepItem
                                    key={step.id}
                                    step={step}
                                    index={idx}
                                    progress={smoothProgress}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Pinned Mockup (Visual) */}
                <div className="w-full lg:w-1/2 h-full flex items-center justify-center relative">
                    <div className="relative w-full aspect-square max-w-2xl">
                        {/* Apple-style Device Frame / Container */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent rounded-[3rem] border border-white/10 shadow-2xl backdrop-blur-3xl overflow-hidden p-8">
                            <div className="absolute inset-0 bg-grid opacity-[0.02]" />

                            {/* Inner Visual Content */}
                            <VisualContent activeIndex={activeIndex} />
                        </div>

                        {/* Decorative Glows */}
                        <motion.div
                            style={{
                                backgroundColor: useTransform(smoothProgress,
                                    [0, 0.33, 0.66, 1],
                                    [STEPS[0].color, STEPS[1].color, STEPS[2].color, STEPS[3].color]
                                )
                            }}
                            className="absolute -inset-20 blur-[120px] opacity-10 rounded-full z-0"
                        />
                    </div>
                </div>
            </div>

            {/* Mobile View (Optional: Simplified for small screens) */}
            <div className="lg:hidden">
                {/* We keep the sticky logic but adjust layouts via Tailwind */}
            </div>
        </section>
    );
}

function StepItem({ step, index, progress }: { step: Step; index: number; progress: any }) {
    const opacity = useTransform(
        progress,
        [index * 0.25 - 0.1, index * 0.25, (index + 1) * 0.25 - 0.1, (index + 1) * 0.25],
        [0, 1, 1, 0]
    );
    const y = useTransform(
        progress,
        [index * 0.25 - 0.1, index * 0.25, (index + 1) * 0.25 - 0.1, (index + 1) * 0.25],
        [40, 0, 0, -40]
    );

    return (
        <motion.div
            style={{ opacity, y }}
            className="absolute inset-x-0 top-0 space-y-6"
        >
            <div className="flex items-center gap-6">
                <span className="text-[120px] font-black text-white/5 leading-none select-none">
                    {step.id}
                </span>
                <div>
                    <h3 className="text-4xl font-black text-white tracking-tighter uppercase">
                        {step.title}
                    </h3>
                    <p className="text-primary font-bold uppercase tracking-widest text-[11px] mt-2">
                        {step.headline}
                    </p>
                </div>
            </div>

            <p className="text-white/40 text-lg font-bold leading-relaxed max-w-lg">
                {step.desc}
            </p>

            <div className="flex flex-wrap gap-3 pt-4">
                {step.tech.map((t) => (
                    <span key={t} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-white/60">
                        {t}
                    </span>
                ))}
            </div>
        </motion.div>
    );
}

function VisualContent({ activeIndex }: { activeIndex: any }) {
    const [index, setIndex] = React.useState(0);

    // Convert transform to state for switching components
    React.useEffect(() => {
        return activeIndex.on("change", (latest: number) => {
            setIndex(Math.floor(latest));
        });
    }, [activeIndex]);

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.1, y: -20 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full flex flex-col"
                >
                    {/* Mockup Header */}
                    <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                                {index === 0 && <Database className="w-6 h-6 text-blue-500" />}
                                {index === 1 && <Lock className="w-6 h-6 text-emerald-500" />}
                                {index === 2 && <Activity className="w-6 h-6 text-purple-500" />}
                                {index === 3 && <Zap className="w-6 h-6 text-primary" />}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Module Active</p>
                                <h4 className="text-white font-black uppercase tracking-tight">
                                    {STEPS[index].title}
                                </h4>
                            </div>
                        </div>
                        <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                            Processing
                        </div>
                    </div>

                    {/* Step-specific Dynamic UI */}
                    <div className="flex-1 flex flex-col justify-center">
                        {index === 0 && <IngestionUI />}
                        {index === 1 && <SecurityUI />}
                        {index === 2 && <ProtocolUI />}
                        {index === 3 && <ClosingUI />}
                    </div>

                    {/* Footer Metrics */}
                    <div className="mt-12 grid grid-cols-3 gap-6 pt-8 border-t border-white/5">
                        {[
                            { label: "Stability", val: "99.9%" },
                            { label: "Latency", val: "42ms" },
                            { label: "Nodes", val: "1.2k" }
                        ].map(m => (
                            <div key={m.label}>
                                <p className="text-white/20 text-[8px] font-black uppercase tracking-widest">{m.label}</p>
                                <p className="text-white text-[11px] font-black">{m.val}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// Sub-components for Mockup States
function IngestionUI() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3], x: [0, 5, 0] }}
                        transition={{ delay: i * 0.2, repeat: Infinity, duration: 3 }}
                        className="h-16 rounded-2xl bg-white/5 border border-white/5 p-4 flex items-center gap-3"
                    >
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <FileJson className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="h-2 w-20 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="h-full bg-blue-500"
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
            <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20">
                <p className="text-[10px] font-mono text-blue-500 mb-2 font-bold uppercase tracking-widest">{">"} Embedding Assets</p>
                <div className="space-y-1.5">
                    <div className="h-1 w-full bg-white/5 rounded-full" />
                    <div className="h-1 w-[80%] bg-white/5 rounded-full" />
                </div>
            </div>
        </div>
    );
}

function SecurityUI() {
    return (
        <div className="flex flex-col items-center justify-center space-y-8">
            <div className="relative">
                <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                    className="w-40 h-40 rounded-full border-2 border-dashed border-emerald-500/30 flex items-center justify-center"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
                    <Shield className="w-12 h-12 text-emerald-500 relative z-10" />
                </div>
            </div>
            <div className="flex gap-4">
                {['AUTH_OK', 'TLS_1.3', 'RSA_4096'].map(t => (
                    <span key={t} className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] font-mono text-emerald-500">
                        {t}
                    </span>
                ))}
            </div>
        </div>
    );
}

function ProtocolUI() {
    return (
        <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-purple-500/5 border border-purple-500/20 font-mono text-[10px] space-y-3">
                <p className="text-purple-500 font-bold uppercase tracking-widest">{">"} Initializing Goal State</p>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                    <span className="text-white/60">TARGET: HIGH_INTENT_BOOKINGS</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                    <span className="text-white/60">GUARDRAIL: NO_PRICING_DMs</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="h-32 rounded-3xl bg-white/5 border border-white/10 p-6 flex flex-col justify-between">
                    <Cpu className="w-6 h-6 text-purple-500" />
                    <p className="text-[12px] font-black text-white">Neural Logic</p>
                </div>
                <div className="h-32 rounded-3xl bg-white/5 border border-white/10 p-6 flex flex-col justify-between text-right">
                    <Globe className="w-6 h-6 text-purple-500 ml-auto" />
                    <p className="text-[12px] font-black text-white">Global Cloud</p>
                </div>
            </div>
        </div>
    );
}

function ClosingUI() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                {[
                    { node: "Lead Identified", time: "12:01", status: "VERIFIED" },
                    { node: "Objection Handled", time: "12:04", status: "CLEARED" },
                    { node: "Booking Sent", time: "12:05", status: "FINAL" }
                ].map((l, i) => (
                    <motion.div
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <MessageSquare className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-[11px] font-black text-white uppercase">{l.node}</span>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-white/20 font-mono">{l.time}</p>
                            <p className="text-[9px] text-primary font-black tracking-widest">{l.status}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
            <div className="h-20 rounded-[2rem] bg-gradient-to-r from-primary/20 to-transparent border border-primary/30 flex items-center px-8 justify-between group overflow-hidden relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-30 transition-opacity" />
                <span className="text-primary font-black uppercase tracking-widest text-[11px] relative z-10">Revenue Cycle Active</span>
                <Zap className="w-6 h-6 text-primary animate-pulse relative z-10" />
            </div>
        </div>
    );
}
