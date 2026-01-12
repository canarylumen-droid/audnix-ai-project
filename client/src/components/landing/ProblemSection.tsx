import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import {
    AlertCircle, Ghost, Clock, UserX,
    TrendingDown, DollarSign, Activity,
    ShieldAlert, Ban, Timer
} from "lucide-react";

interface Problem {
    id: string;
    title: string;
    desc: string;
    impact: string;
    icon: any;
    color: string;
}

const PROBLEMS: Problem[] = [
    {
        id: "01",
        title: "Response Latency",
        desc: "Creators lose 70% of potential deals because they can't reply instantly. When a high-ticket lead DMs you, waiting hours means they've already moved to the next competitor. Speed is the only currency that matters.",
        impact: "70% Conversion Loss",
        icon: Ghost,
        color: "#ef4444"
    },
    {
        id: "02",
        title: "Operational Burnout",
        desc: "You didn't start an agency to spend 20+ hours a week refreshing DMs. Manual outreach forces you to work IN your business instead of ON it, capping your growth ceiling and destroying creativity.",
        impact: "25+ Hours Lost/Week",
        icon: Clock,
        color: "#f59e0b"
    },
    {
        id: "03",
        title: "Process Gaps",
        desc: "Manual follow-ups are inconsistent. Missing critical touchpoints often results in losing high-intent leads that required multiple interactions to close. Humans forget; Audnix executes.",
        impact: "Missing 80% Follow-ups",
        icon: UserX,
        color: "#3b82f6"
    },
    {
        id: "04",
        title: "Lead Interest Decay",
        desc: "Lead intent drops significantly after the first few minutes of contact. Without instant engagement, your marketing budget is effectively being set on fire every single day.",
        impact: "Inefficient CAC Spend",
        icon: TrendingDown,
        color: "#a855f7"
    }
];

export function ProblemSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const activeIndex = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [0, 0, 1, 2, 3]);
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

    return (
        <section ref={containerRef} className="relative bg-black min-h-[400vh]">
            <div className="sticky top-0 h-screen w-full flex flex-col lg:flex-row items-center justify-center overflow-hidden">

                {/* Left Side: Mockup (Visual) */}
                <div className="w-full lg:w-1/2 h-full flex items-center justify-center relative p-8 md:p-12">
                    <div className="relative w-full aspect-square max-w-2xl bg-[#0a0f1a] rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden group">
                        <div className="absolute inset-0 bg-grid-white/[0.01] -z-10" />

                        <div className="absolute inset-0 p-8 md:p-12 flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                                        <AlertCircle className="w-6 h-6 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Systemic Failure Analysis</p>
                                        <h4 className="text-white font-black uppercase tracking-tight">Pipeline Stress Level</h4>
                                    </div>
                                </div>
                                <div className="px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                                    Critical Risk
                                </div>
                            </div>

                            {/* Dynamic Visual Problem State */}
                            <div className="flex-1 flex items-center justify-center">
                                <VisualProblemContent activeIndex={activeIndex} />
                            </div>

                            {/* Performance Impact */}
                            <div className="mt-8 flex justify-between items-center">
                                <div>
                                    <p className="text-white/20 text-[9px] font-black uppercase tracking-widest">Revenue Leakage</p>
                                    <p className="text-white text-xl font-black mt-1">$142,000 /yr</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white/20 text-[9px] font-black uppercase tracking-widest">Efficiency Gap</p>
                                    <p className="text-red-500 text-xl font-black mt-1">92% Loss</p>
                                </div>
                            </div>
                        </div>

                        {/* Background Atmosphere */}
                        <motion.div
                            style={{
                                background: useTransform(smoothProgress,
                                    [0, 0.33, 0.66, 1],
                                    ["radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 70%)",
                                        "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)",
                                        "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
                                        "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)"]
                                )
                            }}
                            className="absolute -inset-20 opacity-50 rounded-full -z-20 pointer-events-none"
                        />
                    </div>
                </div>

                {/* Right Side: Text (Scrolling) */}
                <div className="w-full lg:w-1/2 h-full flex flex-col justify-center px-8 md:px-20 lg:px-40 relative z-20">
                    <div className="max-w-xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="px-6 py-2 rounded-full bg-red-500/5 border border-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.4em] mb-12 inline-block"
                        >
                            The Scaling Trap
                        </motion.div>

                        <div className="relative h-[400px]">
                            {PROBLEMS.map((problem, idx) => (
                                <ProblemItem
                                    key={problem.id}
                                    problem={problem}
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

function ProblemItem({ problem, index, progress }: { problem: Problem; index: number; progress: any }) {
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
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                    <problem.icon className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
                    {problem.title}
                </h3>
            </div>

            <p className="text-white/40 text-xl font-bold leading-relaxed">
                {problem.desc}
            </p>

            <div className="pt-8 flex items-center gap-6">
                <div>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Performance Impact</p>
                    <p className="text-red-500 text-lg font-black uppercase">{problem.impact}</p>
                </div>
                <div className="w-px h-12 bg-white/5" />
                <CircleImpact index={index} />
            </div>
        </motion.div>
    );
}

function CircleImpact({ index }: { index: number }) {
    return (
        <div className="flex gap-1.5">
            {[...Array(4)].map((_, i) => (
                <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors duration-500 ${i <= index ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-white/5'}`}
                />
            ))}
        </div>
    );
}

function VisualProblemContent({ activeIndex }: { activeIndex: any }) {
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
                    initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full"
                >
                    {index === 0 && <LatencyMockup />}
                    {index === 1 && <BurnoutMockup />}
                    {index === 2 && <GapsMockup />}
                    {index === 3 && <DecayMockup />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function LatencyMockup() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-12">
            <div className="relative w-48 h-48 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-0 border-4 border-dashed border-red-500/20 rounded-full"
                />
                <Timer className="w-20 h-20 text-red-100/10" />
                <p className="absolute text-3xl font-black text-red-500">6h 12m</p>
            </div>
            <div className="text-center space-y-2">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Lead Response Latency Threshold</p>
                <div className="h-1.5 w-64 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "95%" }}
                        className="h-full bg-red-500"
                    />
                </div>
            </div>
        </div>
    );
}

function BurnoutMockup() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-8">
            <div className="grid grid-cols-2 gap-4 w-full">
                {[
                    { label: "Energy Level", val: "12%" },
                    { label: "Admin Overhead", val: "94%" },
                    { label: "Creative Time", val: "4%" },
                    { label: "DM Re-checking", val: "100%" }
                ].map((item, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-col justify-between h-32">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{item.label}</p>
                        <span className={`text-2xl font-black ${item.val === '100%' || item.val === '94%' ? 'text-red-500' : 'text-white'}`}>{item.val}</span>
                    </div>
                ))}
            </div>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none font-mono">Status: Critical Exhaustion</p>
        </div>
    );
}

function GapsMockup() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
            <div className="w-full space-y-4">
                {[
                    { label: "Follow-up #1", status: "MISSING", color: "red" },
                    { label: "Follow-up #2", status: "MISSING", color: "red" },
                    { label: "Price Proposal", status: "LOST", color: "red" }
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3], x: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                        className="p-5 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                            <span className="text-xs font-black text-white uppercase">{item.label}</span>
                        </div>
                        <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-full">{item.status}</span>
                    </motion.div>
                ))}
            </div>
            <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-red-500" />
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Logic Continuity Breakage: 84%</span>
            </div>
        </div>
    );
}

function DecayMockup() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-8">
            <div className="relative w-full h-48 bg-white/5 rounded-3xl p-8 overflow-hidden border border-white/5">
                <svg className="w-full h-full overflow-visible">
                    <motion.path
                        d="M 0 0 Q 100 0, 200 150 T 400 200"
                        fill="none"
                        stroke="rgba(239,68,68,0.5)"
                        strokeWidth="4"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </svg>
                <div className="absolute top-8 left-8">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Intent Level</p>
                    <p className="text-xl font-black text-white">100%</p>
                </div>
                <div className="absolute bottom-8 right-8 text-right">
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Abandonment</p>
                    <p className="text-xl font-black text-red-500">92%</p>
                </div>
            </div>
            <div className="flex gap-4">
                <Ban className="w-8 h-8 text-red-500/20" />
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-2">Marketing Budget Decay Active</p>
            </div>
        </div>
    );
}
