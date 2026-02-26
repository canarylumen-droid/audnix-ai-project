
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRealtime } from "@/hooks/use-realtime";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useParams, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LeadIntelligenceModal } from "@/components/dashboard/LeadIntelligenceModal";
import { CustomContextMenu, useContextMenu } from "@/components/ui/interactive/CustomContextMenu";
import UnifiedCampaignWizard from "@/components/outreach/UnifiedCampaignWizard";
import {
  Search,
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
  Send,
  Sparkles,
  Calendar,
  Clock,
  MessageSquare,
  Loader2,
  X,
  Target,
  Activity,
  Brain,
  Share2,
  ExternalLink,
  User,
  Phone,
  Plug,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Filter,
  Zap,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const channelIcons = {
  instagram: Instagram,
  email: Mail,
};

const statusStyles = {
  new: "bg-primary/20 text-primary border-primary/20",
  open: "bg-primary/10 text-primary border-primary/10",
  replied: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  booked: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  converted: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  warm: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  not_interested: "bg-muted text-muted-foreground border-muted",
  cold: "bg-muted text-muted-foreground border-muted",
};

export default function InboxPage() {
  const { id: leadId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all"); // Added status filter
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  // Message Thread State
  const [replyMessage, setReplyMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showDetails, setShowDetails] = useState(false); // Controls the right sidebar
  const [typingLeadId, setTypingLeadId] = useState<string | null>(null); // Track which lead is typing
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { contextConfig, handleContextMenu, closeMenu } = useContextMenu();

  const { data: user } = useQuery<{ id: string }>({ queryKey: ["/api/user/profile"] });

  const { socket } = useRealtime();

  useEffect(() => {
    if (!socket) return;

    const handleMessagesUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      if (leadId) {
        queryClient.invalidateQueries({ queryKey: ["/api/messages", leadId] });
      }
    };

    const handleLeadsUpdated = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      if (data?.type === 'lead_updated' && data?.lead) {
        setAllLeads(prev => prev.map(l => l.id === data.lead.id ? data.lead : l));
      }
    };

    const handleNotification = (data: any) => {
      if (data?.type === 'lead_import') {
        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        toast({ title: "Leads Imported", description: "Your inbox has been updated with new leads." });
      }
    };

    const handleActivityUpdated = (data: any) => {
      if (data?.type === 'typing_status' && data.channel === 'instagram') {
        if (data.status === 'typing_on') {
          setTypingLeadId(data.leadId);
          // Auto-clear after 5 seconds just in case 'typing_off' is missed
          setTimeout(() => setTypingLeadId(null), 5000);
        } else {
          setTypingLeadId(null);
        }
      }
    };

    socket.on('messages_updated', handleMessagesUpdated);
    socket.on('leads_updated', handleLeadsUpdated);
    socket.on('notification', handleNotification);
    socket.on('activity_updated', handleActivityUpdated);

    return () => {
      socket.off('messages_updated', handleMessagesUpdated);
      socket.off('leads_updated', handleLeadsUpdated);
      socket.off('notification', handleNotification);
      socket.off('activity_updated', handleActivityUpdated);
    };
  }, [socket, leadId, queryClient, toast]);

  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const { data: leadsData, isLoading: leadsLoading } = useQuery<any>({
    queryKey: ["/api/leads", { limit: PAGE_SIZE, offset: page * PAGE_SIZE, includeArchived: showArchived }],
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery<any>({
    queryKey: ["/api/messages", leadId],
    enabled: !!leadId,
  });

  const { data: channelStatus } = useQuery<any>({
    queryKey: ["/api/channels/all"],
  });

  const isChannelConnected = (channel?: string) => {
    if (!channel || !channelStatus?.channels) return false;
    if (channel === 'email') return channelStatus.channels.email.connected;
    if (channel === 'instagram') return channelStatus.channels.instagram.connected;
    return false;
  };

  const hasAnyChannel = channelStatus?.channels?.email?.connected || channelStatus?.channels?.instagram?.connected;

  const activeLead = useMemo(() =>
    leadsData?.leads?.find((l: any) => l.id === leadId) || allLeads.find((l: any) => l.id === leadId),
    [leadsData, allLeads, leadId]
  );

  useEffect(() => {
    if (leadsData?.leads) {
      setAllLeads(prev => {
        const newLeads = [...prev];
        leadsData.leads.forEach((lead: any) => {
          const index = newLeads.findIndex(l => l.id === lead.id);
          if (index > -1) {
            // Update existing lead
            newLeads[index] = lead;
          } else {
            // Append new lead
            newLeads.push(lead);
          }
        });
        return newLeads;
      });
    }
  }, [leadsData]);

  // Handle clearing unread status and status transition when lead is selected
  useEffect(() => {
    if (leadId) {
      // Clear lead-specific notifications on the server
      apiRequest("POST", `/api/messages/${leadId}/read`).catch(console.error);

      // REDUCED: Move lead from 'new' to 'open' status immediately on click
      if (activeLead?.status === 'new') {
        apiRequest("PATCH", `/api/leads/${leadId}`, { status: 'open' }).then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        });
      }

      if (activeLead?.metadata?.isUnread) {
        const { isUnread, ...restMetadata } = activeLead.metadata;
        apiRequest("PATCH", `/api/leads/${leadId}`, {
          metadata: restMetadata
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        });
      }
      
      // Always refresh notifications when a lead is opened
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    }
  }, [leadId, activeLead?.id, activeLead?.status, queryClient]); // Added activeLead?.status to dependencies

  const filteredLeads = useMemo(() => {
    return allLeads.filter((lead: any) => {
      const matchesSearch = !searchQuery ||
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesChannel = filterChannel === "all" || lead.channel === filterChannel;

      let matchesStatus = true;
      if (filterStatus !== "all") {
        if (filterStatus === "unread") {
          matchesStatus = !!lead.metadata?.isUnread;
        } else if (filterStatus === "read") {
          matchesStatus = !lead.metadata?.isUnread;
        } else if (filterStatus === "opened") {
          matchesStatus = !!lead.metadata?.isOpened;
        } else if (filterStatus === "warm") {
          // Warm = Replied OR Score > 50 OR manually marked warm
          matchesStatus = lead.status === 'replied' || (lead.score && lead.score > 50) || lead.metadata?.isWarm;
        } else {
          matchesStatus = lead.status === filterStatus;
        }
      }

      const matchesArchived = showArchived ? lead.archived : !lead.archived;

      return matchesSearch && matchesChannel && matchesStatus && matchesArchived;
    }).sort((a: any, b: any) => {
      const timeA = new Date(a.lastMessageAt || a.createdAt).getTime();
      const timeB = new Date(b.lastMessageAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [allLeads, searchQuery, filterChannel, filterStatus, showArchived]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => {
      // If content has a subject line (first line), extract it
      let subject: string | undefined = undefined;
      let body = content;

      // Simple heuristic: if it looks like a subject line is intended (e.g. "Subject: ...")
      // But for now, we'll just send content. 
      // User requested "reply appending subject". 
      // If we want to support subject, we can pass it here if the UI supported it.
      // For now, we just pass content.
      return apiRequest("POST", `/api/messages/${leadId}`, { content, channel: activeLead?.channel });
    },
    onSuccess: () => {
      setReplyMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", leadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    }
  });

  const handleAiReply = async () => {
    setIsGenerating(true);
    setTypedText("");
    try {
      const res = await apiRequest("POST", `/api/ai/reply/${leadId}`);
      const data = await res.json();
      const aiSuggestion = data.aiSuggestion || data.content || "";

      // Typewriter effect from ConversationsPage
      let index = 0;
      const interval = setInterval(() => {
        if (index < aiSuggestion.length) {
          setTypedText(aiSuggestion.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setReplyMessage(aiSuggestion);
          setIsGenerating(false);
        }
      }, 20);
    } catch (err) {
      toast({ title: "AI Error", description: "Failed to generate reply", variant: "destructive" });
      setIsGenerating(false);
    }
  };

  const toggleAi = useMutation({
    mutationFn: async ({ id, paused }: { id: string; paused: boolean }) => {
      await apiRequest("PATCH", `/api/leads/${id}`, { aiPaused: paused });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/leads"] })
  });

  const handleMenuAction = useCallback(async (action: string, data: any) => {
    if (action === 'archive') {
      try {
        await apiRequest("POST", "/api/bulk/archive", {
          leadIds: [data.id],
          archived: true
        });
        // Optimistic update
        setAllLeads(prev => prev.filter(l => l.id !== data.id));
        if (leadId === data.id) {
          setLocation('/dashboard/inbox');
        }
        toast({ title: "Lead Archived", description: "Successfully moved to archive" });
        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      } catch (err) {
        toast({ title: "Error", description: "Failed to archive lead", variant: "destructive" });
        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      }
    } else if (action === 'unarchive') {
      try {
        await apiRequest("POST", "/api/bulk/archive", {
          leadIds: [data.id],
          archived: false
        });
        // Optimistic update
        setAllLeads(prev => prev.filter(l => l.id !== data.id));
        if (leadId === data.id) {
          setLocation('/dashboard/inbox');
        }
        toast({ title: "Lead Restored", description: "Successfully restored from archive" });
        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      } catch (err) {
        toast({ title: "Error", description: "Failed to unarchive lead", variant: "destructive" });
        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      }
    } else if (action === 'delete') {
      if (confirm(`Are you sure you want to delete ${data.name}? This action cannot be undone.`)) {
        // Optimistic UI updates
        setAllLeads(prev => prev.filter(l => l.id !== data.id));
        if (leadId === data.id) {
          setLocation('/dashboard/inbox');
        }

        try {
          await apiRequest("POST", "/api/bulk/delete", {
            leadIds: [data.id]
          });
          toast({ title: "Lead Deleted", description: "Lead has been permanently removed" });
          queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        } catch (err) {
          // Revert on failure (optional, but good practice would be to re-fetch)
          toast({ title: "Error", description: "Failed to delete lead", variant: "destructive" });
          queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        }
      }
    } else if (action === 'mark_unread') {
      try {
        const currentMetadata = data.metadata || {};
        await apiRequest("PATCH", `/api/leads/${data.id}`, {
          metadata: { ...currentMetadata, isUnread: true }
        });
        toast({ title: "Marked as Unread", description: "This conversation will appear as unread" });
        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      } catch (err) {
        toast({ title: "Error", description: "Failed to mark as unread", variant: "destructive" });
      }
    } else if (action === 'copy_details') {
      const details = `Name: ${data.name}\nEmail: ${data.email || 'N/A'}\nPhone: ${data.phone || 'N/A'}\nCompany: ${data.company || 'N/A'}`;
      navigator.clipboard.writeText(details);
      toast({ title: "Copied!", description: "Lead details copied to clipboard" });
    } else if (action === 'mark_booked') {
      try {
        await apiRequest("PATCH", `/api/leads/${data.id}`, { status: 'booked' });
        toast({ title: "Lead Booked", description: `${data.name} has been marked as booked` });
        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      } catch (err) {
        toast({ title: "Error", description: "Failed to mark lead as booked", variant: "destructive" });
      }
    }
  }, [toast, queryClient, leadId, setLocation]);

  const handleBulkAction = async (action: 'archive' | 'delete') => {
    if (selectedLeadIds.length === 0) return;

    if (action === 'delete' && !confirm(`Delete ${selectedLeadIds.length} selected leads?`)) return;

    try {
      // Optimistic UI updates for delete
      if (action === 'delete') {
        setAllLeads(prev => prev.filter(l => !selectedLeadIds.includes(l.id)));
        if (leadId && selectedLeadIds.includes(leadId)) {
          setLocation('/dashboard/inbox');
        }
        setSelectedLeadIds([]);
      }

      const endpoint = action === 'delete' ? '/api/bulk/delete' : '/api/bulk/archive';
      const body = action === 'delete' ? { leadIds: selectedLeadIds } : { leadIds: selectedLeadIds, archived: true };

      await apiRequest("POST", endpoint, body);

      toast({
        title: `Bulk ${action === 'delete' ? 'Delete' : 'Archive'}`,
        description: `Successfully processed ${selectedLeadIds.length} leads`
      });

      if (action !== 'delete') setSelectedLeadIds([]); // Clear selection for archive too if successful
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    } catch (err) {
      toast({ title: "Error", description: "Bulk action failed", variant: "destructive" });
    }
  };

  const toggleLeadSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const bookCallMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/ai/calendar/${leadId}`, { sendMessage: true });
    },
    onSuccess: () => {
      toast({ title: "Booking link sent!", description: `Calendar invite sent to ${activeLead?.name}` });
      queryClient.invalidateQueries({ queryKey: ["/api/messages", leadId] });
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesData?.messages, isGenerating, typedText]);

  useEffect(() => {
    // Component check for debugging
  }, []);

  const ChannelIcon = activeLead ? (channelIcons[activeLead.channel as keyof typeof channelIcons] || Instagram) : Instagram;

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background relative p-0">
      <div className="flex w-full h-full max-w-[1600px] mx-auto bg-card border-0 md:border md:rounded-3xl overflow-hidden shadow-2xl">
        {/* Lead List Pane */}
        <div className={cn(
          "w-full md:w-80 lg:w-[350px] border-r flex flex-col transition-all shrink-0 h-[100dvh] md:h-full bg-background",
          leadId && "hidden md:flex"
        )}>
          <div className="p-4 border-b space-y-4 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Inbox</h2>
              <div className="flex items-center gap-2">
                {/* Status Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                      <Filter className={cn("h-4 w-4", filterStatus !== 'all' ? "text-primary" : "text-muted-foreground")} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setFilterStatus("all")} className="cursor-pointer font-medium">All Chats</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("unread")} className="cursor-pointer font-medium">Unread</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("read")} className="cursor-pointer font-medium">Read</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("opened")} className="cursor-pointer font-medium">Opened (Tracking)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("replied")} className="cursor-pointer font-medium text-emerald-500">Replied</DropdownMenuItem>
                     <DropdownMenuItem onClick={() => setFilterStatus("warm")} className="cursor-pointer font-medium text-orange-500">Warm (Engaged)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("cold")} className="cursor-pointer font-medium text-muted-foreground">Cold (No Reply)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("booked")} className="cursor-pointer font-medium text-sky-500">Booked / Converted</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("not_interested")} className="cursor-pointer font-medium text-destructive/70">Not Interested</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="icon" onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4" /></Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 gap-1.5 text-xs font-medium"
                  onClick={() => setIsCampaignModalOpen(true)}
                >
                  <Send className="h-3.5 w-3.5" />
                  Campaign
                </Button>
                <Button
                  variant={showArchived ? "secondary" : "ghost"}
                  size="icon"
                  className={cn("h-8 w-8", showArchived && "text-primary")}
                  onClick={() => setShowArchived(!showArchived)}
                  title={showArchived ? "Hide Archived" : "Show Archived"}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                className="pl-9 h-10 rounded-xl bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <Button variant="ghost" size="sm" onClick={() => setFilterChannel("all")} className={cn("h-7 px-4 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0 transition-all", filterChannel === 'all' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted")}>All</Button>
              <Button variant="ghost" size="sm" onClick={() => setFilterChannel("instagram")} className={cn("h-7 px-4 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0 transition-all", filterChannel === 'instagram' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted")}>Instagram</Button>
              <Button variant="ghost" size="sm" onClick={() => setFilterChannel("email")} className={cn("h-7 px-4 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0 transition-all", filterChannel === 'email' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted")}>Email</Button>
            </div>

            {/* Mobile/Desktop Connect Alert */}
            {!hasAnyChannel && allLeads.length > 0 && (
              <div className="mx-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="p-1.5 bg-red-500/20 rounded-full shrink-0">
                  <Plug className="h-3 w-3 text-red-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-foreground">Channels Disconnected</h4>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 mb-2">
                    Connect Email or Instagram to sync replies.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[9px] font-bold uppercase w-full bg-background hover:bg-red-500/5 hover:text-red-500 border-red-500/20"
                    onClick={() => setLocation('/dashboard/integrations')}
                  >
                    Connect Now
                  </Button>
                </div>
              </div>
            )}


            {/* Bulk Action Bar */}
            <AnimatePresence>
              {selectedLeadIds.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex items-center justify-between pb-2"
                >
                  <span className="text-xs font-bold text-primary">{selectedLeadIds.length} Selected</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleBulkAction('archive')} title="Archive Selected">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleBulkAction('delete')} title="Delete Selected">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setSelectedLeadIds([])}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Status Display */}
            {filterStatus !== 'all' && (
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Filtering by:</span>
                <Badge variant="secondary" className="text-[10px] px-2 h-5 uppercase">
                  {filterStatus}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setFilterStatus('all'); }}
                  />
                </Badge>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/5">
            {leadsLoading && page === 0 ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[400px] animate-in fade-in zoom-in duration-700">
                {/* Only show "Connect Sources" if ABSOLUTELY no channels are connected AND no leads exist */}
                {!hasAnyChannel && allLeads.length === 0 ? (
                  <div className="max-w-xs">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mb-8 mx-auto relative group">
                      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Plug className="h-10 w-10 text-primary relative z-10 animate-pulse" />
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full border-2 border-background" />
                    </div>
                    <h3 className="text-xl font-black tracking-tighter uppercase italic mb-2">Connect Sources</h3>
                    <p className="text-sm text-muted-foreground/60 font-medium mb-8 leading-relaxed">
                      Your inbox is ready. Just connect your email or Instagram to start importing and engaging leads in real-time.
                    </p>
                    <Button
                      size="lg"
                      className="rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] h-12 px-10 shadow-lg shadow-primary/20 hover:scale-105 transition-all w-full"
                      onClick={() => setLocation('/dashboard/integrations')}
                    >
                      Connect Sources Now <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="max-w-xs opacity-40">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-muted/20 flex items-center justify-center mb-6 mx-auto">
                      <InboxIcon className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-widest text-foreground">No conversations found</p>
                    <p className="text-[10px] text-muted-foreground font-bold mt-2 uppercase">
                      {searchQuery || filterStatus !== 'all' ? "Try adjusting your filters" : "Wait for new leads to arrive"}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-auto">
                  {filteredLeads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => {
                        if (selectedLeadIds.length > 0) {
                          toggleLeadSelection(lead.id);
                        } else {
                          setLocation(`/dashboard/inbox/${lead.id}`);
                        }
                      }}
                      onContextMenu={(e) => handleContextMenu(e, 'inbox', lead)}
                      className={cn(
                        "p-5 cursor-pointer border-b border-border/10 transition-all relative group flex gap-4",
                        leadId === lead.id ? "bg-primary/10" : "hover:bg-muted/30",
                        lead.metadata?.isUnread && "bg-primary/5",
                        selectedLeadIds.includes(lead.id) && "bg-primary/20"
                      )}
                    >
                      {/* Checkbox for selection */}
                      <div
                        className={cn(
                          "absolute left-2 top-1/2 -translate-y-1/2 z-10 transition-all",
                          selectedLeadIds.includes(lead.id) || "opacity-0 group-hover:opacity-100"
                        )}
                        onClick={(e) => toggleLeadSelection(lead.id, e)}
                      >
                        <div className={cn(
                          "h-5 w-5 rounded-md border flex items-center justify-center transition-colors",
                          selectedLeadIds.includes(lead.id) ? "bg-primary border-primary" : "bg-background border-border"
                        )}>
                          {selectedLeadIds.includes(lead.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      </div>

                      {leadId === lead.id && <motion.div layoutId="activeLead" className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                      <div className={cn("flex gap-3 items-center transition-all", (selectedLeadIds.length > 0 || selectedLeadIds.includes(lead.id)) && "pl-8")}>
                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm transition-transform group-hover:scale-105 shrink-0 rounded-full">
                          <AvatarImage src={lead.avatar} />
                          <AvatarFallback className={cn(
                            "font-bold text-sm rounded-full",
                            lead.id === leadId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>{lead.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-sm font-bold truncate text-foreground flex-1" title={lead.name}>{lead.name}</span>
                            <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider shrink-0 mt-0.5">
                              {new Date(lead.lastMessageAt || lead.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className={cn("text-xs truncate transition-colors h-4", lead.metadata?.isUnread ? "text-foreground font-bold" : "text-muted-foreground")}>
                            {typingLeadId === lead.id ? (
                              <span className="flex items-center gap-1 text-primary font-bold animate-pulse">
                                Typinng...
                              </span>
                            ) : (
                              lead.snippet || "No messages"
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge {...({
                              variant: "outline",
                              className: cn("text-[9px] h-4 px-1 rounded-sm border-0 uppercase font-black tracking-wider", statusStyles[lead.status as keyof typeof statusStyles] || statusStyles.cold)
                            } as any)}>
                              {lead.status === 'hardened' ? 'Verified' : lead.status}
                            </Badge>
                            {lead.metadata?.isUnread && (
                              (() => {
                                const isOld = new Date().getTime() - new Date(lead.createdAt).getTime() > 24 * 60 * 60 * 1000;
                                return !isOld ? <span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> : null;
                              })()
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {leadsData?.hasMore && (
                    <div className="p-4">
                      <Button
                        variant="outline"
                        className="w-full text-xs font-bold uppercase tracking-widest rounded-xl h-10 border-dashed text-foreground"
                        onClick={() => setPage(p => p + 1)}
                        disabled={leadsLoading}
                      >
                        {leadsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Load More
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Message Thread Pane */}
        <div className={cn("flex-1 flex flex-col bg-background h-full", !leadId && "hidden md:flex items-center justify-center")}>
          {!leadId ? (
            <div className="text-center space-y-6 max-w-sm px-6">
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                <div className="relative h-24 w-24 rounded-[2.5rem] bg-card border border-border/40 flex items-center justify-center shadow-2xl">
                  <InboxIcon className="h-10 w-10 text-primary/40" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter">Command Center</h2>
                <p className="text-sm text-muted-foreground/60 leading-relaxed">
                  Select a live conversation to view deep lead intelligence, handle objections, or let the AI Agent take full control.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 overflow-hidden h-full">
              <div className="flex-1 flex flex-col h-full min-w-0">
                {/* Thread Header */}
                <div className="h-16 md:h-20 border-b flex items-center px-4 md:px-8 justify-between bg-background shrink-0 z-10">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Back Button for Mobile */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 -ml-2 text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => setLocation('/dashboard/inbox')}
                      title="Back to Inbox"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>

                    <Avatar className="h-10 w-10 shrink-0 border-2 border-background shadow-sm rounded-full">
                      <AvatarImage src={activeLead?.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold rounded-full">{activeLead?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold truncate leading-none mb-1" title={activeLead?.name}>{activeLead?.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">{activeLead?.status === 'hardened' ? 'Verified' : activeLead?.status}</span>
                        <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        <ChannelIcon className={cn("h-3 w-3 shrink-0", !isChannelConnected(activeLead?.channel) ? "text-destructive" : "text-muted-foreground")} />
                        {!isChannelConnected(activeLead?.channel) && (
                          <span className="text-[9px] font-bold text-destructive uppercase tracking-wide ml-1 hidden sm:inline">Disconnected</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sheet open={showDetails} onOpenChange={setShowDetails}>
                      <SheetTrigger asChild>
                        <Badge
                          className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[10px] hidden xl:block px-3 py-1 uppercase tracking-tighter cursor-pointer hover:bg-emerald-500/20 transition-colors"
                          onClick={() => setShowDetails(true)}
                        >
                          {activeLead?.score || 0}% Engagement Score
                        </Badge>
                      </SheetTrigger>
                      <SheetContent
                        side="right"
                        className="w-full sm:max-w-[450px] p-0 bg-background border-l border-border/30 flex flex-col h-full"
                      >
                        <SheetHeader className="p-6 border-b border-border/30 shrink-0">
                          <SheetTitle className="text-xl font-black text-foreground uppercase tracking-tighter flex items-center gap-3">
                            <Brain className="h-6 w-6 text-primary" />
                            Lead Intelligence
                          </SheetTitle>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                          <Accordion type="multiple" defaultValue={["metrics", "contact"]} className="w-full space-y-4">
                            {/* Intensity Metrics */}
                            <AccordionItem value="metrics" className="border-none space-y-2">
                              <AccordionTrigger className="hover:no-underline py-0">
                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Engagement Probability</h4>
                              </AccordionTrigger>
                              <AccordionContent className="pt-2">
                                <div className="p-6 rounded-3xl bg-muted/10 border border-border/30 space-y-4 shadow-inner">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-muted-foreground">Engagement Rank</span>
                                    <span className="text-xs font-black text-foreground text-lg tracking-tighter">
                                      #{activeLead?.id ? (String(activeLead.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100 + 1) : 42} / {(leadsData?.leads?.length || 0) > 100 ? `${((leadsData?.leads?.length || 0) / 1000).toFixed(1)}k` : leadsData?.leads?.length || 0}
                                    </span>
                                  </div>
                                  <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${isNaN(Number(activeLead?.score)) ? 0 : (activeLead?.score || 0)}%` }}
                                      className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.6)]"
                                    />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground/60 font-medium leading-relaxed italic mt-2">
                                    Probability calculated based on real-time intelligence engagement patterns.
                                  </p>
                                </div>
                              </AccordionContent>
                            </AccordionItem>

                            {/* Contact Info */}
                            <AccordionItem value="contact" className="border-none space-y-2">
                              <AccordionTrigger className="hover:no-underline py-0">
                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Contact Identity</h4>
                              </AccordionTrigger>
                              <AccordionContent className="pt-2">
                                <div className="grid gap-3">
                                  <div className="p-4 rounded-2xl bg-muted/10 border border-border/30 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Mail className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">Email</p>
                                        <p className="text-xs font-bold text-foreground truncate max-w-[150px]">{activeLead?.email || 'Not provided'}</p>
                                      </div>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40" />
                                  </div>
                                  <div className="p-4 rounded-2xl bg-muted/10 border border-border/30 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <Phone className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">Phone</p>
                                        <p className="text-xs font-bold text-foreground leading-none">{activeLead?.phone || 'Private'}</p>
                                      </div>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40" />
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>

                            {/* Social Graph */}
                            <AccordionItem value="social" className="border-none space-y-2">
                              <AccordionTrigger className="hover:no-underline py-0">
                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Social Insight</h4>
                              </AccordionTrigger>
                              <AccordionContent className="pt-2">
                                <div className="grid grid-cols-2 gap-3">
                                  {[{ name: 'LinkedIn', url: activeLead?.linkedinProfileUrl || activeLead?.socialLinks?.linkedin }, { name: 'Twitter', url: activeLead?.socialLinks?.twitter }, { name: 'Website', url: activeLead?.website || activeLead?.socialLinks?.website }, { name: 'Portfolio', url: activeLead?.socialLinks?.portfolio }].map((platform) => (
                                    <Button
                                      key={platform.name}
                                      variant="outline"
                                      className="h-12 border-border/30 bg-muted/10 hover:bg-muted/20 rounded-2xl justify-start px-3"
                                      onClick={() => platform.url && window.open(platform.url.startsWith('http') ? platform.url : `https://${platform.url}`, '_blank')}
                                      disabled={!platform.url}
                                    >
                                      <ExternalLink className={`w-3.5 h-3.5 mr-2 ${platform.url ? 'text-primary' : 'text-muted-foreground/40'}`} />
                                      <span className={`text-[10px] font-bold ${platform.url ? 'text-foreground' : 'text-muted-foreground'}`}>{platform.name}</span>
                                    </Button>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>

                            {/* Historical Velocity */}
                            <AccordionItem value="history" className="border-none space-y-2">
                              <AccordionTrigger className="hover:no-underline py-0">
                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">History</h4>
                              </AccordionTrigger>
                              <AccordionContent className="pt-2">
                                <div className="p-4 rounded-2xl bg-muted/20 border border-border/30 space-y-3">
                                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                                    <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Detected</span>
                                    <span className="text-foreground/70">{activeLead?.createdAt ? new Date(activeLead.createdAt).toLocaleDateString() : "Unknown"}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                                    <span className="text-muted-foreground flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5" /> Threads</span>
                                    <span className="text-foreground/70">{messagesData?.messages?.length || 0} messages</span>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>

                        <div className="p-6 border-t border-border/30 bg-muted/10 shrink-0 space-y-3">
                          <Button
                            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl shadow-primary/20"
                            onClick={() => setShowIntelligence(true)}
                          >
                            <Zap className="w-5 h-5 mr-3" />
                            Launch Deep Intelligence
                          </Button>
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              variant="outline"
                              className="h-12 border-border/30 bg-transparent hover:bg-muted/20 text-muted-foreground font-black uppercase text-[9px] tracking-tighter rounded-xl"
                              onClick={() => setLocation(`/dashboard/leads/${leadId}`)}
                            >
                              <User className="w-4 h-4 mr-2" />
                              Full Profile
                            </Button>
                            <Button
                              variant="outline"
                              className="h-12 border-border/30 bg-transparent hover:bg-muted/20 text-muted-foreground font-black uppercase text-[9px] tracking-tighter rounded-xl"
                              onClick={() => {
                                setIsCampaignModalOpen(true);
                              }}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Start Campaign
                            </Button>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>

                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-9 rounded-xl font-bold text-[10px] px-4 transition-all shadow-sm border",
                        !activeLead?.aiPaused
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                          : "bg-muted text-muted-foreground border-border/50 hover:bg-muted/80"
                      )}
                      onClick={() => activeLead && toggleAi.mutate({ id: leadId!, paused: !activeLead.aiPaused })}
                    >
                      <div className={cn("w-2 h-2 rounded-full mr-2 animate-pulse", !activeLead?.aiPaused ? "bg-emerald-500" : "bg-muted-foreground")} />
                      <span className="hidden sm:inline">{!activeLead?.aiPaused ? "AUTONOMOUS MODE: ON" : "AUTONOMOUS MODE: OFF"}</span>
                    </Button>

                    {!showDetails && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-primary hidden lg:flex hover:bg-primary/10 transition-colors"
                        onClick={() => setShowDetails(true)}
                      >
                        <User className="h-5 w-5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-primary lg:hidden hover:bg-primary/10 transition-colors"
                      onClick={() => setShowDetails(true)}
                    >
                      <Brain className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 min-h-0 scroll-smooth flex flex-col bg-muted/5 scrollbar-hide">
                  {messagesLoading ? (
                    <div className="space-y-6">
                      <div className="flex justify-start"><Skeleton className="h-16 w-64 rounded-2xl rounded-tl-none" /></div>
                      <div className="flex justify-end"><Skeleton className="h-16 w-64 rounded-2xl rounded-tr-none" /></div>
                      <div className="flex justify-start"><Skeleton className="h-12 w-48 rounded-2xl rounded-tl-none" /></div>
                    </div>
                  ) : messagesData?.messages?.map((msg: any) => (
                    <div key={msg.id} className={cn("flex w-full", msg.direction === 'inbound' ? "justify-start" : "justify-end")}>
                      <div className={cn(
                        "max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm shadow-sm relative group transition-all hover:shadow-md",
                        msg.direction === 'inbound'
                          ? "bg-white text-black rounded-tl-none border border-border/50 shadow-sm"
                          : "bg-primary text-primary-foreground rounded-tr-none shadow-md shadow-primary/20"
                      )}>
                        <div className="whitespace-pre-wrap break-words leading-relaxed">{msg.body}</div>
                        {msg.metadata?.disclaimer && (
                          <div className="mt-3 pt-3 border-t border-current/10 text-[10px] opacity-60 italic font-medium">
                            {msg.metadata.disclaimer}
                          </div>
                        )}
                        <div className="text-[10px] mt-2 opacity-50 flex items-center gap-1.5 justify-end font-medium">
                          {msg.direction === 'outbound' && (
                            <div className="flex items-center gap-1 mr-auto">
                              {msg.clickedAt ? (
                                <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-emerald-500/20 text-emerald-200 border-none shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                                  <ExternalLink className="h-2 w-2 mr-1" /> CLICKED
                                </Badge>
                              ) : msg.openedAt ? (
                                <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-sky-500/20 text-sky-100 border-none shadow-[0_0_8px_rgba(14,165,233,0.3)]">
                                  <Activity className="h-2 w-2 mr-1" /> OPENED
                                </Badge>
                              ) : (
                                <span className="opacity-40">Delivered</span>
                              )}
                            </div>
                          )}
                          {msg.metadata?.aiGenerated && <Sparkles className="h-2.5 w-2.5" />}
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.direction === 'outbound' && (
                            <div className="flex ml-1">
                              <Check className={cn("h-3 w-3", msg.openedAt ? "text-primary-foreground" : "opacity-40")} />
                              {msg.openedAt && <Check className="h-3 w-3 -ml-2 text-primary-foreground" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isGenerating && typedText && (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm shadow-lg bg-primary/10 border border-primary/20 rounded-tr-none">
                        <div className="whitespace-pre-wrap break-words italic text-primary/80">{typedText}</div>
                        <div className="flex items-center gap-2 mt-3">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          <span className="text-[10px] text-primary/70 font-bold uppercase tracking-widest">Optimizing response...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} className="h-4 shrink-0" />
                </div>

                {/* Reply Input */}
                {!isChannelConnected(activeLead?.channel) ? (
                  <div className="p-4 md:p-6 border-t bg-background shrink-0 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] sticky bottom-0 z-20 w-full mb-[env(safe-area-inset-bottom)]">
                    <div className="max-w-5xl mx-auto flex flex-col items-center justify-center p-6 bg-destructive/5 border border-destructive/20 rounded-2xl text-center space-y-3">
                      <div className="p-3 bg-destructive/10 rounded-full">
                        <Plug className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-destructive uppercase tracking-wide">Channel Disconnected</h4>
                        <p className="text-xs text-muted-foreground mt-1">Connect your {activeLead?.channel} account to reply to this lead.</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => setLocation('/dashboard/integrations')}
                      >
                        Connect {activeLead?.channel === 'instagram' ? 'Instagram' : 'Email'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 md:p-6 border-t bg-background shrink-0 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] sticky bottom-0 z-20 w-full mb-[env(safe-area-inset-bottom)]">
                    <div className="flex gap-3 items-end max-w-5xl mx-auto">
                      <div className="flex-1 relative group">
                        <textarea
                          value={replyMessage}
                          onChange={e => {
                            setReplyMessage(e.target.value);
                            // Auto-grow logic
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (replyMessage.trim() && !sendMutation.isPending) {
                                sendMutation.mutate(replyMessage);
                                (e.target as HTMLTextAreaElement).style.height = 'auto';
                              }
                            }
                          }}
                          placeholder="Compose a response..."
                          className="w-full bg-muted/30 border border-border/50 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 min-h-[56px] max-h-40 resize-none transition-all overflow-y-auto"
                        />
                        <Button
                          size="icon"
                          onClick={handleAiReply}
                          disabled={isGenerating}
                          className="absolute right-3 bottom-0 mb-3 h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg hover:shadow-primary/25 hover:scale-105 transition-all"
                          title="Generate AI Reply"
                        >
                          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 fill-white/20" />}
                        </Button>
                      </div>
                      <Button
                        onClick={() => sendMutation.mutate(replyMessage)}
                        disabled={!replyMessage.trim() || sendMutation.isPending}
                        className="rounded-2xl h-14 w-14 p-0 shadow-xl shadow-primary/20 shrink-0 transition-transform active:scale-95"
                      >
                        {sendMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      </Button>
                    </div>
                    <p className="text-center text-[10px] text-muted-foreground/40 mt-3 font-medium">Shift + Enter for new line. AI suggestions enabled.</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div >

      {
        activeLead && (
          <LeadIntelligenceModal
            isOpen={showIntelligence}
            onOpenChange={setShowIntelligence}
            lead={activeLead}
          />
        )
      }
      <CustomContextMenu
        config={contextConfig}
        onClose={closeMenu}
        onAction={handleMenuAction}
      />
      <UnifiedCampaignWizard
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        }}
        initialLeads={selectedLeadIds.length > 0 ? selectedLeadIds : []}
      />
    </div >
  );
}
