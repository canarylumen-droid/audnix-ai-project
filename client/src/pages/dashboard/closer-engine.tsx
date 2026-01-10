import { useState, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  Sparkles,
  Zap,
  Brain,
  Target,
  MessageSquare,
  BookOpen,
  ArrowRight,
  Shield,
  TrendingUp,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertCircle,
  Cpu,
  Globe,
  Activity
} from "lucide-react";

interface ObjectionAnalysis {
  category: string;
  confidence: number;
  hiddenObjection?: string;
  reframes: string[];
  powerQuestion: string;
  closingTactic: string;
  story: string;
  identityUpgrade?: string;
  competitorAngle?: string;
  nextMove?: string;
}

const NeuralMap = ({ category, isAnalyzing }: { category?: string, isAnalyzing: boolean }) => {
  return (
    <div className="relative w-full h-40 flex items-center justify-center overflow-hidden mb-8 border border-white/5 bg-black/40 rounded-3xl group">
      <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />

      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-64 h-64 bg-primary/10 blur-[80px] rounded-full animate-pulse" />
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              <Cpu className="w-4 h-4 animate-spin" />
              Vectorizing Intelligence
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex items-center gap-12">
        {[
          { label: 'Inbound', icon: MessageSquare, active: true },
          { label: 'Logic', icon: Brain, active: !!category || isAnalyzing },
          { label: 'Strategy', icon: Target, active: !!category },
          { label: 'Output', icon: Zap, active: !!category }
        ].map((node, i, arr) => (
          <div key={i} className="flex items-center gap-12">
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={node.active ? {
                  scale: [1, 1.1, 1],
                  borderColor: node.active ? 'rgba(var(--primary), 0.5)' : 'rgba(255,255,255,0.05)'
                } : {}}
                transition={{ repeat: Infinity, duration: 3 }}
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-500
                                    ${node.active ? 'bg-primary/10 border-primary/20 text-primary shadow-[0_0_20px_rgba(var(--primary),0.2)]' : 'bg-white/5 border-white/10 text-white/5'}
                                `}
              >
                <node.icon className="w-5 h-5" />
              </motion.div>
              <span className={`text-[8px] font-black uppercase tracking-widest ${node.active ? 'text-white/60' : 'text-white/5'}`}>{node.label}</span>
            </div>
            {i < arr.length - 1 && (
              <div className="w-12 h-px bg-white/5 relative">
                {node.active && (
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function CloserEngineLive() {
  const [prospectText, setProspectText] = useState("");
  const [analysis, setAnalysis] = useState<ObjectionAnalysis | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    reframe: true,
    question: true,
    close: true,
  });
  const { toast } = useToast();

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const analyzeMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch("/api/sales-engine/analyze-objection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectMessage: text }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to analyze objection");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setAnalysis(data);
      toast({
        title: "Objection Decoded",
        description: "Your tactical close is ready",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (!prospectText.trim()) {
      toast({
        title: "Enter prospect message",
        description: "Paste what the prospect said during the call",
        variant: "destructive",
      });
      return;
    }
    analyzeMutation.mutate(prospectText);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <button
      onClick={() => copyToClipboard(text, label)}
      className="flex-shrink-0 p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group cursor-none"
    >
      <Copy className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
    </button>
  );

  const CollapsibleSection = ({
    id,
    icon: Icon,
    title,
    content,
    badge,
    accentColor = "cyan",
  }: {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    content: string;
    badge?: string;
    accentColor?: string;
  }) => {
    const isExpanded = expandedSections[id];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-[2rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all`}
      >
        <button
          onClick={() => toggleSection(id)}
          className="w-full p-6 flex items-center justify-between cursor-none"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-white/5 group-hover:bg-primary/10 transition-colors`}>
              <Icon className={`w-5 h-5 text-white/40 group-hover:text-primary transition-colors`} />
            </div>
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-1">{badge || 'Protocol Output'}</span>
              <span className="text-lg font-black text-white uppercase tracking-tight">{title}</span>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-white/20" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/20" />
          )}
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 pt-2">
                <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-4">
                  <p className="text-md text-white/80 flex-1 leading-relaxed font-medium">{content}</p>
                  <CopyButton text={content} label={title} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const scaleMetric = useMemo(() => {
    const nodes = ["Frankfurt-1", "Singapore-2", "NewYork-4", "London-1"];
    const node = nodes[Math.floor(Math.random() * nodes.length)];
    const load = Math.floor(Math.random() * 20) + 2;
    return { node, load };
  }, [analysis]);

  return (
    <div className="p-4 md:p-12 lg:p-20 max-w-7xl mx-auto selection:bg-primary selection:text-black min-h-screen">
      <div className="space-y-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/10 bg-white/5">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Live Nexus Active</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.85]">
              Closer Engine <br /> <span className="text-primary italic">Live.</span>
            </h1>
            <p className="text-white/40 font-bold text-xl md:text-2xl max-w-xl leading-tight italic">
              Input prospect resistance. Receive <span className="text-white">deterministic</span> closing protocols.
            </p>
          </div>

          <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" /> Node: {scaleMetric.node}
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" /> Load: {scaleMetric.load}%
            </div>
          </div>
        </motion.div>

        <NeuralMap category={analysis?.category} isAnalyzing={analyzeMutation.isPending} />

        <div className="grid lg:grid-cols-5 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="glass-premium p-10 rounded-[3rem] border-white/10 space-y-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />

              <div className="space-y-2 relative z-10">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary">Input Vector</h3>
                <h4 className="text-2xl font-black text-white uppercase tracking-tight">Intercept Objection</h4>
              </div>

              <div className="relative z-10">
                <Textarea
                  placeholder='e.g., "The price is too high for our current budget..."'
                  value={prospectText}
                  onChange={(e) => setProspectText(e.target.value)}
                  className="min-h-60 rounded-3xl bg-black/40 border-white/5 text-white placeholder:text-white/20 focus:border-primary/50 text-xl font-medium leading-relaxed resize-none p-8 transition-all cursor-none"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending || !prospectText.trim()}
                className="w-full h-20 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-white/90 transition-all text-xs cursor-none"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5 mr-3" />
                    Analyze & Overcome
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-white/10 relative z-10">
                <Sparkles className="w-3 h-3 text-primary" />
                Validated on 1M+ Close Events
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {analysis ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  className="space-y-6"
                >
                  <div className="glass-premium p-8 rounded-[2.5rem] border-orange-500/20 bg-orange-500/[0.02] flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                        <AlertCircle className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-500/40 block mb-1">Inferred Psychological Subtext</span>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">
                          {analysis.hiddenObjection || analysis.category}
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-1">Confidence</span>
                      <span className="text-2xl font-black text-white tracking-tighter">{analysis.confidence}%</span>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <CollapsibleSection
                      id="reframe"
                      icon={Lightbulb}
                      title="Neural Reframe"
                      content={analysis.reframes[0]}
                      badge="Perspective Shift"
                      accentColor="cyan"
                    />

                    <CollapsibleSection
                      id="question"
                      icon={Target}
                      title="Force Multiplier"
                      content={analysis.powerQuestion}
                      badge="Power Question"
                      accentColor="purple"
                    />

                    <CollapsibleSection
                      id="close"
                      icon={TrendingUp}
                      title="Closing Protocol"
                      content={analysis.closingTactic}
                      badge="Immediate Close"
                      accentColor="emerald"
                    />

                    {analysis.story && (
                      <CollapsibleSection
                        id="story"
                        icon={BookOpen}
                        title="Persuasion Narrative"
                        content={analysis.story}
                        badge="Social Proof"
                        accentColor="orange"
                      />
                    )}

                    {analysis.identityUpgrade && (
                      <CollapsibleSection
                        id="identity"
                        icon={Shield}
                        title="Identity Alignment"
                        content={analysis.identityUpgrade}
                        badge="Future Self"
                        accentColor="blue"
                      />
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full h-16 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-all cursor-none border-white/5 mt-8"
                    onClick={() => {
                      setProspectText("");
                      setAnalysis(null);
                    }}
                  >
                    Reset Vector
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center p-20 glass-premium rounded-[4rem] border-white/5 text-center space-y-8"
                >
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-4">
                    <Brain className="w-10 h-10 text-white/20 animate-pulse" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Awaiting Signal.</h3>
                    <p className="text-white/40 font-medium text-lg max-w-sm mx-auto leading-tight italic">
                      Protocol initialized. Paste the exact verbatim from your call to extract the tactical advantage.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Global Scaling Indicator */}
        <div className="pt-20 border-t border-white/5 grid md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mx-auto">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Edge Distributed</h5>
            <p className="text-[9px] font-bold text-white/20 uppercase">Redundant Across 14 Cloud Zones</p>
          </div>
          <div className="space-y-4 border-x border-white/5 px-12">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mx-auto">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">No Latency Peak</h5>
            <p className="text-[9px] font-bold text-white/20 uppercase">Deterministic Response &lt; 800ms</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mx-auto">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Security Protocol</h5>
            <p className="text-[9px] font-bold text-white/20 uppercase">AES-256 Neural State Encryption</p>
          </div>
        </div>
      </div>
    </div>
  );
}
