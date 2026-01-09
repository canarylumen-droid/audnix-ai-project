import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { AlertCircle, Clock, Ghost, TrendingDown, DollarSign, UserX } from "lucide-react";

const PAIN_POINTS = [
    {
        icon: Ghost,
        title: "The DM Ghost Town",
        desc: "71% of leads ghost because of slow response times. While you sleep, your best prospects are buying from competitors who replied in seconds.",
        impact: "-40% Revenue Leak"
    },
    {
        icon: Clock,
        title: "Manual Grunt Work",
        desc: "Spending 4 hours a day manually replying to 'How much?' and 'Tell me more'. Your time is worth $500/hr, but you're doing $15/hr tasks.",
        impact: "20+ Hours Lost/Week"
    },
    {
        icon: UserX,
        title: "Human Inconsistency",
        desc: "Your team forgets to follow up, skips the 4th touchpoint, and loses the lead. Consistency is the secret to 7-figure scale.",
        impact: "Missing 80% of Sales"
    },
    {
        icon: TrendingDown,
        title: "The Lead Decay",
        desc: "A lead's intent drops by 10x after just 5 minutes. If you aren't there instantly, you're just burning ad budget.",
        impact: "Burned Ad Budget"
    }
];

export function ProblemSection() {
    const containerRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [0.8, 1]);

    return (
        <section ref={containerRef} className="py-40 px-4 relative overflow-hidden bg-black">
            {/* Dynamic Red Glow */}
            <motion.div
                style={{ opacity: useTransform(scrollYProgress, [0.1, 0.3], [0, 0.1]) }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-red-600 blur-[150px] rounded-full pointer-events-none"
            />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-[0.3em] mb-12"
                    >
                        <AlertCircle className="w-4 h-4" />
                        The Silent Killer of Scale
                    </motion.div>

                    <motion.h2
                        style={{ opacity, scale }}
                        className="text-5xl md:text-[12rem] font-black tracking-[-0.06em] text-white mb-12 leading-[0.8] uppercase italic"
                    >
                        YOU ARE LEAVING <br />
                        <span className="text-red-500 tracking-[-0.08em] not-italic drop-shadow-[0_0_30px_rgba(239,68,68,0.3)]">MILLIONS.</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="text-white/40 text-2xl md:text-4xl max-w-4xl mx-auto font-medium tracking-tighter leading-tight"
                    >
                        Most founders think they have a "lead gen" problem. The truth? You have a <span className="text-white cursor-blink italic underline decoration-red-500/40 px-2">speed-to-lead and follow-up problem.</span>
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {PAIN_POINTS.map((point, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.8 }}
                            className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:border-red-500/20 hover:bg-white/[0.04] transition-all group perspective-tilt premium-glow"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-10 group-hover:scale-125 transition-transform duration-700 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                                <point.icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-6 tracking-tighter uppercase">{point.title}</h3>
                            <p className="text-white/40 text-base leading-relaxed mb-10 font-bold italic">
                                {point.desc}
                            </p>
                            <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Protocol Impact</span>
                                <span className="text-sm font-black text-red-500 leading-none">{point.impact}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mt-32 p-20 rounded-[4rem] bg-gradient-to-br from-red-600/10 to-transparent border border-red-500/20 text-center relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-grid opacity-10" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <div className="w-1 h-20 bg-gradient-to-b from-red-500 to-transparent" />
                            <div className="flex flex-col items-center">
                                <DollarSign className="w-12 h-12 text-red-500 mb-4 animate-bounce" />
                                <span className="text-7xl md:text-[10rem] font-black tracking-tighter text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.1)] transition-transform group-hover:scale-110 duration-1000">$142,000</span>
                            </div>
                            <div className="w-1 h-20 bg-gradient-to-b from-red-500 to-transparent" />
                        </div>
                        <p className="text-white/60 font-black uppercase tracking-[0.2em] max-w-2xl mx-auto italic text-lg leading-relaxed">
                            The average annual revenue lost by founders with 50+ monthly leads due to <span className="text-red-500">Manual Latency Error.</span>
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
