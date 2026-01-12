import { motion } from "framer-motion";
import { GlassPanel, GlassCard } from "./GlassPanel";
import { WaveformVisualizer, PulsingDot } from "./WaveformVisualizer";
import { TypewriterText } from "./TypewriterText";
import { liveCallMock } from "../data/liveCallMockData";
import {
  Headphones, User, Sparkles, Copy, Zap, MessageSquare,
  Target, ArrowRight, Building, TrendingUp, AlertCircle,
  FileText, Phone, Settings, Volume2, Brain, PhoneOff
} from "lucide-react";
import { useState } from "react";

const tagStyles: Record<string, { bg: string; text: string; label: string }> = {
  objection: { bg: "bg-red-500/20", text: "text-red-400", label: "Objection" },
  question: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Question" },
  info: { bg: "bg-slate-500/20", text: "text-slate-400", label: "Info" },
  intent: { bg: "bg-green-500/20", text: "text-green-400", label: "Buying Signal" },
  requirement: { bg: "bg-purple-500/20", text: "text-purple-400", label: "Requirement" }
};

const responseTypeStyles: Record<string, { icon: React.ReactNode; color: string }> = {
  "Objection Reframe": { icon: <Zap className="w-4 h-4" />, color: "text-amber-400 bg-amber-500/20 border-amber-500/30" },
  "Answer Question": { icon: <MessageSquare className="w-4 h-4" />, color: "text-blue-400 bg-blue-500/20 border-blue-500/30" },
  "Competitive Positioning": { icon: <Target className="w-4 h-4" />, color: "text-purple-400 bg-purple-500/20 border-purple-500/30" },
  "Push to Close": { icon: <ArrowRight className="w-4 h-4" />, color: "text-green-400 bg-green-500/20 border-green-500/30" }
};

export function LiveCallView() {
  const [currentResponseIndex] = useState(0);
  const currentResponse = liveCallMock.responses[currentResponseIndex];
  const { context } = liveCallMock;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-500/5 to-transparent" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-[1600px] mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Headphones className="w-7 h-7 text-teal-400" />
                <span className="absolute -top-1 -right-1">
                  <PulsingDot color="teal" />
                </span>
              </div>
              <span className="text-xl font-semibold text-white">Audnix is listening</span>
            </div>
            <WaveformVisualizer barCount={40} />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700">
              <Phone className="w-4 h-4 text-teal-400" />
              <span className="text-white font-mono">{context.callDuration}</span>
            </div>
            <button className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/30 transition-colors flex items-center gap-2">
              <PhoneOff className="w-4 h-4" />
              End Call
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-5">
            <GlassPanel className="p-5 h-[calc(100vh-180px)] flex flex-col" glowColor="teal">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-white">What Prospect Said</h2>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-xs font-medium">
                    Live
                  </span>
                </div>
                <span className="text-slate-500 text-sm">Real-Time Transcript</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {liveCallMock.transcript.map((line, index) => {
                  const tag = tagStyles[line.tag];
                  return (
                    <motion.div
                      key={line.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <GlassCard className="p-3 hover:border-teal-500/20 transition-all">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white text-sm">{line.speaker}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${tag.bg} ${tag.text}`}>
                                {tag.label}
                              </span>
                              <span className="text-slate-500 text-xs ml-auto">{line.timestamp}</span>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed">{line.text}</p>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>

              <GlassCard className="mt-4 p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">Listening...</span>
                      <PulsingDot color="teal" />
                    </div>
                    <div className="h-1.5 mt-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
                        animate={{ width: ["0%", "70%", "40%", "80%"] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </GlassPanel>
          </div>

          <div className="col-span-4">
            <GlassPanel className="p-5 h-[calc(100vh-180px)] flex flex-col" glowColor="purple">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-bold text-white">What to Say Next</h2>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium border border-purple-500/30">
                  AI
                </span>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4"
              >
                <GlassCard className="p-4 border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${responseTypeStyles[currentResponse.type].color}`}>
                      {responseTypeStyles[currentResponse.type].icon}
                      {currentResponse.type}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-xs font-medium ml-auto">
                      AI
                    </span>
                  </div>
                  <p className="text-lg text-white leading-relaxed font-medium mb-3">
                    <TypewriterText text={currentResponse.text} delay={20} />
                  </p>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                </GlassCard>
              </motion.div>

              <GlassCard className="p-3 mb-4 bg-slate-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-slate-400">Why this works:</span>
                </div>
                <p className="text-sm text-slate-300">{currentResponse.why}</p>
              </GlassCard>

              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                <h3 className="text-xs font-medium text-slate-500 mb-2">Previous Suggestions</h3>
                {liveCallMock.responses.slice(1).map((response, index) => {
                  const style = responseTypeStyles[response.type];
                  return (
                    <GlassCard key={response.id} className="p-3 hover:border-purple-500/20 transition-all cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border ${style.color}`}>
                          {style.icon}
                          {response.type}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm truncate">{response.text}</p>
                    </GlassCard>
                  );
                })}
              </div>
            </GlassPanel>
          </div>

          <div className="col-span-3 space-y-4">
            <GlassPanel className="p-4" glowColor="gold">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-white text-sm">Prospect Context</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500/30 to-teal-600/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{context.name}</p>
                    <p className="text-slate-500 text-xs">{context.role}</p>
                  </div>
                </div>

                <GlassCard className="p-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-purple-400" />
                    <span className="text-slate-300 text-sm">{context.company}</span>
                  </div>
                </GlassCard>

                <GlassCard className="p-2 border-green-500/20 bg-green-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300 text-sm">Lead Score</span>
                    </div>
                    <span className="text-green-400 font-bold">{context.leadScore}/100</span>
                  </div>
                </GlassCard>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-slate-400 text-xs">Past Objections</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {context.pastObjections.map((obj, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs">
                        {obj}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="p-4" glowColor="teal">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-white text-sm">Brand PDF</h3>
              </div>
              <GlassCard className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-slate-300 text-xs truncate">{context.brandPDF}</p>
                </div>
                <p className="text-slate-500 text-xs line-clamp-2">"{context.notes}"</p>
              </GlassCard>
            </GlassPanel>

            <GlassPanel className="p-4" glowColor="purple">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-4 h-4 text-purple-400" />
                <h3 className="font-semibold text-white text-sm">AI Controls</h3>
              </div>
              <div className="space-y-2">
                <ControlToggle icon={<Volume2 className="w-4 h-4" />} label="Auto-Listen" active />
                <ControlToggle icon={<Brain className="w-4 h-4" />} label="Real-Time AI" active />
                <ControlToggle icon={<Zap className="w-4 h-4" />} label="Objection Mode" active />
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}

function ControlToggle({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={active ? 'text-teal-400' : 'text-slate-500'}>{icon}</span>
        <span className={`text-sm ${active ? 'text-white' : 'text-slate-400'}`}>{label}</span>
      </div>
      <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${active ? 'bg-teal-500' : 'bg-slate-700'}`}>
        <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
    </div>
  );
}
