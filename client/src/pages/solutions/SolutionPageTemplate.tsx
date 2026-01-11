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
            offset: ["start 90%", "start 40%"]
        });
        const opacity = useTransform(scrollYProgress, [0, 1], [0.15, 1]);
        const color = useTransform(scrollYProgress, [0, 1], ["rgba(255,255,255,0.15)", "rgba(255,255,255,1)"]);
        const textShadow = useTransform(scrollYProgress, [0, 1], ["0 0 0px transparent", "0 0 10px rgba(255,255,255,0.3)"]);

        return (
            <motion.span
                ref={ref}
                initial={{ opacity: 0.15 }}
                whileInView={{
                    opacity: 1,
                    transition: { delay: (index % 10) * 0.05 }
                }}
                viewport={{ once: false, margin: "-10% 0px -20% 0px" }}
                style={{ opacity, color, textShadow }}
                className="transition-all duration-300 hover:text-white hover:bg-[#00d2ff]/20 hover:!opacity-100 hover:shadow-[0_0_20px_rgba(0,210,255,0.4)] px-1 rounded-md cursor-default inline-block"
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
                                className="text-muted-foreground text-xl font-medium leading-relaxed max-w-xl"
                            />

                            <div className="flex flex-wrap gap-4">
                                <Link href="/auth">
                                    <Button size="lg" className="h-14 px-8 rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                                        Initialize Protocol <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </Link>
                                <Link href="/#calc">
                                    <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-2 font-bold uppercase tracking-widest hover:bg-muted transition-all">
                                        View ROI Model
                                    </Button>
                                </Link>
                            </div>

                            <div className="pt-8 flex items-center gap-8 text-muted-foreground">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                                    <Shield className="w-4 h-4 text-primary" /> Verified Infrastructure
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
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
                                    className="p-8 rounded-3xl bg-card border border-border shadow-sm space-y-2 hover:border-primary/20 transition-colors"
                                >
                                    <p className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-widest">{metric.label}</p>
                                    <p className="text-4xl font-bold text-foreground tracking-tight">{metric.value}</p>
                                    <p className="text-primary text-[10px] font-bold uppercase tracking-widest">{metric.sub}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Problem Agitation Section */}
                <section className="py-24 px-6 bg-red-500/[0.02] border-y border-red-500/10">
                    <div className="max-w-4xl mx-auto text-center space-y-12">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                            <AlertTriangle className="w-3 h-3" />
                            CRITICAL FAILURE
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">{problemTitle}</h2>
                        <ScrollHighlightText
                            text={problemText}
                            className="text-lg md:text-xl text-muted-foreground/80 font-medium leading-loose whitespace-pre-line max-w-3xl mx-auto text-left md:text-center"
                        />
                    </div>
                </section>

                {/* Features Breakdown */}
                <section className="py-24 px-6 bg-muted/30 border-y border-border/50">
                    <div className="max-w-7xl mx-auto space-y-20">
                        <div className="text-center space-y-4 max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Engineered for <span className="text-primary">Performance.</span></h2>
                            <p className="text-muted-foreground text-lg font-medium max-w-2xl mx-auto">
                                Standard outreach is dead. Autonomous intelligence is the only path forward for modern growth engines.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {features.map((feature, i) => (
                                <div key={i} className="p-8 rounded-3xl bg-background border border-border hover:border-primary/30 transition-all duration-300 space-y-6 group shadow-sm hover:shadow-md">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <feature.icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold tracking-tight">{feature.title}</h3>
                                    <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Deep Dive Section */}
                <section className="py-24 px-6">
                    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">{deepDiveTitle}</h2>
                            <ScrollHighlightText
                                text={deepDiveText}
                                className="text-muted-foreground text-lg leading-loose whitespace-pre-line font-medium"
                            />
                            <Link href="/auth">
                                <Button variant="outline" className="rounded-full px-8 h-12 font-bold border-2 hover:bg-muted transition-all uppercase tracking-widest text-xs">
                                    Read Technical Docs
                                </Button>
                            </Link>
                        </div>
                        <div className="hidden md:block h-96 bg-muted rounded-3xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <MessageSquare className="w-32 h-32 text-primary/20 group-hover:scale-110 transition-transform duration-500" />
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
