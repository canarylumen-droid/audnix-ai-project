import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Database, Brain, Zap, MessageSquare, ArrowRight, CheckCircle2, Terminal, Cpu } from "lucide-react";
import { Link } from "wouter";

const STEPS = [
    {
        title: "Intelligence Ingestion",
        desc: "Upload brand PDFs or URLs. Our neural engine vectorizes your entire knowledge base, learning your tone and closing logic instantly.",
        icon: Database,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        tags: ["PDF Analysis", "Vector DB", "Tone Sync"]
    },
    {
        title: "Ecosystem Bridge",
        desc: "Link your Email channels and CRM. Audnix deploys persistent IMAP listeners for zero-latency response the moment a lead enters.",
        icon: Zap,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        tags: ["OAuth 2.0", "Zero Latency", "CRM Sync"]
    },
    {
        title: "Autonomous Calibration",
        desc: "Define 'Status Level' and logic triggers. 'If intent > 70%, book call; else provide value PDF'. You scale while it thinks.",
        icon: Brain,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        tags: ["Intent Scoring", "Logic Trees", "Safety Rails"]
    },
    {
        title: "Deterministic Closing",
        desc: "The system goes live. It identifies objections and applies high-status reframes to move prospects towards a conversion autonomously.",
        icon: MessageSquare,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        tags: ["High Status Sales", "Conversion Log", "24/7 Ops"]
    }
];

export function HowItWorksSection() {
    const containerRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    return (
        <section ref={containerRef} id="how-it-works" className="py-40 px-4 relative bg-black overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-10 pointer-events-none" />
            <motion.div
                style={{ y: useTransform(scrollYProgress, [0, 1], [0, -200]) }}
                className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none"
            />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-32 gap-12">
                    <div className="max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.4em] inline-block mb-10"
                        >
                            The Architecture of Autonomy
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-6xl md:text-[8rem] font-black tracking-[-0.05em] leading-[0.85] text-white uppercase italic"
                        >
                            DEPLOYMENT <br />
                            <span className="text-primary not-italic tracking-[-0.08em]">PROTOCOL.</span>
                        </motion.h2>
                    </div>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-white/40 text-xl max-w-sm font-medium leading-relaxed pb-8 italic border-l-2 border-primary/20 pl-8"
                    >
                        A four-step integration process that takes you from lead-leakage to deterministic scaling in under 20 minutes.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {STEPS.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className={`p-12 rounded-[4rem] border ${step.border} bg-white/[0.01] hover:bg-white/[0.03] transition-all group relative overflow-hidden perspective-tilt premium-glow`}
                        >
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-12">
                                    <div className={`w-20 h-20 rounded-[2rem] ${step.bg} flex items-center justify-center ${step.color} shadow-lg transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6`}>
                                        <step.icon className="w-10 h-10" />
                                    </div>
                                    <span className="text-[120px] font-black text-white/[0.03] leading-none select-none italic tracking-tighter">0{i + 1}</span>
                                </div>

                                <h3 className="text-3xl font-black text-white mb-8 uppercase tracking-tighter flex items-center gap-4">
                                    {step.title}
                                </h3>

                                <p className="text-white/40 text-lg leading-relaxed font-bold italic mb-12">
                                    {step.desc}
                                </p>

                                <div className="flex flex-wrap gap-3 mb-10">
                                    {step.tags.map(tag => (
                                        <span key={tag} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-primary transition-colors">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/5">
                                    <div className="flex flex-col gap-2">
                                        <Cpu className={`w-4 h-4 ${step.color} opacity-40`} />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Processing</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Terminal className={`w-4 h-4 ${step.color} opacity-40`} />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Log Stream</span>
                                    </div>
                                    <div className="flex flex-col gap-2 text-right">
                                        <CheckCircle2 className={`w-4 h-4 ${step.color} opacity-40 ml-auto`} />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Verified</span>
                                    </div>
                                </div>
                            </div>

                            {/* Step background number hover effect */}
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        </motion.div>
                    ))}
                </div>

                {/* Final Flow Arrow & CTA */}
                <div className="mt-40 flex flex-col items-center justify-center">
                    <motion.div
                        animate={{ y: [0, 20, 0], scaleY: [1, 1.2, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-0.5 h-32 bg-gradient-to-b from-primary via-primary/50 to-transparent mb-12"
                    />
                    <Link href="/auth">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="group flex flex-col items-center gap-6"
                        >
                            <div className="text-center">
                                <p className="text-primary text-[10px] font-black uppercase tracking-[0.6em] mb-4">Final Protocol Step</p>
                                <h4 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-8 italic">Trigger Deployment.</h4>
                            </div>
                            <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all duration-700 shadow-2xl">
                                <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform duration-700" />
                            </div>
                        </motion.button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
