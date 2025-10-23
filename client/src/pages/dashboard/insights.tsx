import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  RefreshCw,
  Instagram,
  Mail,
  BarChart,
  Loader2,
  ChartBar,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function InsightsPage() {
  // Fetch real insights from backend
  const { data: insightsData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["/api/insights"],
    refetchInterval: 60000, // Refresh every minute
    retry: false,
  });

  const insights = insightsData?.summary || null;
  const channelData = insightsData?.channels || [];
  const conversionFunnel = insightsData?.funnel || [];
  const hasData = insightsData?.hasData || false;

  const handleRegenerate = async () => {
    await refetch();
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

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-insights">
            Insights & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            {hasData 
              ? "AI-generated insights from your lead data"
              : "Analytics will appear here once you have data"}
          </p>
        </div>
        {hasData && (
          <Button 
            variant="outline" 
            onClick={handleRegenerate}
            disabled={isFetching}
            data-testid="button-regenerate"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        )}
      </div>

      {!hasData ? (
        // Empty State
        <Card className="border-dashed" data-testid="card-empty-state">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No data yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Connect your accounts to start receiving leads. Once you have lead activity, 
              AI-powered insights will appear here to help you optimize your conversions.
            </p>
            <Button data-testid="button-connect-accounts">
              Connect Accounts
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* AI Summary */}
          {insights && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent" data-testid="card-ai-summary">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <CardTitle>AI Insights</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed" data-testid="text-ai-summary">
                    {insights}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Channel Breakdown */}
          {channelData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card data-testid="card-channel-breakdown">
                <CardHeader>
                  <CardTitle>Lead Sources</CardTitle>
                  <CardDescription>
                    Where your leads are coming from
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {channelData.map((channel: any, index: number) => {
                    const Icon = getChannelIcon(channel.channel);
                    return (
                      <div key={channel.channel} data-testid={`channel-stat-${index}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{channel.channel}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {channel.count} leads ({channel.percentage}%)
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              channel.channel === 'Instagram' ? 'bg-pink-500' :
                              channel.channel === 'WhatsApp' ? 'bg-emerald-500' :
                              'bg-blue-500'
                            }`}
                            style={{ width: `${channel.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Conversion Funnel */}
          {conversionFunnel.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
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

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </>
      )}
    </div>
  );
}