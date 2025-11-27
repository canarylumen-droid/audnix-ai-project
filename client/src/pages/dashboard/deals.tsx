
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DollarSign,
  Calendar,
  Instagram,
  Mail,
  Loader2,
  Package,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Deal {
  id: string;
  leadId: string;
  userId: string;
  brand: string;
  channel: "instagram" | "whatsapp" | "email" | "gmail" | "manual";
  value: number;
  status: "open" | "closed_won" | "closed_lost" | "pending" | "converted";
  notes?: string | null;
  convertedAt?: string | null;
  meetingScheduled?: boolean;
  meetingUrl?: string | null;
  createdAt: string;
  leadName?: string;
}

interface DealsApiResponse {
  deals: Deal[];
}

interface TimelineDataPoint {
  date: string;
  revenue: number;
}

interface RevenueAnalyticsResponse {
  previousWeekRevenue?: number;
  previousMonthRevenue?: number;
  timeline?: TimelineDataPoint[];
}

const channelIcons: Record<string, typeof Instagram | typeof Mail | typeof SiWhatsapp> = {
  instagram: Instagram,
  whatsapp: SiWhatsapp,
  email: Mail,
};

export default function DealsPage() {
  // Fetch real deals from backend
  const { data: dealsData, isLoading, error } = useQuery<DealsApiResponse>({
    queryKey: ["/api/deals"],
    refetchInterval: 5000, // Real-time updates every 5s
    retry: false,
  });

  // Fetch revenue analytics
  const { data: revenueAnalytics } = useQuery<RevenueAnalyticsResponse>({
    queryKey: ["/api/deals/analytics"],
    refetchInterval: 5000,
    retry: false,
  });

  const deals: Deal[] = dealsData?.deals || [];
  const totalValue = deals.reduce((sum: number, deal: Deal) => sum + (deal.value || 0), 0);
  const convertedDeals = deals.filter((d: Deal) => d.status === "converted");
  const pendingDeals = deals.filter((d: Deal) => d.status === "pending");
  const avgDealValue = deals.length > 0 ? Math.round(totalValue / deals.length) : 0;

  // Calculate time-based metrics
  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));
  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  const startOfMonth = new Date(today);
  startOfMonth.setDate(startOfMonth.getDate() - 30);

  const todayDeals = convertedDeals.filter((d: Deal) => d.convertedAt && new Date(d.convertedAt) >= startOfToday);
  const weekDeals = convertedDeals.filter((d: Deal) => d.convertedAt && new Date(d.convertedAt) >= startOfWeek);
  const monthDeals = convertedDeals.filter((d: Deal) => d.convertedAt && new Date(d.convertedAt) >= startOfMonth);

  const todayRevenue = todayDeals.reduce((sum: number, d: Deal) => sum + (d.value || 0), 0);
  const weekRevenue = weekDeals.reduce((sum: number, d: Deal) => sum + (d.value || 0), 0);
  const monthRevenue = monthDeals.reduce((sum: number, d: Deal) => sum + (d.value || 0), 0);

  // Calculate growth percentages (real-time, not hardcoded)
  const previousWeekRevenue = revenueAnalytics?.previousWeekRevenue || 0;
  const weekGrowth = previousWeekRevenue > 0 
    ? Math.round(((weekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100) 
    : weekRevenue > 0 ? 100 : 0;

  const previousMonthRevenue = revenueAnalytics?.previousMonthRevenue || 0;
  const monthGrowth = previousMonthRevenue > 0
    ? Math.round(((monthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
    : monthRevenue > 0 ? 100 : 0;

  // Projections for next 7 days
  const avgDailyRevenue = weekRevenue / 7;
  const projected7Days = Math.round(avgDailyRevenue * 7);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to load deals</h2>
          <p className="text-muted-foreground">
            Please check your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-deals">
          Revenue & Deals
        </h1>
        <p className="text-muted-foreground mt-1">
          {deals.length > 0 
            ? `${deals.length} deal${deals.length !== 1 ? 's' : ''} · $${totalValue.toLocaleString()} total value`
            : "Track your converted leads and revenue"}
        </p>
      </div>

      {/* Revenue Stats - Real-time percentages */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-stat-today">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-today-revenue">
              ${todayRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {todayDeals.length} deal{todayDeals.length !== 1 ? 's' : ''} closed
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-week">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-week-revenue">
              ${weekRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {weekGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : weekGrowth < 0 ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : null}
              <p className={`text-xs font-medium ${weekGrowth > 0 ? 'text-emerald-500' : weekGrowth < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {weekGrowth > 0 ? '+' : ''}{weekGrowth}% vs last week
              </p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-month">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-month-revenue">
              ${monthRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {monthGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : monthGrowth < 0 ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : null}
              <p className={`text-xs font-medium ${monthGrowth > 0 ? 'text-emerald-500' : monthGrowth < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {monthGrowth > 0 ? '+' : ''}{monthGrowth}% vs last month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-projection" className="border-dashed border-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Next 7 Days Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="text-projection">
              ${projected7Days.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on current pace
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Timeline Chart */}
      {revenueAnalytics?.timeline && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Timeline (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueAnalytics.timeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                  formatter={(value: number) => `$${value}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Old Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-stat-total">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Deal Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-value">
              ${totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-converted">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Converted Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-converted-count">
              {convertedDeals.length}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-pending">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-count">
              {pendingDeals.length}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-avg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Deal Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-value">
              ${avgDealValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deals List or Empty State */}
      {deals.length === 0 ? (
        <Card className="border-dashed" data-testid="card-empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">You don't have any activity yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Connect your accounts to start receiving leads. When you convert leads into paying customers, 
              they'll appear here as deals with real-time tracking.
            </p>
            <Link href="/dashboard/integrations">
              <Button data-testid="button-go-to-inbox">
                Connect Accounts
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {deals.map((deal: Deal, index: number) => {
            const ChannelIcon = channelIcons[deal.channel] || Mail;
            return (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover-elevate" data-testid={`card-deal-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {deal.leadName?.charAt(0) || "D"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold" data-testid={`text-lead-name-${index}`}>
                            {deal.leadName || "Unknown Lead"}
                          </p>
                          {deal.brand && (
                            <p className="text-sm text-muted-foreground">{deal.brand}</p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={deal.status === "converted" ? "default" : "secondary"}
                        data-testid={`badge-status-${index}`}
                      >
                        {deal.status}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>Value</span>
                        </div>
                        <span className="font-semibold text-lg">
                          ${deal.value?.toLocaleString() || 0}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ChannelIcon className="h-4 w-4" />
                          <span>Channel</span>
                        </div>
                        <span className="text-sm capitalize">{deal.channel}</span>
                      </div>

                      {deal.convertedAt && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Converted</span>
                          </div>
                          <span className="text-sm">
                            {formatDate(deal.convertedAt)}
                          </span>
                        </div>
                      )}
                    </div>

                    {deal.notes && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="text-sm">{deal.notes}</p>
                      </div>
                    )}

                    {deal.leadId && (
                      <Link href={`/dashboard/conversations/${deal.leadId}`}>
                        <Button
                          variant="outline"
                          className="w-full mt-4"
                          data-testid={`button-view-conversation-${index}`}
                        >
                          View Conversation
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
