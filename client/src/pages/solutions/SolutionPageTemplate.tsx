import { motion } from "framer-motion";
import { Navigation } from "@/components/landing/Navigation";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Shield, Zap, TrendingUp, Globe, Database, MessageSquare } from "lucide-react";
import { CookieConsent } from "@/components/landing/CookieConsent";

interface SolutionPageProps {
    title: string;
    subtitle: string;
    description: string;
    features: { title: string; desc: string; icon: any }[];
    useCases: string[];
    metrics: { label: string; value: string; sub: string }[];
    heroImage?: string;
}

export function SolutionPageTemplate({ title, subtitle, description, features, useCases, metrics }: SolutionPageProps) {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-black">
            <Navigation />

            <main>
                {/* Hero Section */}
                <section className="pt-40 pb-20 px-6 relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none -z-10" />

                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
                                {subtitle}
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] uppercase">
                                {title.split(' ').map((word, i) => (
                                    <span key={i} className={i === title.split(' ').length - 1 ? "text-primary block" : "block"}>{word} </span>
                                ))}
                            </h1>
                            <p className="text-white/50 text-xl font-medium leading-relaxed max-w-xl">
                                {description}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/auth">
                                    <Button size="lg" className="h-16 px-10 rounded-2xl bg-primary text-black font-black uppercase tracking-widest hover:bg-primary/90 transition-all">
                                        Initialize Protocol <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </Link>
                                <Link href="/#calc">
                                    <Button size="lg" className="h-16 px-10 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                        View ROI Model
                                    </Button>
                                </Link>
                            </div>

                            <div className="pt-10 flex items-center gap-8 text-white/20">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                    <Shield className="w-4 h-4" /> Official Meta API
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                    <Zap className="w-4 h-4" /> &lt; 2m Response Latency
                                </div>
                            </div>
                        </motion.div>

                        {/* Metrics Cloud */}
                        <div className="grid grid-cols-2 gap-6">
                            {metrics.map((metric, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + (i * 0.1) }}
                                    className="glass-premium p-8 rounded-[2.5rem] border-white/5 space-y-2"
                                >
                                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{metric.label}</p>
                                    <p className="text-5xl font-black text-white tracking-tighter">{metric.value}</p>
                                    <p className="text-primary text-[10px] font-black uppercase tracking-widest">{metric.sub}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features / Breakdown */}
                <section className="py-40 px-6 bg-white/[0.01]">
                    <div className="max-w-7xl mx-auto space-y-32">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">Engineered for <span className="text-primary">Performance.</span></h2>
                            <p className="text-white/40 text-lg font-medium">Standard outreach is dead. Autonomous intelligence is the only path forward.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-12">
                            {features.map((feature, i) => (
                                <div key={i} className="space-y-6 group">
                                    <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:border-primary/50 transition-all duration-500">
                                        <feature.icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tight uppercase">{feature.title}</h3>
                                    <p className="text-white/50 text-sm font-medium leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Use Cases / Validation */}
                <section className="py-40 px-6">
                    <div className="max-w-5xl mx-auto glass-premium p-16 rounded-[4rem] border-white/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />
                        <div className="relative z-10 grid md:grid-cols-2 gap-16">
                            <div className="space-y-8">
                                <h3 className="text-4xl font-black tracking-tighter uppercase">Operational <br /> <span className="text-primary">Continuity.</span></h3>
                                <p className="text-white/50 font-medium">Deploying Audnix means your sales engine never sleeps. It handles the manual labor of 10 SDRs while maintaining a 5-star brand identity.</p>
                            </div>
                            <div className="space-y-6">
                                {useCases.map((useCase, i) => (
                                    <div key={i} className="flex items-center gap-4 text-white font-bold uppercase tracking-tight text-sm">
                                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                                        {useCase}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-40 px-6 text-center space-y-12">
                    <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9]">Start Your <br /> <span className="text-primary text-6xl md:text-9xl">Evolution.</span></h2>
                    <Link href="/auth">
                        <Button size="lg" className="h-20 px-16 rounded-3xl bg-white text-black font-black uppercase tracking-widest hover:bg-white/90 transition-all text-lg shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                            Initialize Access
                        </Button>
                    </Link>
                </section>
            </main>

            <CookieConsent />
        </div>
    );
}
