import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Link } from "wouter";

// Import demo data
import demoLeads from "@/data/demo-leads.json";

const channelIcons = {
  instagram: Instagram,
  whatsapp: SiWhatsapp,
  email: Mail,
};

const statusColors = {
  open: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  replied: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  converted: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  uninterested: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  paused: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

export default function InboxPage() {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  // Mock user plan
  const userPlan = "trial";
  const leadsLimit = 100;
  const currentLeadCount = demoLeads.length;
  const isAtLimit = currentLeadCount >= leadsLimit;

  // Filter and search leads
  const filteredLeads = useMemo(() => {
    return demoLeads.filter((lead) => {
      const matchesSearch =
        searchQuery === "" ||
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.lastMessageSnippet?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesChannel = channelFilter === "all" || lead.channel === channelFilter;
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

      return matchesSearch && matchesChannel && matchesStatus;
    });
  }, [searchQuery, channelFilter, statusFilter]);

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
      setSelectedLeads(new Set(filteredLeads.map((l) => l.id)));
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
                </div>
                <Link href="/dashboard/pricing">
                  <Button size="sm" data-testid="button-upgrade">
                    Upgrade
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Filters */}
      <Card data-testid="card-filters">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
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
              <SelectTrigger className="w-full md:w-40" data-testid="select-channel">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="select-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Display */}
      {viewMode === "table" ? (
        <Card data-testid="card-leads-table">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                      data-testid="checkbox-select-all"
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-semibold">Name</th>
                  <th className="text-left p-4 text-sm font-semibold">Channel</th>
                  <th className="text-left p-4 text-sm font-semibold">Last Message</th>
                  <th className="text-left p-4 text-sm font-semibold">Status</th>
                  <th className="text-left p-4 text-sm font-semibold">Score</th>
                  <th className="text-left p-4 text-sm font-semibold">Created</th>
                  <th className="text-right p-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, index) => {
                  const ChannelIcon = channelIcons[lead.channel as keyof typeof channelIcons];
                  return (
                    <motion.tr
                      key={lead.id}
                      className="border-b hover-elevate cursor-pointer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      data-testid={`row-lead-${index}`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedLeads.has(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                          className="rounded"
                          data-testid={`checkbox-lead-${index}`}
                        />
                      </td>
                      <td className="p-4">
                        <Link href={`/dashboard/conversations/${lead.id}`}>
                          <div>
                            <p className="font-medium" data-testid={`text-lead-name-${index}`}>{lead.name}</p>
                            <p className="text-xs text-muted-foreground">{lead.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <ChannelIcon className="h-4 w-4" data-testid={`icon-channel-${index}`} />
                          <span className="text-sm capitalize">{lead.channel}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm max-w-xs truncate" data-testid={`text-snippet-${index}`}>
                          {lead.lastMessageSnippet}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(lead.lastMessageAt || lead.createdAt)}
                        </p>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className={statusColors[lead.status as keyof typeof statusColors]}
                          data-testid={`badge-status-${index}`}
                        >
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className={`font-medium ${getScoreColor(lead.leadScore)}`} data-testid={`text-score-${index}`}>
                          {lead.leadScore}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-lead-menu-${index}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Add Tag</DropdownMenuItem>
                            <DropdownMenuItem>Mark Converted</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-leads-cards">
          {filteredLeads.map((lead, index) => {
            const ChannelIcon = channelIcons[lead.channel as keyof typeof channelIcons];
            return (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/dashboard/conversations/${lead.id}`}>
                  <Card className="hover-elevate cursor-pointer" data-testid={`card-lead-${index}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        </div>
                        <ChannelIcon className="h-5 w-5 text-muted-foreground" />
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {lead.lastMessageSnippet}
                      </p>

                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={statusColors[lead.status as keyof typeof statusColors]}
                        >
                          {lead.status}
                        </Badge>
                        <span className={`text-sm font-medium ${getScoreColor(lead.leadScore)}`}>
                          {lead.leadScore}
                        </span>
                      </div>

                      {lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {formatDate(lead.lastMessageAt || lead.createdAt)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredLeads.length === 0 && (
        <Card data-testid="card-empty-state">
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
