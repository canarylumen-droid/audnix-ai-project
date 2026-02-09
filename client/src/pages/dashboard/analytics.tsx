import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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
    Unplug,
    MessageSquare
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
    channelPerformance: Array<{ name: string; value: number }>;
    leadSourceDistribution: Array<{ name: string; value: number; color: string }>;
    recentEvents: Array<{ id: string; type: string; description: string; time: string; details?: string }>;
    isAnyConnected?: boolean;
}

// ... imports remain the same

const COLORS = {
    primary: "hsl(var(--primary))",
    sent_email: "#3b82f6",
    sent_instagram: "#d946ef",
    replied_email: "#1e40af",
    replied_instagram: "#86198f",
    booked: "#10b981",
    background: "hsl(var(--background))",
    card: "hsl(var(--card))",
};

const chartConfig = {
    sent_email: { label: "Sent (Email)", color: COLORS.sent_email },
    sent_instagram: { label: "Sent (IG)", color: COLORS.sent_instagram },
    replied: { label: "Replied", color: COLORS.replied_instagram },
    booked: { label: "Converted", color: COLORS.booked },
};

export default function AnalyticsPage() {
    const [dateRange, setDateRange] = useState<7 | 30>(7);
    const [showEmail, setShowEmail] = useState(true);
    const [showInstagram, setShowInstagram] = useState(true);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [chartType, setChartType] = useState<'area' | 'bar'>('area');
    const [timeRange, setTimeRange] = useState<string>('7d');
    const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'instagram'>('all');
    const queryClient = useQueryClient();
    const { data: analytics, isLoading } = useQuery<AnalyticsData>({
        queryKey: ["/api/dashboard/analytics/full", { days: dateRange }],
        refetchInterval: 10000
    });

    // Filtered metrics based on channelFilter
    const filteredMetrics = analytics?.metrics ? {
        ...analytics.metrics,
        sent: channelFilter === 'email' ? analytics.metrics.sent : (channelFilter === 'instagram' ? 0 : analytics.metrics.sent), // Placeholder logic, adjust as needed
        replied: channelFilter === 'email' ? analytics.metrics.replied : (channelFilter === 'instagram' ? 0 : analytics.metrics.replied), // Placeholder logic
        // Add more filtering logic for other metrics if necessary
    } : undefined;

    if (isLoading && !analytics) return (
        <div className="flex h-[50vh] items-center justify-center">
            <PremiumLoader text="Initializing intelligence layer..." />
        </div>
    );

    // Empty state logic for when no data is available
    const hasData = analytics && (analytics.metrics.sent > 0 || analytics.metrics.replied > 0 || analytics.metrics.booked > 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {hasData ? (
                    <>
                        <StatCard
                            label="Total Sent"
                            value={filteredMetrics?.sent || 0}
                            icon={Send}
                            trend="+12.5%"
                            color="text-blue-500"
                            index={0}
                        />
                        <StatCard
                            label="Response Rate"
                            value={`${filteredMetrics?.responseRate || 0}%`}
                            icon={MessageCircle}
                            trend="+4.2%"
                            color="text-emerald-500"
                            index={1}
                        />
                        <StatCard
                            label="Conversion Rate"
                            value={`${filteredMetrics?.conversionRate || 0}%`}
                            icon={TrendingUp}
                            trend="+1.8%"
                            color="text-amber-500"
                            index={2}
                        />
                        <StatCard
                            label="Revenue"
                            value={`$${(filteredMetrics?.booked || 0) * 1500}`} // Estimated LTV
                            icon={DollarSign}
                            trend="+24%"
                            color="text-purple-500"
                            index={3}
                        />
                    </>
                ) : (
                    <div className="lg:col-span-4 flex flex-col items-center justify-center text-center opacity-20 py-10">
                        <Unplug className="w-16 h-16 mb-4" />
                        <p className="text-lg font-black uppercase tracking-widest">No data available yet.</p>
                        <p className="text-sm text-muted-foreground mt-2">Connect your channels to start seeing analytics.</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Growth Chart */}
                <Card className="lg:col-span-2 bg-card border-border/40 rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8 pb-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/40 text-center sm:text-left">Engagement Velocity</CardTitle>
                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="flex bg-muted/50 rounded-lg p-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDateRange(7)}
                                    className={cn("h-7 text-[10px] font-bold px-4", dateRange === 7 && "bg-background shadow-sm")}
                                >
                                    7 Days
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDateRange(30)}
                                    className={cn("h-7 text-[10px] font-bold px-4", dateRange === 30 && "bg-background shadow-sm")}
                                >
                                    30 Days
                                </Button>
                            </div>
                            {/* Chart Type Toggle */}
                            <div className="flex bg-muted/50 rounded-lg p-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setChartType("area")}
                                    className={cn("h-7 w-7 p-0", chartType === "area" && "bg-background shadow-sm")}
                                >
                                    <Activity className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setChartType("bar")}
                                    className={cn("h-7 w-7 p-0", chartType === "bar" && "bg-background shadow-sm")}
                                >
                                    <BarChart3 className="w-3.5 h-3.5" />
                                </Button>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowEmail(!showEmail)}
                                    className={cn("h-8 text-[10px] border-blue-500/30 rounded-lg", showEmail ? "bg-blue-500/10 text-blue-500" : "opacity-50")}
                                >
                                    <Mail className="w-3 h-3 mr-1" /> Email
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowInstagram(!showInstagram)}
                                    className={cn("h-8 text-[10px] border-fuchsia-500/30 rounded-lg", showInstagram ? "bg-fuchsia-500/10 text-fuchsia-500" : "opacity-50")}
                                >
                                    <TrendingUp className="w-3 h-3 mr-1" /> Instagram
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[300px] md:h-[400px] p-4 md:p-8">
                        {chartType === "area" ? (
                            <ChartContainer config={chartConfig} className="w-full h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics?.timeSeries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                                        />
                                        <ChartTooltip
                                            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '4 4' }}
                                            content={<ChartTooltipContent className="bg-card/90 backdrop-blur-xl border-border rounded-2xl shadow-2xl p-4 min-w-[150px]" />}
                                        />

                                        {showEmail && (
                                            <Area
                                                type="monotone"
                                                dataKey="sent_email"
                                                stackId="1"
                                                stroke={COLORS.sent_email}
                                                fillOpacity={1}
                                                fill="url(#colorSentEmail)"
                                                strokeWidth={3}
                                                activeDot={{ r: 6, strokeWidth: 0, fill: COLORS.sent_email }}
                                            />
                                        )}
                                        {showInstagram && (
                                            <Area
                                                type="monotone"
                                                dataKey="sent_instagram"
                                                stackId="1"
                                                stroke={COLORS.sent_instagram}
                                                fillOpacity={1}
                                                fill="url(#colorSentInstagram)"
                                                strokeWidth={3}
                                                activeDot={{ r: 6, strokeWidth: 0, fill: COLORS.sent_instagram }}
                                            />
                                        )}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        ) : (
                            <div className="h-full w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Sent Email', value: analytics?.metrics.sent || 0, color: COLORS.sent_email },
                                                { name: 'Sent IG', value: 0, color: COLORS.sent_instagram }, // Add IG sent when metric available
                                                { name: 'Replied', value: analytics?.metrics.replied || 0, color: COLORS.replied_instagram },
                                            ].filter(item => item.value > 0)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {[0, 1, 2].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={[COLORS.sent_email, COLORS.sent_instagram, COLORS.replied_instagram][index]} stroke="transparent" />
                                            ))}
                                        </Pie>
                                        <ChartTooltip content={<ChartTooltipContent className="bg-card border-border rounded-xl" />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Real-time Activity Feed */}
                <Card className="bg-card border-border/40 rounded-[2rem] p-8 flex flex-col relative overflow-hidden">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-8 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" /> Live Interaction Stream
                    </h3>
                    <div className="space-y-6 flex-1">
                        {(analytics?.recentEvents || []).length > 0 ? (
                            analytics?.recentEvents.map(event => (
                                <div key={event.id} className="flex gap-4 group">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)] shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{event.description}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 mt-1">{event.time}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                                <Zap className="w-12 h-12 mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">Waiting for activity...</p>
                            </div>
                        )}
                    </div>
                    <Button
                        onClick={() => setIsAuditModalOpen(true)}
                        variant="ghost"
                        className="mt-8 text-[10px] font-black uppercase tracking-widest text-primary p-0 h-auto justify-start hover:bg-transparent hover:text-primary/80"
                    >
                        View Transparency Audit Log <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>

                    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary/5 blur-[60px] rounded-full" />
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lead Distribution Pie Chart */}
                <Card className="bg-card border-border/40 rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/40">Lead Status System</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        {analytics?.metrics ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Warm', value: analytics.metrics.replied, color: '#3b82f6' },
                                            { name: 'Cold', value: analytics.metrics.sent - analytics.metrics.replied, color: '#d946ef' },
                                            { name: 'Converted', value: analytics.metrics.booked, color: '#10b981' }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        {[0, 1, 2].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#d946ef', '#10b981'][index]} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip content={<ChartTooltipContent className="bg-card border-border rounded-xl" />} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="opacity-20 flex flex-col items-center">
                                <PieChartIcon className="w-12 h-12 mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Aggregating Data...</p>
                            </div>
                        )}
                        <div className="flex flex-col gap-3 justify-center pr-10">
                            {[
                                { label: 'Warm', color: 'bg-blue-500' },
                                { label: 'Cold', color: 'bg-fuchsia-500' },
                                { label: 'Converted', color: 'bg-emerald-500' }
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-3">
                                    <div className={cn("w-2 h-2 rounded-full", item.color)} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Audit Purpose Info */}
                <Card className="bg-card border-border/40 rounded-[2rem] p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-black tracking-tight">AI Decision Engine</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                        Audnix logs every deterministic decision cycle. The **Transparency Audit Log** provides transparency into how the AI interprets leads, handles objections, and triggers automation rules.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                            <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Transparency</div>
                            <p className="text-[11px] font-bold opacity-70 leading-snug">Track AI logic flow step-by-step.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                            <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Optimization</div>
                            <p className="text-[11px] font-bold opacity-70 leading-snug">Refine rules based on failed cycles.</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Audit Logs Modal */}
            <Sheet open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
                <SheetContent side="right" className="w-full sm:max-w-xl p-0 bg-background border-l border-border">
                    <div className="h-full flex flex-col">
                        <div className="p-8 border-b border-border bg-card/50">
                            <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
                                <Activity className="w-5 h-5 text-primary" /> Transparency Audit Log
                            </h2>
                            <p className="text-xs text-muted-foreground mt-1 lowercase first-letter:uppercase font-bold">Historical trace of all AI decision cycles and lead intersections</p>
                        </div>
                        <ScrollArea className="flex-1 p-8">
                            <div className="space-y-8">
                                {(analytics?.recentEvents || []).map((event, idx) => (
                                    <div key={idx} className="relative pl-8 border-l border-border/40 pb-8 last:pb-0">
                                        <div className="absolute left-[-5px] top-0 w-[9px] h-[9px] rounded-full bg-primary shadow-[0_0_10px_#3b82f6]" />
                                        <div className="space-y-2">
                                            <div className="flex items-baseline justify-between">
                                                <h4 className="text-sm font-black uppercase tracking-widest">{event.type}</h4>
                                                <span className="text-[10px] font-mono opacity-40">{event.time}</span>
                                            </div>
                                            <p className="text-sm text-foreground/80 leading-relaxed font-bold">{event.description}</p>
                                            {event.details && (
                                                <div className="p-3 rounded-xl bg-muted/50 border border-border/20 text-xs font-mono opacity-60">
                                                    {event.details}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
