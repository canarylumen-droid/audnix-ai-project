
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const COLORS = {
    Instagram: '#E1306C',
    Email: '#3B82F6',
    primary: 'hsl(var(--primary))',
  };

  const chartConfig = {
    Instagram: {
      label: "Instagram",
      color: COLORS.Instagram,
    },
    Email: {
      label: "Email",
      color: COLORS.Email,
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
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent inline-flex items-center gap-2">
            AI Insights <Sparkles className="h-6 w-6 text-purple-400" />
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
            <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
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
            <MetricCard title="Avg Response Time" value={insightsData?.metrics?.avgResponseTime || "--"} color="text-cyan-500" />
            <MetricCard title="Conversion Rate" value={parseFloat(insightsData?.metrics?.conversionRate || "0") + "%"} color="text-emerald-500" />
            <MetricCard title="Engagement Score" value={parseFloat(insightsData?.metrics?.engagementScore || "0") + "%"} color="text-purple-500" />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {channelData.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Channel Distribution</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={channelData} dataKey="count" nameKey="channel" cx="50%" cy="50%" outerRadius={80} label>
                        {channelData.map((e, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[e.channel as keyof typeof COLORS] || COLORS.primary} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {timeSeriesData.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Lead Volume</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                      <XAxis dataKey="date" className="text-xs text-muted-foreground" axisLine={false} tickLine={false} />
                      <YAxis className="text-xs text-muted-foreground" axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="leads" strokeWidth={3} stroke="hsl(var(--primary))" dot={false} />
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

function MetricCard({ title, value, color }: { title: string, value: string, color: string }) {
  return (
    <Card className="border-border/60 hover:border-border transition-colors group relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <div className="h-1 w-full bg-muted mt-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: parseInt(value) > 100 ? '100%' : value }}
            className={`h-full ${color.replace('text-', 'bg-')}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}