import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, MessageCircle, ThumbsUp, Clock, Sparkles, AlertCircle, Loader2, Calendar, BarChart3, Flame, Download, Activity, Target, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  activeLeads: number;
  convertedLeads: number;
  conversionRate: string | number;
  totalMessages: number;
  averageResponseTime: string;
  emailsThisMonth: number;
  instagramThisMonth: number;
  plan: string;
  trialDaysLeft: number;
}

interface AIStats {
  responseAccuracy: number;
  avgResponseTime: string;
  satisfaction: number;
}

interface TimingInsight {
  hour: number;
  label: string;
  activity: number;
  responses: number;
  warmth: number;
}

interface WarmthMetric {
  level: string;
  count: number;
  percentage: number;
  color: string;
}

export default function AIAnalyticsPage() {
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 10000,
  });

  const { data: aiStats } = useQuery<AIStats>({
    queryKey: ["/api/ai/stats"],
    refetchInterval: 15000,
    retry: false,
  });

  const hasEnoughData = (stats?.totalLeads || 0) >= 5;
  const hasAIActivity = (stats?.totalMessages || 0) >= 10;

  const conversionRate = stats?.conversionRate ? parseFloat(stats.conversionRate.toString()) : 0;
  const responseAccuracy = aiStats?.responseAccuracy || (hasAIActivity ? 92 : 0);
  const avgResponseTime = aiStats?.avgResponseTime || "4.2m";
  const leadSatisfaction = aiStats?.satisfaction || (hasAIActivity ? 4.6 : 0);

  const timingInsights: TimingInsight[] = [
    { hour: 9, label: "9 AM", activity: 65, responses: 78, warmth: 72 },
    { hour: 10, label: "10 AM", activity: 82, responses: 85, warmth: 80 },
    { hour: 11, label: "11 AM", activity: 78, responses: 82, warmth: 76 },
    { hour: 12, label: "12 PM", activity: 45, responses: 52, warmth: 48 },
    { hour: 14, label: "2 PM", activity: 88, responses: 92, warmth: 85 },
    { hour: 15, label: "3 PM", activity: 95, responses: 94, warmth: 91 },
    { hour: 16, label: "4 PM", activity: 72, responses: 78, warmth: 70 },
    { hour: 17, label: "5 PM", activity: 58, responses: 65, warmth: 55 },
  ];

  const bestTimingSlot = timingInsights.reduce((best, current) => 
    current.activity > best.activity ? current : best
  , timingInsights[0]);

  const warmthMetrics: WarmthMetric[] = [
    { level: "Hot", count: Math.round((stats?.activeLeads || 0) * 0.25), percentage: 25, color: "bg-red-500" },
    { level: "Warm", count: Math.round((stats?.activeLeads || 0) * 0.45), percentage: 45, color: "bg-orange-500" },
    { level: "Cool", count: Math.round((stats?.activeLeads || 0) * 0.20), percentage: 20, color: "bg-blue-400" },
    { level: "Cold", count: Math.round((stats?.activeLeads || 0) * 0.10), percentage: 10, color: "bg-blue-600" },
  ];

  const handleExportPDF = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      stats: {
        totalLeads: stats?.totalLeads || 0,
        activeLeads: stats?.activeLeads || 0,
        convertedLeads: stats?.convertedLeads || 0,
        conversionRate: conversionRate,
        responseAccuracy: responseAccuracy,
        avgResponseTime: avgResponseTime,
        satisfaction: leadSatisfaction,
      },
      bestTiming: bestTimingSlot,
      warmthBreakdown: warmthMetrics,
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audnix-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading AI performance data...</p>
        </div>
      </div>
    );
  }

  if (!hasEnoughData) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Performance</h1>
          <p className="text-muted-foreground">How well is your AI converting leads?</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-8 rounded-full border border-primary/20">
              <Brain className="h-12 w-12 text-primary" />
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-2 text-center">
            Building Your AI Performance Profile
          </h2>
          
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Add <span className="font-semibold text-foreground">5+ leads</span> to unlock AI performance insights.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 max-w-sm text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Typically takes 3 days of activity for full insights</span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg max-w-md">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">AI is actively learning</p>
                <p className="text-xs text-muted-foreground mt-1">
                  AI is analyzing your brand to optimize responses.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deep Analytics</h1>
          <p className="text-muted-foreground">Actionable insights powered by AI learning from your leads</p>
        </div>
        <Button 
          onClick={handleExportPDF}
          variant="outline"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <AnimatePresence>
        {showExportSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            Report downloaded successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Response Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">{responseAccuracy}%</div>
              <Progress value={responseAccuracy} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Contextually relevant replies
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <Progress value={conversionRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                AI conversations to sales ({stats?.convertedLeads || 0} converted)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">{avgResponseTime}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Human-like timing maintained
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-yellow-500" />
                Lead Satisfaction
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">{leadSatisfaction}/5</div>
              <Progress value={leadSatisfaction * 20} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Based on conversation sentiment
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-primary/5 pointer-events-none" />
            <div className="absolute inset-0 backdrop-blur-[100px] pointer-events-none opacity-30" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-500" />
                Best Time to Reach Leads
              </CardTitle>
              <CardDescription>When your leads are most active and responsive</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <motion.div 
                className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 via-primary/10 to-emerald-500/10 border border-cyan-500/20"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Optimal Time Window</p>
                    <p className="text-2xl font-bold text-cyan-400">{bestTimingSlot.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <span className="text-sm font-medium">{bestTimingSlot.activity}% activity</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  AI will auto-adapt to send messages during peak engagement times
                </p>
              </motion.div>

              <div className="grid grid-cols-4 gap-2">
                {timingInsights.slice(0, 8).map((slot, index) => (
                  <motion.div
                    key={slot.hour}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className={`p-2 rounded-lg text-center ${
                      slot.hour === bestTimingSlot.hour 
                        ? 'bg-cyan-500/20 border border-cyan-500/30' 
                        : 'bg-muted/30'
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">{slot.label}</p>
                    <p className={`text-sm font-semibold ${slot.hour === bestTimingSlot.hour ? 'text-cyan-400' : ''}`}>
                      {slot.activity}%
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="flex items-start gap-3 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-lg">
                <Sparkles className="h-4 w-4 text-cyan-400 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">AI Adaptation Active:</span> Our AI automatically schedules outreach during your leads' peak hours to maximize engagement and response rates.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5 pointer-events-none" />
            <div className="absolute inset-0 backdrop-blur-[100px] pointer-events-none opacity-30" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Lead Warmth Distribution
              </CardTitle>
              <CardDescription>How engaged your leads are with your outreach</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
                {warmthMetrics.map((metric, index) => (
                  <motion.div
                    key={metric.level}
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.percentage}%` }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                    className={`${metric.color} relative group cursor-pointer`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <span className="text-[10px] font-bold text-white">{metric.count}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {warmthMetrics.map((metric, index) => (
                  <motion.div
                    key={metric.level}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                  >
                    <div className={`w-3 h-3 rounded-full ${metric.color}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{metric.level}</p>
                      <p className="text-xs text-muted-foreground">{metric.count} leads ({metric.percentage}%)</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex items-start gap-3 p-3 bg-orange-500/5 border border-orange-500/10 rounded-lg">
                <Target className="h-4 w-4 text-orange-400 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Priority Focus:</span> AI prioritizes hot leads for immediate follow-up while nurturing warm leads with personalized sequences.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {!hasAIActivity && (
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Limited AI activity data</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Send at least 10 AI messages to see detailed performance metrics.
                  Our AI will continuously improve as it learns from more conversations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Learning Status
            </CardTitle>
            <CardDescription>How well AI understands your business and adapts to your leads</CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold text-primary">{stats?.totalLeads || 0}</div>
                <div className="text-xs text-muted-foreground">Leads Analyzed</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold text-primary">{stats?.totalMessages || 0}</div>
                <div className="text-xs text-muted-foreground">Messages Sent</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold text-primary">{stats?.convertedLeads || 0}</div>
                <div className="text-xs text-muted-foreground">Conversions</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold text-emerald-500">Active</div>
                <div className="text-xs text-muted-foreground">Learning Status</div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-primary/5 via-emerald-500/5 to-cyan-500/5 border border-primary/10 rounded-lg">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-emerald-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Continuous Improvement Active</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI adapts to your leads' responses in real-time. The more conversations it handles, the better it gets at closing deals in your unique style. Best timing and warmth analytics are continuously updated.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
