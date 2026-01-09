import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Database, Activity, Zap, MessageSquare, ArrowRight, CheckCircle2, Terminal, Cpu } from "lucide-react";
import { Link } from "wouter";

const STEPS = [
    {
        title: "Knowledge Sync",
        desc: "Upload brand data or URLs. Our system processes your information to understand your tone and engagement requirements instantly.",
        icon: Database,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        tags: ["Data Analysis", "Vector Processing", "Tone Sync"]
    },
    {
        title: "Direct Integration",
        desc: "Link your communication channels and CRM. Audnix maintains active listeners for instant response the moment a lead enters your pipeline.",
        icon: Zap,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        tags: ["Secure OAuth", "Real-time Sync", "CRM Bridge"]
    },
    {
        title: "Rule Configuration",
        desc: "Define your engagement logic and triggers. Set intent thresholds to automate follow-ups or book meetings on your behalf.",
        icon: Activity,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        tags: ["Intent Scoring", "Logic Trees", "Safety Rails"]
    },
    {
        title: "Scale Engagement",
        desc: "The system goes live. It manages interactions, handles objections, and ensures every lead receives a consistent, high-quality response.",
        icon: MessageSquare,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        tags: ["Engagement Monitoring", "Conversion Tracking", "24/7 Operations"]
    }
];

export function HowItWorksSection() {
    const containerRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    return (
        <section ref={containerRef} id="how-it-works" className="py-32 px-4 relative bg-background overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-5 pointer-events-none" />
            <motion.div
                style={{ y: useTransform(scrollYProgress, [0, 1], [0, -200]) }}
                className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none"
            />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12">
                    <div className="max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="px-5 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.3em] inline-block mb-8"
                        >
                            Implementation Workflow
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-5xl md:text-8xl font-bold tracking-tight leading-[0.9] text-foreground"
                        >
                            Seamless <br />
                            <span className="text-primary">Onboarding.</span>
                        </motion.h2>
                    </div>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-muted-foreground text-lg max-w-sm font-medium leading-relaxed pb-6 border-l-2 border-primary/20 pl-8"
                    >
                        A direct four-step process to transition from manual overhead to automated engagement in minutes.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {STEPS.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95, y: 40 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.6 }}
                            className={`p-10 rounded-3xl border ${step.border} bg-card/40 hover:bg-card/60 transition-all group relative overflow-hidden shadow-sm`}
                        >
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-10">
                                    <div className={`w-16 h-16 rounded-2xl ${step.bg} flex items-center justify-center ${step.color} shadow-sm transition-transform duration-500 group-hover:scale-110`}>
                                        <step.icon className="w-8 h-8" />
                                    </div>
                                    <span className="text-8xl font-bold text-muted-foreground/5 leading-none select-none tracking-tighter">0{i + 1}</span>
                                </div>

                                <h3 className="text-2xl font-bold text-foreground mb-6 tracking-tight">
                                    {step.title}
                                </h3>

                                <p className="text-muted-foreground text-sm leading-relaxed font-medium mb-10">
                                    {step.desc}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-10">
                                    {step.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 rounded-full bg-muted border border-border/50 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 group-hover:text-primary transition-colors">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/40">
                                    <div className="flex flex-col gap-1.5">
                                        <Cpu className={`w-3.5 h-3.5 ${step.color} opacity-40`} />
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">Processing</span>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Terminal className={`w-3.5 h-3.5 ${step.color} opacity-40`} />
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">Log Stream</span>
                                    </div>
                                    <div className="flex flex-col gap-1.5 text-right">
                                        <CheckCircle2 className={`w-3.5 h-3.5 ${step.color} opacity-40 ml-auto`} />
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40">Verified</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-32 flex flex-col items-center justify-center">
                    <motion.div
                        animate={{ y: [0, 15, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-px h-24 bg-gradient-to-b from-primary to-transparent mb-10"
                    />
                    <Link href="/auth">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group flex flex-col items-center gap-4"
                        >
                            <div className="text-center">
                                <p className="text-primary text-[10px] font-bold uppercase tracking-[0.4em] mb-4">Start Growing</p>
                                <h4 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight mb-8">Deploy your workspace.</h4>
                            </div>
                            <div className="w-20 h-20 rounded-full border border-border/50 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all duration-500 shadow-md">
                                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-500" />
                            </div>
                        </motion.button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
