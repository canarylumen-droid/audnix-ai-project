import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Mail,
  Calendar,
  Video,
  TrendingUp,
  Loader2,
  Activity
} from "lucide-react";
import { format } from "date-fns";

interface AIDecision {
  id: string;
  actionType: string;
  decision: 'act' | 'wait' | 'skip' | 'escalate';
  intentScore: number;
  timingScore: number;
  confidence: number;
  reasoning: string;
  leadId?: string;
  createdAt: string;
}

interface DecisionStats {
  total: number;
  acted: number;
  waited: number;
  skipped: number;
  escalated: number;
  avgIntentScore: number;
  avgConfidence: number;
}

const DECISION_ICONS = {
  act: CheckCircle,
  wait: Clock,
  skip: XCircle,
  escalate: AlertTriangle,
};

const DECISION_COLORS = {
  act: 'text-green-500 bg-green-500/10',
  wait: 'text-yellow-500 bg-yellow-500/10',
  skip: 'text-red-500 bg-red-500/10',
  escalate: 'text-orange-500 bg-orange-500/10',
};

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  calendar_booking: Calendar,
  video_sent: Video,
  dm_sent: MessageSquare,
  follow_up: Mail,
  objection_handled: MessageSquare,
};

export default function AIDecisionsPage() {
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [decisionFilter, setDecisionFilter] = useState<string>('all');

  const { data: decisions, isLoading } = useQuery<AIDecision[]>({
    queryKey: ['/api/automation/decisions'],
    retry: false,
  });

  const stats: DecisionStats = {
    total: decisions?.length || 0,
    acted: decisions?.filter(d => d.decision === 'act').length || 0,
    waited: decisions?.filter(d => d.decision === 'wait').length || 0,
    skipped: decisions?.filter(d => d.decision === 'skip').length || 0,
    escalated: decisions?.filter(d => d.decision === 'escalate').length || 0,
    avgIntentScore: decisions?.length
      ? Math.round(decisions.reduce((sum, d) => sum + (d.intentScore || 0), 0) / decisions.length)
      : 0,
    avgConfidence: decisions?.length
      ? Math.round(decisions.reduce((sum, d) => sum + (d.confidence || 0), 0) / decisions.length * 100)
      : 0,
  };

  const filteredDecisions = decisions?.filter(d => {
    if (actionFilter !== 'all' && d.actionType !== actionFilter) return false;
    if (decisionFilter !== 'all' && d.decision !== decisionFilter) return false;
    return true;
  }) || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-500" />
          AI Decision Transparency
        </h1>
        <p className="text-muted-foreground mt-1">
          Every AI decision is logged with reasoning. Full visibility into automation logic.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Neural Events"
          value={stats.total}
          icon={Activity}
          color="text-primary"
        />
        <StatCard
          label="Success Rate"
          value={stats.acted}
          subtext={`${stats.total > 0 ? Math.round((stats.acted / stats.total) * 100) : 0}% APV`}
          icon={CheckCircle}
          color="text-emerald-500"
        />
        <StatCard
          label="Neural Affinity"
          value={`${stats.avgIntentScore}%`}
          icon={TrendingUp}
          color="text-orange-500"
        />
        <StatCard
          label="AI Stability"
          value={`${stats.avgConfidence}%`}
          icon={Brain}
          color="text-primary"
        />
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-primary/10 rounded-2xl shadow-inner border border-primary/20">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Intelligence Governance Protocol</h3>
              <p className="text-sm text-muted-foreground/60 mt-2 font-bold leading-relaxed max-w-2xl">
                AI NEVER acts without decision engine approval. Every action requires minimum intent
                thresholds and confidence scores. Each decision is logged as: <span className="text-emerald-500">ACT</span>, <span className="text-orange-500">WAIT</span>,
                <span className="text-red-500">SKIP</span>, or <span className="text-purple-500">ESCALATE</span>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <DecisionTypeCard
          type="act"
          count={stats.acted}
          label="Acted"
        />
        <DecisionTypeCard
          type="wait"
          count={stats.waited}
          label="Waiting"
        />
        <DecisionTypeCard
          type="skip"
          count={stats.skipped}
          label="Skipped"
        />
        <DecisionTypeCard
          type="escalate"
          count={stats.escalated}
          label="Escalated"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Decision Log</CardTitle>
            <div className="flex gap-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="calendar_booking">Calendar Booking</SelectItem>
                  <SelectItem value="dm_sent">DM Sent</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="video_sent">Video Sent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={decisionFilter} onValueChange={setDecisionFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="act">Act</SelectItem>
                  <SelectItem value="wait">Wait</SelectItem>
                  <SelectItem value="skip">Skip</SelectItem>
                  <SelectItem value="escalate">Escalate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !filteredDecisions.length ? (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Decisions Yet</h3>
              <p className="text-sm text-muted-foreground">
                AI decisions will appear here as automation runs
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDecisions.map((decision) => (
                <DecisionRow key={decision.id} decision={decision} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl bg-muted/20 border border-border/10 group-hover:scale-110 transition-transform`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div>
            <div className="text-2xl font-black text-foreground tracking-tighter">{value}</div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">{label}</div>
            {subtext && (
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mt-1">{subtext}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DecisionTypeCard({
  type,
  count,
  label,
}: {
  type: 'act' | 'wait' | 'skip' | 'escalate';
  count: number;
  label: string;
}) {
  const Icon = DECISION_ICONS[type];
  const colorClass = DECISION_COLORS[type];

  return (
    <Card className={`rounded-[1.5rem] border-border/10 overflow-hidden transition-all duration-300 ${count > 0 ? 'bg-muted/10 hover:bg-muted/20' : 'opacity-20'}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${colorClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight text-foreground">{count}</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DecisionRow({ decision }: { decision: AIDecision }) {
  const DecisionIcon = DECISION_ICONS[decision.decision];
  const ActionIcon = ACTION_ICONS[decision.actionType] || MessageSquare;
  const colorClass = DECISION_COLORS[decision.decision];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-start gap-4 p-6 rounded-[2rem] border border-border/10 bg-muted/10 hover:bg-muted/20 transition-all group shadow-sm"
    >
      <div className={`p-3 rounded-2xl ${colorClass} shadow-lg`}>
        <DecisionIcon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-2 text-[10px] font-black uppercase tracking-widest bg-muted/10 border-border/10 h-7 px-3">
            <ActionIcon className="h-3.5 w-3.5" />
            {decision.actionType.replace('_', ' ')}
          </Badge>
          <Badge
            variant="secondary"
            className={`text-[10px] font-black uppercase tracking-widest h-7 px-3 ${colorClass}`}
          >
            {decision.decision}
          </Badge>
        </div>
        <p className="text-md font-bold text-foreground/80 mt-4 leading-relaxed tracking-tight">{decision.reasoning}</p>
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border/10">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">Intent Score</span>
            <span className="text-[10px] font-black text-orange-500">{decision.intentScore}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">Confidence</span>
            <span className="text-[10px] font-black text-primary">{Math.round((decision.confidence || 0) * 100)}%</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Clock className="h-3 w-3 text-muted-foreground/30" />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">{format(new Date(decision.createdAt), 'MMM d, h:mm a')}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
