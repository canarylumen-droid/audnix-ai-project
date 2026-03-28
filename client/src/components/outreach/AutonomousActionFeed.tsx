import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Calendar, PlayCircle, MessageCircle, FastForward, Info, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PremiumLoader } from "@/components/ui/premium-loader";

interface AIActionLog {
  id: string;
  actionType: "calendar_booking" | "video_sent" | "dm_sent" | "follow_up" | "objection_handled";
  decision: "act" | "wait" | "skip" | "escalate";
  intentScore: number | null;
  timingScore: number | null;
  confidence: number | null;
  reasoning: string | null;
  outcome: string | null;
  createdAt: string;
  leadName?: string | null;
  leadEmail?: string | null;
}

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'calendar_booking': return <Calendar className="w-4 h-4" />;
    case 'video_sent': return <PlayCircle className="w-4 h-4" />;
    case 'dm_sent': return <MessageCircle className="w-4 h-4" />;
    case 'follow_up': return <FastForward className="w-4 h-4" />;
    default: return <Bot className="w-4 h-4" />;
  }
};

const getDecisionColor = (decision: string) => {
  switch (decision) {
    case 'act': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'wait': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'skip': return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    case 'escalate': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    default: return 'bg-primary/10 text-primary border-primary/20';
  }
};

export function AutonomousActionFeed() {
  const { data: actions, isLoading } = useQuery<AIActionLog[]>({
    queryKey: ["/api/dashboard/ai-actions", { limit: 15 }],
    refetchInterval: 5000, // 5 seconds
  });

  return (
    <Card className="rounded-2xl border-border/50 bg-card/40 backdrop-blur-xl h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
      <CardHeader className="border-b border-border/40 pb-4 relative z-10">
        <CardTitle className="flex items-center gap-3">
          <Bot className="h-5 w-5 text-primary animate-pulse" />
          Autonomous AI Decisions
        </CardTitle>
        <CardDescription className="text-xs">
          Real-time log of the sales engine's internal reasoning and actions.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto no-scrollbar relative z-10">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <PremiumLoader text="Connecting to Neural Core..." />
          </div>
        ) : !actions || actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground/50 border-t border-border/10">
            <Activity className="h-10 w-10 mb-4 opacity-20 animate-pulse" />
            <p className="text-xs font-black tracking-[0.2em] uppercase">Engine Standing By</p>
            <p className="text-[10px] mt-2 max-w-[200px]">The AI is currently analyzing signals. Decisions will appear here automatically.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            <AnimatePresence>
              {actions.map((action) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-5 hover:bg-muted/10 transition-colors"
                >
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                        {getActionIcon(action.actionType)}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold capitalize flex items-center gap-2">
                            {action.actionType.replace(/_/g, " ")}
                            <Badge variant="outline" className={`text-[9px] uppercase font-black px-2 tracking-widest ${getDecisionColor(action.decision)}`}>
                              {action.decision}
                            </Badge>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 font-medium truncate max-w-[200px] sm:max-w-full">
                            Target: {action.leadName || action.leadEmail || 'Unknown'}
                          </p>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground/60 whitespace-nowrap">
                          {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
                        </span>
                      </div>

                      <div className="bg-background/40 border border-border/50 rounded-lg p-3 text-xs text-muted-foreground/90 leading-relaxed relative">
                        {action.confidence !== null && (
                          <div className="absolute top-2 right-2 flex gap-2">
                            <span className="text-[9px] font-bold text-primary/70">
                              Conf: {Math.round(action.confidence * 100)}%
                            </span>
                          </div>
                        )}
                        <span className="font-semibold text-foreground/70 block mb-1">Reasoning:</span>
                        {action.reasoning || 'Default threshold automation.'}
                      </div>

                      <div className="flex gap-3 mt-2">
                        {action.intentScore !== null && (
                          <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-sm">
                            Intent: {action.intentScore}
                          </span>
                        )}
                        {action.outcome && (
                          <span className="text-[10px] font-medium text-blue-500 flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-sm">
                            <Info className="w-3 h-3" />
                            {action.outcome}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
