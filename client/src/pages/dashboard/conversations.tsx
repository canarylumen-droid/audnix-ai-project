import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Instagram,
  Mail,
  Send,
  Sparkles,
  Paperclip,
  Mic,
  MoreVertical,
  Clock,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const channelIcons = {
  instagram: Instagram,
  whatsapp: SiWhatsapp,
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

  // Fetch lead details
  const { data: lead, isLoading: leadLoading } = useQuery({
    queryKey: ["/api/leads", leadId],
    enabled: !!leadId,
    retry: false,
  });

  // Fetch messages for this lead with aggressive real-time updates
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages", leadId],
    refetchInterval: 3000, // Refresh every 3 seconds for instant feel
    refetchOnWindowFocus: true,
    enabled: !!leadId,
    retry: false,
  });

  const messages = messagesData?.messages || [];

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/messages/${leadId}`, {
        method: "POST",
        body: JSON.stringify({ content, channel: selectedChannel }),
      });
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
    setIsGenerating(true);
    setTypedText("");

    const aiResponse =
      "Thanks for your interest! I'd love to help you get started. Let me know what questions you have and I'll be happy to walk you through everything.";

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
  };

  const handleSendMessage = () => {
    if (message.trim() && leadId) {
      sendMutation.mutate(message);
    }
  };

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
    <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col">
      {/* Lead Header */}
      <Card className="mb-4" data-testid="card-lead-header">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
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
              <Button variant="ghost" size="icon" data-testid="button-more">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <div className="flex-1 flex gap-4">
        <Card className="flex-1 flex flex-col" data-testid="card-chat">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversation</CardTitle>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger className="w-40" data-testid="select-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4">
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
                messages.map((msg: any, index: number) => (
                  <motion.div
                    key={msg.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${index}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        msg.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender === "user"
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
              
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
          
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
        </Card>

        {/* Sidebar */}
        <Card className="w-80" data-testid="card-sidebar">
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
        </Card>
      </div>
    </div>
  );
}