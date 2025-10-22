import { useEffect, useState } from "react";
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
  Phone,
  Send,
  UserPlus,
} from "lucide-react";

// Animated counter component
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function DashboardHome() {
  // Mock user data
  const user = {
    name: "Alex",
    trialDaysLeft: 2,
  };

  const kpis = [
    {
      label: "Leads This Month",
      value: 142,
      icon: Users,
      change: "+23%",
      positive: true,
    },
    {
      label: "Messages Sent",
      value: 1248,
      icon: MessageSquare,
      change: "+18%",
      positive: true,
    },
    {
      label: "AI Voice Replies",
      value: 89,
      icon: Zap,
      change: "+45%",
      positive: true,
    },
    {
      label: "Conversion Rate",
      value: 12,
      suffix: "%",
      icon: TrendingUp,
      change: "+3%",
      positive: true,
    },
  ];

  const activities = [
    {
      id: "1",
      type: "conversion",
      channel: "instagram",
      message: "Sarah Miller converted from Instagram lead",
      time: "2 minutes ago",
      icon: Instagram,
    },
    {
      id: "2",
      type: "voice",
      channel: "whatsapp",
      message: "AI voice reply sent to Marcus Chen",
      time: "5 minutes ago",
      icon: Phone,
    },
    {
      id: "3",
      type: "message",
      channel: "email",
      message: "Follow-up email sent to 12 leads",
      time: "15 minutes ago",
      icon: Mail,
    },
    {
      id: "4",
      type: "conversion",
      channel: "whatsapp",
      message: "David Park booked a call via WhatsApp",
      time: "1 hour ago",
      icon: Phone,
    },
  ];

  const quickActions = [
    {
      label: "Connect Instagram",
      description: "Sync your Instagram DMs",
      icon: Instagram,
      action: "connect-instagram",
    },
    {
      label: "Send Broadcast",
      description: "Message all active leads",
      icon: Send,
      action: "send-broadcast",
    },
    {
      label: "Invite Teammate",
      description: "Add team members",
      icon: UserPlus,
      action: "invite-team",
    },
  ];

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
              Welcome back, {user.name}
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-subtitle">
              Here's what's happening with your leads today
            </p>
          </div>
          {user.trialDaysLeft > 0 && (
            <Badge variant="secondary" className="w-fit" data-testid="badge-trial">
              {user.trialDaysLeft} days left in trial
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
                <Card className="hover-elevate" data-testid={`card-kpi-${index}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {kpi.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid={`text-kpi-value-${index}`}>
                      <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        kpi.positive ? "text-emerald-500" : "text-red-500"
                      }`}
                      data-testid={`text-kpi-change-${index}`}
                    >
                      {kpi.change} from last month
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card data-testid="card-activity-feed">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <motion.div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover-elevate"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                      data-testid={`activity-item-${index}`}
                    >
                      <div className="p-2 rounded-full bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card data-testid="card-quick-actions">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.action}
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3"
                    data-testid={`button-${action.action}`}
                  >
                    <div className="p-2 rounded-md bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
