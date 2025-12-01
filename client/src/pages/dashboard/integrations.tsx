import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ImportingLeadsAnimation } from "@/components/ImportingLeadsAnimation";
import { VoiceMinutesWidget } from "@/components/VoiceMinutesWidget";
import { InstagramComingSoonModal } from "@/components/instagram-coming-soon-modal";
import { useCanAccessInstagramDM } from "@/hooks/use-access-gate";
import {
  Instagram,
  Mail,
  Check,
  AlertCircle,
  Upload,
  Play,
  Mic,
  Shield,
  Loader2,
  FileText,
  Sparkles,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface VoiceBalance {
  locked: boolean;
  balance?: number;
  used?: number;
}

interface ImportResult {
  leadsImported: number;
  messagesImported: number;
}

const channelIcons = {
  instagram: Instagram,
  gmail: SiGoogle,
};

export default function IntegrationsPage() {
  const [voiceConsent, setVoiceConsent] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);
  const [importingChannel, setImportingChannel] = useState<"instagram" | "email" | null>(null);
  const [showAllSetDialog, setShowAllSetDialog] = useState(false);
  const [allSetChannel, setAllSetChannel] = useState<string>("");
  const [showInstagramComingSoon, setShowInstagramComingSoon] = useState(false);
  const [customEmailConfig, setCustomEmailConfig] = useState({
    smtpHost: '',
    smtpPort: '587',
    email: '',
    password: ''
  });
  const voiceInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Access control hooks
  const { canAccess: canAccessInstagram } = useCanAccessInstagramDM();

  // Fetch user data to check plan
  const { data: userData } = useQuery<UserData | null>({
    queryKey: ["/api/user"],
  });

  // Fetch integrations from backend
  const { data: integrationsData, isLoading } = useQuery<IntegrationsResponse>({
    queryKey: ["/api/integrations"],
  });

  const integrations = integrationsData?.integrations ?? [];

  // Get user's plan and lead limits
  const userPlan = userData?.user?.subscriptionTier || 'free';
  const isFreeTrial = userPlan === 'free' || !userData?.user?.subscriptionTier;
  const currentLeadCount = userData?.user?.totalLeads || 0;
  const leadsLimit = isFreeTrial ? 500 : (userPlan === 'starter' ? 2500 : userPlan === 'pro' ? 7000 : 20000);
  const leadUsagePercentage = (currentLeadCount / leadsLimit) * 100;
  const isNearLimit = leadUsagePercentage >= 80; // 80% threshold
  const isAtLimit = currentLeadCount >= leadsLimit;

  // Fetch voice balance to check if locked
  const { data: voiceBalance } = useQuery<VoiceBalance>({
    queryKey: ["/api/voice/balance"],
    refetchInterval: 30000,
  });

  const isVoiceLocked = voiceBalance?.locked || false;

  // Voice upload mutation
  const uploadVoiceMutation = useMutation({
    mutationFn: async (file: File) => {
      // Check if voice is locked before upload
      if (isVoiceLocked) {
        throw new Error("Voice minutes depleted. Please top up to continue.");
      }

      const formData = new FormData();
      formData.append("voice", file);

      const response = await fetch("/api/uploads/voice", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Voice sample uploaded",
        description: `Successfully uploaded ${data.fileName}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // PDF upload mutation
  const uploadPDFMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await fetch("/api/uploads/pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "PDF uploaded",
        description: `Processing ${data.fileName} for brand knowledge`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Connect provider mutation
  const connectProviderMutation = useMutation({
    mutationFn: async ({ provider, credentials }: { provider: string; credentials: Record<string, unknown> }) => {
      const response = await apiRequest("POST", `/api/integrations/${provider}/connect`, credentials);
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Connected successfully",
        description: `${variables.provider} has been connected`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Disconnect provider mutation
  const disconnectProviderMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest("POST", `/api/integrations/${provider}/disconnect`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Disconnected",
        description: "Integration has been disconnected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
  });

  // Connect custom email mutation
  const connectCustomEmailMutation = useMutation({
    mutationFn: async (config: typeof customEmailConfig) => {
      const response = await apiRequest("POST", "/api/custom-email/connect", config);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Custom Email Connected",
        description: "Your business email has been connected successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      setCustomEmailConfig({ smtpHost: '', smtpPort: '587', email: '', password: '' });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Import leads mutation
  const importLeadsMutation = useMutation<ImportResult, Error, string>({
    mutationFn: async (provider: string) => {
      const response = await apiRequest("POST", `/api/ai/import/${provider}`);
      return response.json();
    },
    onSuccess: (data, provider) => {
      const channelMap: Record<string, string> = {
        instagram: "Instagram",
        gmail: "Email"
      };

      setImportingChannel(null);
      setAllSetChannel(channelMap[provider] || provider);
      setShowAllSetDialog(true);

      // Check if user is on free trial and approaching/hit limit
      const isFreeTrial = !userData?.user?.subscriptionTier || userData?.user?.subscriptionTier === 'free';
      const newTotal = (userData?.user?.totalLeads || 0) + data.leadsImported;
      const hitFreeLimit = isFreeTrial && newTotal >= 500;
      const nearLimit = isFreeTrial && newTotal >= 400 && newTotal < 500;

      toast({
        title: "Import Complete",
        description: hitFreeLimit 
          ? `🎉 Imported ${data.leadsImported} leads! You've reached your 500 free leads. Upgrade to import unlimited!`
          : nearLimit
          ? `Imported ${data.leadsImported} leads (${newTotal}/500 total). ${500 - newTotal} remaining on free trial!`
          : `Imported ${data.leadsImported} leads and ${data.messagesImported} messages from ${channelMap[provider] || provider}`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      setImportingChannel(null);
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVoiceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an MP3, WAV, or M4A file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Voice samples must be under 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingVoice(true);
    try {
      await uploadVoiceMutation.mutateAsync(file);
    } finally {
      setIsUploadingVoice(false);
      if (voiceInputRef.current) voiceInputRef.current.value = "";
    }
  };

  const handlePDFFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "PDFs must be under 50MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingPDF(true);
    try {
      await uploadPDFMutation.mutateAsync(file);
    } finally {
      setIsUploadingPDF(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  const handleConnect = async (provider: string) => {
    try {
      // Get OAuth URL from backend for all providers
      const response = await fetch(`/api/connect/${provider}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to connect ${provider}`);
      }

      const { authUrl } = await response.json();

      if (!authUrl) {
        throw new Error(`No authorization URL received for ${provider}`);
      }

      // Open OAuth URL in popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        `${provider}-oauth`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=yes,status=yes`
      );

      // Check if popup was blocked
      if (!popup) {
        // Fallback to redirect in same window
        if (confirm(`Popup was blocked. Open ${provider} authorization in this window?`)) {
          window.location.href = authUrl;
        }
        return;
      }

      // Poll to check if popup is closed and refresh data
      const checkInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkInterval);
          // Refresh integrations data after a short delay
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
            // Also check connection status
            checkProviderStatus(provider);
          }, 1500);
        }
      }, 1000);
    } catch (error) {
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : `Failed to connect ${provider}`,
        variant: "destructive",
      });
    }
  };

  const checkProviderStatus = async (provider: string) => {
    try {
      const response = await fetch(`/api/oauth/${provider}/status`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.connected) {
          toast({
            title: `${provider} Connected`,
            description: data.email || data.username || `Successfully connected to ${provider}`,
          });
        }
      }
    } catch (error) {
      console.error(`Error checking ${provider} status:`, error);
    }
  };

  const handleDisconnect = (provider: string) => {
    if (confirm(`Are you sure you want to disconnect ${provider}?`)) {
      disconnectProviderMutation.mutate(provider);
    }
  };

  const handleSyncNow = (provider: string) => {
    const channelMap: Record<string, "instagram" | "email"> = {
      instagram: "instagram",
      gmail: "email"
    };

    // Map provider to backend endpoint
    const providerToEndpoint: Record<string, string> = {
      instagram: "instagram",
      gmail: "gmail"
    };

    // Check if the channel is actually connected
    const integration = integrations.find((i) => i.provider === provider);
    if (!integration || !integration.connected) {
      toast({
        title: "Channel Not Connected",
        description: `⚠️ Please connect your ${provider === 'gmail' ? 'Email' : provider.charAt(0).toUpperCase() + provider.slice(1)} account first before importing leads. Click "Connect" above to get started.`,
        variant: "default",
        duration: 5000,
      });
      return;
    }

    setImportingChannel(channelMap[provider]);
    importLeadsMutation.mutate(providerToEndpoint[provider]);
  };

  // Check if voice sample has been uploaded
  const hasVoiceSample = integrations.some((i) =>
    i.provider === "voice" || uploadVoiceMutation.isSuccess
  );

  const voiceMinutesUsed = 89;
  const voiceMinutesLimit = 400;
  const voicePercentage = (voiceMinutesUsed / voiceMinutesLimit) * 100;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-integrations">
          Integrations
        </h1>
        <p className="text-muted-foreground mt-1">
          Connect your channels and set up voice cloning
        </p>
      </div>

      {/* Security Notice */}
      <Card className="border-primary/20 bg-primary/5" data-testid="card-security-notice">
        <CardContent className="flex items-start gap-3 p-4">
          <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-primary">Your data is encrypted</p>
            <p className="text-sm text-muted-foreground mt-1">
              All tokens are encrypted with AES-256-GCM and stored securely. You can revoke access anytime.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Free Trial Lead Limit Banner */}
      {isFreeTrial && (
        <Card className={`${isAtLimit ? 'border-amber-500/50 bg-amber-500/5' : isNearLimit ? 'border-blue-500/50 bg-blue-500/5' : 'border-emerald-500/50 bg-emerald-500/5'}`} data-testid="card-lead-limit">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Sparkles className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isAtLimit ? 'text-amber-500' : isNearLimit ? 'text-blue-500' : 'text-emerald-500'}`} />
                  <div className="flex-1">
                    <p className={`font-semibold ${isAtLimit ? 'text-amber-700 dark:text-amber-300' : isNearLimit ? 'text-blue-700 dark:text-blue-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                      {isAtLimit ? '🎉 Free Trial Limit Reached!' : isNearLimit ? '💫 Almost There!' : '🚀 Free Trial Active'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isAtLimit 
                        ? `You've imported ${currentLeadCount} leads on us! Upgrade to continue importing.`
                        : `${currentLeadCount} / ${leadsLimit} leads imported • ${leadsLimit - currentLeadCount} remaining`
                      }
                    </p>
                  </div>
                </div>
                {(isAtLimit || isNearLimit) && (
                  <Button 
                    size="sm" 
                    onClick={() => window.location.href = '/dashboard/pricing'}
                    className={isAtLimit ? 'bg-amber-500 hover:bg-amber-600' : ''}
                  >
                    {isAtLimit ? 'Upgrade Now' : 'View Plans'}
                  </Button>
                )}
              </div>
              
              {/* Progress Bar */}
              <div>
                <Progress 
                  value={leadUsagePercentage} 
                  className={`h-2 ${isAtLimit ? 'bg-amber-500/20' : isNearLimit ? 'bg-blue-500/20' : 'bg-emerald-500/20'}`}
                />
              </div>

              {!isAtLimit && (
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">✨ What you get with paid plans:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li><strong>Starter ($49.99/mo):</strong> 2,500 leads/month + 100 voice minutes</li>
                    <li><strong>Pro ($99.99/mo):</strong> 7,000 leads/month + 400 voice minutes</li>
                    <li><strong>Enterprise ($199.99/mo):</strong> 20,000 leads/month + 1,000 voice minutes</li>
                  </ul>
                </div>
              )}

              {isAtLimit && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    🎁 <strong>Special Offer:</strong> Upgrade now and keep all {currentLeadCount} leads + import thousands more!
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    All your conversations and AI insights are preserved when you upgrade.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channel Integrations */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Connected Channels</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["instagram"].map((providerId, index) => {
              const integration = integrations.find((i) => i.provider === providerId);
              const isConnected = !!integration;
              const Icon = channelIcons[providerId as keyof typeof channelIcons];

              return (
                <motion.div
                  key={providerId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Instagram - Locked for free/trial users */}
                  {providerId === "instagram" && !canAccessInstagram && (
                    <Card
                      className="relative hover-elevate border-gray-500/30 bg-gray-500/5"
                      data-testid={`card-integration-${providerId}`}
                    >
                      {/* Blur overlay */}
                      <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-black/5 rounded-lg flex items-center justify-center">
                        <div className="text-center p-6 bg-background/95 rounded-xl border shadow-lg max-w-xs mx-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
                            <Lock className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-lg mb-2">Instagram Automation</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Upgrade to any paid plan to connect Instagram DMs and automate lead follow-ups
                          </p>
                          <Button 
                            size="sm" 
                            onClick={() => window.location.href = '/dashboard/pricing'}
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                          >
                            Upgrade to Unlock
                          </Button>
                        </div>
                      </div>
                      <CardHeader className="opacity-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-pink-500/10">
                              <Instagram className="h-6 w-6 text-pink-500" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base">Instagram</CardTitle>
                              <CardDescription className="text-sm">
                                DM automation with Meta API integration
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="opacity-50 space-y-3">
                        <Button className="w-full" disabled>
                          Connect Instagram
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Instagram - Coming soon for paid users */}
                  {providerId === "instagram" && canAccessInstagram && (
                    <Card
                      className="hover-elevate border-pink-500/30 bg-pink-500/5 cursor-pointer transition-all"
                      data-testid={`card-integration-${providerId}`}
                      onClick={() => setShowInstagramComingSoon(true)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-pink-500/10">
                              <Instagram className="h-6 w-6 text-pink-500" data-testid={`icon-${providerId}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base" data-testid={`text-name-${providerId}`}>
                                  Instagram
                                </CardTitle>
                                <Badge variant="secondary" className="text-xs bg-pink-500/10 text-pink-600">Coming Q4 2025</Badge>
                              </div>
                              <CardDescription className="text-sm">
                                Meta API verification in progress • CSV import available now
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="p-4 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-0.5" />
                            <div className="text-xs space-y-1">
                              <p className="font-semibold text-pink-800 dark:text-pink-300">Available Now: CSV Import</p>
                              <p className="text-pink-700 dark:text-pink-400">Start automating while OAuth is in setup:</p>
                              <ul className="list-disc list-inside space-y-0.5 ml-2">
                                <li><strong>Export Instagram DMs</strong> from your phone/desktop</li>
                                <li><strong>Upload CSV</strong> with name, username, last message</li>
                                <li><strong>AI starts working immediately</strong></li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        <Button
                          className="w-full bg-pink-500 hover:bg-pink-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = '/dashboard/lead-import';
                          }}
                          data-testid={`button-csv-import-${providerId}`}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Import Instagram CSV Now
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  {/* WhatsApp - Locked for free/trial users */}
                  {providerId === "whatsapp" && !canAccessWhatsApp && (
                    <Card
                      className="relative hover-elevate border-gray-500/30 bg-gray-500/5"
                      data-testid={`card-integration-${providerId}`}
                    >
                      {/* Blur overlay */}
                      <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-black/5 rounded-lg flex items-center justify-center">
                        <div className="text-center p-6 bg-background/95 rounded-xl border shadow-lg max-w-xs mx-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-3">
                            <Lock className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-lg mb-2">WhatsApp Automation</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Upgrade to any paid plan to connect WhatsApp and automate lead follow-ups
                          </p>
                          <Button 
                            size="sm" 
                            onClick={() => window.location.href = '/dashboard/pricing'}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                          >
                            Upgrade to Unlock
                          </Button>
                        </div>
                      </div>
                      <CardHeader className="opacity-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                              <SiWhatsapp className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base">WhatsApp</CardTitle>
                              <CardDescription className="text-sm">
                                OTP sent by WhatsApp • No credentials stored
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="opacity-50 space-y-3">
                        <Button className="w-full" disabled>
                          Connect WhatsApp
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* WhatsApp - Unlocked for paid users */}
                  {providerId === "whatsapp" && canAccessWhatsApp && (
                    <Card
                      className={`hover-elevate ${isConnected ? "border-emerald-500/50" : ""}`}
                      data-testid={`card-integration-${providerId}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                              <SiWhatsapp className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base">WhatsApp</CardTitle>
                              <CardDescription className="text-sm">
                                OTP sent by WhatsApp • No credentials stored
                              </CardDescription>
                            </div>
                          </div>
                          {isConnected && (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 flex-shrink-0" data-testid={`badge-connected-${providerId}`}>
                              <Check className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {isConnected ? (
                          <>
                            <div className="text-sm space-y-2">
                              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="font-medium">Connected • Importing leads...</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                WhatsApp conversations are encrypted and being imported
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleDisconnect(providerId)}
                                disabled={disconnectProviderMutation.isPending}
                              >
                                Disconnect
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleSyncNow(providerId)}
                                disabled={importLeadsMutation.isPending}
                              >
                                Sync Now
                              </Button>
                            </div>
                          </>
                        ) : (
                          <Button
                            className="w-full bg-green-500 hover:bg-green-600"
                            onClick={() => handleConnect(providerId)}
                            disabled={connectProviderMutation.isPending}
                          >
                            {connectProviderMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Connect WhatsApp
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Email - Available to all users */}
                  {providerId === "gmail" && (
                    <Card
                      className={`hover-elevate ${isConnected ? "border-emerald-500/50" : ""}`}
                      data-testid={`card-integration-${providerId}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Icon className="h-6 w-6 text-primary" data-testid={`icon-${providerId}`} />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base capitalize" data-testid={`text-name-${providerId}`}>
                                Business Email
                              </CardTitle>
                              <CardDescription className="text-sm">
                                Connect your business email for automated follow-ups
                              </CardDescription>
                            </div>
                          </div>
                          {isConnected && (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 flex-shrink-0" data-testid={`badge-connected-${providerId}`}>
                              <Check className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {isConnected ? (
                          <>
                            <div className="text-sm space-y-2">
                              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="font-medium">Connected • Importing leads...</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Email conversations are being securely synced
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleDisconnect(providerId)}
                                disabled={disconnectProviderMutation.isPending}
                                data-testid={`button-disconnect-${providerId}`}
                              >
                                {disconnectProviderMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Disconnect"
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleSyncNow(providerId)}
                                disabled={importLeadsMutation.isPending}
                                data-testid={`button-sync-${providerId}`}
                              >
                                {importLeadsMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Sync Now"
                                )}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => handleConnect(providerId)}
                            disabled={connectProviderMutation.isPending}
                            data-testid={`button-connect-${providerId}`}
                          >
                            {connectProviderMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Connect Email
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Email - Available to all users (Free & Paid) */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Email Integration</h2>
        <Card data-testid="card-custom-email">
          <CardHeader>
            <CardTitle>Connect Custom Email</CardTitle>
            <CardDescription>
              Import and automate email responses from your custom domain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="smtp-host">SMTP Server</Label>
                <Input
                  id="smtp-host"
                  type="text"
                  placeholder="smtp.yourdomain.com"
                  value={customEmailConfig.smtpHost}
                  onChange={(e) => setCustomEmailConfig({ ...customEmailConfig, smtpHost: e.target.value })}
                  data-testid="input-smtp-host"
                />
              </div>
              <div>
                <Label htmlFor="smtp-port">Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  placeholder="587"
                  value={customEmailConfig.smtpPort}
                  onChange={(e) => setCustomEmailConfig({ ...customEmailConfig, smtpPort: e.target.value })}
                  data-testid="input-smtp-port"
                />
              </div>
              <div>
                <Label htmlFor="smtp-email">Email Address</Label>
                <Input
                  id="smtp-email"
                  type="email"
                  placeholder="you@yourbusiness.com"
                  value={customEmailConfig.email}
                  onChange={(e) => setCustomEmailConfig({ ...customEmailConfig, email: e.target.value })}
                  data-testid="input-smtp-email"
                />
              </div>
              <div>
                <Label htmlFor="smtp-password">Password / App Password</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  placeholder="••••••••"
                  value={customEmailConfig.password}
                  onChange={(e) => setCustomEmailConfig({ ...customEmailConfig, password: e.target.value })}
                  data-testid="input-smtp-password"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">Secure Storage</p>
                  <p className="text-amber-700 dark:text-amber-400">Your credentials are encrypted with AES-256-GCM</p>
                  <p className="text-amber-700 dark:text-amber-400">Only used to import and send emails on your behalf</p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={() => connectCustomEmailMutation.mutate(customEmailConfig)}
              disabled={!customEmailConfig.smtpHost || !customEmailConfig.email || !customEmailConfig.password || connectCustomEmailMutation.isPending}
              data-testid="button-connect-custom-email"
            >
              {connectCustomEmailMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {connectCustomEmailMutation.isPending ? 'Connecting...' : 'Connect Custom Email'}
            </Button>

            <div className="text-xs text-muted-foreground">
              <p className="font-semibold mb-2">✅ Works with:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Google Workspace • Microsoft 365 • Any custom SMTP</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Voice Clone Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Voice Clone Setup</h2>
          <Card data-testid="card-voice-setup">
          <CardHeader>
            <CardTitle>AI Voice Messaging</CardTitle>
            <CardDescription>
              Upload a short voice sample to enable AI voice replies that sound like you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Voice Minutes Used</span>
                <span className="text-sm text-muted-foreground" data-testid="text-voice-usage">
                  {voiceMinutesUsed} / {voiceMinutesLimit} minutes
                </span>
              </div>
              <Progress value={voicePercentage} className="h-2" data-testid="progress-voice-minutes" />
            </div>

            {/* Upload Section */}
            <div className="space-y-4">
              <input
                ref={voiceInputRef}
                type="file"
                accept="audio/mpeg,audio/wav,audio/x-m4a,audio/mp4,.mp3,.wav,.m4a"
                onChange={handleVoiceFileSelect}
                className="hidden"
                data-testid="input-voice-file"
              />

              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                {hasVoiceSample && !isUploadingVoice ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-emerald-500">
                      <Check className="h-5 w-5" />
                      <span className="font-medium" data-testid="text-voice-uploaded">Voice sample uploaded</span>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => voiceInputRef.current?.click()}
                        data-testid="button-upload-new"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New
                      </Button>
                    </div>
                  </div>
                ) : isUploadingVoice ? (
                  <div className="space-y-3">
                    <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                    <p className="font-medium">Uploading voice sample...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Mic className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-medium">Upload voice sample</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Record or upload a 30-60 second audio clip (MP3, WAV, or M4A)
                      </p>
                    </div>
                    <Button
                      onClick={() => voiceInputRef.current?.click()}
                      disabled={isVoiceLocked}
                      data-testid="button-upload-voice"
                    >
                      {isVoiceLocked ? <Lock className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                      {isVoiceLocked ? "Top Up Required" : "Upload Audio"}
                    </Button>
                    {isVoiceLocked && (
                      <p className="text-xs text-red-500 text-center mt-2">
                        🔒 Voice minutes depleted. Top up to upload voice samples.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Consent */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
                <Checkbox
                  id="voice-consent"
                  checked={voiceConsent}
                  onCheckedChange={(checked) => setVoiceConsent(checked as boolean)}
                  data-testid="checkbox-voice-consent"
                />
                <label
                  htmlFor="voice-consent"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  I consent to Audnix AI using my voice sample to generate AI voice messages for
                  lead follow-ups. I understand this voice clone will only be used for my account
                  and can be deleted at any time.
                </label>
              </div>

              {/* Activate */}
              <Button
                className="w-full"
                disabled={!voiceConsent || !hasVoiceSample || isVoiceLocked}
                data-testid="button-activate-voice"
              >
                {isVoiceLocked ? "🔒 Top Up Required" : hasVoiceSample && voiceConsent ? "Voice Clone Active" : "Activate Voice Clone"}
              </Button>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Voice cloning uses advanced AI to replicate your natural speaking patterns and tone.
                For best results, speak clearly and naturally in your recording.
              </p>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Voice Minutes Tracker */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Usage Tracking</h2>
          <VoiceMinutesWidget />
        </div>
      </div>

      {/* PDF Upload for Brand Knowledge */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Brand Knowledge</h2>
        <Card data-testid="card-pdf-upload">
          <CardHeader>
            <CardTitle>Upload Brand Documents</CardTitle>
            <CardDescription>
              Upload PDFs to teach the AI about your brand, products, and services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handlePDFFileSelect}
              className="hidden"
              data-testid="input-pdf-file"
            />

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              {isUploadingPDF ? (
                <div className="space-y-3">
                  <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                  <p className="font-medium">Processing PDF...</p>
                  <p className="text-sm text-muted-foreground">
                    Extracting text and generating embeddings
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Upload PDF Documents</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Brand guidelines, product specs, FAQs, etc. (Max 50MB)
                    </p>
                  </div>
                  <Button
                    onClick={() => pdfInputRef.current?.click()}
                    data-testid="button-upload-pdf"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload PDF
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Importing Leads Animation */}
      <AnimatePresence>
        {importingChannel && (
          <ImportingLeadsAnimation
            channel={importingChannel}
            isImporting={!!importingChannel}
            onComplete={() => setImportingChannel(null)}
          />
        )}
      </AnimatePresence>

      {/* All Set Dialog */}
      <Dialog open={showAllSetDialog} onOpenChange={setShowAllSetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
                className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center"
              >
                <Sparkles className="h-10 w-10 text-emerald-500" />
              </motion.div>
              <div>
                <DialogTitle className="text-2xl font-bold">All Set!</DialogTitle>
                <DialogDescription className="text-lg mt-2">
                  AI will start working on your {allSetChannel} leads
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="text-center space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Intelligent follow-ups and engagement analysis are now active
            </p>
            {isFreeTrial && (
              <div className="space-y-2">
                {isAtLimit ? (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      🎉 You've imported {currentLeadCount} leads on us!
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      Upgrade to continue importing and unlock unlimited leads
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    💡 Free trial: {currentLeadCount}/{leadsLimit} leads imported • {leadsLimit - currentLeadCount} remaining
                  </p>
                )}
                {(isAtLimit || isNearLimit) && (
                  <Button 
                    size="sm" 
                    variant={isAtLimit ? "default" : "outline"}
                    onClick={() => {
                      setShowAllSetDialog(false);
                      window.location.href = '/dashboard/pricing';
                    }}
                    className="w-full"
                  >
                    {isAtLimit ? 'Upgrade to Import More' : 'View Upgrade Options'}
                  </Button>
                )}
              </div>
            )}
            <Button onClick={() => setShowAllSetDialog(false)} className="w-full" variant={isAtLimit ? "outline" : "default"}>
              {isAtLimit ? 'Continue' : 'Got it!'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Instagram Coming Soon Modal - Only opens on click */}
      {!canAccessInstagram ? (
        <InstagramComingSoonModal 
          open={showInstagramComingSoon} 
          onOpenChange={setShowInstagramComingSoon}
        />
      ) : null}
    </div>
  );
}