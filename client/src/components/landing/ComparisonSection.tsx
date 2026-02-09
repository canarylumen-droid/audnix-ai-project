import { motion } from "framer-motion";
import { Check, X, Shield, Zap, Brain, Lock, Server, Cpu, AlertTriangle } from "lucide-react";

const COMPARISON_DATA = [
    {
        feature: "AI Architecture",
        audnix: "Stateful Vector Memory (Pinecone)",
        wrappers: "Stateless Session (Forgets You)",
        humans: "Fragmented Notion Docs",
        icon: Brain
    },
    {
        feature: "Response Latency",
        audnix: "Human-Like (Variable 45s - 5m)",
        wrappers: "Instant (0s - Bot Behavior)",
        humans: "2 - 12 Hours (Sleep/Breaks)",
        icon: Zap
    },
    {
        feature: "IG Intelligence",
        audnix: "Visual Post Scan + Bio Analysis",
        wrappers: "Text-Only Keyword Matching",
        humans: "Manual Scrolling (Slow)",
        icon: Server
    },
    {
        feature: "Safety Standards",
        audnix: "Deterministic Guardrails",
        wrappers: "Prone to Prompt Injection",
        humans: "Emotional/Mood Based Errors",
        icon: Lock
    },
    {
        feature: "Scale Capacity",
        audnix: "Infinite Vertical Scaling",
        wrappers: "API Rate Limit Bottlenecks",
        humans: "Hiring & Training Bottlenecks",
        icon: Cpu
    },
    {
        feature: "Account Safety",
        audnix: "Official Meta API (Green Tick)",
        wrappers: "Unauthorized Scraping (Ban Risk)",
        humans: "Login Sharing (Security Risk)",
        icon: Shield
    }
];

export function ComparisonSection() {
    return (
        <section id="comparison" className="py-40 px-4 bg-black relative overflow-hidden">
            {/* Dark Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050505] to-black" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-24 max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-8"
                    >
                        <AlertTriangle className="w-3 h-3" />
                        Market Analysis
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[0.9] mb-8"
                    >
                        Why Wrappers <span className="text-red-500">Fail.</span> <br />
                        Why Humans <span className="text-red-500">Burn Out.</span>
                    </motion.h2>
                    <p className="text-white/40 text-xl font-medium leading-relaxed">
                        The market is flooded with "AI Tools" that are just simple ChatGPT wrappers. They lack memory, safety, and nuanced timing. Audnix is an Operating System, not a tool.
                    </p>
                </div>

                <div className="overflow-x-auto pb-8">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr>
                                <th className="py-8 px-6 text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold border-b border-white/5">Core Capability</th>
                                <th className="py-8 px-6 text-[10px] uppercase tracking-[0.2em] text-red-400/80 font-bold border-b border-white/5 bg-red-500/[0.02]">Generic AI Wrappers</th>
                                <th className="py-8 px-6 text-[10px] uppercase tracking-[0.2em] text-orange-400/80 font-bold border-b border-white/5 bg-orange-500/[0.02]">Human VAs / SDRs</th>
                                <th className="py-8 px-6 text-[10px] uppercase tracking-[0.2em] text-primary font-bold border-b border-white/5 bg-primary/[0.05] border-t-2 border-t-primary relative">
                                    <div className="absolute top-0 left-0 right-0 h-32 bg-primary/10 blur-[60px] -z-10" />
                                    Audnix System
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {COMPARISON_DATA.map((row, i) => (
                                <motion.tr
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="border-b border-white/5 group hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="py-8 px-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                                                <row.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{row.feature}</span>
                                        </div>
                                    </td>
                                    <td className="py-8 px-6">
                                        <div className="flex items-center gap-3 text-white/40 font-medium text-sm">
                                            <X className="w-4 h-4 text-red-500" />
                                            {row.wrappers}
                                        </div>
                                    </td>
                                    <td className="py-8 px-6">
                                        <div className="flex items-center gap-3 text-white/40 font-medium text-sm">
                                            <X className="w-4 h-4 text-orange-500" />
                                            {row.humans}
                                        </div>
                                    </td>
                                    <td className="py-8 px-6 bg-primary/[0.02]">
                                        <div className="flex items-center gap-3 text-white font-bold text-sm shadow-[0_0_20px_rgba(var(--primary),0.2)] inline-block px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
                                            <Check className="w-4 h-4 text-primary" />
                                            {row.audnix}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-20 grid md:grid-cols-2 gap-8">
                    <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold text-white mb-4">The "Wrapper" Trap</h3>
                            <p className="text-white/50 leading-relaxed font-medium">
                                Most tools are just accessing OpenAI's API directly. This means they have no "state". If a lead asks a question, the bot forgets who they are in the next message. Audnix maintains a persistent "Identity Layer" for every lead.
                            </p>
                        </div>
                    </div>
                    <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-primary/[0.02] border border-primary/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold text-white mb-4">The Human Error Factor</h3>
                            <p className="text-white/60 leading-relaxed font-medium">
                                Humans have bad days. They get tired, they misread tones, and they forget to follow up. Audnix is deterministic. It never forgets a follow-up, never gets angry, and never sleeps.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
