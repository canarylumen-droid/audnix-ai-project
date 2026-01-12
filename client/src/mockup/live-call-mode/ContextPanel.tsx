import { motion } from "framer-motion";
import { GlassPanel, GlassCard } from "./GlassPanel";
import { WaveformVisualizer, PulsingDot } from "./WaveformVisualizer";
import { liveCallMock } from "../data/liveCallMockData";
import {
  Headphones, User, Building, TrendingUp, AlertCircle,
  FileText, Phone, DollarSign, Target, Settings,
  Volume2, Brain, Zap, ChevronRight
} from "lucide-react";

export function ContextPanel() {
  const { context } = liveCallMock;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-500/5 to-transparent" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto relative">
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

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <GlassPanel className="p-6 h-full" glowColor="gold">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-bold text-white">Prospect Context</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <InfoCard
                  icon={<User className="w-5 h-5 text-teal-400" />}
                  label="Contact"
                  value={context.name}
                  sublabel={context.role}
                />
                <InfoCard
                  icon={<Building className="w-5 h-5 text-purple-400" />}
                  label="Company"
                  value={context.company}
                  sublabel="Enterprise Account"
                />
                <InfoCard
                  icon={<TrendingUp className="w-5 h-5 text-green-400" />}
                  label="Lead Score"
                  value={`${context.leadScore}/100`}
                  sublabel="High Intent"
                  highlight
                />
                <InfoCard
                  icon={<DollarSign className="w-5 h-5 text-amber-400" />}
                  label="Deal Value"
                  value={context.dealValue}
                  sublabel={context.stage}
                />
              </div>

              <GlassCard className="p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="font-semibold text-white">Past Objections</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {context.pastObjections.map((obj, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 text-sm font-medium border border-red-500/30">
                      {obj}
                    </span>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-white">Brand PDF Insights</span>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{context.brandPDF}</p>
                      <p className="text-slate-500 text-sm">Uploaded sales material</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm">"{context.notes}"</p>
                </div>
              </GlassCard>
            </GlassPanel>
          </div>

          <div className="space-y-6">
            <GlassPanel className="p-5" glowColor="teal">
              <div className="flex items-center gap-3 mb-4">
                <Phone className="w-5 h-5 text-teal-400" />
                <h3 className="font-semibold text-white">Call Stats</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Duration</span>
                  <span className="text-white font-mono">{context.callDuration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Previous Calls</span>
                  <span className="text-white">{context.previousCalls}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Stage</span>
                  <span className="text-teal-400 font-medium">{context.stage}</span>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="p-5" glowColor="purple">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">AI Controls</h3>
              </div>
              <div className="space-y-4">
                <ControlToggle icon={<Volume2 />} label="Auto-Listen" active />
                <ControlToggle icon={<Brain />} label="Real-Time AI" active />
                <ControlToggle icon={<Zap />} label="Objection Mode" active />

                <div className="pt-2">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400 text-sm">Sensitivity</span>
                    <span className="text-teal-400 text-sm font-medium">Medium</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700/50">
                    <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-teal-500 to-teal-400" />
                  </div>
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, sublabel, highlight = false }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
}) {
  return (
    <GlassCard className={`p-4 ${highlight ? 'border-green-500/30 bg-green-500/5' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div>
          <span className="text-slate-400 text-sm">{label}</span>
          <p className={`text-lg font-semibold ${highlight ? 'text-green-400' : 'text-white'}`}>{value}</p>
          {sublabel && <span className="text-slate-500 text-sm">{sublabel}</span>}
        </div>
      </div>
    </GlassCard>
  );
}

function ControlToggle({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={active ? 'text-teal-400' : 'text-slate-500'}>{icon}</span>
        <span className={active ? 'text-white' : 'text-slate-400'}>{label}</span>
      </div>
      <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${active ? 'bg-teal-500' : 'bg-slate-700'}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </div>
  );
}
