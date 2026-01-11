import React, { useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Navigation } from "@/components/landing/Navigation";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Shield, Zap, Target, AlertTriangle, ChevronDown, MessageSquare } from "lucide-react";
import { CookieConsent } from "@/components/landing/CookieConsent";


interface FAQItem {
    question: string;
    answer: string;
}

interface SolutionPageProps {
    title: string;
    subtitle: string;
    description: string;
    features: { title: string; desc: string; icon: any }[];
    useCases: string[];
    metrics: { label: string; value: string; sub: string }[];
    problemTitle: string;
    problemText: string;
    deepDiveTitle: string;
    deepDiveText: string;
    faqs: FAQItem[];
    heroImage?: string;
}

export function SolutionPageTemplate({
    title,
    subtitle,
    description,
    features,
    useCases,
    metrics,
    problemTitle,
    problemText,
    deepDiveTitle,
    deepDiveText,
    faqs
}: SolutionPageProps) {
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    // Custom text reveal component for scrolling highlights
    const ScrollHighlightText = ({ text, className }: { text: string, className?: string }) => {
        const words = text.split(" ");
        return (
            <p className={className}>
                {words.map((word, i) => (
                    <Word key={i} index={i}>{word} </Word>
                ))}
            </p>
        );
    };

    const Word = ({ children, index }: { children: React.ReactNode, index: number }) => {
        const ref = React.useRef(null);
        const { scrollYProgress } = useScroll({
            target: ref,
            offset: ["start 90%", "start 50%"]
        });
        const opacity = useTransform(scrollYProgress, [0, 1], [0.2, 1]);
        const color = useTransform(scrollYProgress, [0, 1], ["rgba(255,255,255,0.2)", "rgba(255,255,255,1)"]);

        return (
            <motion.span
                ref={ref}
                style={{ opacity, color }}
                className="transition-colors duration-300 px-1 inline-block"
            >
                {children}
            </motion.span>
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
            <Navigation />

            <main>
                {/* Hero Section */}
                <section className="pt-40 pb-24 px-6 relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none -z-10" />

                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/50 border border-border text-primary text-[10px] font-bold uppercase tracking-[0.3em]">
                                <Target className="w-3 h-3" />
                                {subtitle}
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
                                {title.split(' ').map((word, i) => (
                                    <span key={i} className={i === title.split(' ').length - 1 ? "text-primary block" : "inline"}>{word} </span>
                                ))}
                            </h1>
                            <ScrollHighlightText
                                text={description}
                                className="text-muted-foreground text-xl font-medium leading-relaxed max-w-xl text-left"
                            />

                            <div className="flex flex-wrap gap-4">
                                <Link href="/auth">
                                    <Button size="lg" className="h-14 px-8 rounded-full bg-primary text-black font-black uppercase tracking-widest shadow-[0_0_30px_rgba(0,210,255,0.3)] hover:scale-105 transition-all text-xs">
                                        Initialize Protocol <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </Link>
                                <Link href="/#calc">
                                    <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-white/10 bg-white/5 font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white text-xs backdrop-blur-md">
                                        View ROI Model
                                    </Button>
                                </Link>
                            </div>

                            <div className="pt-8 flex items-center gap-8 text-muted-foreground border-t border-white/5">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                                    <Shield className="w-4 h-4 text-emerald-500" /> Verified Infrastructure
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                                    <Zap className="w-4 h-4 text-primary" /> &lt; 2m Response Latency
                                </div>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-2 gap-6">
                            {metrics.map((metric, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + (i * 0.1) }}
                                    className="p-8 rounded-[2rem] bg-[#0d1117] border border-white/5 hover:border-primary/20 transition-colors group"
                                >
                                    <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mb-2">{metric.label}</p>
                                    <p className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 group-hover:text-primary transition-colors">{metric.value}</p>
                                    <p className="text-primary text-[10px] font-black uppercase tracking-widest">{metric.sub}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Problem Agitation Section */}
                <section className="py-32 px-6 bg-[#050505] border-y border-white/5">
                    <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-20 items-start">
                        <div className="space-y-8 sticky top-32">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                <AlertTriangle className="w-3 h-3" />
                                CRITICAL FAILURE
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-[0.9] uppercase">{problemTitle}</h2>
                            <p className="text-white/40 text-sm font-bold uppercase tracking-widest">
                                The bottleneck in your current operation.
                            </p>
                        </div>

                        <div className="pl-8 border-l border-white/10">
                            <ScrollHighlightText
                                text={problemText}
                                className="text-lg md:text-2xl text-white/60 font-medium leading-loose whitespace-pre-line text-left"
                            />
                        </div>
                    </div>
                </section>

                {/* Features Breakdown */}
                <section className="py-32 px-6 bg-black">
                    <div className="max-w-7xl mx-auto space-y-20">
                        <div className="text-center space-y-6 max-w-3xl mx-auto mb-20">
                            <h2 className="text-3xl md:text-6xl font-black tracking-tighter text-white uppercase">Engineered for <span className="text-primary">Dominance.</span></h2>
                            <p className="text-white/40 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                                Standard outreach is dead. Autonomous intelligence is the only path forward for modern growth engines.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {features.map((feature, i) => (
                                <div key={i} className="p-10 rounded-[2.5rem] bg-[#0d1117] border border-white/5 hover:border-primary/30 transition-all duration-500 space-y-8 group hover:-translate-y-2">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-primary group-hover:text-black transition-all duration-500">
                                        <feature.icon className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black tracking-tight text-white uppercase">{feature.title}</h3>
                                        <p className="text-white/40 text-base font-medium leading-relaxed">
                                            {feature.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Deep Dive Section */}
                <section className="py-32 px-6 border-t border-white/5 bg-[#050505]">
                    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-start">
                        <div className="space-y-10 pl-8 border-l border-white/10">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase leading-none">{deepDiveTitle}</h2>
                            <ScrollHighlightText
                                text={deepDiveText}
                                className="text-lg md:text-xl text-white/60 leading-loose whitespace-pre-line font-medium text-left"
                            />
                            <Link href="#">
                                <Button variant="ghost" className="rounded-full px-0 font-black uppercase tracking-widest text-xs text-primary hover:text-white hover:bg-transparent transition-colors group">
                                    Read Technical Documentation <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                        <div className="hidden md:flex h-[600px] bg-[#0d1117] rounded-[3rem] border border-white/5 relative overflow-hidden flex-col group">
                            {/* Diagram Header */}
                            <div className="px-8 py-6 border-b border-white/5 flex items-center gap-4">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                                </div>
                                <span className="text-white/30 text-xs font-mono">Neural Operations Diagram</span>
                            </div>

                            {/* Diagram Content */}
                            <div className="flex-1 p-8 relative">
                                {/* Grid Background */}
                                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

                                {/* Central Brain Node */}
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center shadow-[0_0_60px_rgba(0,210,255,0.3)]"
                                >
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-primary">AI</div>
                                        <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Neural Core</div>
                                    </div>
                                </motion.div>

                                {/* Client Nodes - Orbiting around the core */}
                                {['Client A', 'Client B', 'Client C', 'Client D'].map((client, i) => {
                                    const angle = (i * 90) * (Math.PI / 180);
                                    const radius = 180;
                                    const x = Math.cos(angle) * radius;
                                    const y = Math.sin(angle) * radius;

                                    return (
                                        <motion.div
                                            key={client}
                                            initial={{ opacity: 0, scale: 0 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.15 }}
                                            className="absolute top-1/2 left-1/2 w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/30 transition-colors"
                                            style={{
                                                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                                            }}
                                        >
                                            <div className="text-center">
                                                <MessageSquare className="w-5 h-5 text-white/40 mx-auto mb-1" />
                                                <div className="text-[9px] font-bold text-white/60 uppercase">{client}</div>
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {/* Connection Lines - Animated dashes */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="rgba(0,210,255,0.1)" />
                                            <stop offset="50%" stopColor="rgba(0,210,255,0.4)" />
                                            <stop offset="100%" stopColor="rgba(0,210,255,0.1)" />
                                        </linearGradient>
                                    </defs>
                                    {[0, 90, 180, 270].map((angle, i) => {
                                        const rad = angle * (Math.PI / 180);
                                        const x1 = '50%';
                                        const y1 = '50%';
                                        const x2 = `calc(50% + ${Math.cos(rad) * 120}px)`;
                                        const y2 = `calc(50% + ${Math.sin(rad) * 120}px)`;
                                        return (
                                            <line
                                                key={i}
                                                x1={x1} y1={y1}
                                                x2={x2} y2={y2}
                                                stroke="url(#lineGradient)"
                                                strokeWidth="2"
                                                strokeDasharray="6 4"
                                                className="animate-pulse"
                                            />
                                        );
                                    })}
                                </svg>

                                {/* Bottom Legend */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-6 text-[9px] font-bold uppercase tracking-widest text-white/30">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        Isolated Brain
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-white/30" />
                                        Sub-Account
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-24 px-6 bg-muted/20 border-y border-border/50">
                    <div className="max-w-3xl mx-auto space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Technical FAQs</h2>
                            <p className="text-muted-foreground">Everything you need to know about implementation.</p>
                        </div>
                        <div className="space-y-4">
                            {faqs.map((faq, i) => (
                                <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                                    <button
                                        className="w-full p-6 text-left flex items-center justify-between font-bold"
                                        onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                                    >
                                        {faq.question}
                                        <ChevronDown className={`w-5 h-5 transition-transform ${openFaqIndex === i ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {openFaqIndex === i && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="px-6 pb-6 text-muted-foreground leading-relaxed text-sm whitespace-pre-line"
                                            >
                                                {faq.answer}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>

                        {/* Support Point */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="p-10 rounded-[2rem] bg-primary/5 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-8 group"
                        >
                            <div className="text-center md:text-left">
                                <h4 className="text-xl font-bold mb-2">Still need clarity?</h4>
                                <p className="text-muted-foreground text-sm font-medium">Our strategy team is available 24/7 to help you.</p>
                            </div>
                            <button
                                onClick={() => document.getElementById('expert-chat-trigger')?.click()}
                                className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px] hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Chat with an expert
                            </button>
                        </motion.div>
                    </div>
                </section>

                <section className="py-32 px-6 text-center space-y-8">
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">Start Your <br /> <span className="text-primary">Evolution.</span></h2>
                    <p className="text-muted-foreground max-w-xl mx-auto text-lg font-medium">Join the top 1% of agencies and creators who have automated their revenue growth.</p>
                    <Link href="/auth">
                        <Button size="lg" className="h-16 px-12 rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 transition-all text-sm">
                            Initialize Access
                        </Button>
                    </Link>
                </section>
            </main>

            <CookieConsent />
        </div>
    );
}
