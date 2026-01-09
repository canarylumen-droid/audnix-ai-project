import { motion } from "framer-motion";
import { X, Check, Activity, Zap, Clock, Shield } from "lucide-react";

export function MoatSection() {
    return (
        <section className="py-32 px-4 relative overflow-hidden bg-background">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-7xl font-bold tracking-tight text-foreground mb-6"
                    >
                        Precision <br />
                        <span className="text-primary">over prediction.</span>
                    </motion.h2>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-stretch">
                    {/* Traditional Bots */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="p-10 rounded-3xl border border-border/40 bg-muted/20 opacity-60 grayscale hover:grayscale-0 transition-all flex flex-col h-full"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-muted border border-border/50 flex items-center justify-center">
                                <X className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-muted-foreground uppercase tracking-widest">Static Automation</h3>
                        </div>

                        <ul className="space-y-6 flex-1">
                            {[
                                "Linear 'if/then' logic that lacks flexibility",
                                "Immediate replies that feel robotic",
                                "Static templates that leads often ignore",
                                "Limited context for multi-step interactions",
                                "Hard-coded sequences that don't adapt"
                            ].map((text, i) => (
                                <li key={i} className="flex items-start gap-4 text-muted-foreground/60 font-medium">
                                    <X className="w-4 h-4 text-destructive/40 mt-1 flex-shrink-0" />
                                    <span className="text-sm">{text}</span>
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
                        <div className="p-10 rounded-3xl border border-primary/20 bg-primary/5 h-full transition-all hover:bg-primary/[0.08]">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                    <Zap className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground uppercase tracking-widest">Intelligent Workspace</h3>
                            </div>

                            <ul className="space-y-6">
                                {[
                                    { icon: Activity, t: "Adaptive Logic", d: "Matches exactly how your group communicates." },
                                    { icon: Clock, t: "Strategic Timing", d: "Delays interactions to maintain a human feel." },
                                    { icon: Shield, t: "Pattern Awareness", d: "Monitors sentiment and prioritizes accordingly." },
                                    { icon: Check, t: "Contextual Memory", d: "Recalls past interactions to build trust." },
                                    { icon: Zap, t: "Optimized Recovery", d: "Identifies lost interest and restarts sequences." }
                                ].map((item, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-start gap-4 text-foreground group"
                                    >
                                        <div className="w-6 h-6 mt-1 flex-shrink-0">
                                            <item.icon className="w-full h-full text-primary group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div>
                                            <span className="block font-bold text-sm uppercase tracking-wider">{item.t}</span>
                                            <span className="text-muted-foreground text-xs font-medium leading-relaxed">{item.d}</span>
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
