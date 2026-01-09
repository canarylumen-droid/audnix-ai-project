
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Plus
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
import { Separator } from "@/components/ui/separator";

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
    do: "email",
    id: "gmail",
    name: "Google Workspace",
    description: "Sync emails, calendar, and contacts.",
    icon: SiGoogle,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    do: "store",
    id: "shopify",
    name: "Shopify",
    description: "Connect store data for product insights.",
    icon: SiShopify,
    color: "text-green-500",
    bg: "bg-green-500/10",
    badge: "Coming Soon"
  },
  {
    do: "crm",
    id: "hubspot",
    name: "HubSpot",
    description: "Bi-directional CRM sync for leads.",
    icon: SiHubspot,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    badge: "Coming Soon"
  },
  {
    do: "notify",
    id: "slack",
    name: "Slack",
    description: "Get real-time alerts for hot leads.",
    icon: SiSlack,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    badge: "Coming Soon"
  }
];

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
  const [isEditingCustomEmail, setIsEditingCustomEmail] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  const { data: userData } = useQuery<UserData | null>({ queryKey: ["/api/user"] });
  const { data: integrationsData, isLoading } = useQuery<IntegrationsResponse>({ queryKey: ["/api/integrations"] });
  const { data: customEmailStatus } = useQuery<{ connected: boolean; email: string | null; provider: string }>({ queryKey: ["/api/custom-email/status"] });

  const integrations = integrationsData?.integrations ?? [];
  const isCustomEmailConnected = customEmailStatus?.connected || false;

  // Access control
  const { canAccess: canAccessVoiceNotes } = useCanAccessVoiceNotes();

  const connectProviderMutation = useMutation({
    mutationFn: async ({ provider, credentials }: { provider: string; credentials?: Record<string, unknown> }) => {
      // OAuth flow usually triggered via browser redirect, but keeping this structure 
      return {};
    },
    // ... (logic handled via handleConnect)
  });

  const disconnectProviderMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest("POST", `/api/integrations/${provider}/disconnect`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({ title: "Disconnected successfully" });
    }
  });

  const connectCustomEmailMutation = useMutation({
    mutationFn: async (config: typeof customEmailConfig) => {
      const response = await apiRequest("POST", "/api/custom-email/connect", config);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-email/status"] });
      setIsEditingCustomEmail(false);
      setCustomEmailConfig({ smtpHost: '', smtpPort: '587', imapHost: '', imapPort: '993', email: '', password: '', fromName: '' });
      toast({ title: "SMTP Connected", description: "Email automation is now active." });
    },
    onError: (error: Error) => {
      toast({ title: "Connection Failed", description: error.message, variant: "destructive" });
    }
  });

  const disconnectCustomEmailMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/custom-email/disconnect"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-email/status"] });
      toast({ title: "Email Disconnected" });
    }
  });

  // Voice upload mutation (Simplified for this view)
  const uploadVoiceMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("voice", file);
      const response = await fetch("/api/uploads/voice", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Voice profile created", description: "AI can now replicate your voice." });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
    onError: () => toast({ title: "Upload failed", variant: "destructive" })
  });

  const handleConnect = async (provider: string) => {
    try {
      const response = await fetch(`/api/connect/${provider}`);
      const { authUrl } = await response.json();
      if (authUrl) window.location.href = authUrl;
    } catch (e) {
      toast({ title: "Connection Error", description: "Could not initiate OAuth flow.", variant: "destructive" });
    }
  };

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

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Supercharge your workspace by connecting your favorite tools.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:flex">
            <FileText className="mr-2 h-4 w-4" />
            Documentation
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Request Integration
          </Button>
        </div>
      </div>

      <Tabs defaultValue="connected" className="w-full">
        <TabsList className="w-full justify-start border-b bg-transparent p-0 rounded-none h-auto gap-6">
          <TabsTrigger value="connected" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3">
            All Apps
          </TabsTrigger>
          <TabsTrigger value="voice" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3">
            Voice & AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connected" className="mt-8 space-y-8">
          {/* Custom SMTP Card - High Priority */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5" /> Email Infrastucture
              </h2>
            </div>
            <Card className={`border ${isCustomEmailConnected ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border'}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Custom SMTP/IMAP</CardTitle>
                    <CardDescription>Connect your own email provider for unrestricted sending.</CardDescription>
                  </div>
                  {isCustomEmailConnected ? (
                    <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/25">Connected</Badge>
                  ) : (
                    <Badge variant="outline">Disconnected</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isCustomEmailConnected && !isEditingCustomEmail ? (
                  <div className="flex items-center justify-between bg-background/50 p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{customEmailStatus?.email || "Email Connected"}</p>
                        <p className="text-sm text-muted-foreground">Ready to send automated follow-ups.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingCustomEmail(true)}>
                        <Pencil className="h-4 w-4 mr-2" /> Configure
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => disconnectCustomEmailMutation.mutate()}>
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 max-w-2xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>SMTP Host</Label>
                        <Input placeholder="smtp.gmail.com" value={customEmailConfig.smtpHost} onChange={(e) => setCustomEmailConfig({ ...customEmailConfig, smtpHost: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>SMTP Port</Label>
                        <Input placeholder="587" value={customEmailConfig.smtpPort} onChange={(e) => setCustomEmailConfig({ ...customEmailConfig, smtpPort: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input placeholder="you@company.com" value={customEmailConfig.email} onChange={(e) => setCustomEmailConfig({ ...customEmailConfig, email: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input type="password" placeholder="••••••••" value={customEmailConfig.password} onChange={(e) => setCustomEmailConfig({ ...customEmailConfig, password: e.target.value })} />
                      </div>
                    </div>
                    <Button
                      className="w-fit"
                      disabled={connectCustomEmailMutation.isPending}
                      onClick={() => connectCustomEmailMutation.mutate(customEmailConfig)}
                    >
                      {connectCustomEmailMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                      Connect SMTP
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Standard Integrations Grid */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrationCards.map((card) => {
                const integration = integrations.find(i => i.provider === card.id);
                const isConnected = !!integration;

                return (
                  <Card key={card.id} className={`group hover:shadow-md transition-all duration-300 border-border/60 ${isConnected ? 'border-primary/20 bg-primary/5' : ''}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                          <card.icon className="h-6 w-6" />
                        </div>
                        {card.badge ? (
                          <Badge variant="secondary" className="text-xs">{card.badge}</Badge>
                        ) : isConnected ? (
                          <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20">Active</Badge>
                        ) : (
                          <SwitchIcon connected={false} />
                        )}
                      </div>
                      <CardTitle className="mt-4">{card.name}</CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      {isConnected ? (
                        <Button
                          variant="outline"
                          className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                          onClick={() => disconnectProviderMutation.mutate(card.id)}
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          variant={card.badge ? "ghost" : "default"}
                          disabled={!!card.badge}
                          onClick={() => handleConnect(card.id)}
                        >
                          {card.badge ? "Coming Soon" : "Connect"}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="voice" className="mt-8">
          <Card className="border-border/60 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -z-10" />

            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <CardTitle>AI Voice Cloning</CardTitle>
              </div>
              <CardDescription>
                Upload a voice sample to enable your AI assistant to send hyper-personalized voice notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 space-y-4">
                  <div className="p-4 border rounded-xl bg-card/50 space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" />
                      Requirements
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                      <li>Clear audio, no background noise</li>
                      <li>Natural speaking pace</li>
                      <li>Minimum 30 seconds length</li>
                      <li>MP3 or WAV format</li>
                    </ul>
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <div
                    className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-muted/20"
                    onClick={() => voiceInputRef.current?.click()}
                  >
                    <input
                      ref={voiceInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleVoiceFileSelect}
                    />
                    <div className="h-12 w-12 rounded-full bg-background border shadow-sm flex items-center justify-center mb-4 text-primary">
                      {isUploadingVoice ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                    </div>
                    <h3 className="font-semibold mb-1">Upload Voice Sample</h3>
                    <p className="text-sm text-muted-foreground">Click to browse or drag & drop</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SwitchIcon({ connected }: { connected: boolean }) {
  return (
    <div className={`w-3 h-3 rounded-full ${connected ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
  );
}
