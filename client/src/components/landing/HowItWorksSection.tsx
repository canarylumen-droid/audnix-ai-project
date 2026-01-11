import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Database, Activity, Zap, MessageSquare, ArrowRight, CheckCircle2, Terminal, Cpu, FileJson, Lock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const STEPS = [
    {
        id: "01",
        title: "Sync Your Identity",
        headline: "Upload your brain, not just scripts.",
        desc: "We don't want you to write 100 'If/Then' rules. Instead, simply upload your existing assets: PDF Offers, Past Sales Call Transcripts, and Website URLs. Our neural engine analyzes your tone, pricing structure, and unique selling propositions in seconds using Vector Embedding.",
        icon: Database,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        tech: ["PDF/Docx Ingestion", "Voice Pattern Analysis", "Semantic Indexing"]
    },
    {
        id: "02",
        title: "Connect Channels",
        headline: "Bank-level secure integration.",
        desc: "Link your Instagram and Email accounts via official O-Auth APIs. We never handle your raw passwords. Once connected, Audnix installs a 'Listener' hook that intercepts DMs and emails in real-time, filtering out spam and prioritizing high-value leads immediately.",
        icon: Lock,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        tech: ["AES-256 Encryption", "Official Meta Partner API", "SMTP Relay"]
    },
    {
        id: "03",
        title: "Define The Protocol",
        headline: "You set the goal, AI finds the path.",
        desc: "Tell the AI what you want: 'Book a call for anyone with >$5k budget' or 'Sell the $97 course to anyone asking about fitness'. You can also set strict 'Guardrails' (topics to avoid) and 'Never-Say' lists to ensure brand safety at all times.",
        icon: Activity,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        tech: ["Goal-Seeking Agents", "Safety Boundary Logic", "Sentiment Thresholds"]
    },
    {
        id: "04",
        title: "Activate Closing Loop",
        headline: "Wake up to revenue, not unread messages.",
        desc: "Turn the system on. The AI begins 'farming' your inbox. It qualifies leads, handles price objections, follows up with 'ghosts' using human-like timing, and sends the final booking link only when the prospect is ready to buy. You just check the dashboard for the $$$ stats.",
        icon: Zap,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        tech: ["24/7 Runtime", "Auto-Objection Handling", "Revenue Attribution"]
    }
];

export function HowItWorksSection() {
    return (
        <section id="how-it-works" className="py-40 px-4 relative bg-background overflow-hidden border-t border-border/50">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-grid opacity-[0.02] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 blur-[200px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-32 max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="px-5 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.3em] inline-block mb-8"
                    >
                        Implementation Protocol
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-8xl font-black tracking-tight leading-[0.9] text-foreground mb-8"
                    >
                        Four Steps To <br />
                        <span className="text-primary">Autonomy.</span>
                    </motion.h2>
                    <p className="text-muted-foreground text-xl font-medium leading-relaxed">
                        No coding. No complex flowcharts. Just connect your data, define your goals, and let the neural engine handle the execution.
                    </p>
                </div>

                <div className="relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="absolute left-[50%] top-0 bottom-0 w-px bg-gradient-to-b from-primary/0 via-primary/20 to-primary/0 hidden lg:block" />

                    <div className="space-y-24">
                        {STEPS.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8 }}
                                className={`flex flex-col lg:flex-row gap-12 lg:gap-24 items-center ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                            >
                                {/* Text Side */}
                                <div className="flex-1 text-center lg:text-left space-y-6">
                                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${step.bg} ${step.color} mb-4 border ${step.border} shadow-[0_0_20px_rgba(0,0,0,0.2)]`}>
                                        <step.icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-4xl font-bold tracking-tight text-foreground">
                                        <span className="text-muted-foreground/30 mr-4 font-black">0{i + 1}.</span>
                                        {step.title}
                                    </h3>
                                    <h4 className="text-lg font-bold text-primary uppercase tracking-wider">{step.headline}</h4>
                                    <p className="text-muted-foreground text-lg leading-relaxed">
                                        {step.desc}
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center lg:justify-start pt-4">
                                        {step.tech.map((tag) => (
                                            <span key={tag} className="px-3 py-1.5 rounded-lg bg-muted border border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Visual Side (Mockup/Graphic) */}
                                <div className="flex-1 w-full">
                                    <div className="aspect-video rounded-[2rem] bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all p-8 flex items-center justify-center shadow-2xl">
                                        <div className="absolute inset-0 bg-grid opacity-[0.04]" />

                                        {/* Abstract Representation of the Step */}
                                        <div className="relative z-10 w-full max-w-[300px] space-y-4">
                                            {[1, 2, 3].map((line) => (
                                                <div key={line} className="h-3 bg-white/10 rounded-full w-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: "0%" }}
                                                        whileInView={{ width: `${Math.random() * 60 + 40}%` }}
                                                        transition={{ delay: 0.5 + (line * 0.2), duration: 1.5, ease: "circOut" }}
                                                        className={`h-full ${step.bg.replace('/10', '')} opacity-50`}
                                                    />
                                                </div>
                                            ))}
                                            <div className="flex gap-4 pt-4">
                                                <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-2 bg-white/10 rounded-full w-3/4" />
                                                    <div className="h-2 bg-white/5 rounded-full w-1/2" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="mt-40 flex flex-col items-center justify-center">
                    <Link href="/auth">
                        <Button size="lg" className="h-20 px-16 rounded-full text-base font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(var(--primary),0.2)] hover:scale-105 transition-all">
                            Initialize Your System <ArrowRight className="ml-3 w-5 h-5" />
                        </Button>
                    </Link>
                    <p className="mt-6 text-muted-foreground text-xs font-bold uppercase tracking-[0.2em]">
                        Setup Time: Approx 12 Minutes
                    </p>
                </div>
            </div>
        </section>
    );
}
