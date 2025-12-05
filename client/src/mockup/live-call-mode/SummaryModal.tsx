import { motion } from "framer-motion";
import { GlassPanel, GlassCard } from "./GlassPanel";
import { liveCallMock } from "../data/liveCallMockData";
import { 
  CheckCircle, AlertTriangle, TrendingUp, Calendar, 
  DollarSign, FileText, Download, Send, Sparkles,
  ArrowRight, Target, Clock
} from "lucide-react";

export function SummaryModal() {
  const { summary, context } = liveCallMock;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <GlassPanel className="relative max-w-4xl w-full p-8" glowColor="green">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Call Processed Successfully</h1>
          <p className="text-slate-400">
            {context.name} at {context.company} | Duration: {context.callDuration}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-5 h-full">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">Pain Points Identified</h3>
              </div>
              <div className="space-y-2">
                {summary.painPoints.map((point, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-slate-300">{point}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-5 h-full">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold text-white">Buying Signals</h3>
              </div>
              <div className="space-y-2">
                {summary.buyingSignals.map((signal, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-slate-300">{signal}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-5 h-full">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">AI Responses Used</h3>
                <span className="text-slate-500 text-sm ml-auto">{summary.objectionCount} objections handled</span>
              </div>
              <div className="space-y-2">
                {["Budget Reframe", "Integration Assurance", "Timeline Urgency"].map((response, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-slate-300">{response}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="p-5 h-full bg-gradient-to-br from-teal-500/10 to-transparent border-teal-500/30">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-teal-400" />
                <h3 className="font-semibold text-white">Intent Score</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="none" className="text-slate-700" />
                    <circle 
                      cx="40" cy="40" r="35" 
                      stroke="currentColor" 
                      strokeWidth="6" 
                      fill="none" 
                      className="text-teal-500"
                      strokeDasharray={`${summary.intentScore * 2.2} 220`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-teal-400">
                    {summary.intentScore}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">High Buying Intent</p>
                  <p className="text-slate-400 text-sm">Ready for proposal</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard className="p-5 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <ArrowRight className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Recommended Next Steps</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {summary.recommendedActions.map((action, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-sm flex items-center justify-center font-medium">
                      {i + 1}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm">{action}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <StatBadge icon={<Calendar />} label="Timeline" value={summary.timeline} />
          <StatBadge icon={<DollarSign />} label="Budget Range" value={summary.budget} />
          <StatBadge icon={<Clock />} label="Call Duration" value={context.callDuration} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex gap-4"
        >
          <button className="flex-1 px-6 py-3 rounded-xl border border-slate-600 text-slate-300 font-medium hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />
            Export PDF
          </button>
          <button className="flex-1 px-6 py-3 rounded-xl border border-slate-600 text-slate-300 font-medium hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2">
            <FileText className="w-5 h-5" />
            Save to CRM
          </button>
          <button className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
            <Send className="w-5 h-5" />
            Create Follow-Up
          </button>
        </motion.div>
      </GlassPanel>
    </div>
  );
}

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <GlassCard className="p-4 flex items-center gap-3">
      <div className="text-slate-400">{icon}</div>
      <div>
        <span className="text-slate-500 text-xs block">{label}</span>
        <span className="text-white font-medium">{value}</span>
      </div>
    </GlassCard>
  );
}
