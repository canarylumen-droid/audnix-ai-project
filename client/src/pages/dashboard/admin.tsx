import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  DollarSign,
  Zap,
  AlertCircle,
  TrendingUp,
  Activity,
} from "lucide-react";

export default function AdminPage() {
  const metrics = {
    totalUsers: 1247,
    activeUsers: 892,
    trialUsers: 245,
    paidUsers: 647,
    mrr: 48230,
    apiBurn: 12450,
    failedJobs: 3,
    storageUsed: 2.4,
  };

  const recentUsers = [
    { email: "sarah.m@email.com", plan: "Pro", signedUp: "2 hours ago" },
    { email: "david.p@business.com", plan: "Enterprise", signedUp: "4 hours ago" },
    { email: "emily.r@startup.io", plan: "Trial", signedUp: "6 hours ago" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-admin">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          System metrics and user management
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card data-testid="card-metric-total-users">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-users">
                {metrics.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-emerald-500 mt-1">+12% from last month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card data-testid="card-metric-active-users">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-users">
                {metrics.activeUsers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">71% active rate</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card data-testid="card-metric-mrr">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                MRR
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-mrr">
                ${metrics.mrr.toLocaleString()}
              </div>
              <p className="text-xs text-emerald-500 mt-1">+8% from last month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card data-testid="card-metric-api-burn">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                API Burn
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-api-burn">
                ${metrics.apiBurn.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* User Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-user-breakdown">
          <CardHeader>
            <CardTitle>User Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trial Users</span>
                <span className="font-medium" data-testid="text-trial-count">
                  {metrics.trialUsers}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{ width: `${(metrics.trialUsers / metrics.totalUsers) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Paid Users</span>
                <span className="font-medium" data-testid="text-paid-count">
                  {metrics.paidUsers}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${(metrics.paidUsers / metrics.totalUsers) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-system-health">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Failed Jobs</span>
              <Badge
                variant={metrics.failedJobs > 0 ? "destructive" : "secondary"}
                data-testid="badge-failed-jobs"
              >
                {metrics.failedJobs}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Storage Used</span>
              <span className="font-medium" data-testid="text-storage">
                {metrics.storageUsed} GB
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Signups */}
      <Card data-testid="card-recent-signups">
        <CardHeader>
          <CardTitle>Recent Signups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentUsers.map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border"
                data-testid={`recent-user-${index}`}
              >
                <div>
                  <p className="font-medium" data-testid={`text-user-email-${index}`}>
                    {user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.signedUp}</p>
                </div>
                <Badge variant="secondary" data-testid={`badge-user-plan-${index}`}>
                  {user.plan}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
