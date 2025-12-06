import { useState, useCallback } from "react";
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

export default function CloserEngineLive() {
  const [prospectText, setProspectText] = useState("");
  const [analysis, setAnalysis] = useState<ObjectionAnalysis | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    reframe: true,
    question: true,
    close: true,
    story: false,
    identity: false,
    competitor: false,
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
      className="flex-shrink-0 p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors group"
    >
      <Copy className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
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
    
    const colorClasses = {
      cyan: "border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10",
      purple: "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10",
      emerald: "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10",
      orange: "border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10",
      blue: "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10",
    };
    
    const iconBgClasses = {
      cyan: "bg-cyan-500/20",
      purple: "bg-purple-500/20",
      emerald: "bg-emerald-500/20",
      orange: "bg-orange-500/20",
      blue: "bg-blue-500/20",
    };
    
    const iconColorClasses = {
      cyan: "text-cyan-400",
      purple: "text-purple-400",
      emerald: "text-emerald-400",
      orange: "text-orange-400",
      blue: "text-blue-400",
    };
    
    const badgeClasses = {
      cyan: "bg-cyan-500/20 text-cyan-300",
      purple: "bg-purple-500/20 text-purple-300",
      emerald: "bg-emerald-500/20 text-emerald-300",
      orange: "bg-orange-500/20 text-orange-300",
      blue: "bg-blue-500/20 text-blue-300",
    };

    const color = accentColor as keyof typeof colorClasses;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border transition-all ${colorClasses[color]}`}
      >
        <button
          onClick={() => toggleSection(id)}
          className="w-full p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${iconBgClasses[color]}`}>
              <Icon className={`w-4 h-4 ${iconColorClasses[color]}`} />
            </div>
            <span className="font-semibold text-white">{title}</span>
            {badge && (
              <Badge className={`${badgeClasses[color]} text-xs`}>
                {badge}
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-white/60" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/60" />
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
              <div className="px-4 pb-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-start gap-3">
                  <p className="text-sm text-white/90 flex-1 leading-relaxed">{content}</p>
                  <CopyButton text={content} label={title} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/30 blur-xl rounded-full" />
              <div className="relative p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                <Zap className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                Closer Engine Live
                <Badge className="bg-purple-500/20 text-purple-300 text-xs font-normal">
                  Beta
                </Badge>
              </h1>
              <p className="text-white/60 mt-1">
                Paste what the prospect said — get the exact words to close
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-b from-[#1a2744] to-[#0d1428] border-cyan-500/20 h-full">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-white">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  What did they say?
                </CardTitle>
                <CardDescription className="text-white/60">
                  Paste the exact objection from your sales call
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder='e.g., "I need to think about it..." or "Your price is too high" or "I need to talk to my partner first"'
                  value={prospectText}
                  onChange={(e) => setProspectText(e.target.value)}
                  className="min-h-40 resize-none bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500/50 transition-colors"
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzeMutation.isPending || !prospectText.trim()}
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Decoding Objection...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5 mr-2" />
                      Decode & Get Close
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Sparkles className="w-3 h-3" />
                    Powered by 110+ objection patterns
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence mode="wait">
            {analysis ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <Card className="bg-gradient-to-b from-[#1a2744] to-[#0d1428] border-emerald-500/30 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500" />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-white">
                        <AlertCircle className="w-5 h-5 text-orange-400" />
                        Objection Detected
                      </CardTitle>
                      <Badge className="bg-orange-500/20 text-orange-300">
                        {analysis.confidence}% confidence
                      </Badge>
                    </div>
                    <div className="mt-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <p className="text-sm text-orange-300 font-medium">
                        Hidden Objection: {analysis.hiddenObjection || analysis.category}
                      </p>
                    </div>
                  </CardHeader>
                </Card>

                <div className="space-y-3">
                  <CollapsibleSection
                    id="reframe"
                    icon={Lightbulb}
                    title="Immediate Reframe"
                    content={analysis.reframes[0]}
                    badge="Use Now"
                    accentColor="cyan"
                  />

                  <CollapsibleSection
                    id="question"
                    icon={Target}
                    title="Close Question"
                    content={analysis.powerQuestion}
                    badge="Forces Clarity"
                    accentColor="purple"
                  />

                  <CollapsibleSection
                    id="close"
                    icon={TrendingUp}
                    title="Closing Tactic"
                    content={analysis.closingTactic}
                    accentColor="emerald"
                  />

                  {analysis.story && (
                    <CollapsibleSection
                      id="story"
                      icon={BookOpen}
                      title="Story Close"
                      content={analysis.story}
                      badge="Persuasion"
                      accentColor="orange"
                    />
                  )}

                  {analysis.identityUpgrade && (
                    <CollapsibleSection
                      id="identity"
                      icon={Shield}
                      title="Identity Upgrade Close"
                      content={analysis.identityUpgrade}
                      badge="Future Self"
                      accentColor="blue"
                    />
                  )}

                  {analysis.competitorAngle && (
                    <CollapsibleSection
                      id="competitor"
                      icon={ArrowRight}
                      title="Competitor Angle"
                      content={analysis.competitorAngle}
                      accentColor="cyan"
                    />
                  )}
                </div>

                {analysis.nextMove && (
                  <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-500/20">
                          <ArrowRight className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Next Move</p>
                          <p className="text-white font-medium">{analysis.nextMove}</p>
                        </div>
                        <CopyButton text={analysis.nextMove} label="Next Move" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white/80 hover:bg-white/5"
                  onClick={() => {
                    setProspectText("");
                    setAnalysis(null);
                  }}
                >
                  Analyze Another Objection
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-full min-h-[400px]"
              >
                <Card className="bg-gradient-to-b from-[#1a2744] to-[#0d1428] border-white/10 p-8 text-center max-w-md">
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <Brain className="w-8 h-8 text-cyan-400/60" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        The Brain Behind a Top 1% Closer
                      </h3>
                      <p className="text-sm text-white/60">
                        Enter an objection to receive instant tactical responses, reframes, and closing questions.
                      </p>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="text-left space-y-2">
                      <p className="text-xs text-white/40 uppercase tracking-wide">What you'll get:</p>
                      <ul className="text-sm text-white/60 space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          Hidden objection detection
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          Instant reframe phrases
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Power closing questions
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                          Story-based persuasion
                        </li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Card className="bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-purple-500/5 border-emerald-500/20">
          <CardContent className="p-4 text-center">
            <p className="font-semibold text-white flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Closer Engine Live is FREE for all plans
            </p>
            <p className="text-sm text-white/60 mt-1">
              Same 110+ objections database as the autonomous AI sales engine
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
