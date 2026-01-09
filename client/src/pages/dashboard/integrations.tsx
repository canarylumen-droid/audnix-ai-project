
import { useState, useRef } from "react";
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
  Unplug
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
    description: "Sync emails, calendar, and contacts via OAuth 2.0.",
    icon: SiGoogle,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    do: "store",
    id: "shopify",
    name: "Shopify Engine",
    description: "Initialize store data for product intelligence.",
    icon: SiShopify,
    color: "text-green-500",
    bg: "bg-green-500/10",
    badge: "Beta"
  },
  {
    do: "crm",
    id: "hubspot",
    name: "HubSpot Node",
    description: "Bi-directional neural sync for core deals.",
    icon: SiHubspot,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    badge: "Queued"
  },
  {
    do: "notify",
    id: "slack",
    name: "Slack Grid",
    description: "Real-time protocol alerts for high-value leads.",
    icon: SiSlack,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    badge: "Queued"
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
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  const { data: userData } = useQuery<UserData | null>({ queryKey: ["/api/user"] });
  const { data: integrationsData, isLoading } = useQuery<IntegrationsResponse>({ queryKey: ["/api/integrations"] });
  const { data: customEmailStatus } = useQuery<{ connected: boolean; email: string | null; provider: string }>({ queryKey: ["/api/custom-email/status"] });

  const integrations = integrationsData?.integrations ?? [];
  const isCustomEmailConnected = customEmailStatus?.connected || false;

  const { canAccess: canAccessVoiceNotes } = useCanAccessVoiceNotes();

  const disconnectProviderMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest("POST", `/api/integrations/${provider}/disconnect`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({ title: "Protocol Terminated", description: "Integration disconnected successfully." });
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
      toast({ title: "Infrastructure Online", description: "SMTP relay successfully established." });
    },
    onError: (error: Error) => {
      toast({ title: "Connection Failed", description: error.message, variant: "destructive" });
    }
  });

  const disconnectCustomEmailMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/custom-email/disconnect"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-email/status"] });
      toast({ title: "Relay Offline" });
    }
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
      toast({ title: "Voice Profile Cloned", description: "Neural replication parameters initialized." });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
    onError: () => toast({ title: "Cloning Failed", variant: "destructive" })
  });

  const handleConnect = async (provider: string) => {
    try {
      const response = await fetch(`/api/connect/${provider}`);
      const { authUrl } = await response.json();
      if (authUrl) window.location.href = authUrl;
    } catch (e) {
      toast({ title: "Handshake Failed", description: "Could not initiate OAuth sequence.", variant: "destructive" });
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
    <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">Global Infrastructure</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase italic">
            EXTERN <span className="text-primary not-italic">NODES.</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="h-14 px-8 rounded-2xl border-white/5 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest italic">
            <FileText className="mr-3 h-4 w-4" /> Documentation
          </Button>
          <Button className="h-14 px-8 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-primary hover:text-white transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)]">
            <Plus className="mr-3 h-4 w-4" /> Request Module
          </Button>
        </div>
      </div>

      <Tabs defaultValue="connected" className="w-full">
        <TabsList className="bg-white/[0.02] border border-white/5 p-1 rounded-2xl md:w-fit mb-12">
          <TabsTrigger value="connected" className="rounded-xl px-10 py-3 data-[state=active]:bg-white data-[state=active]:text-black text-white/40 font-black uppercase text-[10px] tracking-widest transition-all">
            Core Apps
          </TabsTrigger>
          <TabsTrigger value="voice" className="rounded-xl px-10 py-3 data-[state=active]:bg-white data-[state=active]:text-black text-white/40 font-black uppercase text-[10px] tracking-widest transition-all">
            Neural Voice
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connected" className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
          {/* Email Infrastructure Card */}
          <section>
            <Card className={`group relative rounded-[3rem] border transition-all duration-700 overflow-hidden ${isCustomEmailConnected ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 'border-white/5 bg-white/[0.02]'}`}>
              {isCustomEmailConnected && <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-[100px] -z-10" />}

              <CardHeader className="p-10 md:p-14 border-b border-white/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-4 rounded-2xl ${isCustomEmailConnected ? 'bg-emerald-500/20 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                        <Mail className="h-8 w-8" />
                      </div>
                      <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">EMAIL RELAY PROTOCOL</h2>
                    </div>
                    <CardDescription className="text-white/40 font-bold text-lg max-w-2xl italic">
                      Initialize private SMTP/IMAP clusters for uncapped autonomous delivery.
                    </CardDescription>
                  </div>
                  {isCustomEmailConnected ? (
                    <Badge className="bg-emerald-500 text-black border-0 font-black px-6 py-2 rounded-full uppercase italic tracking-widest text-[10px]">
                      INFRASTRUCTURE ONLINE
                    </Badge>
                  ) : (
                    <Badge className="bg-white/5 text-white/40 border-white/10 font-black px-6 py-2 rounded-full uppercase italic tracking-widest text-[10px]">
                      SYSTEM STANDBY
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-10 md:p-14">
                {isCustomEmailConnected && !isEditingCustomEmail ? (
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white/[0.03] p-10 rounded-[2.5rem] border border-white/5 group-hover:border-emerald-500/20 transition-all duration-700">
                    <div className="flex items-center gap-8 mb-8 md:mb-0">
                      <div className="h-20 w-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 relative">
                        <CheckCircle2 className="h-10 w-10" />
                        <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-white italic truncate max-w-md">{customEmailStatus?.email || "Relay Active"}</p>
                        <p className="text-sm text-white/40 font-black uppercase tracking-widest mt-1 italic">Authorized Delivery Channel</p>
                      </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                      <Button variant="outline" className="flex-1 md:flex-none h-14 px-8 rounded-xl border-white/5 bg-white/5 text-white/60 hover:text-white font-black uppercase text-[10px] tracking-widest italic" onClick={() => setIsEditingCustomEmail(true)}>
                        <Pencil className="h-4 w-4 mr-3" /> Reconfigure
                      </Button>
                      <Button variant="ghost" className="flex-1 md:flex-none h-14 px-8 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest italic" onClick={() => disconnectCustomEmailMutation.mutate()}>
                        <Unplug className="h-4 w-4 mr-3" /> Terminate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-12 max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {[
                        { label: "Relay Host", key: "smtpHost", placeholder: "smtp.relay.com" },
                        { label: "Relay Port", key: "smtpPort", placeholder: "587" },
                        { label: "Identity Email", key: "email", placeholder: "operator@venture.com" },
                        { label: "Security Token", key: "password", placeholder: "••••••••", type: "password" }
                      ].map((field) => (
                        <div key={field.key} className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2 italic">{field.label}</Label>
                          <Input
                            type={field.type || "text"}
                            placeholder={field.placeholder}
                            value={(customEmailConfig as any)[field.key]}
                            onChange={(e) => setCustomEmailConfig({ ...customEmailConfig, [field.key]: e.target.value })}
                            className="h-14 bg-white/[0.03] border-white/10 focus:border-primary/50 rounded-2xl font-bold px-6 text-white"
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      className="h-16 px-12 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] w-fit"
                      disabled={connectCustomEmailMutation.isPending}
                      onClick={() => connectCustomEmailMutation.mutate(customEmailConfig)}
                    >
                      {connectCustomEmailMutation.isPending ? <Loader2 className="mr-3 h-4 w-4 animate-spin" /> : <Zap className="mr-3 h-4 w-4" />}
                      INITIALIZE RELAY
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Standard Integrations Grid */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {integrationCards.map((card) => {
                const integration = integrations.find(i => i.provider === card.id);
                const isConnected = !!integration;

                return (
                  <Card key={card.id} className={`group hover:shadow-2xl transition-all duration-700 rounded-[2.5rem] border bg-white/[0.01] hover:scale-[1.02] ${isConnected ? 'border-primary/40 bg-primary/[0.03]' : 'border-white/5'}`}>
                    <CardHeader className="p-10">
                      <div className="flex justify-between items-start mb-8">
                        <div className={`p-5 rounded-2xl bg-white/[0.03] ${card.color} border border-white/5 group-hover:border-primary/30 transition-all duration-700`}>
                          <card.icon className="h-8 w-8" />
                        </div>
                        {card.badge ? (
                          <Badge className="bg-white/5 text-white/40 border-white/10 font-black uppercase text-[8px] tracking-[0.3em] italic py-1.5 px-3">{card.badge}</Badge>
                        ) : isConnected ? (
                          <Badge className="bg-emerald-500 text-black border-0 font-black uppercase text-[8px] tracking-widest italic py-1.5 px-3 animate-pulse">ACTIVE</Badge>
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-white/10" />
                        )}
                      </div>
                      <CardTitle className="text-xl font-black text-white uppercase italic tracking-tight">{card.name}</CardTitle>
                      <CardDescription className="text-white/40 font-bold mt-2 leading-relaxed">{card.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="p-10 pt-0">
                      {isConnected ? (
                        <Button
                          variant="outline"
                          className="w-full h-12 rounded-xl border-white/5 bg-white/5 text-white/40 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 font-black uppercase text-[10px] tracking-widest transition-all duration-500 italic"
                          onClick={() => disconnectProviderMutation.mutate(card.id)}
                        >
                          Terminate
                        </Button>
                      ) : (
                        <Button
                          className={`w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all duration-700 italic ${card.badge ? "bg-white/5 text-white/20 border-white/5 cursor-not-allowed" : "bg-white text-black hover:bg-primary hover:text-white"}`}
                          disabled={!!card.badge}
                          onClick={() => handleConnect(card.id)}
                        >
                          {card.badge ? "Locked" : "Initialize"}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="voice" className="animate-in fade-in slide-in-from-bottom-2 duration-700">
          <Card className="rounded-[3rem] border-white/5 bg-white/[0.02] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-64 bg-primary/5 rounded-full blur-[120px] -z-10" />

            <CardHeader className="p-10 md:p-14 border-b border-white/5">
              <div className="flex items-center gap-6 mb-4">
                <div className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="h-8 w-8" />
                </div>
                <CardTitle className="text-3xl font-black text-white uppercase italic tracking-tight">NEURAL VOICE CLONING</CardTitle>
              </div>
              <CardDescription className="text-white/40 font-bold text-lg max-w-3xl italic">
                Upload a spectral voice sample to enable your AI modules to execute high-fidelity audio replication for outreach.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10 md:p-14">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                  <div className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 space-y-6">
                    <h4 className="text-xs font-black text-primary uppercase tracking-[0.4em] italic mb-4">Replication Stability Requirements</h4>
                    <ul className="space-y-6">
                      {[
                        "Zero background static / interference",
                        "Monotone avoidance (Natural variance)",
                        "Minimum 45s of continuous logic/speech",
                        "High-bitrate WAV/MP3 format"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-4 text-white/60 font-medium italic">
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div
                  className="group relative border-2 border-dashed border-white/10 hover:border-primary/50 transition-all duration-700 rounded-[3rem] p-16 flex flex-col items-center justify-center text-center cursor-pointer bg-white/[0.01] overflow-hidden"
                  onClick={() => voiceInputRef.current?.click()}
                >
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <input
                    ref={voiceInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleVoiceFileSelect}
                  />
                  <div className="h-24 w-24 rounded-[2rem] bg-white text-black shadow-[0_20px_60px_-15px_rgba(255,255,255,0.3)] flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-700">
                    {isUploadingVoice ? <Loader2 className="h-10 w-10 animate-spin" /> : <Upload className="h-10 w-10" />}
                  </div>
                  <h3 className="text-xl font-black text-white uppercase italic mb-2 tracking-tight">INITIALIZE VOICE INJECTION</h3>
                  <p className="text-sm text-white/40 font-bold italic">Click to browse or drag neural audio sample</p>
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
