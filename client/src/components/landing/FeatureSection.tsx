import { motion } from "framer-motion";
import { MessageSquare, Calendar, Target, Smartphone, Sparkles, Activity, Bookmark } from "lucide-react";

const capabilities = [
  {
    title: "Lead Scoring",
    desc: "Stop chasing dead ends. Audnix identifies your highest-value prospects by analyzing intent signals in real-time.",
    icon: Target,
    color: "from-blue-500/20 to-cyan-500/20",
    features: ["Strategic prioritization", "Behavioral tracking", "Intent detection"]
  },
  {
    title: "Brand Intelligence",
    desc: "Your AI doesn't just reply; it represents. It learns your unique voice to build deep, consistent trust with every lead.",
    icon: Bookmark,
    color: "from-purple-500/20 to-blue-500/20",
    features: ["Tone synchronization", "Detailed knowledge", "Brand-safe logic"]
  },
  {
    title: "Live Audit Trail",
    desc: "Total transparency. Watch your AI navigate complex sales conversations and handle objections with surgical precision.",
    icon: Activity,
    color: "from-cyan-500/20 to-emerald-500/20",
    features: ["Conversation logs", "Decision transparency", "Real-time oversight"]
  },
  {
    title: "Seamless Booking",
    desc: "Turn interest into revenue instantly. Audnix handles the back-and-forth to get meetings on your calendar while you sleep.",
    icon: Calendar,
    color: "from-emerald-500/20 to-teal-500/20",
    features: ["Calendar sync", "Timezone master", "Soft-close expertise"]
  },
  {
    title: "Objection Mastery",
    desc: "Price concerns? Timing issues? Audnix uses your proven sales logic to reframe objections into ROI-focused discussions.",
    icon: MessageSquare,
    color: "from-blue-500/20 to-indigo-500/20",
    features: ["Value reframing", "Signal detection", "Risk reversal"]
  },
  {
    title: "Omni-Channel Flow",
    desc: "Dominate the inbox. From Instagram DMs to professional Email threads, your presence is felt everywhere, 24/7.",
    icon: Smartphone,
    color: "from-indigo-500/20 to-purple-500/20",
    features: ["Instagram Native", "Email Automation", "Unified Sync"]
  }
];

export function FeatureSection() {
  return (
    <section id="features" className="py-32 px-4 relative overflow-hidden bg-background">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center mb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="px-5 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-10 flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Designed for the 1% of high-growth teams
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-8xl font-bold tracking-tight mb-10 leading-[0.95]"
          >
            Scale without the <br />
            <span className="text-muted-foreground">operational noise.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-muted-foreground text-lg md:text-xl max-w-2xl font-medium leading-relaxed"
          >
            We've built the intelligent layer that bridges the gap between raw leads and confirmed revenue.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="animated-border-card p-10 rounded-3xl bg-card border border-border/40 hover:bg-muted/30 transition-all group relative overflow-hidden flex flex-col h-full shadow-sm"
            >
              {/* Subtle Corner Accent */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${cap.color} opacity-0 group-hover:opacity-100 blur-[60px] transition-opacity duration-500`} />

              <div className="w-16 h-16 rounded-2xl bg-muted border border-border/40 flex items-center justify-center mb-10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                <cap.icon className="w-8 h-8 text-foreground/40 group-hover:text-primary transition-colors" />
              </div>

              <h3 className="text-2xl font-bold mb-6 tracking-tight">
                {cap.title}
              </h3>
              <p className="text-muted-foreground font-medium mb-12 leading-relaxed text-sm">
                {cap.desc}
              </p>

              <div className="space-y-4 mt-auto">
                {cap.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-primary/20 group-hover:bg-primary transition-all duration-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 group-hover:text-foreground transition-colors">{feat}</span>
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
