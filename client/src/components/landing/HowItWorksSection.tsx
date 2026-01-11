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
                                    <div className="aspect-video rounded-[2rem] bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all p-8 flex items-center justify-center shadow-2xl backdrop-blur-sm">
                                        <div className="absolute inset-0 bg-grid opacity-[0.04]" />

                                        {/* Logic Simulation UI */}
                                        <div className="relative z-10 w-full h-full flex flex-col gap-4">
                                            {/* Header of the mockup */}
                                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                                <div className="flex gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                                                </div>
                                                <div className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[8px] font-mono text-white/40 tracking-tight">
                                                    AUDNIX_PROTO_v2.4.0
                                                </div>
                                            </div>

                                            <div className="flex-1 grid grid-cols-2 gap-4">
                                                {/* Simulated Logic Terminal */}
                                                <div className="bg-black/40 rounded-xl border border-white/5 p-4 font-mono text-[9px] space-y-2 overflow-hidden">
                                                    <div className="flex items-center gap-2 text-primary opacity-70">
                                                        <Terminal className="w-3 h-3" />
                                                        <span>INIT_PROCESS</span>
                                                    </div>
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        whileInView={{ opacity: 1 }}
                                                        className="space-y-1.5 text-white/40"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-green-500" />
                                                            <span>AUTHENTICATING_NODES...</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-green-500" />
                                                            <span>SCANNING_VECTOR_DB...</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <motion.div
                                                                animate={{ opacity: [0.2, 1, 0.2] }}
                                                                transition={{ repeat: Infinity, duration: 1 }}
                                                                className="w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary),0.5)]"
                                                            />
                                                            <span className="text-white/60">AWAITING_PAYLOAD_DETECTION</span>
                                                        </div>
                                                    </motion.div>
                                                </div>

                                                {/* Visual Logic Flow */}
                                                <div className="flex flex-col gap-3">
                                                    {['PDF_INGEST', 'VOICE_TRANSCRIPT', 'SEMANTIC_SYNC'].map((label, node) => (
                                                        <motion.div
                                                            key={label}
                                                            initial={{ x: 20, opacity: 0 }}
                                                            whileInView={{ x: 0, opacity: 1 }}
                                                            transition={{ delay: node * 0.2 }}
                                                            className="h-10 bg-white/5 border border-white/10 rounded-lg flex items-center px-3 gap-3 group/node relative overflow-hidden"
                                                        >
                                                            <div className={`w-1.5 h-1.5 rounded-full ${step.color.replace('text', 'bg')} shadow-[0_0_10px_currentColor]`} />
                                                            <div className="flex-1">
                                                                <div className="text-[7px] text-white/40 mb-1 font-mono uppercase tracking-tighter">{label}</div>
                                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        whileInView={{ width: "100%" }}
                                                                        transition={{ duration: 2, delay: 0.5 + (node * 0.2), repeat: Infinity }}
                                                                        className={`h-full ${step.bg.replace('/10', '')} opacity-40`}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="absolute -right-1 -top-1 w-3 h-3 bg-primary/20 rounded-full blur-[2px] opacity-0 group-hover/node:opacity-100 transition-opacity" />
                                                        </motion.div>
                                                    ))}
                                                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl bg-primary/5">
                                                        <Activity className="w-8 h-8 text-primary animate-pulse" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Floating Elements */}
                                        <motion.div
                                            animate={{
                                                y: [0, -10, 0],
                                                rotate: [0, 5, 0]
                                            }}
                                            transition={{ repeat: Infinity, duration: 4 }}
                                            className="absolute top-10 right-10 w-20 h-20 bg-primary/10 blur-3xl rounded-full"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="mt-40 flex flex-col items-center justify-center">
                    <Link href="/auth">
                        <Button size="lg" className="h-20 px-16 rounded-full text-base font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(var(--primary),0.2)] hover:scale-105 transition-all bg-primary text-primary-foreground">
                            Initialize Your System <ArrowRight className="ml-3 w-5 h-5" />
                        </Button>
                    </Link>
                    <p className="mt-6 text-muted-foreground text-xs font-bold uppercase tracking-[0.2em]">
                        Setup Time: Approx 5 Minutes
                    </p>
                </div>
            </div>
        </section>
    );
}
