import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { AlertCircle, Clock, Ghost, TrendingDown, DollarSign, UserX } from "lucide-react";

const PAIN_POINTS = [
    {
        icon: Ghost,
        title: "Response Latency",
        desc: "Creators lose 70% of potential deals because they can't reply instantly. When a brand or high-ticket lead DMs you, waiting hours to respond means they've already moved to the next creator. Speed is the only currency that matters.",
        impact: "Lower Conversion"
    },
    {
        icon: Clock,
        title: "Operational Burnout",
        desc: "You didn't start an agency to spend 20+ hours a week refreshing Gmail and Instagram DMs. Manual outreach forces you to work IN your business instead of ON it, capping your growth ceiling.",
        impact: "20+ Hours Lost/Week"
    },
    {
        icon: UserX,
        title: "Process Gaps",
        desc: "Manual follow-ups are inconsistent. Missing critical touchpoints often results in losing high-intent leads that required multiple interactions.",
        impact: "Missing 80% of Sales"
    },
    {
        icon: TrendingDown,
        title: "Lead Interest Decay",
        desc: "Lead intent drops significantly after the first few minutes of contact. Without instant engagement, marketing budgets are underutilized.",
        impact: "Inefficient Spend"
    }
];

export function ProblemSection() {
    const containerRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [0.95, 1]);

    return (
        <section ref={containerRef} id="problem" className="py-24 px-4 relative overflow-hidden bg-background font-sans">
            {/* Subtle Gradient Atmosphere */}
            <motion.div
                style={{ opacity: useTransform(scrollYProgress, [0.1, 0.3], [0, 0.05]) }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary blur-[150px] rounded-full pointer-events-none"
            />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-10"
                    >
                        <AlertCircle className="w-3.5 h-3.5" />
                        The Scaling Trap
                    </motion.div>

                    <motion.h2
                        style={{ opacity, scale }}
                        className="text-4xl md:text-8xl font-bold tracking-tight text-foreground mb-10 leading-tight"
                    >
                        Hidden Efficiency <br />
                        <span className="text-muted-foreground">in your pipeline.</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="text-muted-foreground text-lg md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed"
                    >
                        Most <span className="text-foreground border-b-2 border-primary/20 pb-0.5">Agencies & Creators</span> hit a revenue ceiling because they can't clone themselves. Audnix solves this by deploying autonomous clones that scrape, qualify, and close deals for you.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {PAIN_POINTS.map((point, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            whileHover={{
                                scale: 1.02,
                            }}
                            transition={{ delay: i * 0.1, duration: 0.6 }}
                            className="p-8 rounded-3xl bg-card backdrop-blur-xl border border-border/40 hover:border-primary/20 hover:bg-card/80 transition-all group shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 shadow-sm">
                                    <point.icon className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black text-foreground/10 group-hover:text-primary/40 transition-colors tracking-widest mt-2">
                                    0{i + 1}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-4 tracking-tight uppercase">{point.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-8 font-medium">
                                {point.desc}
                            </p>
                            <div className="pt-6 border-t border-border/10 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">Performance Impact</span>
                                <span className="text-xs font-bold text-primary">{point.impact}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mt-16 p-12 md:p-20 rounded-[3rem] bg-card border border-border/40 text-center relative overflow-hidden group shadow-sm"
                >
                    <div className="absolute inset-0 bg-grid opacity-5" />
                    <div className="relative z-10">
                        <div className="flex flex-col items-center">
                            <div className="p-3 rounded-xl bg-primary/10 mb-6 group-hover:scale-110 transition-transform">
                                <DollarSign className="w-6 h-6 text-primary" />
                            </div>
                            <span className="text-6xl md:text-9xl font-bold tracking-tighter text-foreground mb-6">$142,000</span>
                        </div>
                        <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] max-w-2xl mx-auto text-xs md:text-sm leading-relaxed">
                            Mean annual revenue loss for companies with 50+ monthly leads due to <span className="text-foreground font-semibold">manual latency and follow-up errors.</span>
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
