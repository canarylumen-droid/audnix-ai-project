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
  Phone,
  Loader2,
  Package,
  TrendingUp,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

const channelIcons = {
  instagram: Instagram,
  whatsapp: SiWhatsapp,
  email: Mail,
};

export default function DealsPage() {
  // Fetch real deals from backend
  const { data: dealsData, isLoading, error } = useQuery({
    queryKey: ["/api/deals"],
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false,
  });

  const deals = dealsData?.deals || [];
  const totalValue = deals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
  const convertedDeals = deals.filter((d: any) => d.status === "converted");
  const pendingDeals = deals.filter((d: any) => d.status === "pending");
  const avgDealValue = deals.length > 0 ? Math.round(totalValue / deals.length) : 0;

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
          Deals & Conversions
        </h1>
        <p className="text-muted-foreground mt-1">
          {deals.length > 0 
            ? `${deals.length} deal${deals.length !== 1 ? 's' : ''} · $${totalValue.toLocaleString()} total value`
            : "Track your converted leads and revenue"}
        </p>
      </div>

      {/* Stats */}
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
            <h3 className="text-lg font-semibold mb-2">No deals yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              When you convert leads into paying customers, they'll appear here as deals.
            </p>
            <Link href="/dashboard/inbox">
              <Button data-testid="button-go-to-inbox">
                Go to Inbox
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {deals.map((deal: any, index: number) => {
            const ChannelIcon = channelIcons[deal.channel as keyof typeof channelIcons] || Mail;
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