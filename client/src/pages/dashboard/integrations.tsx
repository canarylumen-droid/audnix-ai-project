import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Instagram,
  Mail,
  Check,
  AlertCircle,
  Upload,
  Play,
  Mic,
  Shield,
} from "lucide-react";
import { SiWhatsapp, SiGoogle } from "react-icons/si";

const integrations = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    description: "Connect Instagram DMs for automated follow-ups",
    isConnected: true,
    accountName: "@audnix_ai",
    lastSync: "2 minutes ago",
    messageVolume: 1248,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: SiWhatsapp,
    description: "Sync WhatsApp Business conversations",
    isConnected: true,
    accountName: "+1 (234) 567-8900",
    lastSync: "5 minutes ago",
    messageVolume: 892,
  },
  {
    id: "gmail",
    name: "Gmail",
    icon: SiGoogle,
    description: "Connect Gmail for email automation",
    isConnected: false,
    accountName: null,
    lastSync: null,
    messageVolume: 0,
  },
  {
    id: "outlook",
    name: "Outlook",
    icon: Mail,
    description: "Connect Outlook for email automation",
    isConnected: false,
    accountName: null,
    lastSync: null,
    messageVolume: 0,
  },
];

export default function IntegrationsPage() {
  const [voiceConsent, setVoiceConsent] = useState(false);
  const [voiceUploaded, setVoiceUploaded] = useState(false);

  // Mock user plan
  const voiceMinutesUsed = 89;
  const voiceMinutesLimit = 400;
  const voicePercentage = (voiceMinutesUsed / voiceMinutesLimit) * 100;

  const handleConnect = (integrationId: string) => {
    console.log(`Connecting ${integrationId}...`);
    // In real app, trigger OAuth flow
  };

  const handleDisconnect = (integrationId: string) => {
    console.log(`Disconnecting ${integrationId}...`);
  };

  const handleVoiceUpload = () => {
    setVoiceUploaded(true);
  };

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
              All tokens are encrypted and stored securely. You can revoke access anytime.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Channel Integrations */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Connected Channels</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((integration, index) => {
            const Icon = integration.icon;
            return (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`hover-elevate ${
                    integration.isConnected ? "border-emerald-500/50" : ""
                  }`}
                  data-testid={`card-integration-${integration.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" data-testid={`icon-${integration.id}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base" data-testid={`text-name-${integration.id}`}>
                            {integration.name}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {integration.description}
                          </CardDescription>
                        </div>
                      </div>
                      {integration.isConnected && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500" data-testid={`badge-connected-${integration.id}`}>
                          <Check className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {integration.isConnected ? (
                      <>
                        <div className="text-sm space-y-1">
                          <p className="text-muted-foreground">
                            Account: <span className="font-medium text-foreground" data-testid={`text-account-${integration.id}`}>{integration.accountName}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Last sync: <span className="font-medium text-foreground">{integration.lastSync}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Messages: <span className="font-medium text-foreground" data-testid={`text-volume-${integration.id}`}>{integration.messageVolume.toLocaleString()}</span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDisconnect(integration.id)}
                            data-testid={`button-disconnect-${integration.id}`}
                          >
                            Disconnect
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            data-testid={`button-sync-${integration.id}`}
                          >
                            Sync Now
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleConnect(integration.id)}
                        data-testid={`button-connect-${integration.id}`}
                      >
                        Connect {integration.name}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
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
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                {voiceUploaded ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-emerald-500">
                      <Check className="h-5 w-5" />
                      <span className="font-medium" data-testid="text-voice-uploaded">Voice sample uploaded</span>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <Button variant="outline" size="sm" data-testid="button-play-sample">
                        <Play className="h-4 w-4 mr-2" />
                        Play Sample
                      </Button>
                      <Button variant="ghost" size="sm" data-testid="button-upload-new">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Mic className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-medium">Upload voice sample</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Record or upload a 30-60 second audio clip
                      </p>
                    </div>
                    <Button onClick={handleVoiceUpload} data-testid="button-upload-voice">
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
                disabled={!voiceConsent || !voiceUploaded}
                data-testid="button-activate-voice"
              >
                {voiceUploaded && voiceConsent ? "Voice Clone Active" : "Activate Voice Clone"}
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
    </div>
  );
}
