import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  RefreshCw,
  Instagram,
  Mail,
  Calendar,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

export default function InsightsPage() {
  const insights = {
    summary: "62% of leads came from Instagram, with highest conversion rates between 6-9 PM. WhatsApp engagement is up 45% this week.",
    topChannel: "Instagram",
    topPerformingTime: "6-9 PM",
    avgResponseTime: "2.3 hours",
    period: {
      start: "2025-01-15",
      end: "2025-01-22",
    },
  };

  const channelData = [
    { channel: "Instagram", count: 89, percentage: 62, color: "bg-pink-500" },
    { channel: "WhatsApp", count: 35, percentage: 24, color: "bg-emerald-500" },
    { channel: "Email", count: 20, percentage: 14, color: "bg-blue-500" },
  ];

  const conversionFunnel = [
    { stage: "Leads", count: 144, percentage: 100 },
    { stage: "Replied", count: 98, percentage: 68 },
    { stage: "Engaged", count: 52, percentage: 36 },
    { stage: "Converted", count: 17, percentage: 12 },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-insights">
            Insights & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-generated insights for {new Date(insights.period.start).toLocaleDateString()} - {new Date(insights.period.end).toLocaleDateString()}
          </p>
        </div>
        <Button variant="outline" data-testid="button-regenerate">
          <RefreshCw className="h-4 w-4 mr-2" />
          Regenerate
        </Button>
      </div>

      {/* AI Summary */}
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
              {insights.summary}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-metric-channel">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-top-channel">{insights.topChannel}</p>
            <p className="text-sm text-muted-foreground mt-1">62% of all leads</p>
          </CardContent>
        </Card>

        <Card data-testid="card-metric-time">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Best Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-best-time">{insights.topPerformingTime}</p>
            <p className="text-sm text-muted-foreground mt-1">Highest conversion</p>
          </CardContent>
        </Card>

        <Card data-testid="card-metric-response">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-response-time">{insights.avgResponseTime}</p>
            <p className="text-sm text-emerald-500 mt-1">-15% from last week</p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Channel Performance</h2>
        <Card data-testid="card-channel-performance">
          <CardContent className="p-6 space-y-4">
            {channelData.map((item, index) => {
              const Icon = item.channel === "Instagram" ? Instagram : item.channel === "WhatsApp" ? SiWhatsapp : Mail;
              return (
                <motion.div
                  key={item.channel}
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  data-testid={`channel-stat-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.channel}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground" data-testid={`channel-count-${index}`}>
                        {item.count} leads
                      </span>
                      <Badge variant="secondary" data-testid={`channel-percentage-${index}`}>{item.percentage}%</Badge>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${item.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Conversion Funnel</h2>
        <Card data-testid="card-conversion-funnel">
          <CardContent className="p-6">
            <div className="space-y-6">
              {conversionFunnel.map((stage, index) => (
                <motion.div
                  key={stage.stage}
                  className="space-y-2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.15 }}
                  data-testid={`funnel-stage-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-lg">{stage.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold" data-testid={`funnel-count-${index}`}>{stage.count}</span>
                      <Badge variant="outline" data-testid={`funnel-percentage-${index}`}>{stage.percentage}%</Badge>
                    </div>
                  </div>
                  {index < conversionFunnel.length - 1 && (
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.15 }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
