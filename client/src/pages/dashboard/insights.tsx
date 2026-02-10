
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
import { AudnixLogo } from "@/components/ui/CustomIcons";

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
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: false,
  });

  const insights = insightsData?.summary || null;
  const channelData = insightsData?.channels || [];
  const conversionFunnel = insightsData?.funnel || [];
  const hasData = !!insightsData && (insightsData.hasData || (channelData.length > 0 || conversionFunnel.length > 0) || !!insights);
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <AudnixLogo />
            <h3 className="text-xl font-black mt-8 text-foreground">Analyzing Intelligence</h3>
            <p className="text-muted-foreground font-medium max-w-xs mt-2">
              Gathering real-time market signals and campaign data...
            </p>
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
              value={!insightsData?.metrics?.engagementScore || insightsData.metrics.engagementScore === "NaN" ? "0" : insightsData.metrics.engagementScore}
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
      <Card className="bg-card border-border rounded-[2.5rem] overflow-hidden relative group">
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
