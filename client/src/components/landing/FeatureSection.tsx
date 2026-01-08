import { motion } from "framer-motion";
import { MessageSquare, Mic, Calendar, Check, Zap, Smartphone, Target, Layers } from "lucide-react";

const capabilities = [
  {
    title: "Intelligence Layer",
    desc: "AI that remembers lead history and predicts buying intent.",
    icon: Target,
    color: "from-blue-500 to-cyan-500",
    features: ["Context-aware memory", "Behavior tracking", "Intent scoring"]
  },
  {
    title: "Omnichannel Sync",
    desc: "Respond to Instagram DMs and Emails from one central brain.",
    icon: Layers,
    color: "from-purple-500 to-blue-500",
    features: ["Instagram Meta API", "Real-time Email sync", "Unified interface"]
  },
  {
    title: "Voice Cloning",
    desc: "scale your authenticity with AI voice notes in your exact tone.",
    icon: Mic,
    color: "from-cyan-500 to-emerald-500",
    features: ["1-click voice setup", "Emotional nuances", "Instagram DM ready"]
  },
  {
    title: "Automated Booking",
    desc: "Seamlessly transition from objection handling to booked meeting.",
    icon: Calendar,
    color: "from-emerald-500 to-teal-500",
    features: ["Calendly integration", "Timezone handling", "Soft-close logic"]
  },
  {
    title: "Dynamic Objections",
    desc: "Never lose a lead to 'price' or 'timing' again. AI explains value.",
    icon: MessageSquare,
    color: "from-blue-500 to-indigo-500",
    features: ["Price reframing", "Competitor analysis", "Risk reversal"]
  },
  {
    title: "Mobile First",
    desc: "Control your entire sales engine from your pocket or desktop.",
    icon: Smartphone,
    color: "from-indigo-500 to-purple-500",
    features: ["Native app feel", "Real-time alerts", "Push notifications"]
  }
];

export function FeatureSection() {
  return (
    <section id="features" className="py-32 px-4 relative overflow-hidden bg-[#020409]">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass px-4 py-1.5 rounded-full border-white/10 mb-6"
          >
            <span className="text-xs font-black uppercase tracking-widest text-primary">Capabilities</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6"
          >
            NOT JUST A BOT.<br />
            <span className="text-white/40">AN ELITE SALES ENGINE.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-xl text-white/50 max-w-2xl font-medium"
          >
            We've replaced standard automations with a tiered intelligence layer
            that thinks, learns, and converts.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -10 }}
              className="glass-card group p-8 rounded-[2.5rem] border-white/5 hover:border-white/10 transition-all cursor-default relative overflow-hidden h-full"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${cap.color} opacity-5 blur-3xl group-hover:opacity-15 transition-opacity`} />

              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-inner">
                <cap.icon className="w-7 h-7 text-white group-hover:text-primary transition-colors" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
                {cap.title}
              </h3>
              <p className="text-white/50 font-medium mb-8 leading-relaxed">
                {cap.desc}
              </p>

              <div className="space-y-3 mt-auto">
                {cap.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-sm font-bold text-white/70">{feat}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
