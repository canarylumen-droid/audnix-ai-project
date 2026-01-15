import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Search, Download, CheckCircle, XCircle, Loader2, Zap, Globe, Mail, Phone, MapPin, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/hooks/use-user';

import { ScraperConsole } from '@/components/dashboard/ScraperConsole';

interface Prospect {
    id: string;
    entity: string;
    email: string;
    phone?: string;
    location?: string;
    website: string;
    platforms: string[];
    socialProfiles?: Record<string, string>;
    wealthSignal: string;
    leadScore: number;
    verified: boolean;
    status: string;
    estimatedRevenue?: string;
    role?: string;
    metadata?: any;
}

interface LogMessage {
    id: string;
    text: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'raw';
    timestamp: Date;
}

export default function ProspectingPage() {
    const { data: user } = useUser();
    const [query, setQuery] = useState('');
    const [logs, setLogs] = useState<LogMessage[]>([]);
    const [showConsole, setShowConsole] = useState(false);
    const [ws, setWs] = useState<WebSocket | null>(null);

    // Fetch leads
    const { data: leads = [], refetch } = useQuery<Prospect[]>({
        queryKey: ['prospects'],
        queryFn: async () => {
            const res = await fetch('/api/prospecting/leads', {
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch leads');
            return res.json();
        }
    });

    // Start scan mutation
    const scanMutation = useMutation({
        mutationFn: async (query: string) => {
            setLogs([]); // Reset logs
            const res = await fetch('/api/prospecting/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ query })
            });
            if (!res.ok) throw new Error('Failed to start scan');
            return res.json();
        },
        onSuccess: () => {
            setShowConsole(true);
            setLogs([{ id: 'init', text: '[System] Neural scan protocol initiated. Connecting to global proxy mesh...', type: 'info', timestamp: new Date() }]);
        }
    });

    // WebSocket connection
    useEffect(() => {
        if (!user?.id) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/sync?userId=${user.id}`;
        const websocket = new WebSocket(wsUrl);

        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'PROSPECTING_LOG') {
                const logData = data.payload || data.data; // Handle both notification formats
                setLogs(prev => [...prev, {
                    id: logData.id || Math.random().toString(),
                    text: logData.text,
                    type: logData.type,
                    timestamp: new Date(logData.timestamp)
                }]);
            } else if (data.type === 'PROSPECT_FOUND') {
                refetch();
            } else if (data.type === 'PROSPECT_UPDATED') {
                refetch();
            }
        };

        setWs(websocket);

        return () => {
            websocket.close();
        };
    }, [user?.id, refetch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        scanMutation.mutate(query);
    };

    const downloadCSV = () => {
        const headers = ['Entity', 'Email', 'Phone', 'Location', 'Website', 'Platforms', 'Lead Score', 'Wealth Signal', 'Revenue', 'Role', 'Instagram', 'LinkedIn', 'YouTube'];
        const rows = leads.map(lead => [
            lead.entity,
            lead.email,
            lead.phone || '',
            lead.location || '',
            lead.website,
            lead.platforms.join(', '),
            lead.leadScore,
            lead.wealthSignal,
            lead.estimatedRevenue || '',
            lead.role || '',
            lead.socialProfiles?.instagram || '',
            lead.socialProfiles?.linkedin || '',
            lead.socialProfiles?.youtube || ''
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prospects_${Date.now()}.csv`;
        a.click();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-2 mb-2">
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">
                                Neural <span className="text-primary not-italic">Prospecting.</span>
                            </h1>
                            <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">Global Pool: 500M+ Nodes</span>
                            </div>
                        </div>
                        <p className="text-white/40 text-xs md:text-sm font-medium">Global proxy mesh • Distributed neural crawlers • Real-time enrichment</p>
                    </div>
                    <div className="flex items-center justify-center md:justify-end gap-3">
                        <Button
                            onClick={downloadCSV}
                            disabled={leads.length === 0}
                            variant="outline"
                            className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 transition-all font-bold text-[10px] uppercase tracking-widest h-10 md:h-12 flex-1 md:flex-none"
                        >
                            <Download className="w-4 h-4 mr-2 text-primary" />
                            Export ({leads.length})
                        </Button>
                        <Button
                            onClick={() => setShowConsole(true)}
                            className="rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-bold text-[10px] uppercase tracking-widest h-10 md:h-12 flex-1 md:flex-none"
                        >
                            <Terminal className="w-4 h-4 mr-2" />
                            Console
                        </Button>
                    </div>
                </div>

                {/* Gemini-Style Neural Input */}
                <div className="relative max-w-4xl mx-auto mt-12 mb-16 group">
                    {/* Atmospheric Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 rounded-3xl opacity-20 group-hover:opacity-40 blur-xl transition-all duration-500" />

                    <Card className="relative bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                        <CardContent className="p-2">
                            <form onSubmit={handleSearch} className="relative flex items-center">
                                <div className="pl-6 pr-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse-slow">
                                        <Zap className="w-5 h-5 text-white fill-white" />
                                    </div>
                                </div>

                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    disabled={scanMutation.isPending}
                                    placeholder="Ask Neural Core to find leads (e.g., 'CEO of SaaS in Austin with $5M+ revenue')..."
                                    className="h-20 bg-transparent border-none text-xl md:text-2xl text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 font-medium px-2"
                                />

                                <div className="pr-4 flex items-center gap-3">
                                    {scanMutation.isPending ? (
                                        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                            <span className="text-xs font-bold text-primary uppercase tracking-wider animate-pulse">Scanning</span>
                                        </div>
                                    ) : (
                                        <Button
                                            type="submit"
                                            disabled={!query.trim()}
                                            className="w-12 h-12 rounded-2xl bg-white text-black hover:bg-blue-50 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center p-0"
                                        >
                                            <Search className="w-6 h-6" />
                                        </Button>
                                    )}
                                </div>
                            </form>

                            {/* Feature Tags */}
                            <div className="px-6 pb-4 pt-2 flex flex-wrap gap-2">
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mr-2 py-1.5">Active Protocols:</span>
                                {['Only 95%+ Verified', 'Decision Makers', 'Revenue > $1M', 'Mobile + Email'].map((tag, i) => (
                                    <div key={i} className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-medium text-white/60 flex items-center gap-1.5 hover:bg-white/10 transition-colors">
                                        <div className={`w-1 h-1 rounded-full ${i % 2 === 0 ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                        {tag}
                                    </div>
                                ))}
                            </div>
                        </CardContent>

                        {/* Progress Bar (Bottom) */}
                        {scanMutation.isPending && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                                <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 animate-shimmer w-full" />
                            </div>
                        )}
                    </Card>

                    {/* Helper Text */}
                    <div className="absolute -bottom-10 left-0 right-0 text-center">
                        <p className="text-xs text-white/30 font-medium">
                            <span className="text-primary">Tip:</span> Be specific about location and niche for higher verification rates.
                        </p>
                    </div>
                </div>

                {/* Results Table */}
                {leads.length > 0 ? (
                    <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-foreground">Discovered Leads ({leads.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {leads.map((lead) => (
                                    <motion.div
                                        key={lead.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-6 bg-muted/10 border border-border/20 rounded-2xl hover:bg-muted/20 transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-bold text-foreground">{lead.entity}</h3>
                                                    {lead.verified && (
                                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Verified
                                                        </Badge>
                                                    )}
                                                    <Badge className="bg-primary/20 text-primary border-primary/30">
                                                        Score: {lead.leadScore}%
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                                        <Mail className="w-4 h-4" />
                                                        {lead.email}
                                                    </div>
                                                    {lead.phone && (
                                                        <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                                            <Phone className="w-4 h-4" />
                                                            {lead.phone}
                                                        </div>
                                                    )}
                                                    {lead.location && (
                                                        <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                                            <MapPin className="w-4 h-4" />
                                                            {lead.location}
                                                        </div>
                                                    )}
                                                    {lead.website && (
                                                        <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                                            <Globe className="w-4 h-4" />
                                                            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                                                {lead.website.length > 40 ? `${lead.website.substring(0, 40)}...` : lead.website}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>

                                                {lead.socialProfiles && Object.keys(lead.socialProfiles).length > 0 && (
                                                    <div className="flex gap-2">
                                                        {Object.entries(lead.socialProfiles).map(([platform, url]) => (
                                                            <a
                                                                key={platform}
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-3 py-1 bg-muted/50 hover:bg-muted border border-border/40 rounded-lg text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                                                            >
                                                                {platform}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    {lead.role && (
                                                        <Badge variant="outline" className="text-xs">{lead.role}</Badge>
                                                    )}
                                                    {lead.estimatedRevenue && (
                                                        <Badge variant="outline" className="text-xs">{lead.estimatedRevenue}</Badge>
                                                    )}
                                                    <Badge variant="outline" className="text-xs">{lead.wealthSignal}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-card/50 backdrop-blur-sm border-border/40 rounded-2xl">
                        <CardContent className="p-12 text-center">
                            <div className="text-muted-foreground/40 text-sm font-medium">No leads yet. Start a neural scan to discover prospects.</div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Neural Scraper Console Overlay */}
            <ScraperConsole
                isVisible={showConsole}
                onClose={() => setShowConsole(false)}
                logs={logs}
            />
        </div >
    );
}
