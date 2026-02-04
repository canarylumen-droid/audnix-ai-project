
import { useState, useEffect, useCallback } from "react";
import { CustomContextMenu, useContextMenu } from "@/components/ui/interactive/CustomContextMenu";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useCanAccessVideoAutomation } from "@/hooks/use-access-gate";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Activity,
  Trash2,
  Save,
  Edit2,
  Zap,
  Instagram,
  RefreshCw,
  Filter,
  Play,
  Pause,
  Link as LinkIcon,
  Search,
  Brain,
  Sparkles,
  Loader
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
    <Card className="border-border/40 bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden group relative">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-fuchsia-500/10 text-fuchsia-500 shadow-inner group-hover:scale-110 transition-transform">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">Neural Intent Engine</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
              AI buying signal analysis
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {demoComments.map((demo, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="cursor-pointer hover:bg-muted transition-colors font-normal text-xs py-1"
                onClick={() => {
                  setTestComment(demo.text);
                  analyzeComment(demo.text);
                }}
              >
                {demo.text}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Type a test comment..."
            value={testComment}
            onChange={(e) => setTestComment(e.target.value)}
            className="bg-background/40 border-border/40 shadow-none h-11 rounded-xl"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && testComment.trim()) analyzeComment(testComment);
            }}
          />
          <Button
            onClick={() => analyzeComment(testComment)}
            disabled={!testComment.trim() || analyzing}
            className="min-w-[100px] bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg h-11"
          >
            {analyzing ? <Loader className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {analyzing ? "" : "Analyze"}
          </Button>
        </div>

        {/* Glow effect */}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 blur-[80px] opacity-10 bg-fuchsia-500 rounded-full" />

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl bg-background/60 border border-border/40 p-5 space-y-4 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <Badge variant={result.intent?.shouldDM ? "default" : "secondary"} className={result.intent?.shouldDM ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3" : ""}>
                  {result.intent?.shouldDM ? "HIGH INTENT LEAD" : "PASSIVE SIGNAL"}
                </Badge>
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground/50">CONFIDENCE: {Math.round((result.intent?.confidence || 0) * 100)}%</span>
              </div>
              <p className="text-sm font-bold text-foreground leading-snug">{result.recommendation}</p>
            </motion.div>
          )}
        </AnimatePresence>
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
      toast({ title: "Link updated", description: "Changes apply immediately" });
      setIsEditingLink(false);
    },
  });

  return (
    <Card className="group hover:border-primary/20 transition-all duration-500 border-border/40 bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden relative">
      <CardHeader className="pb-3 px-6 pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <Badge variant={monitor.isActive ? "default" : "secondary"} className={monitor.isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[10px] tracking-wider px-3" : ""}>
                {monitor.isActive ? "LIVE SCANNING" : "MONITOR PAUSED"}
              </Badge>
            </div>
            <a href={monitor.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-muted-foreground/40 hover:text-primary truncate block uppercase tracking-[0.1em] transition-colors">
              Source URL ↗
            </a>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/20 hover:bg-muted/40" onClick={onToggle} disabled={isToggling}>
              {monitor.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-destructive/5 hover:bg-destructive/10 text-destructive/70 hover:text-destructive" onClick={onDelete} disabled={isDeleting}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 py-4 border-y border-border/20">
          <div className="text-center">
            <div className="text-xl font-extrabold tracking-tighter">{monitor.stats?.commentsChecked || 0}</div>
            <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/40 mt-1">Found</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-extrabold tracking-tighter text-primary">{monitor.stats?.dmsSent || 0}</div>
            <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/40 mt-1">Relays</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-extrabold tracking-tighter text-emerald-500">{monitor.stats?.conversions || 0}</div>
            <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/40 mt-1">Impact</div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">
            <span className="flex items-center gap-1.5"><Activity className="h-3 w-3 animate-pulse" /> Neural Cycle</span>
            <span>{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
          </div>
          <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${syncProgress}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        {/* Subtle Glow */}
        <div className="absolute -bottom-10 -left-10 w-32 h-32 blur-[80px] opacity-10 bg-primary rounded-full transition-opacity group-hover:opacity-20" />
      </CardContent>
    </Card>
  );
}

export default function VideoAutomationPage() {
  const { toast } = useToast();
  const { canAccess: canAccessVideo } = useCanAccessVideoAutomation();
  const [videoUrl, setVideoUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: monitors, isLoading: monitorsLoading } = useQuery<VideoMonitor[]>({
    queryKey: ["/api/video-automation/monitors"],
  });

  const { data: instagramMedia, isLoading: reelsLoading } = useQuery({
    queryKey: ["/api/dashboard/instagram/media"],
    enabled: canAccessVideo,
  });

  const { contextConfig, handleContextMenu, closeMenu } = useContextMenu();

  // Map backend media to the format expected by the UI
  const instagramReels = {
    reels: Array.isArray((instagramMedia as any)?.media)
      ? (instagramMedia as any).media.map((item: any) => ({
        id: item.id,
        url: item.permalink,
        mediaUrl: item.media_url,
        thumbnailUrl: item.thumbnail_url || item.media_url,
        caption: item.caption || '',
        timestamp: item.timestamp,
      }))
      : []
  };

  const createMonitor = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/video-automation/monitors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-automation/monitors"] });
      toast({ title: "Monitor activated", description: "Audnix is now watching this post" });
      setVideoUrl("");
    },
    onError: () => toast({ title: "Failed to create monitor", variant: "destructive" }),
  });

  const toggleMonitor = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/video-automation/monitors/${id}`, { isActive });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/video-automation/monitors"] }),
  });

  const deleteMonitor = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/video-automation/monitors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-automation/monitors"] });
      toast({ title: "Monitor removed" });
    },
  });

  const handleMenuAction = useCallback((action: string, data: any) => {
    switch (action) {
      case 'automate_video':
        createMonitor.mutate({
          videoId: data.id,
          videoUrl: data.url,
          productLink: "https://audnixai.com/demo",
          ctaText: "Get Started",
        });
        break;
      case 'copy_link':
        toast({ title: "Link Copied", description: "Video URL saved to clipboard" });
        break;
      case 'save_thumbnail':
        window.open(data.thumbnailUrl, '_blank');
        break;
    }
  }, [createMonitor, toast]);

  // Filter and Pagination Logic
  const filteredReels = instagramReels?.reels?.filter((reel: any) =>
    !searchQuery || reel.caption?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredReels.length / itemsPerPage);
  const currentReels = filteredReels.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const ReelsSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in duration-700">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-[9/16] rounded-xl overflow-hidden relative border border-white/5 bg-muted/5 group">
          {/* Top gradient */}
          <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/20 to-transparent" />

          {/* Central Spinner/Glitch Effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader className="w-8 h-8 text-pink-500/20 animate-spin" />
          </div>

          {/* Bottom bar skeleton */}
          <div className="absolute bottom-0 inset-x-0 p-3 space-y-2 bg-gradient-to-t from-black/80 to-transparent">
            <Skeleton className="h-3 w-3/4 bg-white/10" />
            <Skeleton className="h-2 w-1/2 bg-white/5" />
          </div>

          {/* Scanline Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/5 to-transparent bg-[length:100%_200%] animate-scan" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Instagram Automation <Instagram className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-muted-foreground mt-1">
            Convert comments into sales automatically.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-border/40 hover:bg-muted/50"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/dashboard/instagram/media"] });
              toast({ title: "Syncing...", description: "Fetching latest Instagram media" });
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Live Feed
          </Button>
          <Button
            className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            onClick={() => {
              toast({ title: "Force Re-scan Initiated", description: "AI is checking all active monitors now." });
            }}
          >
            <Activity className="mr-2 h-4 w-4" />
            Force Re-scan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Active Monitors & Demo */}
        <div className="lg:col-span-1 space-y-6">
          <IntentDetectionDemo />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              active automations ({monitors?.length || 0})
            </h3>

            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {monitorsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-32 w-full rounded-xl bg-muted/10" />
                    ))}
                  </div>
                ) : monitors?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-[2.5rem] border border-dashed border-border/40 bg-muted/5 backdrop-blur-sm">
                    <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 relative">
                      <Zap className="h-10 w-10 text-primary/40" />
                      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                    </div>
                    <h4 className="text-xl font-bold text-foreground mb-2">No Active Monitors</h4>
                    <p className="text-sm text-muted-foreground max-w-[280px] mb-8 leading-relaxed">
                      Audnix AI is ready to automate your Instagram sales. Select a reel from the feed to start converting comments into deals.
                    </p>
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-primary/20 hover:bg-primary/5 text-primary font-bold px-8 h-12"
                      onClick={() => {
                        document.querySelector('.relative.w-full.max-w-md input')?.scrollIntoView({ behavior: 'smooth' });
                        (document.querySelector('.relative.w-full.max-w-md input') as HTMLElement)?.focus();
                      }}
                    >
                      Browse Your Reels
                    </Button>
                  </div>
                ) : (
                  Array.isArray(monitors) && monitors.map((monitor) => (
                    <MonitorCard
                      key={monitor.id}
                      monitor={monitor}
                      nextSync={monitor.lastSync ? new Date(new Date(monitor.lastSync).getTime() + 5 * 60000) : null}
                      onToggle={() => toggleMonitor.mutate({ id: monitor.id, isActive: !monitor.isActive })}
                      onDelete={() => deleteMonitor.mutate(monitor.id)}
                      isToggling={toggleMonitor.isPending}
                      isDeleting={deleteMonitor.isPending}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right Column: Media Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between bg-card p-2 rounded-xl border border-border/50 shadow-sm">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reels..."
                className="pl-9 bg-transparent border-none shadow-none focus-visible:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-medium px-3 text-muted-foreground border-l border-border/50">
              {filteredReels.length} Reels
            </div>
          </div>

          {reelsLoading || !mounted ? (
            <ReelsSkeleton />
          ) : (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <AnimatePresence>
                  {currentReels.map((reel: any) => (
                    <motion.div
                      key={reel.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onContextMenu={(e) => handleContextMenu(e, 'video', reel)}
                      className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-black border border-border/20 shadow-sm hover:shadow-xl transition-all cursor-pointer ring-offset-background hover:ring-2 hover:ring-pink-500/50 hover:ring-offset-2"
                      onClick={() => {
                        if (!videoUrl) setVideoUrl(reel.url);
                        createMonitor.mutate({
                          videoId: reel.id,
                          videoUrl: reel.permalink || reel.url,
                          productLink: "https://audnixai.com",
                          ctaText: "Get Started",
                          followUpConfig: { askFollowOnConvert: true, askFollowOnDecline: true }
                        });
                      }}
                    >
                      <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground">
                        {reel.mediaUrl ? (
                          <video src={reel.mediaUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted loop onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => e.currentTarget.pause()} />
                        ) : (
                          <Instagram className="h-8 w-8 opacity-20" />
                        )}
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                      <div className="absolute bottom-0 inset-x-0 p-3 text-white">
                        <p className="text-[10px] line-clamp-2 mb-2 opacity-90 leading-tight">{reel.caption || "No caption"}</p>
                        <div className="flex items-center justify-between text-[9px] font-medium opacity-75 uppercase tracking-wider">
                          <span className="flex items-center gap-1"><Play className="h-2 w-2" /> REEL</span>
                          <span className="bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm group-hover:bg-pink-500 group-hover:text-white transition-colors">Select</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          isActive={currentPage === i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className="cursor-pointer"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </div>
      </div>

      <CustomContextMenu
        config={contextConfig}
        onClose={closeMenu}
        onAction={handleMenuAction}
      />
    </div>
  );
}
