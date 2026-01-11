
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtime } from "@/hooks/use-realtime";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  Check
} from "lucide-react";
import { Link, useSearch } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PremiumLoader } from "@/components/ui/premium-loader";

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
  const searchParams = useSearch();
  const urlSearchQuery = new URLSearchParams(searchParams).get("search") || "";

  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [activeTab, setActiveTab] = useState<"inbox" | "archived" | "starred">("inbox");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);

  // Get user for realtime
  const { data: user } = useQuery({ queryKey: ["/api/user/profile"] });
  useRealtime(user?.id);

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ["/api/leads", { limit: 50, offset }],
    refetchInterval: 5000,
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
      if (activeTab === 'archived') matchesTab = lead.status === 'archived'; // Assuming status logic
      // Real app would use specific fields

      return matchesSearch && matchesChannel && matchesTab;
    });
  }, [allLeads, searchQuery, filterChannel, activeTab]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeads(next);
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
          <h4 className="text-[10px] font-black text-white/20 px-4 mb-4 uppercase tracking-[0.2em]">Priority Hub</h4>
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
                activeTab === item.id ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "text-white/40 hover:text-white hover:bg-white/5"
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
          <h4 className="text-[10px] font-black text-white/20 px-4 mb-4 uppercase tracking-[0.2em]">Neural Channels</h4>
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
                filterChannel === item.id ? "bg-primary/10 text-primary border border-primary/20" : "text-white/40 hover:text-white hover:bg-white/5"
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
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
              <div className="h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-4">
                <InboxIcon className="h-8 w-8 opacity-30" />
              </div>
              <p className="font-medium">All caught up</p>
              <p className="text-sm opacity-60 mt-1">No messages in this view</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {filteredLeads.map((lead) => {
                const ChannelIcon = channelIcons[lead.channel as keyof typeof channelIcons] || Mail;
                const statusClass = statusStyles[lead.status as keyof typeof statusStyles] || statusStyles.new;
                const isSelected = selectedLeads.has(lead.id);
                // "New" messages glow slightly
                const isUnread = lead.status === 'new';

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

                    <div className={cn("transition-all duration-300", isSelected || "group-hover:opacity-0 group-hover:scale-95")}>
                      <Avatar className="h-12 w-12 border-2 border-white/5 shadow-2xl transition-transform group-hover:scale-110">
                        <AvatarFallback className={cn("text-xs font-black bg-background/50 backdrop-blur-md", isUnread ? "text-primary" : "text-white/20")}>
                          {lead.name ? lead.name.slice(0, 2).toUpperCase() : "??"}
                        </AvatarFallback>
                      </Avatar>
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
                        <span className={cn("text-sm truncate font-bold tracking-tight", isUnread ? "text-white" : "text-white/40")}>
                          {lead.lastMessageSnippet || "Neural sync active..."}
                        </span>
                      </div>

                      <div className="col-span-12 md:col-span-2 flex justify-end">
                        <span className={cn("text-xs whitespace-nowrap", isUnread ? "text-primary font-medium" : "text-muted-foreground/60")}>
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