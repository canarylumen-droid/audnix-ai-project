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
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

const channelIcons = {
  instagram: Instagram,
  whatsapp: SiWhatsapp,
  email: Mail,
};

const deals = [
  {
    id: "deal-1",
    leadName: "Sarah Miller",
    brand: "Personal Coaching",
    channel: "instagram" as const,
    value: 5000,
    status: "converted" as const,
    convertedAt: "2025-01-20T10:30:00Z",
    notes: "Very interested in automation for her coaching business",
  },
  {
    id: "deal-2",
    leadName: "David Park",
    brand: "Tech Startup",
    channel: "whatsapp" as const,
    value: 15000,
    status: "converted" as const,
    convertedAt: "2025-01-19T16:45:00Z",
    notes: "Enterprise plan for their sales team",
  },
  {
    id: "deal-3",
    leadName: "Kevin Wu",
    brand: "SaaS Company",
    channel: "instagram" as const,
    value: 8000,
    status: "pending" as const,
    notes: "Waiting for demo call scheduled for next week",
  },
];

export default function DealsPage() {
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const convertedDeals = deals.filter((d) => d.status === "converted");

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-deals">
          Deals & Conversions
        </h1>
        <p className="text-muted-foreground mt-1">
          {deals.length} deals · ${totalValue.toLocaleString()} total value
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-stat-total">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Deal Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-converted">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Converted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{convertedDeals.length}</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-pending">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {deals.length - convertedDeals.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deals.map((deal, index) => {
          const ChannelIcon = channelIcons[deal.channel];
          return (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover-elevate" data-testid={`card-deal-${index}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{deal.leadName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base" data-testid={`text-lead-name-${index}`}>
                          {deal.leadName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{deal.brand}</p>
                      </div>
                    </div>
                    <ChannelIcon className="h-5 w-5 text-muted-foreground" data-testid={`icon-channel-${index}`} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-2xl font-bold">
                      <DollarSign className="h-5 w-5 text-emerald-500" />
                      <span data-testid={`text-value-${index}`}>{deal.value.toLocaleString()}</span>
                    </div>
                    <Badge
                      variant={deal.status === "converted" ? "default" : "secondary"}
                      data-testid={`badge-status-${index}`}
                    >
                      {deal.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-notes-${index}`}>
                    {deal.notes}
                  </p>

                  {deal.convertedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Closed {new Date(deal.convertedAt).toLocaleDateString()}
                    </div>
                  )}

                  <Button variant="outline" className="w-full" data-testid={`button-book-call-${index}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Book Call
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
