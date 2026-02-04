import { useState } from "react";
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
    timeSeries: Array<{ 
        name: string; 
        sent_email: number; 
        sent_instagram: number;
        replied_email: number;
        replied_instagram: number;
        booked: number 
    }>;
    channelPerformance: Array<{ channel: string; value: number }>;
    recentEvents: Array<{ id: string; type: string; description: string; time: string }>;
    isAnyConnected?: boolean;
}

// ... imports remain the same

    const COLORS = {
        primary: "hsl(var(--primary))",
        sent_email: "#3b82f6", // Blue
        sent_instagram: "#d946ef", // Pink/Fuchsia
        replied_email: "#1e40af", // Dark Blue
        replied_instagram: "#86198f", // Dark Purple
        booked: "#10b981",
        background: "hsl(var(--background))",
    };

    // ... loading and empty states remain the same

    const chartConfig = {
        sent_email: { label: "Sent (Email)", color: COLORS.sent_email },
        sent_instagram: { label: "Sent (IG)", color: COLORS.sent_instagram },
        replied: { label: "Replied", color: COLORS.replied_instagram }, // Fallback/General
    };

export default function AnalyticsPage() {
    const [dateRange, setDateRange] = useState<7 | 30>(7);
    const [showEmail, setShowEmail] = useState(true);
    const [showInstagram, setShowInstagram] = useState(true);

    const { data: analytics, isLoading } = useQuery<AnalyticsData>({
        queryKey: ["/api/dashboard/analytics/full", { days: dateRange }],
        refetchInterval: 5000 // Real-time poll
    });

    const COLORS = {
        primary: "hsl(var(--primary))",
        sent_email: "#3b82f6", // Blue
        sent_instagram: "#d946ef", // Pink/Fuchsia
        replied_email: "#1e40af", // Dark Blue
        replied_instagram: "#86198f", // Dark Purple
        booked: "#10b981",
        background: "hsl(var(--background))",
    };

    if (isLoading && !analytics) return (
        <div className="flex h-[50vh] items-center justify-center">
            <PremiumLoader text="Analyzing channel performance..." />
        </div>
    );

    const chartConfig = {
        sent_email: { label: "Sent (Email)", color: COLORS.sent_email },
        sent_instagram: { label: "Sent (IG)", color: COLORS.sent_instagram },
        replied: { label: "Replied", color: COLORS.replied_instagram }, // Fallback/General
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header and key metrics remain the same */}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Growth Chart */}
                <Card className="lg:col-span-2 bg-[#050505] border-white/5 rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Engagement Velocity</CardTitle>
                        <div className="flex gap-4">
                            <div className="flex bg-muted/20 rounded-lg p-1">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setDateRange(7)} 
                                    className={cn("h-7 text-[10px] font-bold", dateRange === 7 && "bg-primary text-primary-foreground")}
                                >
                                    7 Days
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setDateRange(30)} 
                                    className={cn("h-7 text-[10px] font-bold", dateRange === 30 && "bg-primary text-primary-foreground")}
                                >
                                    30 Days
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setShowEmail(!showEmail)}
                                    className={cn("h-8 text-[10px] border-blue-500/30", showEmail ? "bg-blue-500/10 text-blue-500" : "opacity-50")}
                                >
                                    <Mail className="w-3 h-3 mr-1" /> Email
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setShowInstagram(!showInstagram)}
                                    className={cn("h-8 text-[10px] border-fuchsia-500/30", showInstagram ? "bg-fuchsia-500/10 text-fuchsia-500" : "opacity-50")}
                                >
                                    <TrendingUp className="w-3 h-3 mr-1" /> Instagram
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[400px] p-8">
                        <ChartContainer config={chartConfig}>
                            <div className="h-full w-full">
                                <AreaChart data={analytics?.timeSeries || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSentEmail" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.sent_email} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={COLORS.sent_email} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorSentInstagram" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.sent_instagram} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={COLORS.sent_instagram} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }} />
                                    <ChartTooltip content={<ChartTooltipContent className="bg-black border-white/10 rounded-xl" />} />
                                    
                                    {showEmail && <Area type="monotone" dataKey="sent_email" stackId="1" stroke={COLORS.sent_email} fillOpacity={1} fill="url(#colorSentEmail)" strokeWidth={3} />}
                                    {showInstagram && <Area type="monotone" dataKey="sent_instagram" stackId="1" stroke={COLORS.sent_instagram} fillOpacity={1} fill="url(#colorSentInstagram)" strokeWidth={3} />}
                                    
                                    {/* Replies as lines for clarity */}
                                    {showEmail && <Area type="monotone" dataKey="replied_email" stackId="2" stroke={COLORS.replied_email} fillOpacity={0} strokeWidth={2} strokeDasharray="4 4" />}
                                    {showInstagram && <Area type="monotone" dataKey="replied_instagram" stackId="2" stroke={COLORS.replied_instagram} fillOpacity={0} strokeWidth={2} strokeDasharray="4 4" />}
                                </AreaChart>
                            </div>
                        </ChartContainer>
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
