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
} from "lucide-react";
import { SiWhatsapp, SiGoogle } from "react-icons/si";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const channelIcons = {
  instagram: Instagram,
  whatsapp: SiWhatsapp,
  gmail: SiGoogle,
  outlook: Mail,
};

export default function IntegrationsPage() {
  const [voiceConsent, setVoiceConsent] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);
  const [importingChannel, setImportingChannel] = useState<"instagram" | "whatsapp" | "email" | null>(null);
  const [showAllSetDialog, setShowAllSetDialog] = useState(false);
  const [allSetChannel, setAllSetChannel] = useState<string>("");
  const voiceInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch integrations from backend
  const { data: integrationsData, isLoading } = useQuery({
    queryKey: ["/api/integrations"],
  });

  const integrations = integrationsData?.integrations ?? [];

  // Voice upload mutation
  const uploadVoiceMutation = useMutation({
    mutationFn: async (file: File) => {
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
    mutationFn: async ({ provider, credentials }: { provider: string; credentials: any }) => {
      return await apiRequest(`/api/integrations/${provider}/connect`, {
        method: "POST",
        body: JSON.stringify(credentials),
      });
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
      return await apiRequest(`/api/integrations/${provider}/disconnect`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Disconnected",
        description: "Integration has been disconnected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
  });

  // Import leads mutation
  const importLeadsMutation = useMutation({
    mutationFn: async (provider: string) => {
      return await apiRequest(`/api/ai/import/${provider}`, {
        method: "POST",
      });
    },
    onSuccess: (data, provider) => {
      const channelMap: Record<string, string> = {
        instagram: "Instagram",
        whatsapp: "WhatsApp",
        gmail: "Email"
      };
      
      setImportingChannel(null);
      setAllSetChannel(channelMap[provider] || provider);
      setShowAllSetDialog(true);
      
      toast({
        title: "Import Complete",
        description: `Imported ${data.leadsImported} leads and ${data.messagesImported} messages from ${channelMap[provider] || provider}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
    onError: (error: Error, provider) => {
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
    const channelMap: Record<string, "instagram" | "whatsapp" | "email"> = {
      instagram: "instagram",
      whatsapp: "whatsapp",
      gmail: "email",
      outlook: "email"
    };
    
    // Map provider to backend endpoint (gmail/outlook -> gmail for backend)
    const providerToEndpoint: Record<string, string> = {
      instagram: "instagram",
      whatsapp: "whatsapp",
      gmail: "gmail",
      outlook: "gmail"  // Both gmail and outlook use the gmail endpoint
    };
    
    setImportingChannel(channelMap[provider]);
    importLeadsMutation.mutate(providerToEndpoint[provider]);
  };

  // Check if voice sample has been uploaded
  const hasVoiceSample = integrations.some((i: any) => 
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

      {/* Channel Integrations */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Connected Channels</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["instagram", "whatsapp", "gmail", "outlook"].map((providerId, index) => {
              const integration = integrations.find((i: any) => i.provider === providerId);
              const isConnected = !!integration;
              const Icon = channelIcons[providerId as keyof typeof channelIcons];

              return (
                <motion.div
                  key={providerId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={`hover-elevate ${
                      isConnected ? "border-emerald-500/50" : ""
                    }`}
                    data-testid={`card-integration-${providerId}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-6 w-6 text-primary" data-testid={`icon-${providerId}`} />
                          </div>
                          <div>
                            <CardTitle className="text-base capitalize" data-testid={`text-name-${providerId}`}>
                              {providerId}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {providerId === "instagram" && "Connect Instagram DMs for automated follow-ups"}
                              {providerId === "whatsapp" && "Sync WhatsApp Business conversations"}
                              {providerId === "gmail" && "Connect Gmail for email automation"}
                              {providerId === "outlook" && "Connect Outlook for email automation"}
                            </CardDescription>
                          </div>
                        </div>
                        {isConnected && (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500" data-testid={`badge-connected-${providerId}`}>
                            <Check className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {isConnected ? (
                        <>
                          <div className="text-sm space-y-1">
                            <p className="text-muted-foreground">
                              Account: <span className="font-medium text-foreground" data-testid={`text-account-${providerId}`}>{integration.accountType || "Connected"}</span>
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
                          Connect {providerId}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Voice Clone Setup */}
      <div>
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
                      data-testid="button-upload-voice"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Audio
                    </Button>
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
                disabled={!voiceConsent || !hasVoiceSample}
                data-testid="button-activate-voice"
              >
                {hasVoiceSample && voiceConsent ? "Voice Clone Active" : "Activate Voice Clone"}
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
            <Button onClick={() => setShowAllSetDialog(false)} className="w-full">
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
