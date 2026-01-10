import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Search, Download, CheckCircle, XCircle, Loader2, Zap, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/hooks/use-user';

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
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: Date;
}

export default function ProspectingPage() {
    const { data: user } = useUser();
    const [query, setQuery] = useState('');
    const [logs, setLogs] = useState<LogMessage[]>([]);
    const [showModal, setShowModal] = useState(false);
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
            setShowModal(true);
            setLogs([{ id: '1', text: '[System] Neural scan initiated...', type: 'info', timestamp: new Date() }]);
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
                setLogs(prev => [...prev, {
                    id: data.data.id,
                    text: data.data.text,
                    type: data.data.type,
                    timestamp: new Date(data.data.timestamp)
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
        <div className="min-h-screen bg-[#050505] p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">Neural Prospecting</h1>
                        <p className="text-white/40 mt-2">40 parallel workers • Real-time scraping • 2-3 min for 2000 leads</p>
                    </div>
                    <Button
                        onClick={downloadCSV}
                        disabled={leads.length === 0}
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV ({leads.length})
                    </Button>
                </div>

                {/* Search Interface */}
                <Card className="bg-[#0A0A0A] border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white">AI Neural Scan</CardTitle>
                        <p className="text-white/40 text-sm">
                            Describe your target audience. Our clusters will crawl Google, Bing, Instagram, and YouTube to find 500-2000 verified decision makers with personal emails (Gmail preferred). Only 95%+ quality leads are ingested.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleSearch} className="relative">
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                disabled={scanMutation.isPending}
                                placeholder="Find me 1000 real estate founders in Miami with Gmail addresses..."
                                className="h-20 pl-6 pr-24 bg-white/[0.03] border-white/10 rounded-2xl text-lg text-white placeholder:text-white/20"
                            />
                            <Button
                                type="submit"
                                disabled={scanMutation.isPending || !query.trim()}
                                className="absolute right-2 top-2 h-16 px-8 bg-primary hover:bg-primary/90 text-black font-bold rounded-xl"
                            >
                                {scanMutation.isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5 mr-2" />
                                        Scan
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="flex flex-wrap gap-3">
                            {['Personal Emails Only (Gmail/Outlook)', 'Founder/CEO Priority', 'No Generic Emails (info@, support@)', '95%+ Lead Score', 'SMTP Verified'].map(f => (
                                <Badge key={f} variant="secondary" className="bg-white/5 border-white/5 text-[9px] font-black uppercase tracking-widest px-4 py-2">
                                    {f}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Results Table */}
                {leads.length > 0 ? (
                    <Card className="bg-[#0A0A0A] border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white">Discovered Leads ({leads.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {leads.map((lead) => (
                                    <motion.div
                                        key={lead.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-bold text-white">{lead.entity}</h3>
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
                                                    <div className="flex items-center gap-2 text-white/60">
                                                        <Mail className="w-4 h-4" />
                                                        {lead.email}
                                                    </div>
                                                    {lead.phone && (
                                                        <div className="flex items-center gap-2 text-white/60">
                                                            <Phone className="w-4 h-4" />
                                                            {lead.phone}
                                                        </div>
                                                    )}
                                                    {lead.location && (
                                                        <div className="flex items-center gap-2 text-white/60">
                                                            <MapPin className="w-4 h-4" />
                                                            {lead.location}
                                                        </div>
                                                    )}
                                                    {lead.website && (
                                                        <div className="flex items-center gap-2 text-white/60">
                                                            <Globe className="w-4 h-4" />
                                                            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                                                                {lead.website.substring(0, 40)}...
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
                                                                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/60 hover:text-primary transition-colors"
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
                    <Card className="bg-[#0A0A0A] border-white/10">
                        <CardContent className="p-12 text-center">
                            <div className="text-white/20 text-sm">No leads yet. Start a neural scan to discover prospects.</div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Live Execution Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="bg-[#0A0A0A] border-white/10 max-w-3xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            Neural Execution Protocol
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto font-mono text-xs">
                        <AnimatePresence>
                            {logs.map((log) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`p-3 rounded-lg ${log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                                            log.type === 'error' ? 'bg-red-500/10 text-red-400' :
                                                log.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                                                    'bg-white/5 text-white/60'
                                        }`}
                                >
                                    <span className="text-white/40">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.text}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
