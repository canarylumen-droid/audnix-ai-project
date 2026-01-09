import { motion } from "framer-motion";
import { MessageSquare, Mic, Calendar, Target, Layers, Smartphone, Sparkles, Activity, Brain, ZapCheck } from "lucide-react";

const capabilities = [
  {
    title: "Predictive Intelligence",
    desc: "AI that analyzes lead behavior and follows up only when intent peaks.",
    icon: Target,
    color: "from-blue-500 to-cyan-500",
    features: ["Context-aware memory", "Behavior tracking", "Intent scoring"]
  },
  {
    title: "Memory That Feels Human",
    desc: "Audnix remembers every interaction. References past details naturally without redundant questions.",
    icon: Brain,
    color: "from-purple-500 to-blue-500",
    features: ["DM & Email Memory", "Tone Consistency", "Contextual Awareness"]
  },
  {
    title: "Intent Scoring",
    desc: "Automatically scores leads based on speed, language, and engagement depth to prioritize closers.",
    icon: Activity,
    color: "from-cyan-500 to-emerald-500",
    features: ["Engagement Analysis", "Signal Detection", "Lead Prioritization"]
  },
  {
    title: "Automated Booking",
    desc: "Seamlessly transition from objection handling to a booked meeting in your calendar.",
    icon: Calendar,
    color: "from-emerald-500 to-teal-500",
    features: ["Calendly integration", "Timezone handling", "Soft-close logic"]
  },
  {
    title: "Objection Handling",
    desc: "Detect buying signals and counter objections using your specific brand logic and testimonials.",
    icon: MessageSquare,
    color: "from-blue-500 to-indigo-500",
    features: ["Price reframing", "Real-time Metrics", "Risk reversal"]
  },
  {
    title: "Unified Support",
    desc: "Email and Text automation that works 24/7 so you can focus on showing up and closing.",
    icon: Smartphone,
    color: "from-indigo-500 to-purple-500",
    features: ["Native app feel", "Real-time alerts", "Push notifications"]
  }
];

export function FeatureSection() {
  return (
    <section id="features" className="py-40 px-4 relative overflow-hidden bg-black">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center mb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-10 flex items-center gap-3"
          >
            <Sparkles className="w-3 h-3" />
            No Hype. Pure Intelligence.
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-[8rem] font-black tracking-[-0.05em] leading-[0.85] text-white uppercase italic mb-10"
          >
            SYSTEM OVER <br />
            <span className="text-white/20 not-italic tracking-[-0.08em]">SOFTWARE.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-white/40 text-2xl md:text-3xl max-w-3xl font-medium tracking-tight leading-relaxed italic"
          >
            We've built an <span className="text-white">intelligence layer</span> that continuously analyzes outcomes to decide
            exactly <span className="text-white">when and how</span> to act on your behalf.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                delay: i * 0.1,
                duration: 1.2,
                ease: [0.16, 1, 0.3, 1]
              }}
              whileHover={{ y: -20, transition: { duration: 0.4 } }}
              className="p-12 rounded-[4rem] bg-white/[0.01] border border-white/5 hover:border-primary/20 hover:bg-white/[0.03] transition-all group relative overflow-hidden h-full perspective-tilt premium-glow"
            >
              {/* Background Glow */}
              <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${cap.color} opacity-0 group-hover:opacity-10 blur-[80px] transition-opacity duration-700`} />

              <div className="flex justify-between items-start mb-12">
                <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:border-primary/30 transition-all duration-700">
                  <cap.icon className="w-10 h-10 text-white group-hover:text-primary transition-all duration-700" />
                </div>
                <Activity className="w-4 h-4 text-white/10 group-hover:text-primary animate-pulse transition-colors" />
              </div>

              <h3 className="text-3xl font-black text-white mb-6 tracking-tighter uppercase italic group-hover:text-primary transition-colors">
                {cap.title}
              </h3>
              <p className="text-white/40 font-bold italic text-lg leading-relaxed mb-12">
                {cap.desc}
              </p>

              <div className="space-y-4 mt-auto">
                {cap.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-4 group/item">
                    <div className="w-2 h-2 rounded-full bg-primary/20 group-hover/item:bg-primary group-hover/item:scale-150 transition-all shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                    <span className="text-sm font-black uppercase tracking-widest text-white/30 group-hover/item:text-white transition-colors">{feat}</span>
                  </div>
                ))}
              </div>

              {/* Decorative Linear Line */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
