import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Video, Play, Pause, Link as LinkIcon, UserPlus, Loader2, Trash2 } from "lucide-react";

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
        body: JSON.JSON.stringify({ ctaLink }),
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
        <h2 className="text-xl font-semibold">Active Video Monitors</h2>

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
          monitors?.map((monitor: any) => (
            <Card key={monitor.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
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
                      onClick={() => toggleMonitor.mutate({ 
                        id: monitor.id, 
                        isActive: !monitor.isActive 
                      })}
                    >
                      {monitor.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMonitor.mutate(monitor.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
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
                  <Label>CTA Button Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={monitor.ctaLink || ""}
                      onChange={(e) => {
                        const newLink = e.target.value;
                        updateLink.mutate({ id: monitor.id, ctaLink: newLink });
                      }}
                      placeholder="https://yourbrand.com/product"
                    />
                    <Button variant="outline" size="icon">
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ✏️ Edit anytime - changes apply immediately
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Follow Request Settings
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${monitor.followUpConfig?.askFollowOnConvert ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span>On Conversion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${monitor.followUpConfig?.askFollowOnDecline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span>On Decline</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
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