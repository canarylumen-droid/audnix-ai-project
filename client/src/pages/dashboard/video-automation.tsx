
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useCanAccessVideoAutomation } from "@/hooks/use-access-gate";
import { FeatureLock } from "@/components/upgrade/FeatureLock";
import {
  Video,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  Activity,
  Timer,
  Trash2,
  Link as LinkIcon,
  UserPlus,
  Save,
  Edit2,
  Eye,
  Users,
  Target,
  Brain,
  Zap,
  DollarSign,
  Globe,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Instagram,
  Settings,
  FileText,
  Send,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

interface VideoMonitorStats {
  commentsChecked: number;
  dmsSent: number;
  conversions: number;
  followRequests: number;
  hotLeads: number;
  warmLeads: number;
  replied: number;
}

interface VideoMonitor {
  id: string;
  userId: string;
  videoId: string;
  videoUrl: string;
  productLink: string | null;
  ctaText: string;
  isActive: boolean;
  autoReplyEnabled: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  lastSync?: string | null;
  stats?: VideoMonitorStats;
}

interface IntentAnalysisResult {
  intent: {
    intentType: string;
    confidence: number;
    shouldDM: boolean;
    hasBuyingIntent: boolean;
    detectedInterest?: string;
  } | null;
  recommendation: string;
}

interface CreateMonitorPayload {
  videoUrl: string;
  ctaLink: string;
  customMessage?: string;
  followUpConfig: {
    askFollowOnConvert: boolean;
    askFollowOnDecline: boolean;
  };
}

// Countdown timer hook
function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number;
    seconds: number;
    total: number;
  }>({ minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    if (!targetDate) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, total: 0 });
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ minutes, seconds, total: difference });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

// Intent Detection Demo Component
function IntentDetectionDemo() {
  const [testComment, setTestComment] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<IntentAnalysisResult | null>(null);
  const { toast } = useToast();

  const demoComments = [
    { text: "This is cool! 🔥", type: "high_interest", lang: "EN" },
    { text: "How much does this cost?", type: "price_question", lang: "EN" },
    { text: "¿Cuánto cuesta esto?", type: "price_question", lang: "ES" },
    { text: "Wow amazing 😍", type: "high_interest", lang: "EN" },
    { text: "Is this worth the money?", type: "price_objection", lang: "EN" },
    { text: "Tell me more about this", type: "curious", lang: "EN" },
    { text: "C'est trop cher", type: "price_objection", lang: "FR" }
  ];

  const analyzeComment = async (comment: string) => {
    setAnalyzing(true);
    try {
      const response = await apiRequest("POST", "/api/video/test-intent", { comment, videoContext: "Product video" });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      toast({ title: "Failed to analyze", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Intent Detection</CardTitle>
            <CardDescription>
              Understands buying signals in any language
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Demo Examples */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">
            Test Examples
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {demoComments.map((demo, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setTestComment(demo.text);
                  analyzeComment(demo.text);
                }}
                className="text-left p-3 rounded-lg bg-muted/50 hover:bg-muted border border-white/10 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">
                    {demo.lang}
                  </Badge>
                  <Badge 
                    className={`text-xs ${
                      demo.type === 'high_interest' ? 'bg-green-500' :
                      demo.type === 'price_objection' ? 'bg-red-500' :
                      demo.type === 'price_question' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}
                  >
                    {demo.type.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">
                  "{demo.text}"
                </p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Custom Input */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Or Test Your Own Comment
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter any comment in any language..."
              value={testComment}
              onChange={(e) => setTestComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && testComment.trim()) {
                  analyzeComment(testComment);
                }
              }}
            />
            <Button 
              onClick={() => analyzeComment(testComment)}
              disabled={!testComment.trim() || analyzing}
            >
              {analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-1" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results Display */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-muted/50 to-transparent border border-white/10"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  AI Analysis Results
                </h4>
                <Badge 
                  variant={result.intent?.shouldDM ? "default" : "secondary"}
                  className="text-xs"
                >
                  {result.intent?.shouldDM ? "✅ SEND DM" : "❌ SKIP"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Intent Type</p>
                  <Badge className="w-full justify-center">
                    {result.intent?.intentType}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={result.intent?.confidence * 100} 
                      className="h-2"
                    />
                    <span className="text-xs font-medium">
                      {Math.round(result.intent?.confidence * 100)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Detected Interest</p>
                  <p className="text-xs font-medium text-primary">
                    {result.intent?.detectedInterest || "General curiosity"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Action</p>
                  <p className="text-xs font-medium">
                    {result.recommendation}
                  </p>
                </div>
              </div>

              {/* What AI Detected */}
              <div className="p-3 rounded-lg bg-muted/30 border border-white/5">
                <h5 className="text-xs font-semibold mb-2 text-muted-foreground">
                  🎯 What AI Detected:
                </h5>
                <div className="space-y-1 text-xs">
                  {result.intent?.hasBuyingIntent && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span>Buying interest detected</span>
                    </div>
                  )}
                  {result.intent?.detectedInterest && (
                    <div className="flex items-center gap-2">
                      <Brain className="h-3 w-3 text-blue-500" />
                      <span>Interested in: {result.intent.detectedInterest}</span>
                    </div>
                  )}
                  {result.intent?.intentType === 'price_objection' && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3 text-orange-500" />
                      <span>Price concern - AI will reframe value</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium Features Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-white/10">
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-green-500" />
              <span className="text-xs font-semibold">Multi-Language</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Detects intent in English, Spanish, French, German, Portuguese, and 50+ more
            </p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-semibold">Context-Aware</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Understands "wow" means different things based on video context
            </p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-semibold">Objection Handler</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Detects price objections and automatically reframes value
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Monitor Card Component
function MonitorCard({ monitor, nextSync, onToggle, onDelete, isToggling, isDeleting }: {
  monitor: VideoMonitor;
  nextSync: Date | null;
  onToggle: () => void;
  onDelete: () => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  const { toast } = useToast();
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [ctaLink, setCtaLink] = useState(monitor.productLink || "");
  const timeLeft = useCountdown(nextSync);
  const syncProgress = nextSync ? Math.max(0, 100 - (timeLeft.total / 30000) * 100) : 0;

  const updateLinkMutation = useMutation({
    mutationFn: async (newLink: string) => {
      return apiRequest("PATCH", `/api/video/monitors/${monitor.id}`, { productLink: newLink });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video/monitors"] });
      toast({ title: "✅ Link updated", description: "Changes apply immediately to new DMs" });
      setIsEditingLink(false);
    },
    onError: () => {
      toast({ title: "Failed to update link", variant: "destructive" });
    }
  });

  const handleSaveLink = () => {
    if (ctaLink !== monitor.productLink) {
      updateLinkMutation.mutate(ctaLink);
    } else {
      setIsEditingLink(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Video Monitor</CardTitle>
              <Badge variant={monitor.isActive ? "default" : "secondary"}>
                {monitor.isActive ? "Active" : "Paused"}
              </Badge>
            </div>
            <CardDescription className="break-all">
              {monitor.videoUrl}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              disabled={isToggling}
            >
              {monitor.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Comments Checked</p>
            <p className="font-semibold">{monitor.stats?.commentsChecked || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">DMs Sent</p>
            <p className="font-semibold">{monitor.stats?.dmsSent || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Conversions</p>
            <p className="font-semibold text-green-600">{monitor.stats?.conversions || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Follow Requests</p>
            <p className="font-semibold">{monitor.stats?.followRequests || 0}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>CTA Button Link</Label>
            {!isEditingLink && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingLink(true)}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
          {isEditingLink ? (
            <div className="flex gap-2">
              <Input
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder="https://yourbrand.com/product"
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleSaveLink}
                disabled={updateLinkMutation.isPending}
              >
                {updateLinkMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <code className="text-sm flex-1 truncate">{monitor.productLink || "No link set"}</code>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Lead Status Breakdown
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Hot Leads</span>
                <Badge variant="destructive" className="h-5">
                  {monitor.stats?.hotLeads || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Warm Leads</span>
                <Badge className="h-5 bg-orange-500">
                  {monitor.stats?.warmLeads || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Replied</span>
                <Badge className="h-5 bg-blue-500">
                  {monitor.stats?.replied || 0}
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Sync Status
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Next Sync</span>
                  {timeLeft.total > 0 ? (
                    <span className="font-semibold flex items-center gap-1">
                      <Timer className="h-3 w-3 text-blue-500" />
                      {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                  ) : (
                    <span className="font-semibold text-blue-500 animate-pulse">Syncing...</span>
                  )}
                </div>
                <Progress value={syncProgress} className="w-full h-2" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VideoAutomationPage() {
  const { toast } = useToast();
  const { canAccess: canAccessVideo } = useCanAccessVideoAutomation();
  const [videoUrl, setVideoUrl] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [askFollowOnConvert, setAskFollowOnConvert] = useState(true);
  const [askFollowOnDecline, setAskFollowOnDecline] = useState(true);
  const [selectedReel, setSelectedReel] = useState<any>(null);
  const [brandKnowledge, setBrandKnowledge] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "detail">("grid");
  const [commentMonitoringEnabled, setCommentMonitoringEnabled] = useState(true);
  const [dmAutomationEnabled, setDmAutomationEnabled] = useState(true);
  const [ctaLinkEnabled, setCtaLinkEnabled] = useState(true);

  const handleSelectReel = (reel: any) => {
    setSelectedReel(reel);
    setVideoUrl(reel.url);
    setViewMode("detail");
  };

  const handleBackToGrid = () => {
    setViewMode("grid");
    setSelectedReel(null);
  };

  const { data: monitors, isLoading } = useQuery<VideoMonitor[]>({
    queryKey: ["/api/video/monitors"],
  });

  // Fetch user's Instagram reels when component loads
  const { data: instagramReels, isLoading: reelsLoading } = useQuery({
    queryKey: ["/api/video/reels"],
    enabled: canAccessVideo,
  });

  const createMonitor = useMutation({
    mutationFn: async (data: CreateMonitorPayload) => {
      return apiRequest("POST", "/api/video/monitors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video/monitors"] });
      toast({
        title: "✅ Video Monitor Created",
        description: "AI will now detect buying intent in comments 24/7",
      });
      setVideoUrl("");
      setCtaLink("");
      setCustomMessage("");
    },
    onError: () => {
      toast({
        title: "Failed to create monitor",
        description: "Please check your video URL and try again",
        variant: "destructive",
      });
    },
  });

  const toggleMonitor = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/video/monitors/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video/monitors"] });
    },
  });

  const deleteMonitor = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/video/monitors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video/monitors"] });
      toast({ title: "Monitor deleted" });
    },
  });

  const handleCreateMonitor = () => {
    if (!videoUrl) {
      toast({ title: "Please enter a video URL", variant: "destructive" });
      return;
    }

    createMonitor.mutate({
      videoUrl,
      ctaLink,
      customMessage: customMessage || undefined,
      followUpConfig: {
        askFollowOnConvert,
        askFollowOnDecline,
      },
    });
  };

  // Video automation is FREE for all plans - no lock needed

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
          Instagram Video Automation
        </h1>
        <p className="text-muted-foreground mt-1">
          AI-powered sales engine that converts comments into booked meetings
        </p>
      </div>

      {/* Intent Detection Demo */}
      <IntentDetectionDemo />

      {/* Feature Pills */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="py-1.5 px-3">
          <Brain className="h-3.5 w-3.5 mr-1.5" />
          No keywords needed
        </Badge>
        <Badge variant="secondary" className="py-1.5 px-3">
          <DollarSign className="h-3.5 w-3.5 mr-1.5" />
          Handles objections
        </Badge>
        <Badge variant="secondary" className="py-1.5 px-3">
          <Users className="h-3.5 w-3.5 mr-1.5" />
          Personalized DMs
        </Badge>
        <Badge variant="secondary" className="py-1.5 px-3">
          <Globe className="h-3.5 w-3.5 mr-1.5" />
          Any language
        </Badge>
      </div>

      {/* Instagram Reels Gallery */}
      {instagramReels?.reels?.length > 0 && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Instagram className="h-5 w-5 text-primary" />
              Your Reels
            </CardTitle>
            <CardDescription>
              Select a reel to monitor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {instagramReels.reels.map((reel: any) => (
                  <motion.div
                    key={reel.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedReel(reel);
                      setVideoUrl(reel.url);
                    }}
                    className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedReel?.id === reel.id
                        ? "border-primary shadow-lg shadow-primary/20"
                        : "border-white/10 hover:border-primary/50"
                    }`}
                  >
                    <div className="aspect-[9/16] bg-muted relative">
                      {reel.thumbnailUrl ? (
                        <img
                          src={reel.thumbnailUrl}
                          alt={reel.caption?.substring(0, 50) || "Reel"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Video className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      {selectedReel?.id === reel.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <CheckCircle2 className="h-12 w-12 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-muted/50">
                      <p className="text-xs line-clamp-2">
                        {reel.caption || "No caption"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Create Monitor */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Video Monitor</CardTitle>
          <CardDescription>
            {selectedReel ? "AI will analyze your selected reel" : "Or paste any Instagram video URL"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-url">Instagram Video URL</Label>
            <Input
              id="video-url"
              placeholder="https://www.instagram.com/p/ABC123..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={!!selectedReel}
            />
            {selectedReel && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Reel selected - AI will auto-extract brand knowledge</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta-link">CTA Button Link (Optional)</Label>
            <Input
              id="cta-link"
              placeholder="https://yourbrand.com/product"
              value={ctaLink}
              onChange={(e) => setCtaLink(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-knowledge">Brand Knowledge (Optional)</Label>
            <Textarea
              id="brand-knowledge"
              placeholder="AI will auto-extract from video caption, or paste your own brand info here..."
              value={brandKnowledge}
              onChange={(e) => setBrandKnowledge(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {selectedReel?.caption 
                ? "✅ AI detected from caption: " + selectedReel.caption.substring(0, 100) + "..."
                : "AI will analyze video and extract product/service details"}
            </p>
          </div>

          <Button
            onClick={handleCreateMonitor}
            disabled={createMonitor.isPending}
            className="w-full"
          >
            {createMonitor.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Monitor...
              </>
            ) : (
              <>
                <Video className="h-4 w-4 mr-2" />
                Start Monitoring Video
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active Monitors */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Monitors</h2>
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </CardContent>
          </Card>
        ) : monitors?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No monitors yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {monitors?.map((monitor) => {
              const nextSync = monitor.lastSync
                ? new Date(new Date(monitor.lastSync).getTime() + 30000)
                : null;

              return (
                <MonitorCard
                  key={monitor.id}
                  monitor={monitor}
                  nextSync={nextSync}
                  onToggle={() => toggleMonitor.mutate({ id: monitor.id, isActive: !monitor.isActive })}
                  onDelete={() => deleteMonitor.mutate(monitor.id)}
                  isToggling={toggleMonitor.isPending}
                  isDeleting={deleteMonitor.isPending}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
