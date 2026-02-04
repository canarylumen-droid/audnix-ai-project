
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtime } from "@/hooks/use-realtime";
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
  Brain
} from "lucide-react";

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
  const [allLeads, setAllLeads] = useState<any[]>([]);

  // Message Thread State
  const [replyMessage, setReplyMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [showIntelligence, setShowIntelligence] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { contextConfig, handleContextMenu, closeMenu } = useContextMenu();



  const { data: user } = useQuery<{ id: string }>({ queryKey: ["/api/user/profile"] });
  // useRealtime(user?.id); // Replacing with direct socket implementation

  useEffect(() => {
    if (!user?.id) return;

    const socket = io({
      path: '/socket.io',
      query: { userId: user.id }
    });

    const handleMessageUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      if (leadId) {
        queryClient.invalidateQueries({ queryKey: ["/api/messages", leadId] });
      }
    };

    socket.on('messages_updated', handleMessageUpdate);
    socket.on('leads_updated', handleMessageUpdate);

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
          if (!newLeads.find(l => l.id === lead.id)) {
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
      return matchesSearch && matchesChannel;
    });
  }, [allLeads, searchQuery, filterChannel]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => apiRequest("POST", `/api/messages/${leadId}`, { content, channel: activeLead?.channel }),
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
      const aiSuggestion = data.aiSuggestion || "";

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

  const ChannelIcon = activeLead ? (channelIcons[activeLead.channel as keyof typeof channelIcons] || Mail) : Mail;

  return (
    <div className="flex h-[calc(100dvh-80px)] md:h-[calc(100dvh-64px)] -m-6 md:-m-8 lg:-m-10 overflow-hidden bg-background flex-col md:flex-row w-full relative">
      {/* Lead List Pane */}
      <div className={cn(
        "w-full md:w-80 lg:w-[400px] border-r flex flex-col transition-all shrink-0 h-full bg-background z-20",
        leadId && "hidden md:flex"
      )}>
        <div className="p-4 border-b space-y-4 shrink-0">
          <div className="flex items-center justify-between md:hidden mb-2">
            <h2 className="text-lg font-bold">Inbox</h2>
            <Button variant="ghost" size="icon" onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4" /></Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              className="pl-9 h-10 rounded-xl bg-muted/50 border-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Button variant="ghost" size="sm" onClick={() => setFilterChannel("all")} className={cn("h-7 text-[10px] uppercase tracking-widest shrink-0", filterChannel === 'all' && "bg-primary/10 text-primary")}>All</Button>
            <Button variant="ghost" size="sm" onClick={() => setFilterChannel("instagram")} className={cn("h-7 text-[10px] uppercase tracking-widest shrink-0", filterChannel === 'instagram' && "bg-primary/10 text-primary")}>IG</Button>
            <Button variant="ghost" size="sm" onClick={() => setFilterChannel("email")} className={cn("h-7 text-[10px] uppercase tracking-widest shrink-0", filterChannel === 'email' && "bg-primary/10 text-primary")}>Email</Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border/10">
          {leadsLoading && page === 0 ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : (
            <>
              {filteredLeads.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => setLocation(`/dashboard/inbox/${lead.id}`)}
                  onContextMenu={(e) => handleContextMenu(e, 'inbox', lead)}
                  className={cn(
                    "p-4 cursor-pointer hover:bg-muted/50 transition-all border-b border-border/5 group relative",
                    leadId === lead.id ? "bg-primary/5 shadow-[inset_3px_0_0_0_hsl(var(--primary))]" : "hover:pl-5",
                    lead.metadata?.isUnread && "font-semibold bg-muted/20"
                  )}
                >
                  <div className="flex gap-3 items-center">
                    <Avatar className="h-10 w-10 border border-border/20 shadow-sm transition-transform group-hover:scale-105">
                      <AvatarFallback className={cn(
                        "font-bold text-xs",
                        lead.id === leadId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>{lead.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold truncate text-foreground/90">{lead.name}</span>
                        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1">
                          {lead.channel === 'instagram' ? <Instagram className="h-3 w-3 opacity-70" /> : <Mail className="h-3 w-3 opacity-70" />}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground/80 truncate font-medium group-hover:text-primary/80 transition-colors">
                        {lead.metadata?.isUnread && <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />}
                        {lead.lastMessageSnippet || <span>No messages yet</span>}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {leadsData?.hasMore && (
                <div className="p-4">
                  <Button 
                    variant="ghost" 
                    className="w-full text-xs font-bold uppercase tracking-widest text-primary"
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
      <div className={cn("flex-1 flex flex-col bg-card/30 z-10", !leadId && "hidden md:flex items-center justify-center")}>
        {!leadId ? (
          <EmptyState icon={InboxIcon} title="Select a conversation" description="Choose a lead from the list to start chatting." />
        ) : (
          <div className="flex flex-1 overflow-hidden relative">
            <div className="flex-1 flex flex-col border-r h-full overflow-hidden">
              {/* Thread Header */}
              <div className="h-16 border-b flex items-center px-4 md:px-6 justify-between bg-background/50 backdrop-blur-md shrink-0 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setLocation('/dashboard/inbox')}><X className="h-4 w-4" /></Button>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback>{activeLead?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold truncate">{activeLead?.name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">{activeLead?.status}</p>
                      <ChannelIcon className="h-2 w-2 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[10px] hidden sm:block">{activeLead?.score || 0}% INTENT</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full border-primary/20 text-primary font-bold text-[10px]"
                    onClick={() => {
                      if (activeLead) {
                        toggleAi.mutate({ id: leadId!, paused: !activeLead.aiPaused });
                      }
                    }}
                  >
                    {activeLead?.aiPaused ? <Play className="h-3 w-3 sm:mr-1 fill-primary" /> : <Pause className="h-3 w-3 sm:mr-1 fill-primary" />}
                    <span className="hidden sm:inline">{activeLead?.aiPaused ? "RESUME AI" : "PAUSE AI"}</span>
                  </Button>
                  <Button
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-primary lg:hidden"
                    onClick={() => setShowIntelligence(true)}
                  >
                    <Brain className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 min-h-0 scroll-smooth flex flex-col">
                {messagesLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-48 rounded-2xl" />
                    <Skeleton className="h-10 w-48 ml-auto rounded-2xl" />
                  </div>
                ) : messagesData?.messages?.map((msg: any) => (
                  <div key={msg.id} className={cn("flex w-full mb-4", msg.direction === 'inbound' ? "justify-start" : "justify-end")}>
                    <div className={cn(
                      "max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl text-sm shadow-sm relative group",
                      msg.direction === 'inbound' ? "bg-muted text-foreground rounded-tl-none" : "bg-primary text-primary-foreground rounded-tr-none"
                    )}>
                      <div className="whitespace-pre-wrap break-words">{msg.body}</div>
                      {msg.metadata?.disclaimer && (
                        <div className="mt-2 pt-2 border-t border-current/10 text-[10px] opacity-70 italic">
                          {msg.metadata.disclaimer}
                        </div>
                      )}
                      <div className="text-[9px] mt-1 opacity-50 flex items-center gap-1 justify-end">
                        {msg.metadata?.aiGenerated && <Sparkles className="h-2 w-2" />}
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {isGenerating && typedText && (
                  <div className="flex justify-end mb-4">
                    <div className="max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl text-sm shadow-sm bg-primary/10 border border-primary/20 rounded-tr-none">
                      <div className="whitespace-pre-wrap break-words">{typedText}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        <span className="text-[10px] text-primary/70 font-bold uppercase tracking-widest">Generating neural response...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-4 shrink-0" />
              </div>

              {/* Reply Input */}
              <div className="p-4 border-t bg-background/80 backdrop-blur-md shrink-0">
                <div className="flex gap-2 items-end max-w-4xl mx-auto">
                  <div className="flex-1 relative">
                    <textarea
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (replyMessage.trim() && !sendMutation.isPending) sendMutation.mutate(replyMessage);
                        }
                      }}
                      placeholder="Type your message..."
                      className="w-full bg-muted/50 border-none rounded-2xl p-3 md:p-4 text-sm focus:ring-1 focus:ring-primary min-h-[44px] max-h-32 resize-none transition-all"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleAiReply}
                      disabled={isGenerating}
                      className="absolute right-2 bottom-2 text-primary hover:bg-primary/10 h-8 w-8"
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={() => sendMutation.mutate(replyMessage)}
                    disabled={!replyMessage.trim() || sendMutation.isPending}
                    className="rounded-2xl h-11 w-11 md:h-12 md:w-12 p-0 shadow-lg shadow-primary/20 shrink-0"
                  >
                    {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Lead Details Sidebar */}
            <div className="w-80 hidden lg:flex flex-col shrink-0 bg-card/50 backdrop-blur-xl border-l overflow-y-auto">
              <div className="p-6 space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Neural Profile</h3>
                    <Badge variant="outline" className="text-[9px] font-bold border-primary/20 text-primary bg-primary/5 px-2">SYNCED</Badge>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Intent Probability</p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-black tracking-tighter text-primary">{activeLead?.score || 0}%</span>
                          <Activity className="h-4 w-4 text-primary animate-pulse" />
                        </div>
                        <div className="bg-muted/50 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${activeLead?.score || 0}%` }}
                            className="bg-primary h-full rounded-full"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Neural Tags</p>
                      {activeLead?.tags?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {activeLead.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-[9px] px-2 py-0.5 bg-primary/5 text-primary border-primary/10 font-bold uppercase tracking-wider">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/50 italic">
                          <Target className="h-3 w-3" />
                          No tags mapped
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t border-border/50 space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-muted-foreground/60 flex items-center gap-2">
                          <Clock className="h-3 w-3" /> Origin
                        </span>
                        <span className="text-foreground/80">{activeLead?.createdAt ? new Date(activeLead.createdAt).toLocaleDateString() : "Unknown"}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-muted-foreground/60 flex items-center gap-2">
                          <MessageSquare className="h-3 w-3" /> Engagement
                        </span>
                        <span className="text-foreground/80">{messagesData?.messages?.length || 0} Nodes</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.15em] rounded-2xl h-12 text-[10px] shadow-lg shadow-primary/20"
                    onClick={() => setShowIntelligence(true)}
                  >
                    <Brain className="h-4 w-4 mr-2" /> Analysis Matrix
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full font-black uppercase tracking-[0.15em] rounded-2xl h-12 text-[10px] border-border/50 hover:bg-muted/50"
                    onClick={() => bookCallMutation.mutate()}
                    disabled={bookCallMutation.isPending}
                  >
                    {bookCallMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />} 
                    Execute Booking
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
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
