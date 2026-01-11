import { motion, AnimatePresence } from "framer-motion";
import { Navigation } from "@/components/landing/Navigation";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Shield, Zap, Target, AlertTriangle, ChevronDown, MessageSquare } from "lucide-react";
import { CookieConsent } from "@/components/landing/CookieConsent";
import { useState } from "react";

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
                            <p className="text-muted-foreground text-xl font-medium leading-relaxed max-w-xl">
                                {description}
                            </p>
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
                        <div className="text-lg md:text-xl text-muted-foreground/80 font-medium leading-loose whitespace-pre-line max-w-3xl mx-auto text-left md:text-center">
                            {problemText}
                        </div>
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
                            <div className="text-muted-foreground text-lg leading-loose whitespace-pre-line font-medium">
                                {deepDiveText}
                            </div>
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
