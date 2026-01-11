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

            </span>
            <div className="absolute -bottom-3 left-0 w-0 h-1 bg-primary group-hover:w-full transition-all duration-700 shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
        </motion.div>
    ))
}
                    </div >
                </div >
            </div >
        </section >
    );
}
