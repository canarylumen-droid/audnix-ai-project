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
  Play,
  Pause,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

// Import demo data
import demoLeads from "@/data/demo-leads.json";
import demoMessages from "@/data/demo-messages.json";

const channelIcons = {
  instagram: Instagram,
  whatsapp: SiWhatsapp,
  email: Mail,
};

export default function ConversationsPage() {
  const params = useParams();
  const leadId = params.id || "lead-1";
  const [message, setMessage] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("instagram");
  const [isGenerating, setIsGenerating] = useState(false);
  const [typedText, setTypedText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lead = demoLeads.find((l) => l.id === leadId);
  const messages = (demoMessages as any)[leadId] || [];

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
        setIsGenerating(false);
        setMessage(aiResponse);
      }
    }, 30);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!lead) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Lead not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Main Conversation Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4" data-testid="header-conversation">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold" data-testid="text-lead-name">
                  {lead.name}
                </h2>
                <p className="text-sm text-muted-foreground">{lead.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" data-testid="badge-lead-score">
                Score: {lead.leadScore}
              </Badge>
              <Button variant="ghost" size="icon" data-testid="button-more">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="container-messages">
          <AnimatePresence>
            {messages.map((msg: any, index: number) => {
              const isInbound = msg.direction === "inbound";
              const ChannelIcon = channelIcons[msg.channel as keyof typeof channelIcons];

              return (
                <motion.div
                  key={msg.id}
                  className={`flex ${isInbound ? "justify-start" : "justify-end"}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  data-testid={`message-${index}`}
                >
                  <div className={`max-w-[70%] ${isInbound ? "" : "items-end"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <ChannelIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatTime(msg.sentAt)}
                      </span>
                      {msg.isAiGenerated && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-3 ${
                        isInbound
                          ? "bg-muted"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* AI Typing Indicator */}
          {isGenerating && typedText && (
            <motion.div
              className="flex justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              data-testid="ai-typing-indicator"
            >
              <div className="max-w-[70%]">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Generating...
                  </Badge>
                </div>
                <div className="rounded-lg p-3 bg-primary text-primary-foreground">
                  <p className="text-sm">
                    {typedText}
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      |
                    </motion.span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="border-t p-4 space-y-3" data-testid="composer">
          <div className="flex items-center gap-2">
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger className="w-40" data-testid="select-channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </div>
                </SelectItem>
                <SelectItem value="whatsapp">
                  <div className="flex items-center gap-2">
                    <SiWhatsapp className="h-4 w-4" />
                    WhatsApp
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={handleGenerateReply}
              disabled={isGenerating}
              data-testid="button-generate-reply"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate Reply"}
            </Button>
          </div>

          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none"
              rows={3}
              data-testid="textarea-message"
            />
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="icon" data-testid="button-attach">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" data-testid="button-voice">
                <Mic className="h-4 w-4" />
              </Button>
              <Button size="icon" data-testid="button-send">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Timeline */}
      <div className="w-80 border-l p-4 space-y-4 hidden lg:block" data-testid="sidebar-timeline">
        <div>
          <h3 className="font-semibold mb-3">Follow-up Schedule</h3>
          
          <div className="space-y-3">
            {[
              { delay: "12h", action: "Send message", channel: "instagram", status: "completed" },
              { delay: "24h", action: "Escalate to WhatsApp", channel: "whatsapp", status: "completed" },
              { delay: "48h", action: "Send voice note", channel: "whatsapp", status: "pending" },
              { delay: "72h", action: "Send email", channel: "email", status: "pending" },
              { delay: "7d", action: "Final follow-up", channel: "email", status: "pending" },
            ].map((item, index) => {
              const ChannelIcon = channelIcons[item.channel as keyof typeof channelIcons];
              return (
                <motion.div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    item.status === "completed" ? "bg-emerald-500/10" : "bg-muted"
                  }`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  data-testid={`timeline-item-${index}`}
                >
                  <div className={`p-2 rounded-full ${
                    item.status === "completed" ? "bg-emerald-500/20" : "bg-background"
                  }`}>
                    <ChannelIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium">{item.delay}</span>
                    </div>
                    <p className="text-sm mt-1">{item.action}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Human Timing</h3>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-3">
                Add randomization to make follow-ups feel more natural
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Delay variance</span>
                  <span className="font-medium">2-5 min</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  defaultValue="3"
                  className="w-full"
                  data-testid="slider-delay-variance"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
