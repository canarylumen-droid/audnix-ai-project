
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    TrendingUp,
    RefreshCw,
    Target,
    Mail,
    BarChart3,
    CalendarCheck2,
    ArrowUpRight,
    Sparkles,
    PieChart as PieChartIcon,
    Activity,
    Zap,
    Unplug
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import { PremiumLoader } from "@/components/ui/premium-loader";

interface AnalyticsData {
    metrics: {
        sent: number;
        replied: number;
        booked: number;
        leadsFiltered: number;
        conversionRate: number;
        responseRate: number;
    };
    timeSeries: Array<{ name: string; sent: number; replied: number; booked: number }>;
    channelPerformance: Array<{ channel: string; value: number }>;
    recentEvents: Array<{ id: string; type: string; description: string; time: string }>;
    isAnyConnected?: boolean;
}

import { useUser } from "@/hooks/use-user";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

export default function AnalyticsPage() {
    const { data: user } = useUser();
    const queryClient = useQueryClient();
    const { data: analytics, isLoading, refetch, isFetching } = useQuery<AnalyticsData>({
        queryKey: ["/api/dashboard/analytics/full"],
        staleTime: Infinity, // Rely on socket for updates
    });

    useEffect(() => {
        if (!user?.id) return;

        const socket = io({
            path: '/socket.io',
            query: { userId: user.id }
        });

        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/analytics/full"] });
        };

        socket.on('leads_updated', handleUpdate);
        socket.on('messages_updated', handleUpdate);
        socket.on('activity_updated', handleUpdate);

        return () => {
            socket.disconnect();
        };
    }, [user?.id, queryClient]);

    const COLORS = {
        primary: "hsl(var(--primary))",
        sent: "#06b6d4",
        replied: "#8b5cf6",
        booked: "#10b981",
        background: "hsl(var(--background))",
    };

    if (isLoading) {
        return (
            <div className="h-[70vh] flex items-center justify-center">
                <PremiumLoader text="Initializing Analytics..." />
            </div>
        );
    }

    const stats = [
        { label: "Total Sent", value: analytics?.metrics?.sent || 0, icon: Mail, color: "text-blue-400", bg: "bg-blue-400/10" },
        { label: "Replies", value: analytics?.metrics?.replied || 0, icon: Zap, color: "text-purple-400", bg: "bg-purple-400/10" },
        { label: "Meetings", value: analytics?.metrics?.booked || 0, icon: CalendarCheck2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
        { label: "Lead Filtered", value: analytics?.metrics?.leadsFiltered || 0, icon: Sparkles, color: "text-orange-400", bg: "bg-orange-400/10" },
    ];

    if (analytics && !analytics.isAnyConnected) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
                    <div className="relative w-32 h-32 rounded-[2.5rem] bg-[#050505] border border-white/10 flex items-center justify-center">
                        <Unplug className="w-12 h-12 text-white/20" />
                    </div>
                </div>
                <div className="max-w-md space-y-2">
                    <h2 className="text-2xl font-black tracking-tighter text-white uppercase">No Channels Connected</h2>
                    <p className="text-white/40 text-sm font-medium leading-relaxed">
                        Connect your Instagram or Email server to start tracking AI performance and lead engagement in real-time.
                    </p>
                </div>
                <Button asChild className="rounded-2xl h-12 px-8 font-bold bg-white text-black hover:bg-white/90">
                    <Link href="/dashboard/integrations">
                        Go to Integrations
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase text-white inline-flex items-center gap-3">
                        Analytics <Activity className="h-8 w-8 text-primary animate-pulse" />
                    </h1>
                    <p className="text-white/40 font-medium mt-1 uppercase tracking-widest text-xs">Real-time performance distribution</p>
                </div>
                <Button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold h-12 px-6"
                >
                    <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
                    Sync Data
                </Button>
            </div>

            {/* Hero Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="bg-[#050505] border-white/5 rounded-[2rem] p-6 hover:border-primary/20 transition-all group relative overflow-hidden">
                            <div className={cn("absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-20 transition-opacity group-hover:opacity-40", stat.color.replace('text', 'bg'))} />
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-white/5", stat.bg)}>
                                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                                </div>
                                <div className="text-4xl font-black text-white tracking-tighter mb-1">
                                    {stat.value > 0 ? stat.value : "0"}
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-white/30">{stat.label}</div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Growth Chart */}
                <Card className="lg:col-span-2 bg-[#050505] border-white/5 rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Engagement Velocity</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px] p-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics?.timeSeries || []}>
                                <defs>
                                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.sent} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS.sent} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} />
                                <ChartTooltip content={<ChartTooltipContent className="bg-black border-white/10 rounded-xl" />} />
                                <Area type="monotone" dataKey="sent" stroke={COLORS.sent} fillOpacity={1} fill="url(#colorSent)" strokeWidth={4} />
                                <Area type="monotone" dataKey="replied" stroke={COLORS.replied} fillOpacity={0} strokeWidth={4} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Real-time Activity Feed */}
                <Card className="bg-[#0a0a0a] border-white/5 rounded-[3rem] p-8 flex flex-col">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40 mb-8 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" /> Live Interaction Stream
                    </h3>
                    <div className="space-y-6 flex-1">
                        {(analytics?.recentEvents || []).length > 0 ? (
                            analytics?.recentEvents.map(event => (
                                <div key={event.id} className="flex gap-4 group">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_#00d2ff] shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{event.description}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-1">{event.time}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                                <Zap className="w-12 h-12 mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">Waiting for activity...</p>
                            </div>
                        )}
                    </div>
                    <Button variant="ghost" className="mt-8 text-[10px] font-black uppercase tracking-widest text-primary p-0 h-auto justify-start hover:bg-transparent hover:text-primary/80">
                        View Full Audit Logs <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                </Card>
            </div>
        </div>
    );
}
