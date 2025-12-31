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
          label="Total Decisions"
          value={stats.total}
          icon={Activity}
          color="text-blue-500"
        />
        <StatCard
          label="Actions Taken"
          value={stats.acted}
          subtext={`${stats.total > 0 ? Math.round((stats.acted / stats.total) * 100) : 0}% approval rate`}
          icon={CheckCircle}
          color="text-green-500"
        />
        <StatCard
          label="Avg Intent Score"
          value={`${stats.avgIntentScore}%`}
          icon={TrendingUp}
          color="text-purple-500"
        />
        <StatCard
          label="Avg Confidence"
          value={`${stats.avgConfidence}%`}
          icon={Brain}
          color="text-cyan-500"
        />
      </div>

      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold">Intelligence Governance</h3>
              <p className="text-sm text-muted-foreground mt-1">
                AI NEVER acts without decision engine approval. Every action requires minimum intent 
                and confidence scores. Decisions are logged with: act (proceed), wait (hold), 
                skip (don't do), escalate (needs human review).
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
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-muted`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
            {subtext && (
              <div className="text-xs text-muted-foreground mt-1">{subtext}</div>
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
    <Card className={count > 0 ? '' : 'opacity-50'}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${colorClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold">{count}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
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
    <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <DecisionIcon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs">
            <ActionIcon className="h-3 w-3" />
            {decision.actionType.replace('_', ' ')}
          </Badge>
          <Badge
            variant="secondary"
            className={`text-xs ${colorClass}`}
          >
            {decision.decision.toUpperCase()}
          </Badge>
        </div>
        <p className="text-sm mt-2">{decision.reasoning}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>Intent: {decision.intentScore}%</span>
          <span>Timing: {decision.timingScore}%</span>
          <span>Confidence: {Math.round((decision.confidence || 0) * 100)}%</span>
          <span>{format(new Date(decision.createdAt), 'MMM d, h:mm a')}</span>
        </div>
      </div>
    </div>
  );
}
