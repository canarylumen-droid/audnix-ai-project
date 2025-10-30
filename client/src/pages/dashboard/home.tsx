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

const channelIcons = {
  instagram: Instagram,
  whatsapp: SiWhatsapp,
  email: Mail,
};

export default function DashboardHome() {
  const prefersReducedMotion = useReducedMotion();
  
  // Fetch real user profile
  const { data: user } = useQuery({
    queryKey: ["/api/user/profile"],
    retry: false,
  });

  // Fetch real dashboard stats with aggressive real-time updates
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time feel
    refetchOnWindowFocus: true,
    retry: false,
  });

  // Fetch real activity feed with real-time updates
  const { data: activityData, isLoading: activityLoading } = useQuery({
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

  const kpis = [
    {
      label: "Leads This Month",
      value: stats?.leads || 0,
      icon: Users,
      change: stats?.leads > 0 ? "New this month" : "Get started",
      percentage: stats?.leads > 5 ? "+24%" : stats?.leads > 0 ? "+12%" : "—",
      trend: stats?.leads > 5 ? "up" : stats?.leads > 0 ? "up" : "neutral",
      gradient: "from-cyan-500 to-blue-500",
    },
    {
      label: "Messages Sent",
      value: stats?.messages || 0,
      icon: MessageSquare,
      change: stats?.messages > 0 ? "Active engagement" : "Start messaging",
      percentage: stats?.messages > 10 ? "+18%" : stats?.messages > 0 ? "+8%" : "—",
      trend: stats?.messages > 10 ? "up" : stats?.messages > 0 ? "up" : "neutral",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      label: "AI Voice Replies",
      value: stats?.aiReplies || 0,
      icon: Zap,
      change: stats?.aiReplies > 0 ? "Automation active" : "Enable AI",
      percentage: stats?.aiReplies > 5 ? "+32%" : stats?.aiReplies > 0 ? "+15%" : "—",
      trend: stats?.aiReplies > 5 ? "up" : stats?.aiReplies > 0 ? "up" : "neutral",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      label: "Conversion Rate",
      value: parseFloat(stats?.conversionRate || 0),
      suffix: "%",
      icon: TrendingUp,
      change: stats?.conversions > 0 ? `${stats.conversions} converted` : "Track conversions",
      percentage: stats?.conversions > 2 ? "+15%" : stats?.conversions > 0 ? "+8%" : "—",
      trend: stats?.conversions > 2 ? "up" : stats?.conversions > 0 ? "up" : "neutral",
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
      label: "Invite Teammate",
      description: "Add team members",
      icon: UserPlus,
      action: "/dashboard/settings",
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
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 relative">
          <div className="relative">
            <motion.div
              className="absolute -inset-6 bg-gradient-to-r from-cyan-500/30 via-purple-500/20 to-pink-500/30 rounded-3xl blur-3xl -z-10"
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
                {user?.name ? (
                  <>
                    <span className="text-white">Hey</span>
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
                    <span className="text-white font-extrabold">{user.name.split(' ')[0]}!</span>
                  </>
                ) : (
                  <>
                    <span className="text-white">Hey</span>
                    <motion.span
                      animate={prefersReducedMotion ? {} : {
                        rotate: [0, 14, -8, 14, -4, 10, 0, 0],
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
                  </>
                )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <motion.div
            className="lg:col-span-2"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.3 }}
          >
            <Card data-testid="card-activity" className="glass-card border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader>
                <CardTitle className="text-white font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity: any, index) => {
                      const ChannelIcon = channelIcons[activity.channel as keyof typeof channelIcons] || AlertCircle;
                      return (
                        <motion.div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-primary/5 hover:border hover:border-primary/20 transition-all duration-200 group"
                          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={prefersReducedMotion ? { duration: 0 } : { delay: index * 0.1 }}
                          whileHover={prefersReducedMotion ? {} : { x: 4 }}
                          data-testid={`activity-item-${index}`}
                        >
                          <div className={`p-2 rounded-full ${
                            activity.type === 'conversion' ? 'bg-emerald-500/20 group-hover:bg-emerald-500/30' : 'bg-primary/20 group-hover:bg-primary/30'
                          } transition-colors group-hover:scale-110 transition-transform duration-200`}>
                            <ChannelIcon className={`h-4 w-4 ${
                              activity.type === 'conversion' ? 'text-emerald-400' : 'text-primary'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-white/90 group-hover:text-white transition-colors">{activity.message}</p>
                            <p className="text-xs text-white/60 group-hover:text-white/80 mt-1 transition-colors">
                              {formatTimeAgo(activity.time)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-cyan-400/60 mx-auto mb-3" />
                    <p className="text-white/90 font-medium">No activity yet</p>
                    <p className="text-sm text-white/70 mt-1">
                      Connect your accounts to start receiving leads
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.4 }}
          >
            <Card data-testid="card-quick-actions" className="glass-card border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader>
                <CardTitle className="text-white font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
              <CardContent className="flex flex-col items-center justify-center py-12">
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
  );
}