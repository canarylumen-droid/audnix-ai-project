import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  MessageSquare,
  Zap,
  Instagram,
  Mail,
  Send,
  UserPlus,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { Link } from "wouter";
import { SiWhatsapp } from "react-icons/si";
import { useReducedMotion } from "@/lib/animation-utils";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { WelcomeCelebration } from "@/components/WelcomeCelebration";
import { useState, useEffect } from "react";

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
  instagram: Instagram,
  whatsapp: SiWhatsapp,
  email: Mail,
};

export default function DashboardHome() {
  const prefersReducedMotion = useReducedMotion();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcomeCelebration, setShowWelcomeCelebration] = useState(false);

  // Fetch real user profile
  const { data: user } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
    retry: false,
  });

  // Check if user needs onboarding and show celebration on first dashboard visit
  useEffect(() => {
    if (user) {
      const hasCompletedOnboarding = user.metadata?.onboardingCompleted || false;
      setShowOnboarding(!hasCompletedOnboarding);

      // Show celebration if first dashboard visit (track with localStorage)
      const celebrationKey = `celebration_shown_${user.id}`;
      const hasSeenCelebration = localStorage.getItem(celebrationKey);
      
      if (!hasSeenCelebration && user.username) {
        setShowWelcomeCelebration(true);
        localStorage.setItem(celebrationKey, "true");
      }
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Fetch real dashboard stats with aggressive real-time updates
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time feel
    refetchOnWindowFocus: true,
    retry: false,
  });

  // Fetch previous period stats for real-time percentage calculations
  const { data: previousStats } = useQuery<PreviousDashboardStats>({
    queryKey: ["/api/dashboard/stats/previous"],
    refetchInterval: 10000,
    retry: false,
  });

  // Fetch real activity feed with real-time updates
  const { data: activityData, isLoading: activityLoading } = useQuery<DashboardActivityResponse>({
    queryKey: ["/api/dashboard/activity"],
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
    retry: false,
  });

  // Calculate trial days left using actual database expiry
  const getTrialDaysLeft = () => {
    if (!user?.plan || user.plan !== "trial" || !user?.trialExpiresAt) return 0;
    const now = new Date();
    const expiryDate = new Date(user.trialExpiresAt);
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
  };

  const trialDaysLeft = getTrialDaysLeft();
  const activities = activityData?.activities || [];

  // Format time ago
  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Helper function to calculate real-time percentage change
  const calculatePercentageChange = (current: number, previous: number | undefined): string => {
    // If no previous data yet, show dash instead of claiming growth
    if (!previousStats || previous === undefined) {
      return "—";
    }
    if (previous === 0) {
      return current > 0 ? "+100%" : "—";
    }
    const change = ((current - previous) / previous) * 100;
    if (isNaN(change) || !isFinite(change)) return "—";
    const formatted = change.toFixed(1);
    return change > 0 ? `+${formatted}%` : `${formatted}%`;
  };

  const kpis = [
    {
      label: "Leads This Month",
      value: stats?.leads || 0,
      icon: Users,
      change: stats?.leads > 0 ? "New this month" : "Get started",
      percentage: calculatePercentageChange(stats?.leads || 0, previousStats?.leads),
      trend: previousStats ? ((stats?.leads || 0) > (previousStats?.leads || 0) ? "up" : (stats?.leads || 0) < (previousStats?.leads || 0) ? "down" : "neutral") : "neutral",
      gradient: "from-cyan-500 to-blue-500",
    },
    {
      label: "Messages Sent",
      value: stats?.messages || 0,
      icon: MessageSquare,
      change: stats?.messages > 0 ? "Active engagement" : "Start messaging",
      percentage: calculatePercentageChange(stats?.messages || 0, previousStats?.messages),
      trend: previousStats ? ((stats?.messages || 0) > (previousStats?.messages || 0) ? "up" : (stats?.messages || 0) < (previousStats?.messages || 0) ? "down" : "neutral") : "neutral",
      gradient: "from-purple-500 to-blue-500",
    },
    {
      label: "AI Voice Replies",
      value: stats?.aiReplies || 0,
      icon: Zap,
      change: stats?.aiReplies > 0 ? "Automation active" : "Enable AI",
      percentage: calculatePercentageChange(stats?.aiReplies || 0, previousStats?.aiReplies),
      trend: previousStats ? ((stats?.aiReplies || 0) > (previousStats?.aiReplies || 0) ? "up" : (stats?.aiReplies || 0) < (previousStats?.aiReplies || 0) ? "down" : "neutral") : "neutral",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      label: "Conversion Rate",
      value: parseFloat(stats?.conversionRate || 0),
      suffix: "%",
      icon: TrendingUp,
      change: stats?.conversions > 0 ? `${stats.conversions} converted` : "Track conversions",
      percentage: calculatePercentageChange(stats?.conversions || 0, previousStats?.conversions),
      trend: previousStats ? ((stats?.conversions || 0) > (previousStats?.conversions || 0) ? "up" : (stats?.conversions || 0) < (previousStats?.conversions || 0) ? "down" : "neutral") : "neutral",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  const quickActions = [
    {
      label: "Connect Instagram",
      description: "Sync your Instagram DMs",
      icon: Instagram,
      action: "/dashboard/integrations",
    },
    {
      label: "Send Broadcast",
      description: "Message all active leads",
      icon: Send,
      action: "/dashboard/inbox",
    },
    {
      label: "Import Leads",
      description: "Upload leads from CSV",
      icon: UserPlus,
      action: "/dashboard/lead-import",
    },
  ];

  if (statsLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show friendly message for new users instead of error
  const hasAnyActivity = stats && (stats.leads > 0 || stats.messages > 0 || stats.aiReplies > 0);

  return (
    <>
      {/* Welcome Celebration on First Dashboard Visit */}
      <AnimatePresence>
        {showWelcomeCelebration && user?.username && (
          <WelcomeCelebration
            username={user.username}
            onComplete={() => setShowWelcomeCelebration(false)}
          />
        )}
      </AnimatePresence>

      <OnboardingWizard isOpen={showOnboarding} onComplete={handleOnboardingComplete} />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Hero Section */}
        <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
      >
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="relative">
            <motion.div
              className="absolute -inset-6 bg-gradient-to-r from-cyan-500/30 via-purple-500/20 to-blue-500/30 rounded-3xl blur-3xl -z-10"
              animate={prefersReducedMotion ? {} : {
                opacity: [0.4, 0.7, 0.4],
                scale: [1, 1.05, 1],
              }}
              transition={prefersReducedMotion ? {} : {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.h1
              className="text-4xl md:text-5xl font-bold drop-shadow-lg"
              data-testid="heading-welcome"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.2 }}
              style={{ textShadow: "0 0 40px rgba(0, 200, 255, 0.3)" }}
            >
              <span className="inline-flex items-center gap-3">
                <span className="text-white">Hey @{user?.username || 'Friend'}</span>
                <motion.span
                  animate={prefersReducedMotion ? {} : {
                    rotate: [0, 14, -8, 14, -4, 10, 0, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={prefersReducedMotion ? {} : {
                    duration: 2,
                    delay: 0.5,
                    ease: "easeInOut",
                  }}
                  className="inline-block text-5xl"
                >
                  👋
                </motion.span>
              </span>
            </motion.h1>
            <motion.p
              className="text-white mt-3 text-xl font-medium"
              data-testid="text-subtitle"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.3 }}
            >
              {hasAnyActivity
                ? "Here's what's happening with your leads today ✨"
                : "You don't have any activity yet. Connect your accounts to get started! 🚀"}
            </motion.p>
          </div>
          <AnimatePresence>
            {trialDaysLeft > 0 && (
              <motion.div
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Badge
                  variant="secondary"
                  className="w-fit glass-card border-primary/30 px-4 py-2 text-base hover:scale-105 transition-transform"
                  data-testid="badge-trial"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-primary" />
                  {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left in trial
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            const TrendIcon = kpi.trend === "up" ? ArrowUp : kpi.trend === "down" ? ArrowDown : Minus;
            return (
              <motion.div
                key={kpi.label}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: index * 0.1 }}
                whileHover={prefersReducedMotion ? {} : {
                  y: -8,
                  scale: 1.03,
                  transition: { duration: 0.2 }
                }}
              >
                <Card
                  data-testid={`card-kpi-${index}`}
                  className="relative overflow-hidden border-2 border-transparent hover:border-white/20 transition-all duration-300 group"
                  style={{
                    background: `linear-gradient(135deg, rgba(30, 40, 80, 0.9), rgba(20, 30, 60, 0.95))`,
                    boxShadow: `0 8px 32px rgba(0, 170, 255, 0.15), 0 0 0 1px rgba(0, 200, 255, 0.2)`,
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                    <CardTitle className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                      {kpi.label}
                    </CardTitle>
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${kpi.gradient} group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="flex items-end justify-between">
                      <motion.div
                        className="text-3xl font-extrabold text-white"
                        data-testid={`text-kpi-value-${index}`}
                        whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        {kpi.value}{kpi.suffix || ''}
                      </motion.div>
                      {kpi.percentage !== "—" && (
                        <motion.div
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            kpi.trend === "up" ? "bg-emerald-500/20 text-emerald-300" :
                            kpi.trend === "down" ? "bg-red-500/20 text-red-300" :
                            "bg-gray-500/20 text-gray-300"
                          }`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                        >
                          <TrendIcon className="h-3 w-3" />
                          <span>{kpi.percentage}</span>
                        </motion.div>
                      )}
                    </div>
                    <p className="text-xs text-white/70 mt-2 font-medium">
                      {kpi.change}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Activity Feed & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
          <motion.div
            className="lg:col-span-1"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.3 }}
          >
            <Card data-testid="card-activity" className="glass-card border-border/50 hover:border-primary/30 transition-colors overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/30 bg-gradient-to-r from-primary/10 via-transparent to-transparent">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-cyan-400" />
                    Recent Activity
                  </CardTitle>
                  {activities.length > 0 && (
                    <Badge variant="outline" className="bg-primary/20 border-primary/30 text-cyan-300">
                      {activities.length} events
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-0 py-0">
                {activityLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                      <p className="text-xs text-white/60">Loading activity...</p>
                    </div>
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-0 divide-y divide-border/20 max-h-[400px] overflow-y-auto">
                    {activities.map((activity: ActivityItem, index: number) => {
                      const ChannelIcon = channelIcons[activity.channel as keyof typeof channelIcons] || AlertCircle;
                      const getActivityColor = (type: string) => {
                        switch(type) {
                          case 'conversion': return 'emerald';
                          case 'message': return 'blue';
                          case 'lead': return 'cyan';
                          case 'email': return 'purple';
                          default: return 'primary';
                        }
                      };
                      const color = getActivityColor(activity.type);
                      return (
                        <motion.div
                          key={activity.id}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-${color}-500/5 border-l-2 border-l-${color}-500/30 hover:border-l-${color}-500/60 transition-all duration-200 group cursor-pointer`}
                          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.05 }}
                          whileHover={prefersReducedMotion ? {} : { x: 4, paddingLeft: 20 }}
                          data-testid={`activity-item-${index}`}
                        >
                          <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                            activity.type === 'conversion' ? 'bg-emerald-500/20 group-hover:bg-emerald-500/30' : 
                            activity.type === 'message' ? 'bg-blue-500/20 group-hover:bg-blue-500/30' :
                            'bg-cyan-500/20 group-hover:bg-cyan-500/30'
                          } transition-colors group-hover:scale-110 transition-transform duration-200`}>
                            <ChannelIcon className={`h-5 w-5 ${
                              activity.type === 'conversion' ? 'text-emerald-400' : 
                              activity.type === 'message' ? 'text-blue-400' :
                              'text-cyan-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm text-white/90 group-hover:text-white transition-colors font-medium truncate">{activity.message}</p>
                              <Badge variant="secondary" className={`flex-shrink-0 text-xs ${
                                activity.type === 'conversion' ? 'bg-emerald-500/20 text-emerald-300' :
                                activity.type === 'message' ? 'bg-blue-500/20 text-blue-300' :
                                'bg-cyan-500/20 text-cyan-300'
                              }`}>
                                {activity.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-white/50 group-hover:text-white/70 mt-1.5 transition-colors">
                              🕐 {formatTimeAgo(activity.time)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="p-3 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                      <AlertCircle className="h-8 w-8 text-cyan-400/60" />
                    </div>
                    <p className="text-white/90 font-medium text-sm">No activity yet</p>
                    <p className="text-xs text-white/60 mt-2 text-center">
                      Your activity will appear here when you start importing leads and sending messages
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            className="lg:col-span-1"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.4 }}
          >
            <Card data-testid="card-quick-actions" className="glass-card border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 md:px-6">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.label} href={action.action}>
                      <motion.div
                        whileHover={prefersReducedMotion ? {} : { scale: 1.02, x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          variant="outline"
                          className="w-full justify-start glass-card border-border/50 hover:border-primary/50 hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group"
                          data-testid={`button-action-${index}`}
                        >
                          <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 mr-3">
                            <Icon className="h-4 w-4 text-cyan-400" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{action.label}</div>
                            <div className="text-xs text-white/70 group-hover:text-white/90 transition-colors">
                              {action.description}
                            </div>
                          </div>
                        </Button>
                      </motion.div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Empty State for New Users */}
        {stats?.leads === 0 && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.5 }}
          >
            <Card className="border-dashed border-primary/30 glass-card hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group" data-testid="card-empty-state">
              <CardContent className="flex flex-col items-center justify-center py-12 px-4 md:px-6">
                <motion.div
                  animate={prefersReducedMotion ? {} : {
                    scale: [1, 1.1, 1],
                  }}
                  transition={prefersReducedMotion ? {} : {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors mb-4"
                >
                  <Users className="h-12 w-12 text-primary" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">No leads yet</h3>
                <p className="text-foreground/70 text-center mb-6 max-w-md">
                  Connect your Instagram, WhatsApp, or Email accounts to start receiving and managing leads automatically.
                </p>
                <Link href="/dashboard/integrations">
                  <Button className="glow hover:scale-105 transition-transform" data-testid="button-connect-accounts">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Connect Your Accounts
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
    </>
  );
}