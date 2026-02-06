
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useParams, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LeadIntelligenceModal } from "@/components/dashboard/LeadIntelligenceModal";
import { CustomContextMenu, useContextMenu } from "@/components/ui/interactive/CustomContextMenu";
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
  ChevronLeft,
  Filter,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const channelIcons = {
  instagram: Instagram,
  email: Mail,
};

const statusStyles = {
  new: "bg-primary/20 text-primary border-primary/20",
  open: "bg-primary/10 text-primary border-primary/10",
  replied: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  converted: "bg-purple-500/10 text-purple-500 border-purple-500/20",
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

  // Message Thread State
  const [replyMessage, setReplyMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [showIntelligence, setShowIntelligence] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { contextConfig, handleContextMenu, closeMenu } = useContextMenu();

  const { data: user } = useQuery<{ id: string }>({ queryKey: ["/api/user/profile"] });

  useEffect(() => {
    if (!user?.id) return;

    const socket = io({
      path: '/socket.io',
      query: { userId: user.id }
    });

    socket.on('messages_updated', () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      if (leadId) {
        queryClient.invalidateQueries({ queryKey: ["/api/messages", leadId] });
      }
    });

    socket.on('leads_updated', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      if (data?.type === 'lead_updated' && data?.lead) {
        setAllLeads(prev => prev.map(l => l.id === data.lead.id ? data.lead : l));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, leadId, queryClient]);

  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const { data: leadsData, isLoading: leadsLoading } = useQuery<any>({
    queryKey: ["/api/leads", { limit: PAGE_SIZE, offset: page * PAGE_SIZE }],
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery<any>({
    queryKey: ["/api/messages", leadId],
    enabled: !!leadId,
  });

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

  // Handle clearing unread status when lead is selected
  useEffect(() => {
    if (leadId && activeLead?.metadata?.isUnread) {
      const { isUnread, ...restMetadata } = activeLead.metadata;
      apiRequest("PATCH", `/api/leads/${leadId}`, {
        metadata: restMetadata
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      });
    }
  }, [leadId, activeLead, queryClient]);

  const filteredLeads = useMemo(() => {
    return allLeads.filter((lead: any) => {
      const matchesSearch = !searchQuery ||
        lead.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesChannel = filterChannel === "all" || lead.channel === filterChannel;
      
      const matchesStatus = filterStatus === "all" 
          ? true 
          : filterStatus === "unread" 
            ? (lead.metadata?.isUnread || false)
            : lead.status === filterStatus;

      return matchesSearch && matchesChannel && matchesStatus;
    });
  }, [allLeads, searchQuery, filterChannel, filterStatus]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => {
      if (typeof Mail === 'undefined') {
        console.warn("Mail component not found, using fallback icon logic");
      }
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
        await apiRequest("POST", "/api/bulk/update-status", {
          leadIds: [data.id],
          status: 'cold'
        });
        toast({ title: "Thread Archived", description: "Lead has been moved to cold" });
        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      } catch (err) {
        toast({ title: "Error", description: "Failed to archive thread", variant: "destructive" });
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
    }
  }, [toast, queryClient]);

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
  }, [messagesData]);

  useEffect(() => {
    const checkMail = () => {
      try {
        // Simple check to ensure Mail is available or provide fallback
        if (typeof Mail === 'undefined') {
          console.error("Mail icon is undefined in this scope");
        }
      } catch (e) {}
    };
    checkMail();
  }, []);

  const ChannelIcon = activeLead ? (channelIcons[activeLead.channel as keyof typeof channelIcons] || Instagram) : Instagram;

  return (
    <div className="flex h-[calc(100dvh-80px)] md:h-[calc(100dvh-64px)] w-full overflow-hidden bg-background relative p-0 md:p-4 lg:p-6">
      <div className="flex w-full h-full max-w-[1600px] mx-auto bg-card/30 backdrop-blur-xl border rounded-none md:rounded-3xl overflow-hidden shadow-2xl">
        {/* Lead List Pane */}
        <div className={cn(
          "w-full md:w-80 lg:w-[350px] border-r flex flex-col transition-all shrink-0 h-full bg-background/50",
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
                    <DropdownMenuItem onClick={() => setFilterStatus("replied")} className="cursor-pointer font-medium text-emerald-500">Replied</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("warm")} className="cursor-pointer font-medium text-orange-500">Warm</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("cold")} className="cursor-pointer font-medium text-muted-foreground">Cold</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button variant="ghost" size="icon" onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4" /></Button>
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
                <div className="flex flex-col items-center justify-center p-8 text-center h-64">
                    <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                        <InboxIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No conversations found</p>
                    <p className="text-xs text-muted-foreground/50 mt-1 max-w-[200px]">Try adjusting your filters or search query.</p>
                </div>
            ) : (
              <>
                {filteredLeads.map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => setLocation(`/dashboard/inbox/${lead.id}`)}
                    onContextMenu={(e) => handleContextMenu(e, 'inbox', lead)}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-primary/5 transition-all border-b border-border/5 group relative",
                      leadId === lead.id ? "bg-primary/10" : "hover:pl-5",
                      lead.metadata?.isUnread && "bg-primary/5"
                    )}
                  >
                    {leadId === lead.id && <motion.div layoutId="activeLead" className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                    <div className="flex gap-3 items-center">
                      <Avatar className="h-12 w-12 border-2 border-background shadow-sm transition-transform group-hover:scale-105">
                        <AvatarFallback className={cn(
                          "font-bold text-sm",
                          lead.id === leadId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>{lead.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold truncate text-foreground">{lead.name}</span>
                          <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">
                            {new Date(lead.lastMessageAt || lead.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className={cn("text-xs truncate transition-colors", lead.metadata?.isUnread ? "text-foreground font-bold" : "text-muted-foreground")}>
                          {lead.lastMessageSnippet || "No messages"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                             <Badge variant="outline" className={cn("text-[9px] h-4 px-1 rounded-sm border-0 uppercase font-black tracking-wider", statusStyles[lead.status] || statusStyles.cold)}>
                                {lead.status === 'hardened' ? 'Verified' : lead.status}
                             </Badge>
                             {lead.metadata?.isUnread && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {leadsData?.hasMore && (
                  <div className="p-4">
                    <Button 
                      variant="outline" 
                      className="w-full text-xs font-bold uppercase tracking-widest rounded-xl h-10 border-dashed"
                      onClick={() => setPage(p => p + 1)}
                      disabled={leadsLoading}
                    >
                      {leadsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Load More"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Message Thread Pane */}
        <div className={cn("flex-1 flex flex-col bg-background/30", !leadId && "hidden md:flex items-center justify-center")}>
          {!leadId ? (
            <div className="text-center space-y-4 max-w-sm px-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <InboxIcon className="h-10 w-10 text-primary opacity-50" />
              </div>
              <h2 className="text-xl font-bold">Select a conversation</h2>
              <p className="text-sm text-muted-foreground">Pick a lead from the list to start the automated engagement flow or reply manually.</p>
            </div>
          ) : (
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 flex flex-col h-full min-w-0">
                {/* Thread Header */}
                <div className="h-16 md:h-20 border-b flex items-center px-4 md:px-8 justify-between bg-background/50 backdrop-blur-md shrink-0">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Back Button for Mobile */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="shrink-0 md:hidden -ml-2" 
                        onClick={() => setLocation('/dashboard/inbox')}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    
                    <Avatar className="h-10 w-10 shrink-0 border-2 border-background shadow-sm">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{activeLead?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold truncate leading-none mb-1">{activeLead?.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">{activeLead?.status === 'hardened' ? 'Verified' : activeLead?.status}</span>
                        <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        <ChannelIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[10px] hidden lg:block px-3 py-1 uppercase tracking-tighter">{activeLead?.score || 0}% Engagement Score</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl border-primary/20 text-primary font-bold text-[10px] px-4 hover:bg-primary hover:text-primary-foreground transition-all"
                      onClick={() => activeLead && toggleAi.mutate({ id: leadId!, paused: !activeLead.aiPaused })}
                    >
                      {activeLead?.aiPaused ? <Play className="h-3 w-3 mr-2 fill-current" /> : <Pause className="h-3 w-3 mr-2 fill-current" />}
                      <span className="hidden sm:inline">{activeLead?.aiPaused ? "RESUME AUTOMATION" : "PAUSE AI"}</span>
                    </Button>
                    <Button
                      variant="ghost" 
                      size="icon"
                      className="h-10 w-10 text-primary lg:hidden hover:bg-primary/10"
                      onClick={() => setShowIntelligence(true)}
                    >
                      <Brain className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 min-h-0 scroll-smooth flex flex-col bg-muted/5">
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
                          ? "bg-card text-foreground rounded-tl-none border border-border/50" 
                          : "bg-primary text-primary-foreground rounded-tr-none shadow-primary/20"
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
                              {msg.openedAt ? (
                                <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-primary-foreground/10 text-primary-foreground border-none">
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
                <div className="p-4 md:p-6 border-t bg-background/80 backdrop-blur-md shrink-0">
                  <div className="flex gap-3 items-end max-w-5xl mx-auto">
                    <div className="flex-1 relative group">
                      <textarea
                        value={replyMessage}
                        onChange={e => setReplyMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (replyMessage.trim() && !sendMutation.isPending) sendMutation.mutate(replyMessage);
                          }
                        }}
                        placeholder="Compose a response..."
                        className="w-full bg-muted/30 border border-border/50 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 min-h-[56px] max-h-40 resize-none transition-all"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleAiReply}
                        disabled={isGenerating}
                        className="absolute right-3 bottom-3 text-primary hover:bg-primary/10 h-10 w-10 rounded-xl"
                      >
                        {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
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
              </div>

              {/* Lead Details Sidebar */}
              <div className="w-80 hidden lg:flex flex-col shrink-0 bg-background/50 backdrop-blur-3xl border-l overflow-y-auto">
                <div className="p-8 space-y-10">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Lead Profile</h3>
                      <Badge variant="outline" className="text-[9px] font-bold border-emerald-500/20 text-emerald-500 bg-emerald-500/5 px-2">ACTIVE</Badge>
                    </div>
                    
                    <div className="space-y-8">
                      <div className="p-6 rounded-3xl bg-muted/20 border border-border/50 shadow-inner">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Intent Probability</p>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-3xl font-black tracking-tighter text-primary">{activeLead?.score || 0}%</span>
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Activity className="h-4 w-4 text-primary animate-pulse" />
                            </div>
                          </div>
                          <div className="bg-muted/50 rounded-full h-2 overflow-hidden shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${activeLead?.score || 0}%` }}
                              className="bg-primary h-full rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Profile Tags</p>
                        {activeLead?.tags?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {/* Tags display implementation */}
                            {activeLead.tags.map(tag => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground/40 italic py-4 border border-dashed rounded-2xl justify-center">
                            No tags mapped
                          </div>
                        )}
                      </div>

                      <div className="pt-8 border-t border-border/30 space-y-5">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                          <span className="text-muted-foreground/50 flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" /> Found On
                          </span>
                          <span className="text-foreground/70">{activeLead?.createdAt ? new Date(activeLead.createdAt).toLocaleDateString() : "Unknown"}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                          <span className="text-muted-foreground/50 flex items-center gap-2">
                            <MessageSquare className="h-3.5 w-3.5" /> Total Messages
                          </span>
                          <span className="text-foreground/70">{messagesData?.messages?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest rounded-2xl h-14 text-[11px] shadow-xl shadow-primary/20"
                      onClick={() => setShowIntelligence(true)}
                    >
                      <Brain className="h-5 w-5 mr-3" /> Analyze Lead
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full font-bold uppercase tracking-widest rounded-2xl h-14 text-[11px] border-border/50 hover:bg-muted/50 transition-colors"
                      onClick={() => bookCallMutation.mutate()}
                      disabled={bookCallMutation.isPending}
                    >
                      {bookCallMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Calendar className="h-5 w-5 mr-3" />} 
                      Book Meeting
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full font-bold uppercase tracking-widest rounded-2xl h-14 text-[11px] border-border/50 hover:bg-muted/50 transition-colors"
                      onClick={() => setLocation(`/dashboard/leads/${leadId}`)}
                    >
                      <User className="h-5 w-5 mr-3" /> View Full Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeLead && (
        <LeadIntelligenceModal
          isOpen={showIntelligence}
          onOpenChange={setShowIntelligence}
          lead={activeLead}
        />
      )}
      <CustomContextMenu
        config={contextConfig}
        onClose={closeMenu}
        onAction={handleMenuAction}
      />
    </div>
  );
}
