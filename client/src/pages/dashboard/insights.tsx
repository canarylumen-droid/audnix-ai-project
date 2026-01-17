
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  RefreshCw,
  Instagram,
  Mail,
  BarChart,
  Download,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AnimatedNumber } from "@/hooks/use-count-up";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart as RechartsBarChart,
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
} from "recharts";
import { useCanAccessAnalytics, useCanAccessFullAnalytics } from "@/hooks/use-access-gate";
import { FeatureLock } from "@/components/upgrade/FeatureLock";
import { PremiumLoader } from "@/components/ui/premium-loader";

interface ChannelData {
  channel: string;
  count: number;
  percentage: number;
}

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

interface TimeSeriesData {
  date: string;
  leads: number;
}

interface InsightsMetrics {
  avgResponseTime: string;
  conversionRate: string;
  engagementScore: string;
}

interface InsightsApiResponse {
  summary: string | null;
  channels: ChannelData[];
  funnel: FunnelStage[];
  hasData: boolean;
  timeSeries: TimeSeriesData[];
  metrics?: InsightsMetrics;
}

export default function InsightsPage() {
  const { canAccess: canAccessFullAnalytics } = useCanAccessFullAnalytics();
  const { data: insightsData, isLoading, error, refetch, isFetching } = useQuery<InsightsApiResponse>({
    queryKey: ["/api/insights"],
    refetchInterval: 10000,
    retry: false,
  });

  const insights = insightsData?.summary || null;
  const channelData = insightsData?.channels || [];
  const conversionFunnel = insightsData?.funnel || [];
  const hasData = insightsData?.hasData || false;
  const timeSeriesData = insightsData?.timeSeries || [];

  const PIE_COLORS = [
    "hsl(var(--primary))",
    "#c026d3", // Fuchsia
    "#f59e0b", // Amber
    "#10b981", // Emerald
    "#6366f1"  // Indigo
  ];

  const COLORS = {
    primary: "hsl(var(--primary))",
    secondary: "hsl(var(--primary) / 0.6)",
    accent: "#f59e0b", // Amber
    success: "#10b981", // Emerald
    background: "hsl(var(--background))",
    grid: "hsl(var(--border) / 0.1)",
    tooltip: "hsl(var(--popover))"
  };

  const chartConfig = {
    Instagram: {
      label: "Instagram",
      color: "#E1306C", // Specific Instagram color
    },
    Email: {
      label: "Email",
      color: COLORS.primary,
    },
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <PremiumLoader text="Synthesizing Insights..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Unable to load insights. Please check your connection.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent inline-flex items-center gap-2">
            AI Insights <Sparkles className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time analysis to optimize your outreach strategy.
          </p>
        </div>
        {hasData && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.href = '/api/bulk/export'}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="grid gap-6">
          <Card className="border-dashed border-2 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-6">
              <div className="h-20 w-20 bg-background rounded-full shadow-lg flex items-center justify-center text-primary border border-border/50">
                <TrendingUp className="h-10 w-10" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-semibold">Awaiting Data</h3>
                <p className="text-muted-foreground">
                  Audnix is ready to analyze your traffic. Connect an integration or start an automation to generate insights.
                </p>
              </div>
              <div className="flex gap-4">
                <Button onClick={() => window.location.href = '/dashboard/integrations'}>
                  Connect Instagram <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50 pointer-events-none grayscale-[0.5]">
            {/* Mock cards to show potential */}
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-32 bg-muted/20" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* AI Summary Card */}
          {insights && (
            <Card className="bg-gradient-to-br from-primary/10 via-transparent to-transparent border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-indigo-400" />
                  Performance Summary
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-lg leading-relaxed font-medium text-foreground/90">
                  {insights}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Avg Response Time"
              value={insightsData?.metrics?.avgResponseTime || "--"}
              color="text-primary"
              icon={BarChart}
            />
            <MetricCard
              title="Conversion Rate"
              value={(insightsData?.metrics?.conversionRate || "0") + "%"}
              color="text-emerald-500"
              progress={parseFloat(insightsData?.metrics?.conversionRate || "0")}
              icon={TrendingUp}
            />
            <MetricCard
              title="Engagement Score"
              value={(insightsData?.metrics?.engagementScore || "0") + "%"}
              color="text-purple-500"
              progress={parseFloat(insightsData?.metrics?.engagementScore || "0")}
              icon={Sparkles}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {channelData.length > 0 && (
              <Card className="border-border/40 bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/60">Channel Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelData}
                        dataKey="count"
                        nameKey="channel"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {channelData.map((e, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {timeSeriesData.length > 0 && (
              <Card className="border-border/40 bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/60">Lead Volume</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/10" />
                      <XAxis dataKey="date" className="text-[10px] text-muted-foreground" axisLine={false} tickLine={false} />
                      <YAxis className="text-[10px] text-muted-foreground" axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="leads"
                        strokeWidth={4}
                        stroke="hsl(var(--primary))"
                        dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Feature Lock for advanced if needed */}
          {!canAccessFullAnalytics && (
            <FeatureLock featureName="Advanced Analytics" description="Unlock deep channel analysis." requiredPlan="Pro" />
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, color, icon: Icon, progress }: { title: string, value: string, color: string, icon: any, progress?: number }) {
  return (
    <Card className="border-border/40 hover:border-primary/20 transition-all bg-card/40 backdrop-blur-xl rounded-[2rem] group relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">{title}</CardTitle>
        <Icon className={cn("h-4 w-4 transition-colors", color)} />
      </CardHeader>
      <CardContent className="flex flex-col items-center text-center pt-2">
        {progress !== undefined ? (
          <div className="relative h-24 w-24 mb-4 flex items-center justify-center">
            <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
              <path className="text-muted/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <motion.path
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${progress}, 100` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={color}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold tracking-tighter">{value}</span>
            </div>
          </div>
        ) : (
          <div className="text-3xl font-bold tracking-tighter mb-4 py-3">{value}</div>
        )}

        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/40 mb-2">Network Health</p>

        {/* Apple-style background glow */}
        <div className={cn("absolute -bottom-10 -right-10 w-32 h-32 blur-[80px] opacity-10 rounded-full", color.replace('text-', 'bg-'))} />
      </CardContent>
    </Card>
  );
}