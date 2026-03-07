import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCanAccessVoiceNotes } from "@/hooks/use-access-gate";
import {
  Instagram,
  Mail,
  Check,
  Shield,
  Loader2,
  CheckCircle2,
  Pencil,
  Sparkles,
  Zap,
  Globe,
  Upload,
  FileText,
  AlertCircle,
  Plus,
  ShieldCheck,
  Activity,
  Cpu,
  Unplug,
  RefreshCw,
  FolderSync,
  ArrowRight
} from "lucide-react";
import { SiGoogle, SiShopify, SiHubspot, SiSlack } from "react-icons/si";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { getPlanCapabilities } from "@shared/plan-utils";

interface Integration {
  provider: string;
  connected: boolean;
  lastSync?: string;
  accountInfo?: {
    email?: string;
    username?: string;
  };
}

interface IntegrationsResponse {
  integrations: Integration[];
}

interface UserData {
  user: {
    id: string;
    email: string;
    subscriptionTier?: string;
    totalLeads?: number;
  };
}

const integrationCards = [
  {
    do: "social",
    id: "instagram",
    name: "Instagram",
    description: "Automate DMs and lead responses on your Instagram account.",
    icon: Instagram,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    do: "email",
    id: "gmail",
    name: "Google Workspace",
    description: "Connect your business email for automated outreach and follow-ups.",
    icon: SiGoogle,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    do: "store",
    id: "shopify",
    name: "Shopify",
    description: "Sync your store data for AI-powered product recommendations.",
    icon: SiShopify,
    color: "text-green-500",
    bg: "bg-green-500/10",
    badge: "Coming Soon"
  },
  {
    do: "crm",
    id: "hubspot",
    name: "HubSpot",
    description: "Automatically sync leads and deals with your HubSpot CRM.",
    icon: SiHubspot,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    badge: "Coming Soon"
  }
];


function DisconnectConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  providerName
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  providerName: string;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disconnect {providerName}?</DialogTitle>
          <DialogDescription>
            Are you sure you want to disconnect? The AI will stop processing leads from this source immediately.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onOpenChange(false); }}>Yes, Disconnect</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const CircularProgress = ({ value, label, sublabel, color = "primary" }: { value: number, label: string, sublabel: string, color?: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="relative h-24 w-24">
      <svg className="h-full w-full rotate-[-90deg]">
        <circle
          cx="48"
          cy="48"
          r="36"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-muted/10"
        />
        <motion.circle
          cx="48"
          cy="48"
          r="36"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray="226.2"
          initial={{ strokeDashoffset: 226.2 }}
          animate={{ strokeDashoffset: 226.2 - (226.2 * Math.min(value, 100)) / 100 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={cn(color === "primary" ? "text-primary" : "text-emerald-500")}
          style={{ strokeLinecap: "round" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black tracking-tighter">{label}</span>
      </div>
    </div>
    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{sublabel}</span>
  </div>
);

export default function IntegrationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customEmailConfig, setCustomEmailConfig] = useState({
    smtpHost: '',
    smtpPort: '587',
    imapHost: '',
    imapPort: '993',
    email: '',
    password: '',
    fromName: ''
  });
  const [testEmailData, setTestEmailData] = useState({ recipient: "", subject: "Test Email", content: "This is a test email." });
  const [isTestEmailOpen, setIsTestEmailOpen] = useState(false);
  const [isEditingCustomEmail, setIsEditingCustomEmail] = useState(false);
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);
  const [disconnectProvider, setDisconnectProvider] = useState<string | null>(null);

  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  const { data: integrationsData, isLoading } = useQuery<IntegrationsResponse>({
    queryKey: ["/api/integrations"],
    staleTime: 30000,
    placeholderData: (prev: any) => prev,
  });
  const { data: customEmailStatus, refetch: refetchStatus } = useQuery<{
    connected: boolean;
    email: string | null;
    integrations: Array<{ id: string; email: string; connected: boolean; provider: string }>;
  }>({
    queryKey: ["/api/custom-email/status"],
    staleTime: 30000,
    placeholderData: (prev) => prev,
  });

  const { data: folderData } = useQuery<{ success: boolean; inbox: string[]; sent: string[]; isDiscovering: boolean }>({
    queryKey: ["/api/custom-email/folders"],
    enabled: !!customEmailStatus?.connected,
    placeholderData: (prev) => prev,
  });
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
    staleTime: 15000,
    placeholderData: (prev: any) => prev,
  });
  const { data: userData } = useQuery<UserData>({ queryKey: ["/api/user/profile"] });

  const [tickerTime, setTickerTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setTickerTime(Date.now()), 47); // ~21fps for high-fidelity ticker
    return () => clearInterval(timer);
  }, []);

  const getDailyLimit = () => {
    const tier = userData?.user?.subscriptionTier?.toLowerCase();
    if (tier === 'enterprise') return 500;
    if (tier === 'pro') return 400;
    return 300; // Default / Starter
  };

  const calculateReputation = () => {
    return stats?.domainHealth !== undefined ? stats.domainHealth.toFixed(1) : null;
  };

  useEffect(() => {
    // Autonomous check: if email connected but no domain health, trigger it
    if (customEmailStatus?.connected && customEmailStatus?.email && stats?.domainHealth === undefined) {
      if (!verifyDomainMutation.isPending) {
        const domain = getDomainFromEmail(customEmailStatus.email);
        if (domain) {
          verifyDomainMutation.mutate(domain);
        }
      }
    }
  }, [customEmailStatus?.connected, customEmailStatus?.email, stats?.domainHealth]);

  const integrations = integrationsData?.integrations ?? [];
  const isCustomEmailConnected = customEmailStatus?.connected || false;

  const verifyDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      const res = await apiRequest("POST", "/api/dns/verify", { domain, force: true });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Check Complete", description: "Domain reputation updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (err: any) => toast({ title: "Verification Failed", description: err.message, variant: "destructive" })
  });

  const disconnectProviderMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest("POST", `/api/integrations/${provider}/disconnect`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({ title: "Disconnected", description: "Integration removed successfully." });
    }
  });

  const connectCustomEmailMutation = useMutation({
    mutationFn: async (config: typeof customEmailConfig) => {
      const response = await apiRequest("POST", "/api/custom-email/connect", config);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-email/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      setIsEditingCustomEmail(false);
      setCustomEmailConfig({ smtpHost: '', smtpPort: '587', imapHost: '', imapPort: '993', email: '', password: '', fromName: '' });
      toast({ title: "Email Connected", description: "SMTP settings saved successfully." });
    },
    onError: (error: Error) => {
      // apiRequest throws "400: {json}" - try to extract structured error
      let errorMsg = error.message;
      let tipMsg = '';
      try {
        const jsonStr = error.message.replace(/^\d+:\s*/, '');
        const parsed = JSON.parse(jsonStr);
        errorMsg = parsed.error || errorMsg;
        tipMsg = parsed.tip || '';
      } catch { /* use raw message */ }
      const description = tipMsg ? `${errorMsg}\n\n💡 ${tipMsg}` : errorMsg;
      toast({ title: "Connection Failed", description, variant: "destructive" });
    }
  });

  const disconnectCustomEmailMutation = useMutation({
    mutationFn: async (integrationId?: string) => apiRequest("POST", "/api/custom-email/disconnect", { integrationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-email/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({ title: "Email Disconnected" });
    }
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/custom-email/send-test", {
        recipientEmail: data.recipient,
        subject: data.subject,
        content: data.content
      });
      return res.json();
    },
    onSuccess: () => {
      setIsTestEmailOpen(false);
      toast({ title: "Test Email Sent", description: "Check your inbox." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to Send", description: err.message, variant: "destructive" });
    }
  });

  const syncNowMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/custom-email/sync-now"),
    onSuccess: () => {
      toast({ title: "Sync Triggered", description: "Fetching new messages in the background..." });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (err: any) => toast({ title: "Sync Failed", description: err.message, variant: "destructive" })
  });

  const uploadVoiceMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("voice", file);
      const response = await fetch("/api/uploads/voice", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Voice Uploaded", description: "Your voice sample has been processed." });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
    onError: () => toast({ title: "Upload Failed", variant: "destructive" })
  });

  const handleConnect = async (provider: string) => {
    try {
      const response = await fetch(`/api/oauth/connect/${provider}`);
      const { authUrl } = await response.json();
      if (authUrl) window.location.href = authUrl;
    } catch (e) {
      toast({ title: "Error", description: "Could not start connection setup.", variant: "destructive" });
    }
  };

  const discoverSettingsMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/custom-email/discover", { email });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.smtp?.host) {
        setCustomEmailConfig(prev => ({
          ...prev,
          smtpHost: data.smtp.host,
          smtpPort: String(data.smtp.port || 587),
          imapHost: data.imap?.host || prev.imapHost,
          imapPort: String(data.imap?.port || 993)
        }));
        toast({ title: "Settings Found", description: `Automatically detected settings for ${customEmailConfig.email}` });
      }
    }
  });

  const handleVoiceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVoice(true);
    try {
      await uploadVoiceMutation.mutateAsync(file);
    } finally {
      setIsUploadingVoice(false);
    }
  };

  const confirmDisconnect = (provider: string, integrationId?: string) => {
    setDisconnectProvider(provider === 'custom_email' ? (integrationId || 'custom_email') : provider);
    setIsDisconnectDialogOpen(true);
  };

  const getDomainFromEmail = (email: string | null) => {
    if (!email) return null;
    return email.split('@')[1];
  };

  const getMailboxLimit = () => {
    const tier = (userData as any)?.user?.subscriptionTier || 'trial';
    return (getPlanCapabilities(tier) as any).mailboxLimit || 3;
  };

  const connectedMailboxesCount = (customEmailStatus?.integrations?.length || 0) +
    (integrations.filter(i => i.provider === 'gmail' || i.provider === 'outlook').length || 0);

  const isAtMailboxLimit = connectedMailboxesCount >= getMailboxLimit();

  const getNextPlan = () => {
    const tier = userData?.user?.subscriptionTier?.toLowerCase() || 'starter';
    if (tier === 'starter') return 'Pro';
    if (tier === 'pro') return 'Enterprise';
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <DisconnectConfirmationDialog
        isOpen={isDisconnectDialogOpen}
        onOpenChange={setIsDisconnectDialogOpen}
        onConfirm={() => {
          if (disconnectProvider === 'instagram') {
            disconnectProviderMutation.mutate('instagram');
          } else if (disconnectProvider === 'gmail') {
            disconnectProviderMutation.mutate('gmail');
          } else if (disconnectProvider === 'outlook') {
            disconnectProviderMutation.mutate('outlook');
          } else if (disconnectProvider) {
            // It's a custom email integration ID
            disconnectCustomEmailMutation.mutate(disconnectProvider);
          }
        }}
        providerName={disconnectProvider === 'instagram' ? 'Instagram' :
          disconnectProvider === 'gmail' ? 'Google Workspace' :
            disconnectProvider === 'outlook' ? 'Outlook' :
              customEmailStatus?.integrations?.find(i => i.id === disconnectProvider)?.email || 'Email Account'}
      />

      {/* Send Test Email Dialog */}
      <Dialog open={isTestEmailOpen} onOpenChange={setIsTestEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>Verify your SMTP connection by sending a real email.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <Input
                placeholder="recipient@example.com"
                value={testEmailData.recipient}
                onChange={e => setTestEmailData({ ...testEmailData, recipient: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Test Subject"
                value={testEmailData.subject}
                onChange={e => setTestEmailData({ ...testEmailData, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Input
                placeholder="Hello world..."
                value={testEmailData.content}
                onChange={e => setTestEmailData({ ...testEmailData, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestEmailOpen(false)}>Cancel</Button>
            <Button onClick={() => sendTestEmailMutation.mutate(testEmailData)} disabled={sendTestEmailMutation.isPending}>
              {sendTestEmailMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Integrations
          </h1>
          <p className="text-muted-foreground">
            Connect your favorite tools to automate your sales workflow.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full px-6 text-sm font-medium">
            <FileText className="mr-2 h-4 w-4" /> Documentation
          </Button>
          <Button className="rounded-full px-6 text-sm font-medium">
            <Plus className="mr-2 h-4 w-4" /> Request App
          </Button>
        </div>
      </div>

      <Tabs defaultValue="connected" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-full w-full max-w-[400px] mb-8">
          <TabsTrigger value="connected" className="rounded-full px-8 py-2 text-sm font-medium">
            Channels
          </TabsTrigger>
          <TabsTrigger value="voice" className="rounded-full px-8 py-2 text-sm font-medium">
            Voice Cloning
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connected" className="space-y-12">
          {/* Custom SMTP Integration Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">Custom Email Domain</h2>
              </div>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-primary/20 bg-primary/5 text-primary">
                Advanced
              </Badge>
            </div>

            <Card className={cn(
              "rounded-3xl border-border/50 overflow-hidden transition-all duration-500",
              isCustomEmailConnected ? "bg-card shadow-2xl shadow-primary/5 border-primary/20" : "bg-muted/20"
            )}>
              {isCustomEmailConnected && !isEditingCustomEmail ? (
                <div className="p-8 space-y-8">
                  <div className="flex items-center justify-between pb-4 border-b border-border/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">Connected Mailboxes</h3>
                        <Badge variant="outline" className="rounded-full text-[10px]">
                          {connectedMailboxesCount} / {getMailboxLimit()} Limit
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Manage your outreach accounts and their health.</p>
                    </div>
                    {isAtMailboxLimit ? (
                      getNextPlan() ? (
                        <Link href="/dashboard/pricing">
                          <Button size="sm" variant="outline" className="rounded-full gap-2 border-primary/20 text-primary hover:bg-primary/5">
                            <Zap className="h-3.5 w-3.5 fill-primary" /> Upgrade for More
                          </Button>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-500 border-emerald-500/20 bg-emerald-500/5">
                            Full Capacity
                          </Badge>
                          <Button size="sm" className="rounded-full gap-2 shadow-lg shadow-primary/20" onClick={() => setIsEditingCustomEmail(true)}>
                            <Plus className="h-4 w-4" /> Add Mailbox
                          </Button>
                        </div>
                      )
                    ) : (
                      <Button size="sm" className="rounded-full gap-2 shadow-lg shadow-primary/20" onClick={() => setIsEditingCustomEmail(true)}>
                        <Plus className="h-4 w-4" /> Add Mailbox
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {customEmailStatus?.integrations?.map((mailbox) => (
                      <div key={mailbox.id} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-muted/20 border border-border/40 hover:border-primary/30 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-foreground">
                                {mailbox.provider === 'custom_email'
                                  ? (mailbox as any).metadata?.from_name || (mailbox.email || '').split('@')[0]
                                  : (mailbox.email || mailbox.provider)}
                              </h4>
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[8px] font-black uppercase tracking-widest px-1.5 py-0">Active</Badge>
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Custom SMTP Account</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0 transition-opacity">
                          <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] px-3 w-full sm:w-auto" onClick={() => setIsTestEmailOpen(true)}>
                            <Mail className="h-3 w-3 mr-1.5" /> Test Connection
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] px-3 font-bold text-destructive hover:bg-destructive/10 w-full sm:w-auto" onClick={() => confirmDisconnect('custom_email', mailbox.id)}>
                            <Unplug className="h-3 w-3 mr-1.5" /> Disconnect
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="flex items-center justify-around p-6 rounded-2xl bg-muted/20 border border-border/40 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 bg-primary rounded-full" />
                      <CircularProgress
                        value={stats?.messagesToday ? (stats.messagesToday / getDailyLimit()) * 100 : 0}
                        label={stats?.messagesToday || "0"}
                        sublabel="Sent Today"
                      />
                      <CircularProgress
                        value={stats?.messagesYesterday ? (stats.messagesYesterday / getDailyLimit()) * 100 : 0}
                        label={stats?.messagesYesterday || "0"}
                        sublabel="Sent Yesterday"
                        color="secondary"
                      />
                      <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest">Real-time Feed</span>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-muted/20 border border-border/40 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            Domain Health Monitor
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => {
                              const domain = getDomainFromEmail(customEmailStatus?.email || null);
                              if (domain) verifyDomainMutation.mutate(domain);
                            }}
                            disabled={verifyDomainMutation.isPending}
                          >
                            <RefreshCw className={cn("h-3 w-3", verifyDomainMutation.isPending && "animate-spin")} />
                          </Button>
                          <Badge className={cn(
                            "text-[9px] font-black border-0 uppercase tracking-tighter",
                            calculateReputation() === null ? "bg-muted text-muted-foreground" :
                              parseFloat(calculateReputation()!) > 90 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                          )}>
                            {calculateReputation() === null ? "Pending Analysis" : parseFloat(calculateReputation()!) > 90 ? "Healthy" : "Attention Required"}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold text-muted-foreground/60 uppercase">Domain Grade</p>
                          <div className="text-3xl font-black tracking-tighter text-foreground h-9 flex items-center">
                            {calculateReputation() !== null ? `${calculateReputation()}%` : <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold text-muted-foreground/60 uppercase">Engine Status</p>
                          <p className={cn(
                            "text-xs font-black uppercase tracking-widest pt-2",
                            calculateReputation() === null ? "text-muted-foreground" :
                              parseFloat(calculateReputation()!) > 90 ? "text-emerald-500" : "text-amber-500"
                          )}>
                            {calculateReputation() === null ? "Waiting" : parseFloat(calculateReputation()!) > 95 ? "Autonomous" : "User Oversight Recommended"}
                          </p>
                        </div>
                      </div>

                      <div className={cn(
                        "p-3 rounded-xl border text-[10px] leading-tight font-medium transition-all duration-300",
                        calculateReputation() === null ? "bg-muted/10 border-border/20 text-muted-foreground" :
                          parseFloat(calculateReputation()!) > 90
                            ? "bg-primary/5 border-primary/10 text-muted-foreground"
                            : "bg-red-500/5 border-red-500/10 text-red-400"
                      )}>
                        {calculateReputation() === null ? "AI is initiating a health checkpoint for your domain." :
                          parseFloat(calculateReputation()!) > 90
                            ? "Your domain parameters are within safe limits. AI is managing 1-by-1 sending autonomously."
                            : "Warning: Low reputation detected. Engine will auto-pause if bounce rate exceeds 10%."}
                      </div>

                      {stats?.domainVerifications?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold text-muted-foreground/60 uppercase">Recent DNS Checks</p>
                          <div className="space-y-1.5">
                            {stats.domainVerifications.map((v: any, idx: number) => (
                              <div key={idx} className="flex flex-col gap-1.5 bg-white/5 p-3 rounded-xl border border-border/50">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-foreground/80">{v.domain}</span>
                                  <Badge className={cn(
                                    "text-[8px] h-4 py-0 uppercase font-black",
                                    v.result?.overallStatus === 'excellent' || v.result?.overallStatus === 'good' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                  )}>
                                    {v.result?.overallStatus || 'unknown'}
                                  </Badge>
                                </div>
                                {v.result && (
                                  <div className="grid grid-cols-4 gap-1">
                                    {['SPF', 'DKIM', 'DMARC', 'MX'].map(record => {
                                      const key = record.toLowerCase();
                                      const isFound = v.result[key]?.found;
                                      const isValid = v.result[key]?.valid ?? true;
                                      return (
                                        <div key={record} className="flex flex-col items-center gap-1 p-1 rounded bg-black/20">
                                          <span className="text-[7px] font-bold text-muted-foreground uppercase">{record}</span>
                                          <div className={cn(
                                            "h-1 w-full rounded-full",
                                            isFound && isValid ? "bg-emerald-500" : isFound ? "bg-amber-500" : "bg-red-500"
                                          )} />
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (!isCustomEmailConnected || isEditingCustomEmail) && (
                <div className="p-8 space-y-6">
                  {isAtMailboxLimit && !isEditingCustomEmail ? (
                    <div className="flex flex-col items-center text-center py-12 space-y-6">
                      <div className="h-20 w-20 rounded-[2rem] bg-amber-500/5 flex items-center justify-center border border-amber-500/10 mb-2">
                        <AlertCircle className="h-10 w-10 text-amber-500" />
                      </div>
                      <div className="space-y-2 max-w-sm">
                        <h3 className="text-xl font-black tracking-tight">Plan Limit Reached</h3>
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed px-4">
                          Your {(userData as any)?.user?.subscriptionTier || 'Starter'} plan supports up to {getMailboxLimit()} mailbox{getMailboxLimit() > 1 ? 'es' : ''}.
                          Disconnect an existing account to add another.
                        </p>
                      </div>
                      {getNextPlan() && (
                        <Link href="/dashboard/billing">
                          <Button className="rounded-2xl gap-2 h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                            <Zap className="h-4 w-4 fill-primary-foreground" /> Upgrade to {getNextPlan()}
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
                            {isEditingCustomEmail ? 'Add New Mailbox' : 'Connect Your Domain'}
                          </h3>
                          <p className="text-xs text-muted-foreground">Professional outreach requires a custom SMTP & IMAP connection.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-full text-[10px] font-bold gap-1.5 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                                  onClick={() => setCustomEmailConfig({
                                    ...customEmailConfig,
                                    smtpHost: 'smtp.gmail.com',
                                    smtpPort: '587',
                                    imapHost: 'imap.gmail.com',
                                    imapPort: '993'
                                  })}
                                >
                                  <SiGoogle className="h-3 w-3" /> Gmail Personal
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Quick-fill settings for personal @gmail.com accounts</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-full text-[10px] font-bold gap-1.5 border-blue-500/20 bg-blue-500/5 text-blue-500 hover:bg-blue-500/10"
                                  onClick={() => setCustomEmailConfig({
                                    ...customEmailConfig,
                                    smtpHost: 'smtp.office365.com',
                                    smtpPort: '587',
                                    imapHost: 'imap-mail.outlook.com',
                                    imapPort: '993'
                                  })}
                                >
                                  <Mail className="h-3 w-3" /> Outlook Personal
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Quick-fill settings for personal @outlook.com accounts</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5 md:col-span-2">
                          <Label className="text-xs font-semibold text-muted-foreground ml-1">Account Email</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="your@email.com"
                              value={customEmailConfig.email}
                              onChange={(e) => setCustomEmailConfig({ ...customEmailConfig, email: e.target.value })}
                              className="rounded-xl border-border/50 focus:ring-primary/20"
                            />
                            <Button
                              variant="outline"
                              className="rounded-xl px-4 text-xs font-bold gap-2"
                              onClick={() => discoverSettingsMutation.mutate(customEmailConfig.email)}
                              disabled={!customEmailConfig.email.includes('@') || discoverSettingsMutation.isPending}
                            >
                              {discoverSettingsMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                              Auto-Discover
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <Label className="text-xs font-semibold text-muted-foreground ml-1">From Name (Displayed to recipients)</Label>
                          <Input
                            placeholder="John Doe"
                            value={customEmailConfig.fromName}
                            onChange={(e) => setCustomEmailConfig({ ...customEmailConfig, fromName: e.target.value })}
                            className="rounded-xl border-border/50 focus:ring-primary/20"
                          />
                        </div>
                        {[
                          { label: "SMTP Host", key: "smtpHost", placeholder: "e.g. smtp.gmail.com" },
                          { label: "SMTP Port", key: "smtpPort", placeholder: "587" },
                          { label: "App Password", key: "password", placeholder: "Minimum 16 characters", type: "password" },
                          { label: "IMAP Host (Optional)", key: "imapHost", placeholder: "e.g. imap.gmail.com" },
                          { label: "IMAP Port", key: "imapPort", placeholder: "993" }
                        ].map((field) => (
                          <div key={field.key} className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground ml-1 flex items-center gap-1.5">
                              {field.label}
                              {field.key === 'password' && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertCircle className="h-3 w-3 text-primary animate-pulse cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[280px] p-4 space-y-3 bg-indigo-950/90 border-primary/20 backdrop-blur-xl">
                                      <div className="space-y-1">
                                        <p className="font-black text-[10px] uppercase tracking-widest text-primary flex items-center gap-2">
                                          <Sparkles className="h-3 w-3" /> Gmail / Outlook Guide
                                        </p>
                                        <p className="text-xs leading-relaxed text-foreground/90 italic">Manual connection for personal accounts requires a 16-character <strong>App Password</strong>.</p>
                                      </div>
                                      <div className="space-y-2 py-1">
                                        <div className="flex items-start gap-2">
                                          <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary mt-0.5 shrink-0">1</div>
                                          <p className="text-[10px] text-muted-foreground">Enable <strong>IMAP Access</strong> in your email Forwarding/IMAP settings.</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary mt-0.5 shrink-0">2</div>
                                          <p className="text-[10px] text-muted-foreground">Enable <strong>2-Step Verification</strong> in Security settings.</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary mt-0.5 shrink-0">3</div>
                                          <p className="text-[10px] text-muted-foreground">Search for <strong>"App Passwords"</strong> and generate a code.</p>
                                        </div>
                                      </div>
                                      <div className="pt-2 border-t border-white/5 space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-orange-500/60">Getting Connection Error?</p>
                                        <p className="text-[10px] text-muted-foreground leading-snug">Ensure <strong>IMAP</strong> is set to "Enabled" in your email provider. Your regular password will not work.</p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        className="p-0 h-auto text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 hover:bg-transparent"
                                        onClick={() => window.open('https://myaccount.google.com/apppasswords', '_blank')}
                                      >
                                        Open Google Settings <ArrowRight className="ml-1 h-3 w-3" />
                                      </Button>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </Label>
                            <Input
                              type={field.type || "text"}
                              placeholder={field.placeholder}
                              value={(customEmailConfig as any)[field.key]}
                              onChange={(e) => setCustomEmailConfig({ ...customEmailConfig, [field.key]: e.target.value })}
                              className="rounded-xl border-border/50 focus:ring-primary/20"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-4">
                        <Button
                          className="rounded-xl px-8 font-semibold h-11 flex-1"
                          disabled={connectCustomEmailMutation.isPending}
                          onClick={() => connectCustomEmailMutation.mutate(customEmailConfig)}
                        >
                          {connectCustomEmailMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isEditingCustomEmail ? 'Add Mailbox' : 'Connect Account'}
                        </Button>
                        {isEditingCustomEmail && (
                          <Button variant="outline" className="rounded-xl px-8 font-semibold h-11" onClick={() => setIsEditingCustomEmail(false)}>Cancel</Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>

            {/* Social and SaaS Integrations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading ? (
                // Skeleton loading for integration cards
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="rounded-2xl border border-border/50 bg-muted/10 p-6 animate-pulse">
                    <div className="flex justify-between items-start mb-6">
                      <div className="h-14 w-14 rounded-xl bg-muted/20" />
                      <div className="h-4 w-12 rounded bg-muted/20" />
                    </div>
                    <div className="h-5 w-24 rounded bg-muted/20 mb-2" />
                    <div className="h-4 w-full rounded bg-muted/20" />
                    <div className="mt-6 h-9 w-full rounded-lg bg-muted/20" />
                  </Card>
                ))
              ) : (
                integrationCards.map((card) => {
                  const integration = Array.isArray(integrations) ? integrations.find(i => i.provider === card.id) : undefined;
                  const isConnected = !!integration;

                  return (
                    <Card key={card.id} className={`group transition-all rounded-2xl border bg-muted/10 hover:bg-muted/20 ${isConnected ? 'border-primary/40 bg-primary/5' : 'border-border/50'}`}>
                      <CardHeader className="p-6">
                        <div className="flex justify-between items-start mb-6">
                          <div className={`p-4 rounded-xl bg-background border border-border/50 ${card.color}`}>
                            <card.icon className="h-6 w-6" />
                          </div>
                          {card.badge ? (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground border-0 font-semibold text-[9px] uppercase tracking-wider py-1">{card.badge}</Badge>
                          ) : isConnected ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-0 font-bold text-[9px] uppercase tracking-wider py-1">Active</Badge>
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
                          )}
                        </div>
                        <CardTitle className="text-lg font-semibold">{card.name}</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">{card.description}</CardDescription>
                      </CardHeader>
                      <CardFooter className="p-6 pt-0">
                        {isConnected ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-lg text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => confirmDisconnect(card.id)}
                          >
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            variant={card.badge ? "secondary" : "default"}
                            size="sm"
                            className="w-full rounded-lg text-xs font-semibold"
                            disabled={!!card.badge}
                            onClick={() => handleConnect(card.id)}
                          >
                            {card.badge ? "Locked" : "Connect Account"}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent >


        <TabsContent value="voice">
          <Card className="rounded-2xl border-border/50 overflow-hidden">
            <CardHeader className="p-8 border-b bg-muted/20">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-semibold">AI Voice Cloning</CardTitle>
              </div>
              <CardDescription className="text-sm font-medium pt-2">
                Enable your AI to send personalized voice messages to leads.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="p-6 rounded-xl bg-muted/30 border border-border/50 space-y-4">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Recording Guidelines</h4>
                    <ul className="space-y-3">
                      {[
                        "Record in a quiet environment",
                        "Speak naturally at a normal pace",
                        "At least 1 minute of high-quality audio",
                        "Use WAV or MP3 format"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                          <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div
                  className="group relative border-2 border-dashed border-border/50 hover:border-primary/40 transition-all rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer bg-muted/20"
                  onClick={() => voiceInputRef.current?.click()}
                >
                  <input
                    ref={voiceInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleVoiceFileSelect}
                  />
                  <div className="h-16 w-16 rounded-full bg-background border border-border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {isUploadingVoice ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <h3 className="text-sm font-semibold mb-1">Click to Upload Sample</h3>
                  <p className="text-xs text-muted-foreground">MP3, WAV, or M4A files up to 10MB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs >
    </div >
  );
}

function SwitchIcon({ connected }: { connected: boolean }) {
  return (
    <div className={`w-3 h-3 rounded-full ${connected ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
  );
}
