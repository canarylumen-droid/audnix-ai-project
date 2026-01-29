
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Activity
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
  useRealtime(user?.id);

  const { data: leadsData, isLoading: leadsLoading } = useQuery<any>({
    queryKey: ["/api/leads", { limit: 50, offset: 0 }],
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery<any>({
    queryKey: ["/api/messages", leadId],
    enabled: !!leadId,
  });

  const activeLead = useMemo(() => 
    leadsData?.leads?.find((l: any) => l.id === leadId),
    [leadsData, leadId]
  );

  useEffect(() => {
    if (leadsData?.leads) setAllLeads(leadsData.leads);
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
    <div className="flex h-[calc(100vh-8rem)] -m-6 md:-m-8 lg:-m-10 overflow-hidden bg-background">
      {/* Lead List Pane */}
      <div className={cn("w-full md:w-80 border-r flex flex-col transition-all", leadId && "hidden md:flex")}>
        <div className="p-4 border-b space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search leads..." 
              className="pl-9 h-10 rounded-xl bg-muted/50 border-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <Button variant="ghost" size="sm" onClick={() => setFilterChannel("all")} className={cn("h-7 text-[10px] uppercase tracking-widest", filterChannel === 'all' && "bg-primary/10 text-primary")}>All</Button>
             <Button variant="ghost" size="sm" onClick={() => setFilterChannel("instagram")} className={cn("h-7 text-[10px] uppercase tracking-widest", filterChannel === 'instagram' && "bg-primary/10 text-primary")}>IG</Button>
             <Button variant="ghost" size="sm" onClick={() => setFilterChannel("email")} className={cn("h-7 text-[10px] uppercase tracking-widest", filterChannel === 'email' && "bg-primary/10 text-primary")}>Email</Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border/10">
          {leadsLoading ? (
            <div className="p-4 space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : filteredLeads.map(lead => (
            <div 
              key={lead.id}
              onClick={() => setLocation(`/dashboard/inbox/${lead.id}`)}
              onContextMenu={(e) => handleContextMenu(e, 'inbox', lead)}
              className={cn(
                "p-4 cursor-pointer hover:bg-muted/30 transition-all border-l-2 border-transparent",
                leadId === lead.id && "bg-primary/5 border-l-primary",
                lead.metadata?.isUnread && "bg-primary/5 border-l-primary"
              )}
            >
              <div className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{lead.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold truncate">{lead.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {lead.channel === 'instagram' ? <Instagram className="h-3 w-3"/> : <Mail className="h-3 w-3"/>}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{lead.lastMessageSnippet || "No messages yet"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Thread Pane */}
      <div className={cn("flex-1 flex flex-col bg-card/30", !leadId && "hidden md:flex items-center justify-center")}>
        {!leadId ? (
          <EmptyState icon={InboxIcon} title="Select a conversation" description="Choose a lead from the list to start chatting." />
        ) : (
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col border-r">
              {/* Thread Header */}
              <div className="h-16 border-b flex items-center px-6 justify-between bg-background/50 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setLocation('/dashboard/inbox')}><Check className="h-4 w-4 rotate-180"/></Button>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{activeLead?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-bold">{activeLead?.name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{activeLead?.status}</p>
                      <ChannelIcon className="h-2 w-2 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-full border-primary/20 text-primary font-bold text-[10px]"
                    onClick={() => toggleAi.mutate({ id: leadId, paused: !activeLead?.aiPaused })}
                  >
                    {activeLead?.aiPaused ? <><Play className="h-3 w-3 mr-1 fill-primary"/> RESUME AI</> : <><Pause className="h-3 w-3 mr-1 fill-primary"/> PAUSE AI</>}
                  </Button>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[10px]">{activeLead?.score || 0}% INTENT</Badge>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                     <Skeleton className="h-10 w-48 rounded-2xl" />
                     <Skeleton className="h-10 w-48 ml-auto rounded-2xl" />
                  </div>
                ) : messagesData?.messages?.map((msg: any) => (
                  <div key={msg.id} className={cn("flex", msg.direction === 'inbound' ? "justify-start" : "justify-end")}>
                    <div className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
                      msg.direction === 'inbound' ? "bg-muted" : "bg-primary text-primary-foreground"
                    )}>
                      {msg.body}
                      {msg.metadata?.disclaimer && (
                        <div className="mt-2 pt-2 border-t border-primary-foreground/20 italic text-[10px] opacity-70">
                          {msg.metadata.disclaimer}
                        </div>
                      )}
                      <div className="text-[9px] mt-1 opacity-50 flex items-center gap-1">
                         {msg.metadata?.aiGenerated && <Sparkles className="h-2 w-2"/>}
                         {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {isGenerating && typedText && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] p-3 rounded-2xl text-sm shadow-sm bg-primary/10 border border-primary/20">
                      {typedText}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <div className="p-4 border-t bg-background/50">
                <div className="flex gap-2 items-end max-w-4xl mx-auto">
                  <div className="flex-1 relative">
                    <textarea
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (replyMessage.trim()) sendMutation.mutate(replyMessage);
                        }
                      }}
                      placeholder="Type your message..."
                      className="w-full bg-muted/50 border-none rounded-2xl p-3 text-sm focus:ring-1 focus:ring-primary min-h-[44px] max-h-32 resize-none"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleAiReply}
                      disabled={isGenerating}
                      className="absolute right-2 bottom-2 text-primary hover:bg-primary/10"
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
                    </Button>
                  </div>
                  <Button 
                    onClick={() => sendMutation.mutate(replyMessage)} 
                    disabled={!replyMessage.trim() || sendMutation.isPending}
                    className="rounded-2xl h-11 w-11 p-0 shadow-lg shadow-primary/20"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Lead Details Sidebar (from ConversationsPage) */}
            <div className="w-80 hidden lg:flex flex-col shrink-0 bg-card overflow-y-auto">
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Lead Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Score</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${activeLead?.score || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold">{activeLead?.score || 0}%</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Tags</p>
                      {activeLead?.tags?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {activeLead.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No tags</p>
                      )}
                    </div>

                    <div className="pt-4 border-t space-y-3">
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>First contact: {activeLead?.createdAt ? new Date(activeLead.createdAt).toLocaleDateString() : "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{messagesData?.messages?.length || 0} messages exchanged</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-10 text-xs"
                    onClick={() => setShowIntelligence(true)}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-2" /> View Lead Overview
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full font-bold rounded-xl h-10 text-xs"
                    onClick={() => bookCallMutation.mutate()}
                    disabled={bookCallMutation.isPending}
                  >
                    <Calendar className="h-3.5 w-3.5 mr-2" /> Book Call
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
