import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Video, Plus, Edit2, Trash2, Power, Loader2, ExternalLink, MessageSquare, Lock, Crown } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function VideoAutomationPage() {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [productLink, setProductLink] = useState("");
  const [ctaText, setCtaText] = useState("Get it here");
  const [videoCaption, setVideoCaption] = useState("");
  const [replyToComments, setReplyToComments] = useState(false);
  const [askForFollow, setAskForFollow] = useState(false);
  const [instagramHandle, setInstagramHandle] = useState("");
  const [editingMonitor, setEditingMonitor] = useState<any>(null);
  const { toast } = useToast();

  // Check user plan
  const { data: userData } = useQuery({
    queryKey: ["/api/user"],
  });

  const isPaidUser = userData?.user?.plan && userData.user.plan !== 'trial';

  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: ["/api/video-automation/videos"],
  });

  const { data: monitorsData, isLoading: monitorsLoading } = useQuery({
    queryKey: ["/api/video-automation/monitors"],
    refetchInterval: 10000,
  });

  const createMonitorMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/video-automation/monitors", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ AI Monitor Active",
        description: "AI is now monitoring this video 24/7 for buying signals",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/video-automation/monitors"] });
      setSelectedVideo(null);
      setProductLink("");
      setCtaText("Get it here");
    },
  });

  const updateMonitorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest(`/api/video-automation/monitors/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "✅ Monitor updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/video-automation/monitors"] });
      setEditingMonitor(null);
    },
  });

  const deleteMonitorMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/video-automation/monitors/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({ title: "Monitor removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/video-automation/monitors"] });
    },
  });

  const handleCreateMonitor = () => {
    if (!selectedVideo || !productLink) {
      toast({
        title: "Missing information",
        description: "Please select a video and add a product link",
        variant: "destructive",
      });
      return;
    }

    if (monitors.length >= 3) {
      toast({
        title: "Video limit reached",
        description: "Maximum 3 active video monitors allowed (Instagram API guidelines)",
        variant: "destructive",
      });
      return;
    }

    createMonitorMutation.mutate({
      videoId: selectedVideo.id,
      videoUrl: selectedVideo.url,
      productLink,
      ctaText,
      metadata: {
        videoCaption: videoCaption || selectedVideo.caption,
        productName: "",
        pricePoint: "",
        replyToComments,
        askForFollow: askForFollow && replyToComments,
        instagramHandle: askForFollow ? instagramHandle : undefined,
      },
    });
  };

  const videos = videosData?.videos || [];
  const monitors = monitorsData?.monitors || [];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 relative">
      {/* Trial User Lock Overlay */}
      {!isPaidUser && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="w-full max-w-md mx-4 border-2 border-primary">
            <CardHeader className="text-center space-y-4">
              <motion.div
                className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Lock className="w-8 h-8 text-primary" />
              </motion.div>
              <CardTitle className="text-2xl">Premium Feature</CardTitle>
              <CardDescription className="text-base">
                Video Comment Automation is available for paid plans only
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary" />
                  <span>Auto-detect buying intent in comments</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary" />
                  <span>AI-powered personalized DMs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary" />
                  <span>24/7 automated engagement</span>
                </div>
              </div>
              <Link href="/dashboard/pricing">
                <Button className="w-full" size="lg">
                  Upgrade to Access
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Video Comment Automation</h1>
          <p className="text-muted-foreground">
            Monitor Instagram Reels for buying intent and auto-respond with AI
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Video Monitor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Set Up AI Video Monitor</DialogTitle>
              <DialogDescription>
                Select a video and configure what AI should send when someone shows buying intent
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label>Select Instagram Video</Label>
                {videosLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Select
                    value={selectedVideo?.id}
                    onValueChange={(id) => {
                      const video = videos.find((v: any) => v.id === id);
                      setSelectedVideo(video);
                      setVideoCaption(video?.caption || "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a video..." />
                    </SelectTrigger>
                    <SelectContent>
                      {videos.map((video: any) => (
                        <SelectItem key={video.id} value={video.id}>
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            <span className="truncate max-w-xs">
                              {video.caption || `Video from ${new Date(video.timestamp).toLocaleDateString()}`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  ⚠️ Limit: 2-3 videos max per account (Instagram API guidelines)
                </p>
              </div>

              <div>
                <Label>Product/Offer Link</Label>
                <Input
                  placeholder="https://yourproduct.com"
                  value={productLink}
                  onChange={(e) => setProductLink(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  🔗 The link your leads will receive in their DMs (sales page, product, booking, etc.)
                </p>
              </div>

              <div>
                <Label>Button Text</Label>
                <Input
                  placeholder="Get it here"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  maxLength={25}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  💬 CTA text that appears with the link (e.g., "Get Access", "Book Now", "See Pricing")
                </p>
              </div>

              <div>
                <Label>Video Context (Optional)</Label>
                <Textarea
                  placeholder="What's this video about? Helps AI understand the context..."
                  value={videoCaption}
                  onChange={(e) => setVideoCaption(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  🧠 Helps AI personalize responses based on what your video is about
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Reply to Comments</Label>
                    <p className="text-xs text-muted-foreground">
                      🚀 Beats ManyChat! AI replies naturally in 5-25 seconds (human-like timing)
                    </p>
                  </div>
                  <Switch
                    checked={replyToComments}
                    onCheckedChange={setReplyToComments}
                  />
                </div>

                {replyToComments && (
                  <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Ask to Follow (Optional)</Label>
                        <p className="text-xs text-muted-foreground">
                          📲 Naturally ask leads to follow before sending link (provides value, not forced)
                        </p>
                      </div>
                      <Switch
                        checked={askForFollow}
                        onCheckedChange={setAskForFollow}
                      />
                    </div>

                    {askForFollow && (
                      <div>
                        <Label>Your Instagram Handle</Label>
                        <Input
                          placeholder="@yourhandle"
                          value={instagramHandle}
                          onChange={(e) => setInstagramHandle(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          ✨ AI will say: "Follow @yourhandle so I can send this over!" (natural, not pushy)
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                onClick={handleCreateMonitor}
                disabled={createMonitorMutation.isPending || !isPaidUser}
                className="w-full"
              >
                {createMonitorMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Video className="h-4 w-4 mr-2" />
                )}
                Start AI Monitoring
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Monitors */}
      <div className="grid gap-4">
        {monitorsLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </CardContent>
          </Card>
        ) : monitors.length === 0 ? (
          <Card className="border-dashed" data-testid="card-empty-state">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Video className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">You don't have any activity yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Connect your Instagram account and add your first Reel to start monitoring comments. 
              AI will automatically detect interest and engage with viewers in real-time.
            </p>
          </CardContent>
        </Card>
        ) : (
          monitors.map((monitor: any) => (
            <motion.div
              key={monitor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        {monitor.metadata?.videoCaption || "Instagram Video"}
                      </CardTitle>
                      <a
                        href={monitor.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        View on Instagram
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={monitor.isActive ? "default" : "secondary"}>
                        {monitor.isActive ? "Active" : "Paused"}
                      </Badge>
                      <Switch
                        checked={monitor.isActive}
                        onCheckedChange={(checked) => {
                          if (!isPaidUser) return; // Prevent action for trial users
                          updateMonitorMutation.mutate({
                            id: monitor.id,
                            data: { isActive: checked },
                          });
                        }}
                        disabled={!isPaidUser}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Button text:</span>
                    <Badge variant="outline">{monitor.ctaText}</Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Link:</span>
                    <a
                      href={monitor.productLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate max-w-xs"
                    >
                      {monitor.productLink}
                    </a>
                  </div>

                  {monitor.metadata?.replyToComments && (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">
                        🚀 Comment Replies Active
                      </Badge>
                      {monitor.metadata?.askForFollow && (
                        <Badge variant="secondary" className="text-xs">
                          📲 Follow Request Enabled
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-1 border-t">
                    💬 AI monitors comments 24/7 • Responds in 5-25 seconds • Natural, human-like replies
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!isPaidUser) return;
                        setEditingMonitor(monitor)
                      }}
                      disabled={!isPaidUser}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!isPaidUser) return;
                        deleteMonitorMutation.mutate(monitor.id)
                      }}
                      disabled={!isPaidUser}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      {editingMonitor && (
        <Dialog open={!!editingMonitor} onOpenChange={() => setEditingMonitor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Monitor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Product Link</Label>
                <Input
                  defaultValue={editingMonitor.productLink}
                  onChange={(e) => {
                    setEditingMonitor({ ...editingMonitor, productLink: e.target.value });
                  }}
                />
              </div>
              <div>
                <Label>Button Text</Label>
                <Input
                  defaultValue={editingMonitor.ctaText}
                  onChange={(e) => {
                    setEditingMonitor({ ...editingMonitor, ctaText: e.target.value });
                  }}
                  maxLength={25}
                />
              </div>
              <Button
                onClick={() => {
                  updateMonitorMutation.mutate({
                    id: editingMonitor.id,
                    data: {
                      productLink: editingMonitor.productLink,
                      ctaText: editingMonitor.ctaText,
                    },
                  });
                }}
                className="w-full"
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}