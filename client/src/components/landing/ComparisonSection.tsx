import { motion } from "framer-motion";
import { Check, X, Shield, Globe, Zap, Cpu, Brain, Search } from "lucide-react";

const BRANDS = [
    { name: 'SMARTLEAD', site: 'smartlead.ai' },
    { name: 'INSTANTLY', site: 'instantly.ai' },
    { name: 'CLAY', site: 'clay.com' },
    { name: 'APOLLO', site: 'apollo.io' },
    { name: 'LEMLIST', site: 'lemlist.com' }
];

export function ComparisonSection() {
    return (
        <section className="py-60 px-4 relative overflow-hidden bg-black">
            {/* Background gradients */}
            <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-40">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-12 inline-block"
                    >
                        Efficiency Benchmark
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-6xl md:text-[10rem] font-black tracking-[-0.05em] leading-[0.85] text-white italic mb-12 uppercase"
                    >
                        THE NEW <br />
                        <span className="text-primary not-italic tracking-[-0.08em]">STANDARD.</span>
                    </motion.h2>
                    <p className="text-white/40 font-bold italic text-2xl md:text-3xl max-w-3xl mx-auto leading-tight tracking-tight">
                        Why settle for legacy tools that just <span className="text-white decoration-primary/40 underline">organize leads</span> when you can have a neural protocol that <span className="text-white italic cursor-blink">closes them</span> autonomously?
                    </p>
                </div>

                <div className="overflow-x-auto pb-10 scrollbar-hide">
                    <div className="min-w-[1000px] glass-card rounded-[4rem] p-12 border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />

                        <table className="w-full text-left border-collapse relative z-10">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="py-12 px-8 text-[10px] font-black uppercase tracking-[0.5em] text-white/20 italic">Intelligence Map</th>
                                    <th className="py-12 px-8 text-[10px] font-black uppercase tracking-[0.5em] text-white/20 italic">Legacy CRMs</th>
                                    <th className="py-12 px-8 text-[10px] font-black uppercase tracking-[0.5em] text-primary italic text-center">Audnix Neural Protocol</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { name: "Autonomous Response Latency", old: "Never (Human required)", new: "< 2 Minutes (24/7)", icon: Zap },
                                    { name: "Objection Handling Logic", old: "Manual Reframing", new: "Dynamic Neural Reframing", icon: Brain },
                                    { name: "Knowledge Base Integration", old: "Manual Search", new: "Vector PDF Ingestion", icon: Search },
                                    { name: "Predictive Follow-Up", old: "Linear Sequences", new: "Intent-Based Signals", icon: Globe },
                                    { name: "Safety & Compliance", old: "High Risk Threshold", new: "Official API Protected", icon: Shield },
                                    { name: "Revenue Attribution", old: "Guesstimated", new: "Deterministic USD Tracking", icon: Cpu },
                                ].map((row, i) => (
                                    <motion.tr
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1, duration: 0.8 }}
                                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group/row"
                                    >
                                        <td className="py-10 px-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover/row:text-primary transition-colors border border-white/5">
                                                    <row.icon className="w-6 h-6" />
                                                </div>
                                                <span className="text-xl font-black text-white italic tracking-tighter uppercase">{row.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-10 px-8">
                                            <div className="flex items-center gap-3 text-white/20 font-bold italic text-lg uppercase tracking-tighter">
                                                <X className="w-5 h-5 text-red-500/30" />
                                                {row.old}
                                            </div>
                                        </td>
                                        <td className="py-10 px-8 bg-primary/5 rounded-[2rem] relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                            <div className="flex items-center justify-center gap-3 text-primary font-black italic text-lg uppercase tracking-tighter relative z-10 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                                                <Check className="w-6 h-6" />
                                                {row.new}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-40 text-center">
                    <p className="text-white/10 text-[10px] font-black uppercase tracking-[0.5em] mb-16 italic">Trusted by Tier 1 Sales Operators Worldwide</p>
                    <div className="flex flex-wrap justify-center gap-20 items-center">
                        {BRANDS.map(brand => (
                            <motion.div
                                key={brand.name}
                                whileHover={{ scale: 1.1, filter: "brightness(300%)" }}
                                className="group relative cursor-default"
                            >
                                <div className="absolute -inset-10 bg-white/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <span className="text-4xl font-black tracking-[-0.1em] text-white/20 group-hover:text-white transition-all duration-500 lowercase italic relative z-10">
                                    {brand.name}<span className="text-primary group-hover:text-white transition-colors">.co</span>
                                </span>
                                <div className="absolute -bottom-2 left-0 w-0 h-px bg-white/40 group-hover:w-full transition-all duration-500" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
