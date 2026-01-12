import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Globe, Zap, CheckCircle, AlertTriangle, Loader2, Database, Shield } from 'lucide-react';

interface LogEntry {
    id: string;
    text: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'raw';
    timestamp: Date;
}

interface ScraperConsoleProps {
    logs: LogEntry[];
    isVisible: boolean;
    onClose: () => void;
}

export const ScraperConsole = ({ logs, isVisible, onClose }: ScraperConsoleProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [stats, setStats] = useState({
        proxies: 0,
        threads: 0,
        requests: 0,
        successRate: 0,
        bandwidth: '0 MB/s'
    });

    useEffect(() => {
        if (isVisible) {
            const interval = setInterval(() => {
                setStats({
                    proxies: Math.floor(Math.random() * 5000) + 1500000,
                    threads: Math.floor(Math.random() * 200) + 1200,
                    requests: Math.floor(Math.random() * 50000) + 350000,
                    successRate: 99.2 + (Math.random() * 0.7),
                    bandwidth: `${(Math.random() * 85 + 42).toFixed(1)} GB/s`
                });
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [isVisible]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-2xl"
        >
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full h-full md:h-[90vh] md:max-w-6xl bg-[#030303] md:border border-white/10 md:rounded-[3rem] shadow-[0_0_150px_rgba(0,180,255,0.2)] flex flex-col overflow-hidden relative"
            >
                {/* Header */}
                <div className="px-6 md:px-10 py-6 md:py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01] sticky top-0 z-10 backdrop-blur-md">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/40 shadow-[0_0_30px_rgba(0,210,255,0.3)] shrink-0">
                            <Brain className="w-6 h-6 md:w-8 md:h-8 text-primary animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase italic">Neural Core Alpha</h3>
                                <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-black uppercase">Active</Badge>
                            </div>
                            <p className="text-[9px] md:text-[10px] font-black text-white/40 tracking-[0.3em] uppercase mt-1">Global Proxy Mesh V4.2 • Handshake: 1.5M Residential Nodes</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group border border-white/10 hover:border-primary/50"
                    >
                        <XCircle className="w-6 h-6 text-white/20 group-hover:text-primary transition-colors" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                    {/* Console Output */}
                    <div className="flex-1 flex flex-col min-h-0 bg-black/50 border-r border-white/5">
                        <div
                            ref={scrollRef}
                            className="flex-1 p-6 md:p-10 space-y-3 overflow-y-auto font-mono scrollbar-hide selection:bg-primary/30"
                        >
                            <AnimatePresence mode="popLayout">
                                {logs.map((log) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex gap-4 text-[11px] md:text-xs leading-relaxed transition-all py-2 px-4 rounded-xl border ${log.type === 'raw' ? 'text-white/20 font-light bg-white/[0.02] border-transparent' :
                                            log.type === 'success' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                                log.type === 'error' ? 'text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]' :
                                                    log.type === 'warning' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                                                        'text-primary bg-primary/10 border-primary/20 shadow-[0_0_20px_rgba(0,180,255,0.1)]'
                                            }`}
                                    >
                                        <span className="opacity-20 shrink-0 font-bold tracking-tight">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                        <span className="flex-1 break-words font-medium">
                                            {log.text}
                                        </span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Mobile Stats Toggle/Summary */}
                        <div className="lg:hidden px-6 py-4 bg-primary/5 border-t border-white/5 flex items-center justify-around gap-4 text-[9px] font-black uppercase tracking-widest text-primary">
                            <div className="flex items-center gap-1"><Shield className="w-3 h-3" /> {stats.proxies.toLocaleString()}</div>
                            <div className="flex items-center gap-1"><Zap className="w-3 h-3" /> {stats.successRate.toFixed(1)}%</div>
                            <div className="flex items-center gap-1"><Activity className="w-3 h-3" /> {stats.bandwidth}</div>
                        </div>
                    </div>

                    {/* Stats Sidebar (High-End Terminal Info) */}
                    <div className="w-80 p-10 bg-black/80 hidden lg:block space-y-10 overflow-y-auto select-none">
                        <section>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-6">Neural Cluster Metrics</p>
                            <div className="space-y-8">
                                {[
                                    { label: 'Cloud Endpoints', value: stats.proxies.toLocaleString(), icon: Shield, color: 'text-primary' },
                                    { label: 'Neural Threads', value: stats.threads, icon: Cpu, color: 'text-indigo-400' },
                                    { label: 'Neural Hits', value: stats.requests.toLocaleString(), icon: Database, color: 'text-purple-400' },
                                    { label: 'WAF Bypass Rate', value: `${stats.successRate.toFixed(1)}%`, icon: CheckCircle, color: 'text-emerald-400' },
                                ].map((stat, i) => (
                                    <div key={i} className="group/stat">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3 text-white/40 group-hover/stat:text-white transition-colors">
                                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{stat.label}</span>
                                            </div>
                                            <span className="text-sm font-black text-white tabular-nums">{stat.value}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                                            <motion.div
                                                initial={{ width: '0%' }}
                                                animate={{ width: `${70 + Math.random() * 25}%` }}
                                                className={`h-full rounded-full ${stat.color.replace('text', 'bg')} shadow-[0_0_10px_currentColor] opacity-60`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="pt-10 border-t border-white/5 space-y-6">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Subsystem State</p>
                            <div className="p-6 rounded-[1.5rem] bg-white/[0.02] border border-white/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-white/40 uppercase">Ingestion Stream</span>
                                    <span className="text-xs font-black text-primary animate-pulse">{stats.bandwidth}</span>
                                </div>
                                <div className="h-12 bg-black/40 rounded-xl flex items-end gap-1 px-3 py-2 overflow-hidden border border-white/5">
                                    {[...Array(20)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: `${20 + Math.random() * 80}%` }}
                                            transition={{ repeat: Infinity, duration: 0.5 + Math.random(), repeatType: 'reverse' }}
                                            className="w-full bg-primary/40 rounded-t-[1px]"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 border-t border-white/5">
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Neural Engine v4.2 stable</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Info Bar */}
                <div className="px-6 md:px-10 py-4 bg-black border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/20">
                    <div className="flex gap-6">
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Distributed Node Alpha-01</span>
                        <span className="hidden md:flex items-center gap-2"><Globe className="w-3 h-3 text-primary" /> Routing: Worldwide Residential</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
