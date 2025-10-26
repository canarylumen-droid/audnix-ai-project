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

  // Fetch real dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false,
  });

  // Fetch real activity feed
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/dashboard/activity"],
    refetchInterval: 30000,
    retry: false,
  });

  // Calculate trial days left
  const getTrialDaysLeft = () => {
    if (!user?.plan || user.plan !== "trial") return 0;
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 3);
    const now = new Date();
    const daysLeft = Math.ceil((trialExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
      change: stats?.leads > 0 ? "New this month" : "—",
      positive: true,
    },
    {
      label: "Messages Sent",
      value: stats?.messages || 0,
      icon: MessageSquare,
      change: "—",
      positive: true,
    },
    {
      label: "AI Voice Replies",
      value: stats?.aiReplies || 0,
      icon: Zap,
      change: "—",
      positive: true,
    },
    {
      label: "Conversion Rate",
      value: parseFloat(stats?.conversionRate || 0),
      suffix: "%",
      icon: TrendingUp,
      change: stats?.conversions > 0 ? `${stats.conversions} converted` : "—",
      positive: true,
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
              className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-transparent to-emerald-500/20 rounded-2xl blur-2xl -z-10"
              animate={prefersReducedMotion ? {} : {
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={prefersReducedMotion ? {} : {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.h1 
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-primary to-white bg-clip-text text-transparent" 
              data-testid="heading-welcome"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.2 }}
            >
              <span className="inline-flex items-center gap-2">
                {user?.name ? (
                  <>
                    Welcome back, <span className="text-primary">{user.name.split(' ')[0]}</span>
                    <motion.span
                      animate={prefersReducedMotion ? {} : {
                        rotate: [0, 14, -8, 14, -4, 10, 0, 0],
                      }}
                      transition={prefersReducedMotion ? {} : {
                        duration: 2,
                        delay: 0.5,
                        ease: "easeInOut",
                      }}
                      className="inline-block"
                    >
                      👋
                    </motion.span>
                  </>
                ) : (
                  'Welcome back'
                )}
              </span>
            </motion.h1>
            <motion.p 
              className="text-foreground/80 mt-2 text-lg" 
              data-testid="text-subtitle"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.3 }}
            >
              {stats?.leads > 0 
                ? "Here's what's happening with your leads today"
                : "Get started by connecting your accounts"}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: index * 0.1 }}
                whileHover={prefersReducedMotion ? {} : { 
                  y: -5, 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
              >
                <Card 
                  data-testid={`card-kpi-${index}`}
                  className="glass-card border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-foreground/70 group-hover:text-foreground transition-colors">
                      {kpi.label}
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                      <Icon className="h-4 w-4 text-primary group-hover:text-primary/90" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <motion.div 
                      className="text-2xl font-bold text-foreground" 
                      data-testid={`text-kpi-value-${index}`}
                      whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      {kpi.value}{kpi.suffix || ''}
                    </motion.div>
                    {kpi.change !== "—" && (
                      <p className="text-xs text-foreground/60 mt-1">
                        {kpi.change}
                      </p>
                    )}
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
                <CardTitle className="text-foreground">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
                            <p className="text-sm text-foreground/90 group-hover:text-foreground transition-colors">{activity.message}</p>
                            <p className="text-xs text-foreground/50 group-hover:text-foreground/70 mt-1 transition-colors">
                              {formatTimeAgo(activity.time)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-foreground/40 mx-auto mb-3" />
                    <p className="text-foreground/70">No activity yet</p>
                    <p className="text-sm text-foreground/50 mt-1">
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
                <CardTitle className="text-foreground">Quick Actions</CardTitle>
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
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-foreground group-hover:text-primary transition-colors">{action.label}</div>
                            <div className="text-xs text-foreground/60 group-hover:text-foreground/80 transition-colors">
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