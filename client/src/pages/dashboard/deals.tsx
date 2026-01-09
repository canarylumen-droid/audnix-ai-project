
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DollarSign,
  Calendar,
  Instagram,
  Mail,
  Package,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowRight,
  Filter,
  Plus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PremiumLoader } from "@/components/ui/premium-loader";

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

const channelIcons: Record<string, typeof Instagram | typeof Mail> = {
  instagram: Instagram,
  email: Mail,
};

export default function DealsPage() {
  const { data: dealsData, isLoading } = useQuery<DealsApiResponse>({
    queryKey: ["/api/deals"],
    refetchInterval: 5000,
    retry: false,
  });

  const { data: revenueAnalytics } = useQuery<RevenueAnalyticsResponse>({
    queryKey: ["/api/deals/analytics"],
    refetchInterval: 5000,
    retry: false,
  });

  const deals: Deal[] = dealsData?.deals || [];
  const totalValue = deals.reduce((sum: number, deal: Deal) => sum + (deal.value || 0), 0);
  const convertedDeals = deals.filter((d: Deal) => d.status === "converted" || d.status === "closed_won");
  const pendingDeals = deals.filter((d: Deal) => d.status === "pending" || d.status === "open");

  // Calculate Avg Value
  const avgDealValue = deals.length > 0 ? Math.round(totalValue / deals.length) : 0;

  // Real-time metrics
  const today = new Date();
  const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);

  const weekDeals = convertedDeals.filter((d) => d.convertedAt && new Date(d.convertedAt) >= startOfWeek);
  const monthDeals = convertedDeals.filter((d) => d.convertedAt && new Date(d.convertedAt) >= startOfMonth);

  const weekRevenue = weekDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const monthRevenue = monthDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  // Growth calcs
  const previousWeekRevenue = revenueAnalytics?.previousWeekRevenue || 0;
  const weekGrowth = previousWeekRevenue > 0
    ? Math.round(((weekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100)
    : weekRevenue > 0 ? 100 : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <PremiumLoader text="Analyzing Pipeline..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Revenue & Pipeline
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Monitor your sales performance and active deals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:flex">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Deal
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime value</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${weekRevenue.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-xs font-medium ${weekGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {weekGrowth > 0 ? '+' : ''}{weekGrowth}%
              </span>
              <span className="text-xs text-muted-foreground">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Deals</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDeals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">In pipeline</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deals.length > 0 ? Math.round((convertedDeals.length / deals.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Conversion avg</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      {revenueAnalytics?.timeline && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueAnalytics.timeline}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                <XAxis dataKey="date" className="text-xs text-muted-foreground" tickLine={false} axisLine={false} />
                <YAxis className="text-xs text-muted-foreground" tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Deals List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>

        {deals.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/5">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No deals yet</h3>
              <p className="text-muted-foreground max-w-sm mt-1 mb-6">
                Deals will automatically appear here when your AI converts a lead.
              </p>
              <Link href="/dashboard/integrations">
                <Button>Connect Sources <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="border-b">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Deal Name</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Value</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Stage</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Channel</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Date</th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((deal) => (
                      <tr key={deal.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">{deal.leadName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{deal.leadName || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle font-medium">
                          ${deal.value?.toLocaleString()}
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant={deal.status === 'converted' ? 'default' : 'secondary'} className="capitalize">
                            {deal.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle hidden md:table-cell capitalize text-muted-foreground">
                          {deal.channel}
                        </td>
                        <td className="p-4 align-middle hidden md:table-cell text-muted-foreground">
                          {formatDate(deal.createdAt)}
                        </td>
                        <td className="p-4 align-middle text-right">
                          <Link href={`/dashboard/conversations/${deal.leadId}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
