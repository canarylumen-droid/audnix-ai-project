import { useState, useMemo } from "react";
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
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Link } from "wouter";

// Import demo data as fallback
import demoLeads from "@/data/demo-leads.json";

const channelIcons = {
  instagram: Instagram,
  whatsapp: SiWhatsapp,
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
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  // Fetch leads from backend (with fallback to demo data)
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ["/api/leads", { channel: channelFilter !== "all" ? channelFilter : undefined, status: statusFilter !== "all" ? statusFilter : undefined }],
    retry: false,
  });

  const leads = leadsData?.leads ?? demoLeads;

  // Mock user plan
  const userPlan = "trial";
  const leadsLimit = 100;
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
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-inbox">
              Inbox
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredLeads.length} {filteredLeads.length === 1 ? "lead" : "leads"}
              {selectedLeads.size > 0 && ` · ${selectedLeads.size} selected`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")} data-testid="button-toggle-view">
              {viewMode === "table" ? <Grid3x3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="button-bulk-actions">
                  <MoreVertical className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem data-testid="menu-item-export">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-item-tag">
                  <TagIcon className="h-4 w-4 mr-2" />
                  Add Tag
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Trial Limit Warning */}
        {isAtLimit && userPlan === "trial" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <Card className="border-orange-500/50 bg-orange-500/5" data-testid="card-trial-limit">
              <CardContent className="flex items-start gap-3 p-4">
                <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-orange-500">Lead limit reached</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You've reached the {leadsLimit} lead limit for trial accounts. Upgrade to continue adding leads.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" data-testid="button-upgrade-trial">
                    View Plans
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-leads"
          />
        </div>
        
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-channel">
            <SelectValue placeholder="All Channels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="not_interested">Not Interested</SelectItem>
            <SelectItem value="cold">Cold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads List */}
      {viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-sm text-muted-foreground">
                    <th className="text-left p-4 font-medium">
                      <input
                        type="checkbox"
                        checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                        data-testid="checkbox-select-all"
                      />
                    </th>
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Channel</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Score</th>
                    <th className="text-left p-4 font-medium">Last Message</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead: any) => {
                    const ChannelIcon = channelIcons[lead.channel as keyof typeof channelIcons];
                    const statusColor = statusColors[lead.status as keyof typeof statusColors];

                    return (
                      <tr
                        key={lead.id}
                        className="border-b hover-elevate cursor-pointer"
                        data-testid={`row-lead-${lead.id}`}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedLeads.has(lead.id)}
                            onChange={() => toggleLeadSelection(lead.id)}
                            className="rounded"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`checkbox-lead-${lead.id}`}
                          />
                        </td>
                        <td className="p-4">
                          <div>
                            <Link href={`/dashboard/conversations?lead=${lead.id}`}>
                              <a className="font-medium hover:text-primary" data-testid={`link-lead-${lead.id}`}>
                                {lead.name}
                              </a>
                            </Link>
                            {lead.email && (
                              <p className="text-sm text-muted-foreground">{lead.email}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <ChannelIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize text-sm">{lead.channel}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className={statusColor}>
                            {lead.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className={`font-medium ${getScoreColor(lead.score || lead.leadScore || 0)}`}>
                            {lead.score || lead.leadScore || 0}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="max-w-xs">
                            {lead.lastMessageAt && (
                              <p className="text-sm text-muted-foreground">
                                {formatDate(lead.lastMessageAt)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${lead.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem data-testid={`menu-item-view-${lead.id}`}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem data-testid={`menu-item-tag-${lead.id}`}>
                                Add Tag
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500" data-testid={`menu-item-archive-${lead.id}`}>
                                Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead: any, index: number) => {
            const ChannelIcon = channelIcons[lead.channel as keyof typeof channelIcons];
            const statusColor = statusColors[lead.status as keyof typeof statusColors];

            return (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover-elevate" data-testid={`card-lead-${lead.id}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link href={`/dashboard/conversations?lead=${lead.id}`}>
                          <a className="font-medium hover:text-primary">
                            {lead.name}
                          </a>
                        </Link>
                        {lead.email && (
                          <p className="text-sm text-muted-foreground">{lead.email}</p>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                        className="rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <ChannelIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize text-muted-foreground">{lead.channel}</span>
                      </div>
                      <Badge variant="outline" className={statusColor}>
                        {lead.status.replace("_", " ")}
                      </Badge>
                      <span className={`font-medium ml-auto ${getScoreColor(lead.score || lead.leadScore || 0)}`}>
                        {lead.score || lead.leadScore || 0}
                      </span>
                    </div>

                    {lead.lastMessageAt && (
                      <p className="text-sm text-muted-foreground">
                        {formatDate(lead.lastMessageAt)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {filteredLeads.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No leads found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters or search query
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
