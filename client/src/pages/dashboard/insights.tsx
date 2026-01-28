
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
import { NeuralTypingLogo } from "@/components/ui/CustomIcons";

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
    queryKey: ["/api/ai/insights"],
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: false,
  });

  const insights = insightsData?.summary || null;
  const channelData = insightsData?.channels || [];
  const conversionFunnel = insightsData?.funnel || [];
  const hasData = insightsData?.hasData || (channelData.length > 0 || conversionFunnel.length > 0);
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/api/bulk/export'}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {(!hasData && !insights) ? (
        <div className="grid gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-black/40 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent" />

            <div className="flex flex-col items-center justify-center text-center space-y-12 relative z-10">
              <div className="scale-125 pb-8">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-8 w-8 text-primary" />
                  <span className="text-2xl font-black text-white">Audnix AI</span>
                </div>
              </div>

              <div className="max-w-xl space-y-4">
                <h3 className="text-4xl font-black tracking-tight text-white leading-tight">Analyzing Performance...</h3>
                <p className="text-zinc-400 text-lg leading-relaxed font-medium">
                  Audnix is currently analyzing your outreach performance. Connect an integration to activate performance tracking.
                </p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" className="rounded-full px-10 h-16 text-lg font-black shadow-[0_20px_40px_-10px_rgba(59,130,246,0.5)] transition-all hover:scale-105" onClick={() => window.location.href = '/dashboard/integrations'}>
                    Connect Integrations <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full px-10 h-16 text-lg font-black backdrop-blur-md border-white/10 text-white hover:bg-white/5" onClick={() => refetch()}>
                    <RefreshCw className="mr-2 h-5 w-5" /> Refresh Analytics
                  </Button>
                </div>

                <div className="flex items-center gap-3 py-4 px-6 rounded-full bg-white/5 border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Connect 10+ leads to activate AI optimization</span>
                </div>
              </div>
            </div>
          </motion.div>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-full lg:col-span-2">
              <CardHeader>
                <CardTitle>Lead Velocity</CardTitle>
                <CardDescription>Leads generated over time.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={timeSeriesData}
                    margin={{
                      top: 5,
                      right: 10,
                      left: 10,
                      bottom: 0,
                    }}
                  >
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      tickLine={false}
                      axisLine={false}
                      stroke={COLORS.grid}
                      className="text-[10px] text-muted-foreground"
                    />
                    <YAxis className="text-[10px] text-muted-foreground" axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="leads"
                      strokeWidth={4}
                      stroke="hsl(var(--primary))"
                      dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <MetricCard
              title="Network Health"
              value={insightsData?.metrics?.engagementScore || "0"}
              icon={<Sparkles className="h-5 w-5 text-purple-500" />}
              description="Average lead interest"
              trend="Stable"
            />
          </div>

          {!canAccessFullAnalytics && (
            <FeatureLock
              featureName="Advanced Analytics"
              description="Unlock deep channel analysis."
              requiredPlan="Pro"
            />
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon, description, trend, trendColor }: {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  trend?: string;
  trendColor?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="bg-black/40 backdrop-blur-3xl border-white/5 rounded-[2.5rem] overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">{title}</CardTitle>
          <div className="h-10 w-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black tracking-tighter mb-1 select-none">
            {value}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-zinc-500 font-medium">
              {description}
            </p>
            {trend && (
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                trendColor || "bg-primary/10 border-primary/20 text-primary"
              )}>
                {trend}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
