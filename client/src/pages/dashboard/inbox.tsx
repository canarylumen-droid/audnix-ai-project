import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  MoreVertical,
  Download,
  Tag as TagIcon,
  Grid3x3,
  List,
  Instagram,
  Mail,
  Phone,
  AlertCircle,
  Loader2,
  Users,
  MessageCircle,
} from "lucide-react";
import { Link, useSearch } from "wouter";
import { RecentConversations } from "@/components/dashboard/RecentConversations";

const channelIcons = {
  instagram: Instagram,
  email: Mail,
};

const statusColors = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  open: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  replied: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  converted: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  not_interested: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cold: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  uninterested: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  paused: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

export default function InboxPage() {
  const searchParams = useSearch();
  const urlSearchQuery = new URLSearchParams(searchParams).get("search") || "";
  
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showRecentConversations, setShowRecentConversations] = useState(false);

  useEffect(() => {
    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery);
    }
  }, [urlSearchQuery]);

  // Fetch real leads from backend with real-time updates
  const { data: leadsData, isLoading, error } = useQuery({
    queryKey: ["/api/leads", { 
      channel: channelFilter !== "all" ? channelFilter : undefined, 
      status: statusFilter !== "all" ? statusFilter : undefined 
    }],
    refetchInterval: 5000, // Update every 5 seconds
    refetchOnWindowFocus: true,
    retry: false,
  });

  // Get real user data
  const { data: user } = useQuery({
    queryKey: ["/api/user/profile"],
    retry: false,
  });

  const leads = leadsData?.leads || [];
  const userPlan = user?.plan || "trial";
  const leadsLimit = userPlan === "trial" ? 500 : userPlan === "starter" ? 2500 : userPlan === "pro" ? 7000 : 20000;
  const currentLeadCount = leads.length;
  const isAtLimit = currentLeadCount >= leadsLimit;

  // Filter and search leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead: any) => {
      const matchesSearch =
        searchQuery === "" ||
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesChannel = channelFilter === "all" || lead.channel === channelFilter;
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

      return matchesSearch && matchesChannel && matchesStatus;
    });
  }, [leads, searchQuery, channelFilter, statusFilter]);

  const toggleLeadSelection = (leadId: string) => {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(leadId)) {
      newSelection.delete(leadId);
    } else {
      newSelection.add(leadId);
    }
    setSelectedLeads(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map((l: any) => l.id)));
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
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
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to load leads</h2>
          <p className="text-muted-foreground">
            Please check your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6 lg:p-8">
      {/* Main content area */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-inbox">
              Lead Inbox
            </h1>
            <p className="text-muted-foreground mt-1">
              {leads.length > 0 
                ? `${leads.length} lead${leads.length !== 1 ? 's' : ''} · ${filteredLeads.length} shown`
                : "Your leads will appear here"}
            </p>
          </div>


        {/* Channel Stats Summary */}
        {leads.length > 0 && (
          <Card data-testid="card-channel-stats">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">
                    {leads.filter((l: any) => l.channel === 'instagram').length} Instagram
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">
                    {leads.filter((l: any) => l.channel === 'email').length} Email
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


          <div className="flex items-center gap-2">
            {isAtLimit && (
              <Badge variant="destructive" data-testid="badge-limit">
                Lead limit reached ({currentLeadCount}/{leadsLimit})
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRecentConversations(!showRecentConversations)}
              className="lg:hidden"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Recent Chats
            </Button>
          </div>
        </div>

        {/* Mobile Recent Conversations */}
        {showRecentConversations && (
          <div className="lg:hidden">
            <RecentConversations />
          </div>
        )}

        {/* Filters and Search */}
        <Card data-testid="card-filters">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search leads by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-40" data-testid="select-channel">
                <SelectValue placeholder="All channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All channels</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="not_interested">Not interested</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("table")}
                data-testid="button-view-table"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("cards")}
                data-testid="button-view-cards"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {selectedLeads.size > 0 && (
            <div className="flex items-center gap-4 mt-4 p-3 bg-muted rounded-lg">
              <span className="text-sm">
                {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
              </span>
              <Button size="sm" variant="outline" data-testid="button-bulk-tag">
                <TagIcon className="h-3 w-3 mr-1" />
                Add Tag
              </Button>
              <Button size="sm" variant="outline" data-testid="button-bulk-export">
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

        {/* Leads Display */}
        {filteredLeads.length === 0 ? (
        <Card className="border-dashed" data-testid="card-empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {leads.length === 0 ? "You don't have any activity yet" : "No matching leads"}
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {leads.length === 0 
                ? "Connect your Instagram or Email accounts to start receiving leads. Once connected, your leads will appear here in real-time."
                : "Try adjusting your filters or search query."}
            </p>
            {leads.length === 0 && (
              <Link href="/dashboard/integrations">
                <Button data-testid="button-connect-accounts">
                  Connect Your Accounts
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <Card data-testid="card-leads-table">
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                      onChange={toggleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Channel</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Score</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Last Message</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead: any, index) => {
                  const ChannelIcon = channelIcons[lead.channel as keyof typeof channelIcons];
                  const statusColor = statusColors[lead.status as keyof typeof statusColors];
                  return (
                    <motion.tr
                      key={lead.id}
                      className="border-b hover:bg-muted/50 transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      data-testid={`lead-row-${index}`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedLeads.has(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                          data-testid={`checkbox-lead-${index}`}
                        />
                      </td>
                      <td className="p-4">
                        <Link href={`/dashboard/conversations/${lead.id}`}>
                          <div className="hover:underline cursor-pointer">
                            <p className="font-medium" data-testid={`text-lead-name-${index}`}>{lead.name}</p>
                            {lead.email && (
                              <p className="text-sm text-muted-foreground">{lead.email}</p>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <ChannelIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm capitalize">{lead.channel}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className={statusColor} data-testid={`badge-status-${index}`}>
                          {lead.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className={`text-sm font-medium ${getScoreColor(lead.score || 0)}`}>
                          {lead.score || 0}%
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {lead.lastMessageAt ? formatDate(lead.lastMessageAt) : "No messages"}
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-menu-${index}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/conversations/${lead.id}`}>
                                View Conversation
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>Add Tag</DropdownMenuItem>
                            <DropdownMenuItem>Mark as Converted</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead: any, index) => {
            const ChannelIcon = channelIcons[lead.channel as keyof typeof channelIcons];
            const statusColor = statusColors[lead.status as keyof typeof statusColors];
            return (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover-elevate" data-testid={`card-lead-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          <ChannelIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <Link href={`/dashboard/conversations/${lead.id}`}>
                            <p className="font-semibold hover:underline cursor-pointer" data-testid={`text-card-lead-name-${index}`}>
                              {lead.name}
                            </p>
                          </Link>
                          {lead.email && (
                            <p className="text-sm text-muted-foreground">{lead.email}</p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-card-menu-${index}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/conversations/${lead.id}`}>
                              View Conversation
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Add Tag</DropdownMenuItem>
                          <DropdownMenuItem>Mark as Converted</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={statusColor} data-testid={`badge-card-status-${index}`}>
                        {lead.status.replace('_', ' ')}
                      </Badge>
                      <span className={`text-sm font-medium ${getScoreColor(lead.score || 0)}`}>
                        Score: {lead.score || 0}%
                      </span>
                    </div>

                    {lead.tags && lead.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {lead.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 text-xs text-muted-foreground">
                      Last message: {lead.lastMessageAt ? formatDate(lead.lastMessageAt) : "No messages yet"}
                    </div>

                    <Link href={`/dashboard/conversations/${lead.id}`}>
                      <Button className="w-full mt-3" variant="outline" data-testid={`button-view-conversation-${index}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        View Conversation
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
        )}
      </div>

      {/* Desktop Recent Conversations Sidebar */}
      <div className="hidden lg:block w-[400px] flex-shrink-0">
        <div className="sticky top-6">
          <RecentConversations />
        </div>
      </div>
    </div>
  );
}