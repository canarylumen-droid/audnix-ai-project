import { motion } from "framer-motion";
import { GlassPanel, GlassCard } from "./GlassPanel";
import { WaveformVisualizer, PulsingDot } from "./WaveformVisualizer";
import { TypewriterText } from "./TypewriterText";
import { liveCallMock, AIResponse } from "../data/liveCallMockData";
import { Headphones, Sparkles, Copy, ChevronDown, Zap, MessageSquare, Target, ArrowRight } from "lucide-react";
import { useState } from "react";

const responseTypeStyles: Record<string, { icon: React.ReactNode; color: string }> = {
  "Objection Reframe": { icon: <Zap className="w-4 h-4" />, color: "text-amber-400 bg-amber-500/20 border-amber-500/30" },
  "Answer Question": { icon: <MessageSquare className="w-4 h-4" />, color: "text-blue-400 bg-blue-500/20 border-blue-500/30" },
  "Competitive Positioning": { icon: <Target className="w-4 h-4" />, color: "text-purple-400 bg-purple-500/20 border-purple-500/30" },
  "Push to Close": { icon: <ArrowRight className="w-4 h-4" />, color: "text-green-400 bg-green-500/20 border-green-500/30" }
};

export function AIResponsePanel() {
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const currentResponse = liveCallMock.responses[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-purple-500/5 to-transparent" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Headphones className="w-6 h-6 text-teal-400" />
              <span className="absolute -top-1 -right-1">
                <PulsingDot color="teal" />
              </span>
            </div>
            <span className="text-xl font-semibold text-white">Audnix is listening</span>
          </div>
          <WaveformVisualizer barCount={30} />
        </motion.div>

        <GlassPanel className="p-6 mb-6" glowColor="purple">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">What to Say Next</h2>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium border border-purple-500/30">
                AI
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <GlassCard className="p-6 border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent">
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${responseTypeStyles[currentResponse.type].color}`}>
                  {responseTypeStyles[currentResponse.type].icon}
                  {currentResponse.type}
                </span>
                <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-sm font-medium ml-auto">
                  AI
                </span>
              </div>
              <p className="text-xl text-white leading-relaxed font-medium">
                <TypewriterText text={currentResponse.text} delay={25} />
              </p>
              <button className="mt-4 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <Copy className="w-4 h-4" />
                <span className="text-sm">Copy Response</span>
              </button>
            </GlassCard>
          </motion.div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Previous Suggestions</h3>
            {liveCallMock.responses.slice(1).map((response, index) => (
              <ResponseHistoryItem 
                key={response.id} 
                response={response} 
                index={index}
                expanded={expandedId === response.id}
                onToggle={() => setExpandedId(expandedId === response.id ? null : response.id)}
              />
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function ResponseHistoryItem({ 
  response, 
  index, 
  expanded, 
  onToggle 
}: { 
  response: AIResponse; 
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const style = responseTypeStyles[response.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <GlassCard className="overflow-hidden">
        <button
          onClick={onToggle}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border ${style.color}`}>
              {style.icon}
              {response.type}
            </span>
            <p className="text-slate-300 truncate max-w-md">{response.text.slice(0, 60)}...</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4"
          >
            <p className="text-white mb-3">{response.text}</p>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <span className="text-xs font-medium text-slate-400 block mb-1">Why this works:</span>
              <p className="text-sm text-slate-300">{response.why}</p>
            </div>
          </motion.div>
        )}
      </GlassCard>
    </motion.div>
  );
}
