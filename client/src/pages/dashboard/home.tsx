
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  MessageSquare,
  Zap,
  Mail,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  ArrowRight,
  Activity
} from "lucide-react";
import { Link } from "wouter";
import { useReducedMotion } from "@/lib/animation-utils";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { WelcomeCelebration } from "@/components/WelcomeCelebration";
import { useState, useEffect } from "react";
import { PremiumLoader } from "@/components/ui/premium-loader";

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  name?: string;
  role: string;
  plan: string;
  businessName?: string;
  trialExpiresAt?: string;
  voiceNotesEnabled?: boolean;
  metadata?: {
    onboardingCompleted?: boolean;
    [key: string]: unknown;
  };
}

interface DashboardStats {
  leads: number;
  messages: number;
  aiReplies: number;
  conversionRate: number | string;
  conversions: number;
  totalLeads?: number;
  newLeads?: number;
  activeLeads?: number;
  convertedLeads?: number;
  totalMessages?: number;
}

interface PreviousDashboardStats {
  leads: number;
  messages: number;
  aiReplies: number;
  conversions: number;
  totalLeads?: number;
}

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  time: string | Date;
  channel: string;
  title?: string;
  description?: string;
  timestamp?: string | Date;
  leadId?: string;
}

interface DashboardActivityResponse {
  activities: ActivityItem[];
}

const channelIcons = {
  email: Mail,
};

export default function DashboardHome() {
  const prefersReducedMotion = useReducedMotion();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcomeCelebration, setShowWelcomeCelebration] = useState(false);
  const queryClient = useQueryClient();

  // Fetch real user profile
  const { data: user } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
    retry: false,
  });

  useEffect(() => {
    if (user) {
      const hasCompletedOnboarding = user.metadata?.onboardingCompleted || false;
      const onboardingDismissedKey = `onboarding_dismissed_${user.id}`;
      const wasOnboardingDismissed = localStorage.getItem(onboardingDismissedKey);
      setShowOnboarding(!hasCompletedOnboarding && !wasOnboardingDismissed);
    }
  }, [user]);

  const showCelebrationAfterOnboarding = () => {
    if (user?.username) {
      const celebrationKey = `celebration_shown_${user.id}`;
      const hasSeenCelebration = localStorage.getItem(celebrationKey);
      const onboardingDismissedKey = `onboarding_dismissed_${user.id}`;
      if (!hasSeenCelebration && localStorage.getItem(onboardingDismissedKey)) {
        setShowWelcomeCelebration(true);
        localStorage.setItem(celebrationKey, "true");
      }
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    if (user?.id) localStorage.setItem(`onboarding_dismissed_${user.id}`, "true");
    queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    showCelebrationAfterOnboarding();
  };

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    staleTime: 60000,
    refetchInterval: false,
  });

  const { data: previousStats } = useQuery<PreviousDashboardStats>({
    queryKey: ["/api/dashboard/stats/previous"],
    retry: false,
    staleTime: Infinity,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery<DashboardActivityResponse>({
    queryKey: ["/api/dashboard/activity"],
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  });

  const getTrialDaysLeft = () => {
    if (!user?.plan || user.plan !== "trial" || !user?.trialExpiresAt) return 0;
    const now = new Date();
    const expiryDate = new Date(user.trialExpiresAt);
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const trialDaysLeft = getTrialDaysLeft();
  const activities = activityData?.activities || [];

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const calculatePercentageChange = (current: number, previous: number | undefined): string => {
    if (!previousStats || previous === undefined) return "—";
    if (previous === 0) return current > 0 ? "+100%" : "—";
    const change = ((current - previous) / previous) * 100;
    if (isNaN(change) || !isFinite(change)) return "—";
    const formatted = change.toFixed(1);
    return change > 0 ? `+${formatted}%` : `${formatted}%`;
  };

  const kpis = [
    {
      label: "Total Leads",
      value: stats?.leads || 0,
      icon: Users,
      percentage: calculatePercentageChange(stats?.leads || 0, previousStats?.leads),
      trend: previousStats ? ((stats?.leads || 0) > (previousStats?.leads || 0) ? "up" : (stats?.leads || 0) < (previousStats?.leads || 0) ? "down" : "neutral") : "neutral",
    },
    {
      label: "Messages Sent",
      value: stats?.messages || 0,
      icon: MessageSquare,
      percentage: calculatePercentageChange(stats?.messages || 0, previousStats?.messages),
      trend: previousStats ? ((stats?.messages || 0) > (previousStats?.messages || 0) ? "up" : (stats?.messages || 0) < (previousStats?.messages || 0) ? "down" : "neutral") : "neutral",
    },
    {
      label: "AI Replies",
      value: stats?.aiReplies || 0,
      icon: Zap,
      percentage: calculatePercentageChange(stats?.aiReplies || 0, previousStats?.aiReplies),
      trend: previousStats ? ((stats?.aiReplies || 0) > (previousStats?.aiReplies || 0) ? "up" : (stats?.aiReplies || 0) < (previousStats?.aiReplies || 0) ? "down" : "neutral") : "neutral",
    },
    {
      label: "Conversion Rate",
      value: parseFloat(stats?.conversionRate?.toString() || "0"),
      suffix: "%",
      icon: TrendingUp,
      percentage: calculatePercentageChange(stats?.conversions || 0, previousStats?.conversions),
      trend: previousStats ? ((stats?.conversions || 0) > (previousStats?.conversions || 0) ? "up" : (stats?.conversions || 0) < (previousStats?.conversions || 0) ? "down" : "neutral") : "neutral",
    },
  ];

  if (statsLoading) {
    return <div className="h-[60vh] flex items-center justify-center"><PremiumLoader text="Loading Dashboard..." /></div>;
  }

  const hasAnyActivity = stats && (stats.leads > 0 || stats.messages > 0 || stats.aiReplies > 0);

  return (
    <>
      <AnimatePresence>
        {showWelcomeCelebration && user?.username && (
          <WelcomeCelebration
            username={user.username}
            onComplete={() => setShowWelcomeCelebration(false)}
          />
        )}
      </AnimatePresence>

      <OnboardingWizard isOpen={showOnboarding} onComplete={handleOnboardingComplete} />

      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Welcome back, {user?.name?.split(' ')[0] || user?.username || 'Friend'}
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              {hasAnyActivity ? "Here's what's happening today." : "Let's get your automation running."}
            </p>
          </div>
          {trialDaysLeft > 0 && (
            <Badge variant="secondary" className="w-fit px-3 py-1 text-sm bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
              <Sparkles className="w-3 h-3 mr-2" />
              {trialDaysLeft} days left in trial
            </Badge>
          )}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            const TrendIcon = kpi.trend === "up" ? ArrowUp : kpi.trend === "down" ? ArrowDown : Minus;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow border-border/60">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}{kpi.suffix || ''}</div>
                    {kpi.percentage !== "—" && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`flex items-center text-xs font-medium ${kpi.trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
                          <TrendIcon className="h-3 w-3 mr-0.5" />
                          {kpi.percentage}
                        </span>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="h-full border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Live Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {activityLoading ? (
                  <div className="p-8 flex justify-center"><PremiumLoader text="Loading feed..." /></div>
                ) : activities.length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {activities.map((activity, i) => (
                      <div key={activity.id} className="p-4 flex gap-4 hover:bg-muted/20 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary mt-1">
                          {activity.type === 'message' ? <MessageSquare className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-sm">{activity.title || "New Event"}</p>
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.time)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{activity.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
                    <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-2">
                      <Activity className="h-6 w-6 opacity-30" />
                    </div>
                    <p>No recent activity</p>
                    <Button variant="link" className="text-primary" onClick={() => window.location.href = '/dashboard/integrations'}>
                      Connect integrations to start
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions / Getting Started */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/10">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/dashboard/lead-import'}>
                  <Users className="h-4 w-4 mr-2" /> Import Leads
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/dashboard/video-automation'}>
                  <Zap className="h-4 w-4 mr-2" /> Create Automation
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/dashboard/integrations'}>
                  <Mail className="h-4 w-4 mr-2" /> Connect Email
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    AI Engine
                  </span>
                  <span className="text-emerald-500 font-medium">Operational</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    Email Sync
                  </span>
                  <span className="text-emerald-500 font-medium">Active</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}