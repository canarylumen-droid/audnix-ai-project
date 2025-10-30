
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
import { Video, Plus, Edit2, Trash2, Power, Loader2, ExternalLink, MessageSquare } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function VideoAutomationPage() {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [productLink, setProductLink] = useState("");
  const [ctaText, setCtaText] = useState("Get it here");
  const [videoCaption, setVideoCaption] = useState("");
  const [editingMonitor, setEditingMonitor] = useState<any>(null);
  const { toast } = useToast();

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

    createMonitorMutation.mutate({
      videoId: selectedVideo.id,
      videoUrl: selectedVideo.url,
      productLink,
      ctaText,
      metadata: {
        videoCaption: videoCaption || selectedVideo.caption,
        productName: "",
        pricePoint: "",
      },
    });
  };

  const videos = videosData?.videos || [];
  const monitors = monitorsData?.monitors || [];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Video Comment Automation</h1>
          <p className="text-muted-foreground">
            AI monitors your Instagram videos 24/7 and sends DMs to leads with buying intent
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
              </div>

              <div>
                <Label>Product/Offer Link</Label>
                <Input
                  placeholder="https://yourproduct.com"
                  value={productLink}
                  onChange={(e) => setProductLink(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This link will appear as a clickable button in the DM
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
                  Keep it short (2-4 words recommended)
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
              </div>

              <Button
                onClick={handleCreateMonitor}
                disabled={createMonitorMutation.isPending}
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
          <Card>
            <CardContent className="text-center py-12">
              <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Active Monitors</h3>
              <p className="text-muted-foreground mb-4">
                Set up your first video monitor to start automating DMs
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
                          updateMonitorMutation.mutate({
                            id: monitor.id,
                            data: { isActive: checked },
                          });
                        }}
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

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingMonitor(monitor)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMonitorMutation.mutate(monitor.id)}
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
