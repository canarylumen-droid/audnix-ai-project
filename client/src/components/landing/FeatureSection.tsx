import { motion } from "framer-motion";
import { Mic, BrainCircuit, Clock, AlertTriangle, Zap, Search, ArrowRight } from "lucide-react";

interface FeatureCardProps {
    title: string;
    description: string;
    icon: any;
    delay: number;
    index: number;
}

const FeatureCard = ({ title, description, icon: Icon, delay, index }: FeatureCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.6 }}
        className="group relative h-full rounded-[2.5rem] bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 hover:border-primary/20 hover:bg-white/[0.05] transition-all duration-500"
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full group-hover:bg-primary/10 transition-colors" />
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:bg-primary group-hover:text-black transition-all duration-500">
                    <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-white/10 group-hover:text-primary/40 transition-colors tracking-widest mt-2">
                    0{index + 1}
                </span>
            </div>
            <h3 className="text-xl font-black text-white mb-4 tracking-tight uppercase">{title}</h3>
            <p className="text-white/40 text-sm leading-relaxed font-medium">
                {description}
            </p>
        </div>
    </motion.div>
);

export function FeatureSection() {
    return (
        <section id="features" className="py-24 px-4 bg-black relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-12 inline-block shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                    >
                        Built for Performance
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.85] mb-8 uppercase"
                    >
                        Engineered <br /> To <span className="text-primary">Win.</span>
                    </motion.h2>
                    <p className="text-white/40 text-xl font-medium max-w-2xl mx-auto leading-tight">
                        Generic AI chats are toys. Audnix is an autonomous revenue engine that analyzes, strategizes, and closes.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 relative z-10 mb-6">
                    <FeatureCard
                        title="Voice Note Intelligence"
                        description="Audnix doesn't just read text. It listens to Voice Notes, extracts sentiment, and adapts its reply tone instantly using neural acoustic modeling."
                        icon={Mic}
                        delay={0}
                        index={0}
                    />
                    <FeatureCard
                        title="Real-Time Intent Check"
                        description="Every reply is analyzed against 110+ objection scenarios and buying signals before a single word is sent back to the lead."
                        icon={BrainCircuit}
                        delay={0.1}
                        index={1}
                    />
                    <FeatureCard
                        title="Predictive Timing"
                        description="Uses 'Human-Like Delays' (2-8 mins) and checks user activity to respond exactly when they are most likely to convert into a sale."
                        icon={Clock}
                        delay={0.2}
                        index={2}
                    />
                    <FeatureCard
                        title="Churn & Drop-off Risk"
                        description="Identifies leads losing interest based on sentiment decay and automatically deploys a 'Re-Engagement Protocol' to recover the sale."
                        icon={AlertTriangle}
                        delay={0.3}
                        index={3}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 relative z-10">
                    <div className="lg:col-span-2 group relative overflow-hidden rounded-[2.5rem] bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 md:p-12">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] rounded-full group-hover:bg-primary/10 transition-colors duration-700" />
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-8 group-hover:scale-110 transition-transform duration-500">
                                <Zap className="w-6 h-6 text-primary" />
                            </div>

                            <h3 className="text-3xl font-black mb-6 tracking-tight uppercase">
                                High-Ticket Closer Protocol
                            </h3>

                            <p className="text-white/40 font-medium text-lg mb-8 max-w-xl leading-relaxed">
                                Most bots just answer questions. Audnix is programmed to
                                <span className="text-white"> close the deal</span>.
                                It systematically overcomes objections, builds value, and pushes for the meeting only when intent is verified.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {[
                                    "110+ Objection Scenarios",
                                    "Qualified Meetings Only",
                                    "Price-Sensitivity Analysis",
                                    "Competitor Awareness"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm font-bold text-white/60">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-[2.5rem] bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 md:p-12">
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-8 group-hover:scale-110 transition-transform duration-500">
                                    <Search className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-3xl font-black mb-4 tracking-tight uppercase">Smart Lead Profile</h3>
                                <p className="text-white/40 font-medium leading-relaxed mb-6">
                                    Audnix scans public data to build a profile of every lead before engaging.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {["URGENT", "ENTERPRISE", "PRICE SENSITIVE", "STARTUP", "AGENCY", "HIGH INTENT"].map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-wider text-white/40 group-hover:border-primary/20 group-hover:text-white/60 transition-colors cursor-default">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
                                        <span>Buying Intent</span>
                                        <span className="text-emerald-500">High (92%)</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[92%]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
