
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
      label: "TOTAL CAPTURED LEADS",
      value: stats?.leads || 0,
      icon: Users,
      percentage: calculatePercentageChange(stats?.leads || 0, previousStats?.leads),
      trend: previousStats ? ((stats?.leads || 0) > (previousStats?.leads || 0) ? "up" : (stats?.leads || 0) < (previousStats?.leads || 0) ? "down" : "neutral") : "neutral",
    },
    {
      label: "AUTONOMOUS OUTREACH",
      value: stats?.messages || 0,
      icon: MessageSquare,
      percentage: calculatePercentageChange(stats?.messages || 0, previousStats?.messages),
      trend: previousStats ? ((stats?.messages || 0) > (previousStats?.messages || 0) ? "up" : (stats?.messages || 0) < (previousStats?.messages || 0) ? "down" : "neutral") : "neutral",
    },
    {
      label: "NEURAL RESPONSES",
      value: stats?.aiReplies || 0,
      icon: Zap,
      percentage: calculatePercentageChange(stats?.aiReplies || 0, previousStats?.aiReplies),
      trend: previousStats ? ((stats?.aiReplies || 0) > (previousStats?.aiReplies || 0) ? "up" : (stats?.aiReplies || 0) < (previousStats?.aiReplies || 0) ? "down" : "neutral") : "neutral",
    },
    {
      label: "CONVERSION VELOCITY",
      value: parseFloat(stats?.conversionRate?.toString() || "0"),
      suffix: "%",
      icon: TrendingUp,
      percentage: calculatePercentageChange(stats?.conversions || 0, previousStats?.conversions),
      trend: previousStats ? ((stats?.conversions || 0) > (previousStats?.conversions || 0) ? "up" : (stats?.conversions || 0) < (previousStats?.conversions || 0) ? "down" : "neutral") : "neutral",
    },
  ];

  if (statsLoading) {
    return <div className="h-[60vh] flex items-center justify-center"><PremiumLoader text="Syncing Neural Data..." /></div>;
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

      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-7xl mx-auto px-4 md:px-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">Command Center</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase italic">
              GOD MODE: <span className="text-primary not-italic">{user?.name?.split(' ')[0] || user?.username || 'OPERATOR'}</span>
            </h1>
            <p className="text-white/40 font-bold text-lg italic">
              {hasAnyActivity ? "Systems initialized. Performance parameters optimal." : "Awaiting infrastructure initialization. Upload leads to begin."}
            </p>
          </div>
          {trialDaysLeft > 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-1 rounded-[2rem] bg-gradient-to-r from-primary to-purple-600"
            >
              <div className="bg-black/90 backdrop-blur-xl rounded-[1.9rem] px-8 py-4 flex items-center gap-4 border border-white/10">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic leading-none mb-1">Trial Protocol</span>
                  <span className="text-xl font-black text-white italic">{trialDaysLeft} DAYS REMAINING</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            const TrendIcon = kpi.trend === "up" ? ArrowUp : kpi.trend === "down" ? ArrowDown : Minus;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:scale-[1.02] transition-all duration-700 bg-white/[0.02] border-white/5 rounded-[2.5rem] overflow-hidden group premium-glow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 p-8 border-b border-white/5">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">{kpi.label}</CardTitle>
                    <div className="p-3 rounded-xl bg-white/[0.03] text-primary border border-white/5 group-hover:border-primary/30 transition-all duration-700">
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="text-4xl font-black text-white italic tracking-tighter">{kpi.value}{kpi.suffix || ''}</div>
                    {kpi.percentage !== "—" && (
                      <div className="flex items-center gap-2 mt-4">
                        <div className={`flex items-center h-6 px-3 rounded-full text-[10px] font-black italic ${kpi.trend === "up" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                          <TrendIcon className="h-2 w-2 mr-1" />
                          {kpi.percentage}
                        </div>
                        <span className="text-[10px] font-black uppercase text-white/20 italic tracking-widest">VS CYCLE</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activity Feed */}
          <div className="lg:col-span-2">
            <Card className="bg-white/[0.02] border-white/5 rounded-[3rem] overflow-hidden h-full shadow-2xl">
              <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
                <CardTitle className="flex items-center gap-4 text-2xl font-black text-white uppercase italic tracking-tight">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Activity className="h-6 w-6" />
                  </div>
                  NEURAL STREAM
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {activityLoading ? (
                  <div className="p-20 flex justify-center"><PremiumLoader text="Intercepting Signals..." /></div>
                ) : activities.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {activities.map((activity, i) => (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        key={activity.id}
                        className="p-8 flex gap-8 hover:bg-white/[0.03] transition-all duration-500 group"
                      >
                        <div className="h-14 w-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 text-white group-hover:text-primary group-hover:border-primary/30 transition-all duration-500 mt-1">
                          {activity.type === 'message' ? <MessageSquare className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <p className="font-black text-white italic uppercase tracking-tight text-lg">{activity.title || "TELEMETRY EVENT"}</p>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic bg-white/5 px-3 py-1 rounded-full">{formatTimeAgo(activity.time)}</span>
                          </div>
                          <p className="text-white/40 font-bold leading-relaxed">{activity.message}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 text-center space-y-8">
                    <div className="h-24 w-24 bg-white/[0.03] border border-dashed border-white/10 rounded-full flex items-center justify-center relative overflow-hidden">
                      <Activity className="h-10 w-10 text-white/10 animate-pulse" />
                      <div className="absolute inset-0 bg-primary/5 blur-2xl" />
                    </div>
                    <div className="space-y-2 max-w-sm">
                      <p className="text-xl font-black text-white uppercase italic">NO DATA INTERCEPTED</p>
                      <p className="text-sm text-white/40 font-bold italic leading-relaxed">Infrastructure online, but no signals detected. Initialize outreach sequences to populate stream.</p>
                    </div>
                    <Button
                      className="h-14 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)]"
                      onClick={() => setLocation('/dashboard/integrations')}
                    >
                      CONNECT NODE
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions / Getting Started */}
          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 rounded-[3rem] overflow-hidden shadow-2xl premium-glow">
              <CardHeader className="p-10 pb-4">
                <CardTitle className="text-2xl font-black text-white uppercase italic tracking-tight">RAPID EXECUTION</CardTitle>
                <CardDescription className="text-white/40 font-bold italic pt-2">Direct system commands.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-4 pt-0">
                {[
                  { label: "Import Leads", icon: Users, path: "/dashboard/lead-import" },
                  { label: "Create Automation", icon: Zap, path: "/dashboard/video-automation" },
                  { label: "Connect Email", icon: Mail, path: "/dashboard/integrations" },
                ].map((action) => (
                  <Button
                    key={action.label}
                    className="w-full h-16 justify-between px-8 rounded-2xl bg-white/[0.03] border border-white/10 text-white hover:bg-primary hover:text-white hover:border-transparent font-black uppercase text-[11px] tracking-[0.2em] italic transition-all duration-500 group"
                    onClick={() => setLocation(action.path)}
                  >
                    <span className="flex items-center">
                      <action.icon className="h-4 w-4 mr-4 transition-transform group-hover:scale-125" />
                      {action.label}
                    </span>
                    <ArrowRight className="h-4 w-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
              <CardHeader className="p-10 pb-6 border-b border-white/5">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">CORE STATUS</CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse" />
                    <span className="text-sm font-black text-white italic uppercase tracking-tight">Neural Core</span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-0 font-black text-[9px] px-3 h-6 italic">STABLE</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse" />
                    <span className="text-sm font-black text-white italic uppercase tracking-tight">Delivery Relay</span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-0 font-black text-[9px] px-3 h-6 italic">ACTIVE</Badge>
                </div>
                <div className="p-6 rounded-2xl bg-primary/[0.03] border border-primary/20 mt-4">
                  <p className="text-[10px] font-black text-primary uppercase italic mb-1 tracking-widest">Network Load</p>
                  <div className="flex items-end gap-1 h-8">
                    {[30, 45, 25, 60, 40, 80, 50, 35, 90, 45].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.05, duration: 1, repeat: Infinity, repeatType: "reverse" }}
                        className="flex-1 bg-primary/40 rounded-t-[1px]"
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
