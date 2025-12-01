import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Instagram, 
  Mail, 
  X, 
  Loader2,
  MessageCircle,
  ArrowLeft,
  Clock,
} from "lucide-react";
type Channel = "instagram" | "email";

interface Message {
  id: string;
  body: string;
  direction: "inbound" | "outbound";
  createdAt: string;
  audioUrl?: string;
}

interface Lead {
  id: string;
  name: string;
  channel: Channel;
  status: string;
  lastMessageAt: string;
  engagementScore: number;
}

const channelConfig = {
  instagram: {
    icon: Instagram,
    label: "Instagram",
    color: "from-pink-500 to-purple-600",
    bgColor: "bg-gradient-to-r from-pink-500/10 to-purple-600/10",
    textColor: "text-pink-500",
  },
  email: {
    icon: Mail,
    label: "Email",
    color: "from-blue-500 to-cyan-600",
    bgColor: "bg-gradient-to-r from-blue-500/10 to-cyan-600/10",
    textColor: "text-blue-500",
  },
};

export function RecentConversations() {
  const [selectedChannel, setSelectedChannel] = useState<Channel>("instagram");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ["/api/leads", { channel: selectedChannel, limit: 5 }],
    refetchInterval: 5000,
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/leads", selectedLead?.id, "messages"],
    enabled: !!selectedLead,
  });

  const leads = leadsData?.leads || [];
  const messages = messagesData?.messages || [];

  const formatTime = (dateString: string) => {
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

  const formatFullTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (selectedLead) {
    return (
      <Card className="h-full flex flex-col">
        <div className="p-4 border-b flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedLead(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarFallback className={channelConfig[selectedLead.channel].bgColor}>
              {selectedLead.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold">{selectedLead.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {(() => {
                const ChannelIcon = channelConfig[selectedLead.channel].icon;
                return <ChannelIcon className="h-3 w-3" />;
              })()}
              <span>{channelConfig[selectedLead.channel].label}</span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              selectedLead.status === "converted"
                ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                : selectedLead.status === "replied"
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-blue-500/10 text-blue-500 border-blue-500/20"
            }
          >
            {selectedLead.status}
          </Badge>
        </div>

        <ScrollArea className="flex-1 p-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No messages yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message: Message, index: number) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex ${
                    message.direction === "outbound" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.direction === "outbound"
                        ? `bg-gradient-to-r ${channelConfig[selectedLead.channel].color} text-white`
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                    {message.audioUrl && (
                      <div className="mt-2 pt-2 border-t border-white/20">
                        <audio controls className="w-full max-w-xs">
                          <source src={message.audioUrl} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}
                    <div
                      className={`flex items-center gap-1 mt-1 text-xs ${
                        message.direction === "outbound"
                          ? "text-white/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      <span>{formatFullTime(message.createdAt)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-4">Recent Conversations</h2>
        
        <div className="flex gap-2">
          {(Object.keys(channelConfig) as Channel[]).map((channel) => {
            const config = channelConfig[channel];
            const ChannelIcon = config.icon;
            const isActive = selectedChannel === channel;

            return (
              <Button
                key={channel}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedChannel(channel)}
                className={
                  isActive
                    ? `bg-gradient-to-r ${config.color} hover:opacity-90`
                    : ""
                }
              >
                <ChannelIcon className="h-4 w-4 mr-2" />
                {config.label}
              </Button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <CardContent className="p-4">
          {leadsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground mb-2">
                No recent {channelConfig[selectedChannel].label} conversations
              </p>
              <p className="text-xs text-muted-foreground">
                Connect your account to start receiving leads
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {leads.map((lead: Lead, index: number) => {
                  const config = channelConfig[lead.channel];
                  const ChannelIcon = config.icon;

                  return (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="w-full p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left group"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 mt-1">
                            <AvatarFallback className={config.bgColor}>
                              {lead.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                                {lead.name}
                              </h4>
                              <span className="text-xs text-muted-foreground ml-2">
                                {formatTime(lead.lastMessageAt)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <ChannelIcon className={`h-3 w-3 ${config.textColor}`} />
                              <Badge
                                variant="outline"
                                className="text-xs"
                              >
                                Score: {lead.engagementScore}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  lead.status === "converted"
                                    ? "bg-purple-500/10 text-purple-500 border-purple-500/20 text-xs"
                                    : lead.status === "replied"
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs"
                                    : "bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs"
                                }
                              >
                                {lead.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
