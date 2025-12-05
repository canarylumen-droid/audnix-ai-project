import { motion } from "framer-motion";
import { GlassPanel, GlassCard } from "./GlassPanel";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { Headphones, Mic, MonitorPlay, Chrome, FileText, Zap, Brain, Volume2 } from "lucide-react";

export function ActivationModal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <GlassPanel className="relative max-w-2xl w-full p-8" glowColor="teal">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-600/10 border border-teal-500/30 mb-6"
          >
            <Headphones className="w-10 h-10 text-teal-400" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold text-white mb-3">
              Activate Audnix Real-Time Assistant
            </h1>
            <p className="text-slate-400 text-lg max-w-md mx-auto">
              Your AI listens only to your prospect and helps you say the perfect next line.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <GlassCard className="p-4 mb-6">
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="flex items-center gap-2 text-teal-400">
                <Volume2 className="w-5 h-5" />
                <span className="text-sm font-medium">Live Waveform Preview</span>
              </div>
            </div>
            <WaveformVisualizer />
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 mb-8"
        >
          <ToggleOption icon={<Mic className="w-5 h-5" />} label="Enable Call Listener" checked />
          
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Audio Source</label>
            <div className="grid grid-cols-4 gap-3">
              <AudioSourceButton icon={<Mic />} label="Microphone" active />
              <AudioSourceButton icon={<Headphones />} label="VoIP" />
              <AudioSourceButton icon={<MonitorPlay />} label="Zoom Tab" />
              <AudioSourceButton icon={<Chrome />} label="Chrome Tab" />
            </div>
          </div>

          <ToggleOption icon={<Zap className="w-5 h-5" />} label="Smart Filler Removal" sublabel="Removes uh, um, ahh automatically" checked />
          <ToggleOption icon={<Brain className="w-5 h-5" />} label="Objection Detection Mode" sublabel="Highlights objections in real-time" checked />
          <ToggleOption icon={<FileText className="w-5 h-5" />} label="Use Brand PDF Context" sublabel="AI uses your sales materials for better responses" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4"
        >
          <button className="flex-1 px-6 py-3 rounded-xl border border-slate-600 text-slate-300 font-medium hover:bg-slate-800/50 transition-colors">
            Cancel
          </button>
          <button className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all hover:scale-[1.02]">
            Start Listening
          </button>
        </motion.div>
      </GlassPanel>
    </div>
  );
}

function ToggleOption({ icon, label, sublabel, checked = false }: { icon: React.ReactNode; label: string; sublabel?: string; checked?: boolean }) {
  return (
    <GlassCard className="p-4 flex items-center justify-between group hover:border-teal-500/30 transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="text-teal-400">{icon}</div>
        <div>
          <span className="text-white font-medium">{label}</span>
          {sublabel && <p className="text-slate-500 text-sm">{sublabel}</p>}
        </div>
      </div>
      <div className={`w-12 h-6 rounded-full p-1 transition-colors ${checked ? 'bg-teal-500' : 'bg-slate-700'}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow-lg transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </GlassCard>
  );
}

function AudioSourceButton({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`
      p-3 rounded-xl border text-center transition-all
      ${active 
        ? 'bg-teal-500/20 border-teal-500/50 text-teal-300' 
        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
      }
    `}>
      <div className="flex flex-col items-center gap-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
    </button>
  );
}
