
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtime } from "@/hooks/use-realtime";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Trash2,
  Archive,
  Inbox as InboxIcon,
  Star,
  Instagram,
  Mail,
  RefreshCw,
  MoreVertical,
  Check,
  Play,
  Pause,
  Circle,
  Zap,
  Download
} from "lucide-react";
import { Link, useSearch } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PremiumLoader } from "@/components/ui/premium-loader";
import { useToast } from "@/hooks/use-toast";

const channelIcons = {
  instagram: Instagram,
  email: Mail,
};

// Apple-style status badges
const statusStyles = {
  new: "bg-primary/20 text-primary border-primary/20",
  open: "bg-primary/10 text-primary border-primary/10",
  replied: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  converted: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  not_interested: "bg-muted text-muted-foreground border-muted",
  cold: "bg-muted text-muted-foreground border-muted",
};

export default function InboxPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = useSearch();
  const urlSearchQuery = new URLSearchParams(searchParams).get("search") || "";

  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [activeTab, setActiveTab] = useState<"inbox" | "archived" | "starred">("inbox");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);

  // Get user for realtime
  const { data: user } = useQuery<{ id: string }>({ queryKey: ["/api/user/profile"] });
  useRealtime(user?.id);

  const { data: leadsData, isLoading } = useQuery<any>({
    queryKey: ["/api/leads", { limit: 50, offset }],
    refetchInterval: 5000,
  });

  // Toggle AI Pause Mutation
  const toggleAi = useMutation({
    mutationFn: async ({ id, paused }: { id: string; paused: boolean }) => {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiPaused: paused })
      });
      if (!res.ok) throw new Error("Failed to update lead");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(["/api/leads", { limit: 50, offset }], (old: any) => {
        if (!old?.leads) return old;
        return {
          ...old,
          leads: old.leads.map((l: any) =>
            l.id === variables.id ? { ...l, aiPaused: variables.paused } : l
          )
        };
      });
      toast({
        title: variables.paused ? "AI Agent Paused" : "AI Agent Resumed",
        description: variables.paused ? "AI will stop replying to this lead." : "AI will resume autonomous replies.",
      });
    }
  });

  useEffect(() => {
    if (leadsData?.leads) {
      if (offset === 0) setAllLeads(leadsData.leads);
      else setAllLeads(prev => {
        const newLeads = leadsData.leads.filter((newLead: any) => !prev.some(p => p.id === newLead.id));
        return [...prev, ...newLeads];
      });
    }
  }, [leadsData, offset]);

  const filteredLeads = useMemo(() => {
    return allLeads.filter((lead: any) => {
      const matchesSearch = !searchQuery ||
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesChannel = filterChannel === "all" || lead.channel === filterChannel;

      // Mock tab filtering
      let matchesTab = true;
      if (activeTab === 'starred') matchesTab = lead.isStarred;
      if (activeTab === 'archived') matchesTab = lead.status === 'archived';

      return matchesSearch && matchesChannel && matchesTab;
    });
  }, [allLeads, searchQuery, filterChannel, activeTab]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeads(next);
  };

  const exportLeads = () => {
    if (allLeads.length === 0) return;

    const headers = ["Name", "Email", "Channel", "Status", "Score", "Created At"];
    const csvContent = [
      headers.join(","),
      ...allLeads.map(l => [
        `"${l.name || ""}"`,
        `"${l.email || ""}"`,
        `"${l.channel || ""}"`,
        `"${l.status || ""}"`,
        l.score || 0,
        `"${l.createdAt || ""}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `audnix-leads-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Data Exported",
      description: `Successfully downloaded ${allLeads.length} leads.`,
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-muted-foreground";
  };

  const InboxSkeleton = () => (
    <div className="space-y-0 divide-y divide-border/20">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-10rem)] -m-6 md:-m-8 lg:-m-10 flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-border/40 bg-muted/5 hidden md:flex flex-col p-3 space-y-6">
        <div className="space-y-1">
          <h4 className="text-[10px] font-black text-muted-foreground/30 px-4 mb-4 uppercase tracking-[0.2em]">Priority Hub</h4>
          {[
            { id: 'inbox', label: 'Inbox', icon: InboxIcon, count: allLeads.length },
            { id: 'starred', label: 'Starred', icon: Star, count: 0 },
            { id: 'archived', label: 'Archive', icon: Archive, count: 0 }
          ].map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-between font-bold h-11 rounded-xl px-4 transition-all duration-300",
                activeTab === item.id ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => setActiveTab(item.id as any)}
            >
              <div className="flex items-center">
                <item.icon className={cn("mr-3 h-4 w-4", activeTab === item.id ? "text-primary" : "opacity-40")} />
                <span className="text-[11px] uppercase tracking-widest">{item.label}</span>
              </div>
              {item.count > 0 && (
                <Badge className="bg-primary/20 text-primary text-[10px] font-black h-5 min-w-[1.25rem] px-1 flex items-center justify-center border-none">
                  {item.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <div className="space-y-1 pt-8">
          <h4 className="text-[10px] font-black text-muted-foreground/30 px-4 mb-4 uppercase tracking-[0.2em]">Neural Channels</h4>
          {[
            { id: 'all', label: 'All Channels', icon: InboxIcon },
            { id: 'instagram', label: 'Instagram', icon: Instagram },
            { id: 'email', label: 'Email', icon: Mail }
          ].map((item) => (
            <Button
              key={item.id}
              variant={filterChannel === item.id ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start font-bold h-11 rounded-xl px-4 transition-all duration-300",
                filterChannel === item.id ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => setFilterChannel(item.id)}
            >
              <item.icon className={cn("mr-3 h-4 w-4", filterChannel === item.id ? "text-primary" : "opacity-40")} />
              <span className="text-[11px] uppercase tracking-widest">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Main List Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Toolbar */}
        <div className="h-14 border-b border-border/40 flex items-center px-4 justify-between flex-shrink-0 bg-background/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search leads, actions, or tools..."
                className="h-11 pl-11 bg-muted/40 border-border/10 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-xl font-medium placeholder:text-muted-foreground transition-all text-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            {selectedLeads.size > 0 && (
              <div className="flex items-center gap-1 animate-in fade-in slide-in-from-top-2 mr-2 bg-muted/30 rounded-md px-2 py-1">
                <span className="text-xs font-medium mr-2">{selectedLeads.size} selected</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"><Archive className="h-3.5 w-3.5" /></Button>
              </div>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" onClick={exportLeads} title="Export to CSV">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setOffset(0)} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading ? "animate-spin" : "")} />
            </Button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-muted/50 hover:scrollbar-thumb-muted-foreground/30">
          {isLoading && filteredLeads.length === 0 ? (
            <InboxSkeleton />
          ) : filteredLeads.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <EmptyState
                icon={InboxIcon}
                title="No messages found"
                description="Your inbox is empty. Import leads or wait for new messages."
              />
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {filteredLeads.map((lead) => {
                const ChannelIcon = channelIcons[lead.channel as keyof typeof channelIcons] || Mail;
                const statusClass = statusStyles[lead.status as keyof typeof statusStyles] || statusStyles.new;
                const isSelected = selectedLeads.has(lead.id);
                // "New" messages glow slightly
                const isUnread = lead.status === 'new';
                const score = lead.score || 0; // Default score

                return (
                  <motion.div
                    key={lead.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "group flex items-start gap-3 px-4 py-3.5 hover:bg-muted/30 transition-all cursor-pointer relative border-l-2 border-transparent",
                      isSelected && "bg-primary/5",
                      isUnread && "bg-primary/5 border-l-primary" // Glow effect
                    )}
                    onClick={() => window.location.href = `/dashboard/conversations/${lead.id}`}
                  >
                    {/* Checkbox Overlay */}
                    <div
                      className={cn("absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center transition-all duration-200", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
                      onClick={(e) => { e.stopPropagation(); toggleSelection(lead.id); }}
                    >
                      <div className={cn("h-5 w-5 rounded border flex items-center justify-center transition-colors shadow-sm", isSelected ? "bg-primary border-primary text-primary-foreground" : "bg-background border-muted-foreground/30 hover:border-primary/50")}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                    </div>

                    <div className={cn("relative transition-all duration-300", isSelected || "group-hover:opacity-0 group-hover:scale-95")}>
                      <Avatar className="h-12 w-12 border-2 border-white/5 shadow-2xl transition-transform group-hover:scale-110">
                        <AvatarFallback className={cn("text-xs font-black bg-muted/50 backdrop-blur-md", isUnread ? "text-primary" : "text-muted-foreground/40")}>
                          {lead.name ? lead.name.slice(0, 2).toUpperCase() : "??"}
                        </AvatarFallback>
                      </Avatar>

                      {/* Pause/Play Button Overlay */}
                      <div
                        className="absolute inset-0 flex items-center justify-center z-30 opacity-0 hover:opacity-100 transition-opacity bg-background/60 backdrop-blur-sm rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAi.mutate({ id: lead.id, paused: !lead.aiPaused });
                        }}
                      >
                        {lead.aiPaused ? (
                          <Play className="h-5 w-5 text-primary fill-primary" />
                        ) : (
                          <Pause className="h-5 w-5 text-muted-foreground fill-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 grid grid-cols-12 gap-x-4 gap-y-1 items-center">
                      <div className="col-span-12 md:col-span-3 flex items-center gap-2 min-w-0">
                        <span className={cn("truncate text-sm", isUnread ? "font-bold text-foreground" : "font-medium text-foreground/80")}>
                          {lead.name || "Unknown Lead"}
                        </span>
                        <ChannelIcon className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
                      </div>

                      <div className="col-span-12 md:col-span-7 flex items-center gap-3 min-w-0">
                        {lead.status && (
                          <Badge variant="outline" className={cn("text-[9px] h-6 px-2.5 font-black rounded-lg uppercase tracking-widest md:flex hidden backdrop-blur-md", statusClass)}>
                            {lead.status.replace('_', ' ')}
                          </Badge>
                        )}
                        <span className={cn("text-sm truncate font-bold tracking-tight", isUnread ? "text-foreground" : "text-muted-foreground/40")}>
                          {lead.lastMessageSnippet || "Neural sync active..."}
                        </span>
                      </div>

                      <div className="col-span-12 md:col-span-2 flex justify-end items-center gap-3">
                        {/* Circular Score Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted/20">
                              <div className="relative flex items-center justify-center">
                                <svg className="h-8 w-8 transform -rotate-90">
                                  <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-muted/20" />
                                  <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="transparent" strokeDasharray={88} strokeDashoffset={88 - (88 * score) / 100} className={cn(getScoreColor(score))} />
                                </svg>
                                <span className={cn("absolute text-[9px] font-bold", getScoreColor(score))}>{score}</span>
                              </div>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-border/50">
                            <DropdownMenuLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Lead Intelligence</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="p-3 space-y-2">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Intent Score</span>
                                <span className={cn("font-bold", getScoreColor(score))}>{score}/100</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Status</span>
                                <span className="capitalize text-foreground">{lead.status.replace('_', ' ')}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">AI Agent</span>
                                <Badge variant="outline" className={cn("text-[9px] h-4", lead.aiPaused ? "border-amber-500/50 text-amber-500" : "border-green-500/50 text-green-500")}>
                                  {lead.aiPaused ? 'PAUSED' : 'ACTIVE'}
                                </Badge>
                              </div>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <span className={cn("text-xs whitespace-nowrap hidden lg:block", isUnread ? "text-primary font-medium" : "text-muted-foreground/60")}>
                          {formatDate(lead.lastMessageAt || lead.createdAt)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Load More Trigger could go here */}
              <div className="p-4 text-center">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setOffset(prev => prev + 50)}>
                  Load older messages
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}