import { motion } from "framer-motion";
import { UserCheck, Zap, Clock, MessageSquare, Brain } from "lucide-react";

const NODES = [
    { id: 1, type: "lead", icon: UserCheck, label: "Lead Inbound", sub: "Email / CRM Sync", delay: 0 },
    { id: 2, type: "process", icon: Brain, label: "Behavior Mapping", sub: "Intent Analysis", delay: 0.2 },
    { id: 3, type: "action", icon: MessageSquare, label: "Contextual Reply", sub: "Value Reframing", delay: 0.4 },
    { id: 4, type: "result", icon: Zap, label: "Predictive Win", sub: "Call Booked", delay: 0.6 },
];

export function NeuralFlowMockup() {
    return (
        <div className="relative w-full h-full min-h-[500px] flex items-center justify-center p-8 group overflow-hidden">
            {/* Background Animated Grids */}
            <div className="absolute inset-0 bg-grid opacity-20 mask-radial scale-150 group-hover:scale-100 transition-transform duration-[2s]" />

            {/* Connecting Path SVG */}
            <svg className="absolute w-full h-full pointer-events-none">
                <motion.path
                    d="M 200,300 Q 400,100 600,300 T 1000,300"
                    fill="none"
                    stroke="rgba(34,211,238,0.1)"
                    strokeWidth="4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                />
                <motion.path
                    d="M 200,300 Q 400,100 600,300 T 1000,300"
                    fill="none"
                    stroke="url(#glowGradient)"
                    strokeWidth="3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <defs>
                    <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>
            </svg>

            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10 w-full justify-between max-w-5xl">
                {NODES.map((node, i) => (
                    <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: node.delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="relative"
                    >
                        {/* Connection Line Mobile */}
                        {i < NODES.length - 1 && (
                            <div className="md:hidden absolute -bottom-12 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-b from-primary/30 to-transparent" />
                        )}

                        <div className={`
              w-64 p-6 rounded-[2.5rem] glass-card border-white/5 
              hover:border-primary/20 hover:bg-white/[0.05] transition-all duration-500
              perspective-tilt premium-glow
            `}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(34,211,238,0.15)] group-hover:scale-110 transition-transform">
                                    <node.icon className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Learning</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-lg font-black text-white tracking-tighter uppercase">{node.label}</h4>
                                <p className="text-xs font-bold text-primary/40 italic">{node.sub}</p>
                            </div>

                            <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/10 italic">Neural Step 0{i + 1}</span>
                                <Clock className="w-3 h-3 text-white/10" />
                            </div>
                        </div>

                        {/* Glowing Orb below node */}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
