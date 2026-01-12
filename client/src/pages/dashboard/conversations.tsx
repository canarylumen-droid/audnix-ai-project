import { useState, useEffect, useRef, useCallback } from "react";
import { CustomContextMenu, useContextMenu } from "@/components/ui/interactive/CustomContextMenu";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Instagram,
  Mail,
  Send,
  Sparkles,
  MoreVertical,
  Clock,
  Loader2,
  MessageSquare,
  Calendar,
  X,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/use-realtime";
import { LeadIntelligenceModal } from "@/components/dashboard/LeadIntelligenceModal";

interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  channel: string;
  status: string;
  score?: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface Message {
  id: string;
  content: string;
  sender: "user" | "lead";
  timestamp: string;
  channel?: string;
}

interface LeadResponse {
  lead?: Lead;
  id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  channel?: string;
  status?: string;
  score?: number;
  tags?: string[];
  createdAt?: string;
}

interface MessagesResponse {
  messages: Message[];
}

const channelIcons = {
  instagram: Instagram,
  email: Mail,
};

export default function ConversationsPage() {
  const params = useParams();
  const leadId = params.id;
  const [message, setMessage] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("instagram");
  const [isGenerating, setIsGenerating] = useState(false);
  const [typedText, setTypedText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [messageOffset, setMessageOffset] = useState(0);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const { contextConfig, handleContextMenu, closeMenu } = useContextMenu();

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
      toast({ title: "Marked as Unread", description: "Action simulated for UI demo" });
    }
  }, [toast]);

  // Get user for real-time subscriptions
  const { data: user } = useQuery({
    queryKey: ["/api/user/profile"],
    retry: false,
  });
  useRealtime(user?.id);

  // Fetch lead details
  const { data: lead, isLoading: leadLoading } = useQuery<LeadResponse>({
    queryKey: ["/api/leads", leadId],
    enabled: !!leadId,
    retry: false,
  });

  // Fetch messages for this lead with pagination
  const { data: messagesData, isLoading: messagesLoading } = useQuery<MessagesResponse>({
    queryKey: ["/api/messages", leadId, { limit: 100, offset: messageOffset }],
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
    enabled: !!leadId,
    retry: false,
  });

  // Accumulate messages as user loads more
  useEffect(() => {
    if (messagesData?.messages) {
      if (messageOffset === 0) {
        setAllMessages(messagesData.messages);
      } else {
        setAllMessages(prev => [...prev, ...messagesData.messages]);
      }
    }
  }, [messagesData, messageOffset]);

  const messages = allMessages;

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/messages/${leadId}`, { content, channel: selectedChannel });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", leadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleGenerateReply = async () => {
    if (!leadId) return;

    setIsGenerating(true);
    setTypedText("");

    try {
      const response = await apiRequest("POST", `/api/ai/reply/${leadId}`);
      const data = await response.json();
      const aiResponse = data.aiSuggestion || data.message?.body || "I'm ready to help you with that.";

      // Typewriter effect
      let index = 0;
      const interval = setInterval(() => {
        if (index < aiResponse.length) {
          setTypedText(aiResponse.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setMessage(aiResponse);
          setIsGenerating(false);
        }
      }, 20);
    } catch (err) {
      console.error("AI Reply Error:", err);
      toast({
        title: "AI Brain Latency",
        description: "The neural core took too long to respond. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  const handleSendMessage = () => {
    if (message.trim() && leadId) {
      sendMutation.mutate(message);
    }
  };

  const bookCallMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/ai/calendar/${leadId}`, { sendMessage: true });
    },
    onSuccess: () => {
      toast({
        title: "Booking link sent!",
        description: `Calendar invite sent to ${lead?.name || lead?.lead?.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages", leadId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send booking link",
        variant: "destructive",
      });
    },
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!leadId) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">You don't have any activity yet</h2>
          <p className="text-muted-foreground mb-4">
            Connect your accounts to start receiving leads and conversations will appear here in real-time
          </p>
          <Button asChild>
            <a href="/dashboard/integrations">Connect Accounts</a>
          </Button>
        </div>
      </div>
    );
  }

  if (leadLoading || messagesLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Lead not found</h2>
          <p className="text-muted-foreground">
            This lead may have been removed or doesn't exist
          </p>
        </div>
      </div>
    );
  }

  const ChannelIcon = channelIcons[lead.channel as keyof typeof channelIcons] || Mail;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-10rem)] -m-6 md:-m-8 lg:-m-10 bg-background">
      {/* Leads Sidebar */}
      <div className={`${selectedLead ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r bg-card flex-col`}>
        {/* This is a placeholder for the leads list. In a real app, this would fetch and display leads. */}
        <div className="p-4 border-b flex items-center gap-2">
          <Input placeholder="Search leads..." className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/leads"] })}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {/* Example Lead Item - replace with actual lead data */}
          <Card
            className={`p-3 cursor-pointer hover:bg-accent transition-all duration-200 ${selectedLead?.id === lead.id ? "bg-accent border-l-4 border-l-primary" : ""
              }`}
            onClick={() => setSelectedLead(lead)}
            onContextMenu={(e) => handleContextMenu(e, 'inbox', lead)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">{lead.name?.charAt(0) || "L"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-semibold truncate">{lead.name}</h3>
                  {lead.status === 'new' && <div className="w-2 h-2 rounded-full bg-primary mt-1" />}
                </div>
                <p className="text-xs text-muted-foreground truncate w-36">
                  Last message content...
                </p>
              </div>
            </div>
          </Card>
          {/* More lead items would go here */}
        </div>
      </div>

      {/* Conversation Area */}
      <div className={`${selectedLead ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {selectedLead ? (
          <>
            <div className="border-b p-4 flex items-center justify-between bg-card">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2"
                onClick={() => setSelectedLead(null)}
              >
                <X className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{lead.name?.charAt(0) || "L"}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold" data-testid="text-lead-name">
                    {lead.name}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ChannelIcon className="h-3 w-3" />
                    <span>{lead.channel}</span>
                    {lead.email && <span>· {lead.email}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" data-testid="badge-status">
                  {lead.status?.replace('_', ' ')}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bookCallMutation.mutate()}
                  disabled={bookCallMutation.isPending}
                  data-testid="button-book-call"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Call
                </Button>
                <Button variant="ghost" size="icon" data-testid="button-more">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No messages yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start the conversation by sending a message below
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <motion.div
                      key={msg.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      data-testid={`message-${index}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${msg.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                          }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${msg.sender === "user"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                            }`}
                        >
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}

                {isGenerating && typedText && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[70%] rounded-lg px-4 py-2 bg-primary/10 border border-primary/20">
                      <p className="text-sm">{typedText}</p>
                    </div>
                  </motion.div>
                )}

                {(messagesData?.messages?.length || 0) >= 100 && (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessageOffset(prev => prev + 100)}
                      disabled={messagesLoading}
                    >
                      {messagesLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Load Earlier Messages
                    </Button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[80px] flex-1"
                  disabled={sendMutation.isPending || isGenerating}
                  data-testid="textarea-message"
                />
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={handleGenerateReply}
                    disabled={sendMutation.isPending || isGenerating}
                    data-testid="button-ai-generate"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Reply
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMutation.isPending}
                    data-testid="button-send"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2" />
              Select a lead to start the conversation
            </div>
          </div>
        )}
      </div>

      {/* Sidebar for Lead Details (visible on larger screens) */}
      <Card className="w-80 hidden md:flex flex-col" data-testid="card-sidebar">
        <CardHeader>
          <CardTitle className="text-lg">Lead Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Score</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${lead.score || 0}%` }}
                />
              </div>
              <span className="text-sm font-medium">{lead.score || 0}%</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Tags</p>
            {lead.tags && lead.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {lead.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">History</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3 w-3" />
                <span>First contact: {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-3 w-3" />
                <span>{messages.length} messages exchanged</span>
              </div>
            </div>
          </div>
        </CardContent>
        <div className="p-4 border-t mt-auto">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg border-0 font-bold rounded-xl h-11"
            onClick={() => setShowIntelligence(true)}
          >
            <Sparkles className="h-4 w-4 mr-2" /> View Intelligence Dossier
          </Button>
        </div>
      </Card>

      {
        lead && (
          <LeadIntelligenceModal
            isOpen={showIntelligence}
            onOpenChange={setShowIntelligence}
            lead={lead}
          />
        )
      }
      <CustomContextMenu
        config={contextConfig}
        onClose={closeMenu}
        onAction={handleMenuAction}
      />
    </div >
  );
}