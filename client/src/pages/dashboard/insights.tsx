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
  Loader2,
  ChartBar,
  Download,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
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
  Legend,
  Tooltip,
} from "recharts";
import { useCanAccessAnalytics } from "@/hooks/use-access-gate";
import { FeatureLock } from "@/components/upgrade/FeatureLock";
import { useUser } from "@/hooks/use-user";

export default function InsightsPage() {
  const { canAccess: canAccessAnalytics } = useCanAccessAnalytics();
  const { user } = useUser();
  const { data: insightsData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["/api/insights"],
    refetchInterval: 10000, // Update every 10 seconds
    refetchOnWindowFocus: true,
    retry: false,
  });

  const insights = insightsData?.summary || null;
  const channelData = insightsData?.channels || [];
  const conversionFunnel = insightsData?.funnel || [];
  const hasData = insightsData?.hasData || false;
  const timeSeriesData = insightsData?.timeSeries || [];

  const handleRegenerate = async () => {
    await refetch();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'instagram':
        return Instagram;
      case 'whatsapp':
        return SiWhatsapp;
      case 'email':
        return Mail;
      default:
        return ChartBar;
    }
  };

  const COLORS = {
    Instagram: '#E1306C',
    WhatsApp: '#25D366',
    Email: '#3B82F6',
    primary: 'hsl(var(--primary))',
  };

  const chartConfig = {
    Instagram: {
      label: "Instagram",
      color: COLORS.Instagram,
    },
    WhatsApp: {
      label: "WhatsApp",
      color: COLORS.WhatsApp,
    },
    Email: {
      label: "Email",
      color: COLORS.Email,
    },
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          {/* Animated brain/thinking indicator */}
          <div className="relative w-16 h-16">
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/40 rounded-full"
            />
            <motion.div
              animate={{ scale: [1.2, 1, 1.2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-2 bg-gradient-to-r from-primary to-primary/60 rounded-full flex items-center justify-center"
            >
              <BarChart className="h-6 w-6 text-white" />
            </motion.div>
          </div>
          
          {/* Animated text */}
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-foreground">
              🤖 AI is working...
            </p>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-sm text-muted-foreground"
            >
              Deep reasoning • Analyzing patterns • Building insights
            </motion.p>
          </div>

          {/* Animated progress dots */}
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-primary"
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to load insights</h2>
          <p className="text-muted-foreground">
            Please check your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="heading-insights">
            Insights & Analytics
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {hasData
              ? "AI-generated insights from your lead data"
              : "Analytics will appear here once you have data"}
          </p>
        </div>
        {hasData && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              data-testid="button-download-pdf"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={isFetching}
              data-testid="button-regenerate"
              className="relative overflow-hidden"
            >
              {isFetching ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                  </motion.div>
                  <span className="opacity-70">Generating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {!hasData ? (
        <Card className="border-dashed" data-testid="card-empty-state">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">You don't have any activity yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Connect your Instagram, WhatsApp, or Email accounts to start receiving leads.
              Once you have activity, AI-powered insights and analytics will appear here in real-time
              to help you optimize your conversions.
            </p>
            <Button data-testid="button-connect-accounts" asChild>
              <a href="/dashboard/integrations">Connect Accounts</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* AI Insights - FREE for all users! Show preview for trial users */}
          {insights && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-transparent bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-transparent" data-testid="card-ai-summary">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="p-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                      >
                        <TrendingUp className="h-5 w-5 text-white" />
                      </motion.div>
                      <div>
                        <CardTitle className="text-lg">🤖 AI Insights</CardTitle>
                        <CardDescription className="text-xs">Live analysis of your campaigns</CardDescription>
                      </div>
                    </div>
                    {!canAccessAnalytics && (
                      <Badge className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white border-0">
                        FREE Preview
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-base leading-relaxed text-foreground font-medium" 
                    data-testid="text-ai-summary"
                  >
                    {insights}
                  </motion.p>
                  
                  {!canAccessAnalytics && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-4 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg space-y-3"
                    >
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-cyan-300">
                          ✨ Upgrade to unlock full analytics:
                        </p>
                        <ul className="text-xs text-gray-300 space-y-1 ml-2">
                          <li>✓ Detailed channel breakdowns (Instagram, WhatsApp, Email)</li>
                          <li>✓ Conversion rates & engagement scores</li>
                          <li>✓ Real-time performance charts</li>
                          <li>✓ AI-powered recommendations</li>
                        </ul>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => window.location.href = '/dashboard/pricing'}
                        className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
                      >
                        See Full Analytics → Upgrade Now
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Wrap analytics in FeatureLock for free/trial users */}
          {canAccessAnalytics ? (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Card data-testid="card-metric-response">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {insightsData?.metrics?.avgResponseTime || "—"}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-metric-conversion">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {insightsData?.metrics?.conversionRate || "0"}%
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-metric-engagement">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Engagement Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {insightsData?.metrics?.engagementScore || "0"}%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {channelData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card data-testid="card-channel-chart">
                  <CardHeader>
                    <CardTitle>Lead Sources Distribution</CardTitle>
                    <CardDescription>
                      Breakdown by channel
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={channelData}
                            dataKey="count"
                            nameKey="channel"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={(entry) => `${entry.channel}: ${entry.percentage}%`}
                          >
                            {channelData.map((entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[entry.channel as keyof typeof COLORS] || COLORS.primary}
                              />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {channelData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card data-testid="card-channel-breakdown">
                  <CardHeader>
                    <CardTitle>Lead Volume by Channel</CardTitle>
                    <CardDescription>
                      Total leads per channel
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={channelData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="channel" className="text-xs" />
                          <YAxis className="text-xs" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey="count"
                            radius={[8, 8, 0, 0]}
                          >
                            {channelData.map((entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[entry.channel as keyof typeof COLORS] || COLORS.primary}
                              />
                            ))}
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {timeSeriesData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card data-testid="card-trends">
                <CardHeader>
                  <CardTitle>Lead Trends</CardTitle>
                  <CardDescription>
                    Daily lead activity over the past week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="leads"
                          stroke={COLORS.primary}
                          strokeWidth={2}
                          dot={{ fill: COLORS.primary }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {conversionFunnel.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card data-testid="card-conversion-funnel">
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>
                    Lead progression through your sales process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {conversionFunnel.map((stage: any, index: number) => (
                      <div key={stage.stage} data-testid={`funnel-stage-${index}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{stage.stage}</span>
                          <span className="text-sm text-muted-foreground">
                            {stage.count} ({stage.percentage}%)
                          </span>
                        </div>
                        <div className="relative">
                          <div className="w-full bg-muted rounded-full h-8">
                            <div
                              className="h-8 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-end pr-3"
                              style={{ width: `${stage.percentage}%` }}
                            >
                              <span className="text-xs text-primary-foreground font-medium">
                                {stage.percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
            </>
          ) : (
            /* Show Feature Lock for free/trial users */
            <FeatureLock
              featureName="Advanced Analytics"
              description="Get detailed charts, conversion funnels, and channel performance metrics to optimize your lead generation"
              requiredPlan="Starter"
              variant="card"
              className="min-h-[400px]"
            >
              <div className="blur-sm opacity-50 pointer-events-none">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                  <Card><CardContent className="p-6 h-32"></CardContent></Card>
                  <Card><CardContent className="p-6 h-32"></CardContent></Card>
                  <Card><CardContent className="p-6 h-32"></CardContent></Card>
                </div>
              </div>
            </FeatureLock>
          )}
        </>
      )}
    </div>
  );
}