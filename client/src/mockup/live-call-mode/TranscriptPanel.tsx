import { motion } from "framer-motion";
import { GlassPanel, GlassCard } from "./GlassPanel";
import { WaveformVisualizer, PulsingDot } from "./WaveformVisualizer";
import { liveCallMock, TranscriptLine } from "../data/liveCallMockData";
import { Headphones, User } from "lucide-react";

const tagStyles: Record<string, { bg: string; text: string; label: string }> = {
  objection: { bg: "bg-red-500/20", text: "text-red-400", label: "Objection" },
  question: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Question" },
  info: { bg: "bg-slate-500/20", text: "text-slate-400", label: "Info" },
  intent: { bg: "bg-green-500/20", text: "text-green-400", label: "Buying Signal" },
  requirement: { bg: "bg-purple-500/20", text: "text-purple-400", label: "Requirement" }
};

export function TranscriptPanel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-500/5 to-transparent" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
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

        <GlassPanel className="p-6" glowColor="teal">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">What Prospect Said</h2>
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-sm font-medium">
                Live Transcript
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-sm">Real-Time Text Streaming</span>
              <span className="font-mono text-teal-400">{liveCallMock.context.callDuration}</span>
            </div>
          </div>

          <div className="space-y-4">
            {liveCallMock.transcript.map((line, index) => (
              <TranscriptLineItem key={line.id} line={line} index={index} />
            ))}
          </div>

          <GlassCard className="mt-6 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500/30 to-teal-600/20 flex items-center justify-center">
                <User className="w-5 h-5 text-teal-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">Prospect Speaking...</span>
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-teal-400"
                  >
                    <PulsingDot color="teal" />
                  </motion.span>
                </div>
                <div className="h-2 mt-2 rounded-full bg-slate-700/50 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "65%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </GlassPanel>
      </div>
    </div>
  );
}

function TranscriptLineItem({ line, index }: { line: TranscriptLine; index: number }) {
  const tag = tagStyles[line.tag];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <GlassCard className="p-4 hover:border-teal-500/20 transition-all group">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600">
              <User className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-semibold text-white">{line.speaker}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tag.bg} ${tag.text}`}>
                {tag.label}
              </span>
              <span className="text-slate-500 text-sm ml-auto font-mono">{line.timestamp}</span>
            </div>
            <p className="text-slate-300 text-lg leading-relaxed">{line.text}</p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
