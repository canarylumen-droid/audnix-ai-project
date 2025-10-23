import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Link } from "wouter";
import { SiWhatsapp } from "react-icons/si";

const channelIcons = {
  instagram: Instagram,
  whatsapp: SiWhatsapp,
  email: Mail,
};

export default function DashboardHome() {
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold" data-testid="heading-welcome">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-subtitle">
              {stats?.leads > 0 
                ? "Here's what's happening with your leads today"
                : "Get started by connecting your accounts"}
            </p>
          </div>
          {trialDaysLeft > 0 && (
            <Badge variant="secondary" className="w-fit" data-testid="badge-trial">
              {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left in trial
            </Badge>
          )}
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card data-testid={`card-kpi-${index}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {kpi.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid={`text-kpi-value-${index}`}>
                      {kpi.value}{kpi.suffix || ''}
                    </div>
                    {kpi.change !== "—" && (
                      <p className="text-xs text-muted-foreground mt-1">
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card data-testid="card-activity">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
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
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          data-testid={`activity-item-${index}`}
                        >
                          <div className={`p-2 rounded-full ${
                            activity.type === 'conversion' ? 'bg-emerald-500/10' : 'bg-primary/10'
                          }`}>
                            <ChannelIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{activity.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(activity.time)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No activity yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Connect your accounts to start receiving leads
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card data-testid="card-quick-actions">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.label} href={action.action}>
                      <Button
                        variant="outline"
                        className="w-full justify-start hover-elevate"
                        data-testid={`button-action-${index}`}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">{action.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {action.description}
                          </div>
                        </div>
                      </Button>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-dashed" data-testid="card-empty-state">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No leads yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Connect your Instagram, WhatsApp, or Email accounts to start receiving and managing leads automatically.
                </p>
                <Link href="/dashboard/integrations">
                  <Button data-testid="button-connect-accounts">
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