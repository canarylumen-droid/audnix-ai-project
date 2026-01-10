import { motion } from "framer-motion";
import { Check, X, Shield, Globe, Zap, Cpu, Brain, Search } from "lucide-react";

const BRANDS = [
    { name: 'SMARTLEAD', site: 'smartlead.co' },
    { name: 'INSTANTLY', site: 'instantly.co' },
    { name: 'CLAY', site: 'clay.co' },
    { name: 'APOLLO', site: 'apollo.co' },
    { name: 'LEMLIST', site: 'lemlist.co' }
];

export function ComparisonSection() {
    return (
        <section className="py-60 px-4 relative overflow-hidden bg-black selection:bg-primary selection:text-black">
            {/* Background gradients */}
            <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-44">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-12 inline-block shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                    >
                        Efficiency Benchmark
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-6xl md:text-[10rem] font-black tracking-[-0.05em] leading-[0.85] text-white mb-12 uppercase flex flex-col items-center"
                    >
                        <span>THE NEW</span>
                        <span className="text-primary tracking-[-0.08em] block drop-shadow-[0_0_40px_rgba(var(--primary),0.3)]">STANDARD.</span>
                    </motion.h2>
                    <p className="text-white/40 font-bold text-2xl md:text-3xl max-w-3xl mx-auto leading-tight tracking-tight">
                        Why settle for legacy tools that just <span className="text-white decoration-primary/40 underline underline-offset-8 decoration-2">organize leads</span> when you can have an intelligence protocol that <span className="text-white cursor-blink">closes them</span> autonomously?
                    </p>
                </div>

                <div className="overflow-x-auto pb-10 scrollbar-hide">
                    <div className="min-w-[1000px] glass-premium rounded-[3rem] p-12 border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />

                        <table className="w-full text-left border-collapse relative z-10">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="py-12 px-8 text-[11px] font-black uppercase tracking-[0.5em] text-white/80">Intelligence Map</th>
                                    <th className="py-12 px-8 text-[11px] font-black uppercase tracking-[0.5em] text-white/80">Legacy CRMs</th>
                                    <th className="py-12 px-8 text-[11px] font-black uppercase tracking-[0.5em] text-primary text-center">Audnix Intelligence Protocol</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { name: "Autonomous Response Latency", old: "Never (Human required)", new: "< 2 Minutes (24/7)", icon: Zap },
                                    { name: "Objection Handling Logic", old: "Manual Reframing", new: "Dynamic Intelligence Flow", icon: Brain },
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
                                        className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group/row"
                                    >
                                        <td className="py-10 px-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover/row:text-primary transition-all duration-500 border border-white/5 group-hover/row:scale-110">
                                                    <row.icon className="w-6 h-6" />
                                                </div>
                                                <span className="text-xl font-bold text-white tracking-tighter uppercase">{row.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-10 px-8">
                                            <div className="flex items-center gap-3 text-white/20 font-bold text-lg uppercase tracking-tighter">
                                                <X className="w-5 h-5 text-red-500/30" />
                                                {row.old}
                                            </div>
                                        </td>
                                        <td className="py-10 px-8 bg-primary/5 rounded-[2rem] relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                            <div className="flex items-center justify-center gap-3 text-primary font-black text-lg uppercase tracking-tighter relative z-10 drop-shadow-[0_0_15px_rgba(var(--primary),0.6)]">
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
                    <p className="text-white/80 text-[11px] font-black uppercase tracking-[0.5em] mb-20">Trusted by Tier 1 Sales Operators Worldwide</p>
                    <div className="flex flex-wrap justify-center gap-16 md:gap-24 items-center">
                        {BRANDS.map(brand => (
                            <motion.div
                                key={brand.name}
                                whileHover={{ scale: 1.15, rotate: 2 }}
                                className="group relative"
                            >
                                <div className="absolute -inset-10 bg-primary/10 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <span className="text-3xl md:text-5xl font-black tracking-[-0.08em] text-white/30 group-hover:text-white transition-all duration-500 relative z-10">
                                    {brand.name}<span className="text-primary group-hover:text-primary transition-colors">.co</span>
                                </span>
                                <div className="absolute -bottom-3 left-0 w-0 h-1 bg-primary group-hover:w-full transition-all duration-700 shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
