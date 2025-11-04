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
  Target
} from "lucide-react";

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

// Monitor Card Component
function MonitorCard({ monitor, nextSync, onToggle, onDelete, isToggling, isDeleting }: {
  monitor: any;
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
      return apiRequest(`/api/video-automation/monitors/${monitor.id}`, {
        method: "PATCH",
        body: JSON.stringify({ productLink: newLink })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-automation/monitors"] });
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
          <p className="text-xs text-muted-foreground">
            💾 Save to apply changes immediately to new DMs
          </p>
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
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ignored</span>
                <Badge variant="secondary" className="h-5">
                  {monitor.stats?.ignored || 0}
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
              <div className="text-xs text-muted-foreground">
                {monitor.isActive ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Monitoring every 30 seconds
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Pause className="h-3 w-3 text-orange-500" />
                    Monitor paused
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity Timeline
          </h4>
          <ScrollArea className="h-32">
            <div className="space-y-2 pr-4">
              {monitor.recentActivity?.length > 0 ? (
                monitor.recentActivity.map((activity: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-start gap-2 text-xs border-l-2 border-muted pl-3 py-1"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-muted-foreground">{activity.username}</p>
                    </div>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {activity.timestamp}
                    </span>
                  </motion.div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Follow Request Settings
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${monitor.metadata?.askFollowOnConvert ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span>On Conversion</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${monitor.metadata?.askFollowOnDecline ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span>On Decline</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VideoAutomationPage() {
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [askFollowOnConvert, setAskFollowOnConvert] = useState(true);
  const [askFollowOnDecline, setAskFollowOnDecline] = useState(true);

  // Fetch active video monitors
  const { data: monitors, isLoading } = useQuery({
    queryKey: ["/api/video-monitors"],
  });

  // Create new monitor
  const createMonitor = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/video-monitors", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-monitors"] });
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

  // Toggle monitor active status
  const toggleMonitor = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest(`/api/video-monitors/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-monitors"] });
    },
  });

  // Delete monitor
  const deleteMonitor = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/video-monitors/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-monitors"] });
      toast({ title: "Monitor deleted" });
    },
  });

  // Update CTA link
  const updateLink = useMutation({
    mutationFn: async ({ id, ctaLink }: { id: string; ctaLink: string }) => {
      return apiRequest(`/api/video-monitors/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ctaLink }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-monitors"] });
      toast({ title: "✅ Link updated" });
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

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Instagram Video Automation</h1>
        <p className="text-muted-foreground mt-1">
          AI monitors your videos 24/7, detects buying intent, and sends personalized DMs automatically
        </p>
      </div>

      {/* Create New Monitor */}
      <Card>
        <CardHeader>
          <CardTitle>Add Video Monitor</CardTitle>
          <CardDescription>
            Select an Instagram video to monitor for buying intent comments
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
            />
            <p className="text-xs text-muted-foreground">
              📹 Paste the URL of any Instagram post/reel you want to monitor
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta-link">CTA Button Link (Optional)</Label>
            <div className="flex gap-2">
              <LinkIcon className="h-4 w-4 mt-3 text-muted-foreground" />
              <Input
                id="cta-link"
                placeholder="https://yourbrand.com/product"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              🔗 When leads show interest, AI will send this as a button (not plain text)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-message">Custom Greeting (Optional)</Label>
            <Textarea
              id="custom-message"
              placeholder="Hey {name}! I saw your comment on my latest video..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              💬 Leave empty for AI-generated personalized messages. Use {"{name}"} for lead's name
            </p>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm">Follow Request Settings</h4>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="follow-convert">Ask for Follow After Conversion</Label>
                <p className="text-xs text-muted-foreground">
                  "Would you mind following us to stay connected?" (Professional tone)
                </p>
              </div>
              <Switch
                id="follow-convert"
                checked={askFollowOnConvert}
                onCheckedChange={setAskFollowOnConvert}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="follow-decline">Ask for Follow If Not Interested</Label>
                <p className="text-xs text-muted-foreground">
                  Politely request connection even if lead declines offer
                </p>
              </div>
              <Switch
                id="follow-decline"
                checked={askFollowOnDecline}
                onCheckedChange={setAskFollowOnDecline}
              />
            </div>
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Active Video Monitors</h2>
          <Badge variant="outline">{monitors?.length || 0} videos monitored</Badge>
        </div>

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
              <p className="text-muted-foreground">No video monitors yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first video above to start automating DMs
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {monitors?.map((monitor: any) => {
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

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
          <div className="flex gap-2">
            <span>1️⃣</span>
            <p>AI monitors your video comments 24/7 for buying intent signals</p>
          </div>
          <div className="flex gap-2">
            <span>2️⃣</span>
            <p>When detected, sends personalized DM: "Hey {"{name}"}, I saw your comment..."</p>
          </div>
          <div className="flex gap-2">
            <span>3️⃣</span>
            <p>Sends CTA link as a clickable button (not plain text) for better conversion</p>
          </div>
          <div className="flex gap-2">
            <span>4️⃣</span>
            <p>If warm lead or converted, sends 2 voice notes (15 sec each = 30 sec total)</p>
          </div>
          <div className="flex gap-2">
            <span>5️⃣</span>
            <p>Politely asks: "Would you mind following us to stay connected?" (Professional tone)</p>
          </div>
          <div className="flex gap-2">
            <span>6️⃣</span>
            <p>Triggers follow button only after lead replies "yes" (not automatic)</p>
          </div>
          <div className="flex gap-2">
            <span>💰</span>
            <p><strong>Replaces ManyChat entirely</strong> - Professional, scalable, expert-level automation</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}