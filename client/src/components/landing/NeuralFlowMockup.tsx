import { motion } from "framer-motion";
import { UserCheck, Zap, Clock, MessageSquare, LayoutGrid } from "lucide-react";

const NODES = [
    { id: 1, type: "lead", icon: UserCheck, label: "Lead Inbound", sub: "CRM Sync Active", delay: 0 },
    { id: 2, type: "process", icon: LayoutGrid, label: "Data Enrichment", sub: "Pattern Analysis", delay: 0.2 },
    { id: 3, type: "action", icon: MessageSquare, label: "Engagement", sub: "Automated Outreach", delay: 0.4 },
    { id: 4, type: "result", icon: Zap, label: "Growth", sub: "Meeting Confirmed", delay: 0.6 },
];

export function AutomationFlowMockup() {
    return (
        <div className="relative w-full h-full min-h-[500px] flex items-center justify-center p-8 group overflow-hidden">
            {/* Background Animated Grids */}
            <div className="absolute inset-0 bg-grid opacity-10 mask-radial scale-150 group-hover:scale-100 transition-transform duration-[2000ms]" />

            {/* Connecting Path SVG */}
            <svg className="absolute w-full h-full pointer-events-none opacity-50">
                <motion.path
                    d="M 200,300 Q 400,100 600,300 T 1000,300"
                    fill="none"
                    stroke="rgba(var(--primary), 0.1)"
                    strokeWidth="4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                />
                <motion.path
                    d="M 200,300 Q 400,100 600,300 T 1000,300"
                    fill="none"
                    stroke="url(#glowGradient)"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                <defs>
                    <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>
            </svg>

            <div className="flex flex-col md:flex-row items-center gap-10 relative z-10 w-full justify-between max-w-5xl">
                {NODES.map((node, i) => (
                    <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: node.delay, duration: 0.8 }}
                        className="relative"
                    >
                        {/* Connection Line Mobile */}
                        {i < NODES.length - 1 && (
                            <div className="md:hidden absolute -bottom-10 left-1/2 -translate-x-1/2 w-px h-10 bg-gradient-to-b from-primary/20 to-transparent" />
                        )}

                        <div className={`
                          w-64 p-6 rounded-3xl bg-card/40 border border-border/50 backdrop-blur-md
                          hover:border-primary/30 transition-all duration-500
                        `}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-transform">
                                    <node.icon className="w-5 h-5" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Active</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-foreground tracking-tight uppercase">{node.label}</h4>
                                <p className="text-xs font-medium text-muted-foreground">{node.sub}</p>
                            </div>

                            <div className="mt-8 pt-4 border-t border-border/40 flex items-center justify-between">
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Sequence 0{i + 1}</span>
                                <Clock className="w-3.5 h-3.5 text-muted-foreground/30" />
                            </div>
                        </div>

                        {/* Subtle background glow */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-24 bg-primary/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
