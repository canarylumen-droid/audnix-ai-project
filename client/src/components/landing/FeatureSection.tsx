import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import {
    Mic, BrainCircuit, Clock, AlertTriangle,
    Zap, Search, MessageSquare, Target,
    Activity, BarChart3, ShieldCheck, Waves
} from "lucide-react";

interface Feature {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    mockupType: 'voice' | 'intent' | 'timing' | 'risk';
}

const FEATURES: Feature[] = [
    {
        id: "01",
        title: "Voice Note Intelligence",
        description: "Audnix doesn't just read text. It listens to Voice Notes, extracts sentiment, and adapts its reply tone instantly using neural acoustic modeling.",
        icon: Mic,
        color: "#3b82f6",
        mockupType: 'voice'
    },
    {
        id: "02",
        title: "Real-Time Intent Check",
        description: "Every reply is analyzed against 110+ objection scenarios and buying signals before a single word is sent back to the prospect.",
        icon: BrainCircuit,
        color: "#10b981",
        mockupType: 'intent'
    },
    {
        id: "03",
        title: "Predictive Timing",
        description: "Uses 'Human-Like Delays' and checks user activity logs to respond exactly when they are most likely to convert in their timezone.",
        icon: Clock,
        color: "#f59e0b",
        mockupType: 'timing'
    },
    {
        id: "04",
        title: "Churn & Drop-off Risk",
        description: "Identifies leads losing interest and automatically deploys a Re-Engagement Protocol to recover the sale before they ghost.",
        icon: AlertTriangle,
        color: "#ef4444",
        mockupType: 'risk'
    }
];

export function FeatureSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // We want 4 steps, so 0 to 1 progress maps to 0-3 index
    const activeIndex = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [0, 0, 1, 2, 3]);
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

    return (
        <section ref={containerRef} className="relative bg-black min-h-[400vh]">
            <div className="sticky top-0 h-screen w-full flex flex-col lg:flex-row items-center justify-center overflow-hidden">

                {/* Visual Side (Mockup) - Pinned to the Left/Right based on balance */}
                <div className="w-full lg:w-1/2 h-full flex items-center justify-center relative p-8 md:p-12 lg:order-2">
                    <div className="relative w-full aspect-video lg:aspect-square max-w-2xl bg-[#0a0f1a] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden group">
                        <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />

                        <div className="absolute inset-0 p-8 md:p-12 flex flex-col">
                            {/* Visual Header */}
                            <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                                        <Zap className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Neural Analysis</p>
                                        <motion.h4
                                            key={activeIndex.get()}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-white font-black uppercase tracking-tight"
                                        >
                                            {FEATURES[Math.min(Math.floor(activeIndex.get()), 3)].title}
                                        </motion.h4>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active State</span>
                                </div>
                            </div>

                            {/* Dynamic Mockup Content */}
                            <div className="flex-1 flex items-center justify-center">
                                <VisualFeatureContent activeIndex={activeIndex} />
                            </div>

                            {/* System Status */}
                            <div className="mt-8 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/30">
                                <span>Inference Latency: 42ms</span>
                                <span>Core Load: 12%</span>
                            </div>
                        </div>

                        {/* Hover Glow */}
                        <motion.div
                            style={{
                                backgroundColor: useTransform(smoothProgress,
                                    [0, 0.33, 0.66, 1],
                                    [FEATURES[0].color, FEATURES[1].color, FEATURES[2].color, FEATURES[3].color]
                                )
                            }}
                            className="absolute -inset-20 blur-[150px] opacity-[0.08] rounded-full -z-20 pointer-events-none"
                        />
                    </div>
                </div>

                {/* Text Side - Pinned and fading in/out */}
                <div className="w-full lg:w-1/2 h-full flex flex-col justify-center px-8 md:px-20 lg:px-40 relative z-20 lg:order-1">
                    <div className="max-w-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-12 inline-block"
                        >
                            Engineered To Win
                        </motion.div>

                        <div className="relative h-[400px]">
                            {FEATURES.map((feature, idx) => (
                                <FeatureItem
                                    key={feature.id}
                                    feature={feature}
                                    index={idx}
                                    progress={smoothProgress}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function FeatureItem({ feature, index, progress }: { feature: Feature; index: number; progress: any }) {
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
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
                    {feature.title}
                </h3>
            </div>

            <p className="text-white/40 text-xl font-bold leading-relaxed">
                {feature.description}
            </p>

            <div className="pt-8">
                <div className="inline-flex items-center gap-2 group cursor-pointer">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary group-hover:mr-2 transition-all">Documentation</span>
                    <Zap className="w-4 h-4 text-primary" />
                </div>
            </div>
        </motion.div>
    );
}

function VisualFeatureContent({ activeIndex }: { activeIndex: any }) {
    const [index, setIndex] = React.useState(0);

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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full"
                >
                    {index === 0 && <VoiceMockup />}
                    {index === 1 && <IntentMockup />}
                    {index === 2 && <TimingMockup />}
                    {index === 3 && <RiskMockup />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function VoiceMockup() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-12">
            <div className="flex items-end gap-1.5 h-20">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{ height: ["20%", "100%", "30%", "80%", "20%"] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                        className="w-2 bg-blue-500/50 rounded-full"
                    />
                ))}
            </div>
            <div className="space-y-4 w-full max-w-sm">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Waves className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                        <div className="h-2 w-full bg-white/5 rounded-full mb-2" />
                        <div className="h-2 w-2/3 bg-white/5 rounded-full" />
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Acoustic Logic Pattern Identified</p>
                </div>
            </div>
        </div>
    );
}

function IntentMockup() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-8">
            <div className="grid grid-cols-2 gap-4 w-full">
                {[
                    { label: "Pricing Objection", val: "94%" },
                    { label: "Competitor Comparison", val: "12%" },
                    { label: "Trust Signal", val: "88%" },
                    { label: "Decision Power", val: "75%" }
                ].map((item, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-3">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{item.label}</p>
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-black text-white">{item.val}</span>
                            <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: item.val }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className="h-full bg-emerald-500"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="py-4 px-8 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">High Intent Detected :: Ready for Close</p>
            </div>
        </div>
    );
}

function TimingMockup() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-12">
            <div className="relative">
                <Clock className="w-32 h-32 text-fuchsia-500/20" />
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                    className="absolute inset-0 border-t-2 border-fuchsia-500 rounded-full"
                />
            </div>
            <div className="grid grid-cols-3 gap-8 w-full max-w-md">
                {[
                    { state: "Activity", val: "Online" },
                    { state: "Delay", val: "4m 12s" },
                    { state: "Optimum", val: "NOW" }
                ].map(m => (
                    <div key={m.state} className="text-center">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">{m.state}</p>
                        <p className={`text-xs font-black ${m.val === 'NOW' ? 'text-fuchsia-500 animate-pulse' : 'text-white'}`}>{m.val}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RiskMockup() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
            <div className="w-full space-y-4">
                {[1, 2, 3].map(i => (
                    <motion.div
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-5 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <span className="text-xs font-black text-white uppercase tracking-tight">Lead Interest Decay Detected</span>
                        </div>
                        <span className="text-[9px] font-black text-red-500">Risk: {90 - (i * 10)}%</span>
                    </motion.div>
                ))}
            </div>
            <div className="w-full p-8 rounded-[2.5rem] bg-gradient-to-r from-red-500/20 to-transparent border border-red-500/30 flex items-center justify-between">
                <div>
                    <h5 className="text-white font-black uppercase text-xs">Re-Engagement Protocol</h5>
                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-1">Deploying autonomous recovery script</p>
                </div>
                <Zap className="w-8 h-8 text-red-500 animate-bounce" />
            </div>
        </div>
    );
}
