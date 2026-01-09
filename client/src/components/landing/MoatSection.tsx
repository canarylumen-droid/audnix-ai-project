import { motion } from "framer-motion";
import { X, Check, Brain, Zap, Clock, Shield } from "lucide-react";

export function MoatSection() {
    return (
        <section className="py-32 px-4 relative overflow-hidden bg-[#020409]">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-7xl font-black tracking-tight text-white mb-6"
                    >
                        THE DIFFERENCE IS<br />
                        <span className="text-primary italic">INTELLIGENCE.</span>
                    </motion.h2>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-stretch">
                    {/* Traditional Bots */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="glass-card p-10 rounded-[3rem] border-white/5 bg-white/[0.01] opacity-50 grayscale hover:grayscale-0 transition-all"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                <X className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white/60 uppercase tracking-widest">Standard Bots</h3>
                        </div>

                        <ul className="space-y-6">
                            {[
                                "Linear 'if/then' logic that breaks easily",
                                "Replies instantly, annoying the lead",
                                "Sounds like a robot (zero personality)",
                                "Forgets context if the lead asks a new question",
                                "Generic templates that leads spot instantly"
                            ].map((text, i) => (
                                <li key={i} className="flex items-start gap-4 text-white/40 font-medium">
                                    <X className="w-5 h-5 text-red-500/50 mt-1 flex-shrink-0" />
                                    <span>{text}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Audnix AI */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-[3rem] blur-lg opacity-30" />
                        <div className="glass-card p-10 rounded-[3rem] border-primary/20 bg-white/[0.04] relative h-full">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <Zap className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold text-white uppercase tracking-widest">Audnix Closer</h3>
                            </div>

                            <ul className="space-y-6">
                                {[
                                    { icon: Brain, t: "Behavioral Intelligence", d: "Learns exactly how your brand speaks." },
                                    { icon: Clock, t: "Smart Delay Logic", d: "Waits 4-12 mins to feel like a real human." },
                                    { icon: Shield, t: "Risk Aware", d: "Detects anger or confusion & alerts you." },
                                    { icon: Check, t: "Infinite Memory", d: "Recalls a thread from 6 months ago naturally." },
                                    { icon: Zap, t: "Value Reframing", d: "Turns 'Too expensive' into a ROI discussion." }
                                ].map((item, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-start gap-4 text-white hover:translate-x-2 transition-transform cursor-default group"
                                    >
                                        <div className="w-6 h-6 mt-1 flex-shrink-0">
                                            <item.icon className="w-full h-full text-primary group-hover:scale-125 transition-transform" />
                                        </div>
                                        <div>
                                            <span className="block font-black text-sm uppercase tracking-wider">{item.t}</span>
                                            <span className="text-white/50 text-xs font-bold leading-relaxed">{item.d}</span>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
