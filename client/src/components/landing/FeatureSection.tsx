import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Calendar, Target, Smartphone, Sparkles, Activity, Bookmark, MousePointer2, Brain, History, Clock, ShieldCheck, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { useState } from "react";

const DEEP_DIVE_FEATURES = [
  {
    id: "memory",
    title: "Permanent Active Memory",
    subtitle: "Context That Never Expires",
    icon: History,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    outcome: "Your leads feel truly heard because the AI remembers details from 3 months ago.",
    technical: [
      "Vector Database Persistence: Unlike generic wrappers that wipe context after the session, Audnix maintains a permanent Pinecone vector record for every specific lead handle.",
      "Semantic Recall: If a lead mentioned 'budget issues' in January, and you reach out in March, the AI references that specific conversation: 'Hey [Name], I know timing was tight in Jan, is Q2 looking better?'",
      "Cross-Channel Knowledge: Information gathered via Email is instantly available to the Instagram DM agent. It creates a unified 'Theory of Mind' for each prospect."
    ]
  },
  {
    id: "objections",
    title: "Dynamic Objection Graph",
    subtitle: "Navigate 'No' Like a Top Closer",
    icon: Brain,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
    outcome: "Turns 'It's too expensive' into 'When can we start?' without human intervention.",
    technical: [
      "Goal-Oriented Agents: We don't use static 'If/Then' scripts. We use a dynamic goal-seeking agent that understands the intent behind the objection.",
      "Value Re-Anchoring: When a lead objects to price, the AI automatically retrieves their 'Pain Point' from the memory bank and re-anchors the price against the cost of inaction.",
      "Soft-Looping: The agent uses 'Chris Voss' style mirroring and labeling ('It sounds like you're worried about ROI...') to lower defensiveness before moving back to the close."
    ]
  },
  {
    id: "timing",
    title: "Behavioral Timing Matrix",
    subtitle: "Human-Like Latency Patterns",
    icon: Clock,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    outcome: "Leads never suspect it's a bot because it doesn't reply instantly.",
    technical: [
      "Variable Latency Distribution: The AI analyzes the complexity of the inbound message. A simple 'Yes' gets a 45-second reply. A complex paragraph gets a 4-7 minute reply time to simulate reading/thinking.",
      "Prime Activity Windows: We analyze the lead's historical posting times to determine when they are most active. Follow-up nudges are scheduled for these specific 'Green Zones' to maximize open rates.",
      "Drop-Off Detection: If a lead ghosts, the system waits exactly 22 hours (not 24, to look natural) before sending a 'short-form' bump message."
    ]
  },
  {
    id: "sentiment",
    title: "Instagram Intelligence",
    subtitle: "Scoring Beyond The Bio",
    icon: Target,
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
    outcome: "Stop talking to unqualified leads. We filter them out before you even say hello.",
    technical: [
      "Visual Profiling: The engine scans their recent 9 posts to estimate 'Business Viability'. No business content? It lowers the lead score.",
      "Keyword Density Analysis: We scan their bio for specific negative keywords (e.g., 'Aspiring', 'Student', 'Free') and positive keywords (e.g., 'Founder', 'CEO', 'Agency') to assign a 0-100 fit score.",
      "Intent Prediction: Based on their first DM to you, we classify them as 'Hot Lead', 'Fan/Support', or 'Tire Kicker'. Fan messages are routed to a cheaper model; Hot Leads go to the GPT-4o 'Closer' model."
    ]
  }
];

export function FeatureSection() {
  const [expandedId, setExpandedId] = useState<string | null>("memory");

  return (
    <section id="features" className="py-40 px-4 relative overflow-hidden bg-black">
      {/* Background Grid & Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-8 shadow-[0_0_20px_rgba(var(--primary),0.2)]"
          >
            <Sparkles className="w-4 h-4" />
            Under The Hood
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-8xl font-black tracking-tight leading-[0.9] text-white mb-8"
          >
            Not A Wrapper. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary animate-gradient-x">
              A Neural Architecture.
            </span>
          </motion.h2>
          <p className="text-white/40 text-xl md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed">
            Most "AI tools" are just prompt wrappers that forget you immediately. Audnix is a stateful, persistent intelligence engine designed for complex sales cycles.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side: Interactive Selector */}
          <div className="space-y-6">
            {DEEP_DIVE_FEATURES.map((feature, i) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setExpandedId(feature.id)}
                className={`group cursor-pointer p-8 rounded-[2rem] border transition-all duration-500 overflow-hidden relative ${expandedId === feature.id
                  ? `bg-white/[0.03] ${feature.border} shadow-2xl`
                  : "bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5"
                  }`}
              >
                {/* Active Indicator Glow */}
                {expandedId === feature.id && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${feature.bg.replace('/10', '')} shadow-[0_0_20px_rgba(0,0,0,0.5)]`} />
                )}

                <div className="flex items-start gap-6">
                  <div className={`w-14 h-14 rounded-2xl ${expandedId === feature.id ? feature.bg : "bg-white/5"} border ${expandedId === feature.id ? feature.border : "border-white/5"} flex items-center justify-center transition-colors duration-500 group-hover:scale-110`}>
                    <feature.icon className={`w-7 h-7 ${expandedId === feature.id ? feature.color : "text-white/20"} transition-colors duration-500`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-2xl font-bold mb-2 transition-colors ${expandedId === feature.id ? "text-white" : "text-white/50 group-hover:text-white/80"}`}>
                      {feature.title}
                    </h3>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-white/30 group-hover:text-white/50 transition-colors">
                      {feature.subtitle}
                    </p>
                  </div>
                  <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${expandedId === feature.id ? "opacity-100 rotate-90" : ""}`}>
                    <ChevronDown className="w-4 h-4 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Side: Detail View */}
          <div className="relative min-h-[600px]">
            <AnimatePresence mode="wait">
              {DEEP_DIVE_FEATURES.map((feature) => (
                expandedId === feature.id && (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "circOut" }}
                    className="absolute inset-0"
                  >
                    <div className={`h-full p-12 rounded-[3rem] border ${feature.border} bg-black/80 backdrop-blur-3xl relative overflow-hidden flex flex-col shadow-2xl`}>
                      {/* Ambient Glow */}
                      <div className={`absolute top-0 right-0 w-[400px] h-[400px] ${feature.bg} blur-[120px] rounded-full opacity-30 pointer-events-none`} />

                      <div className="relative z-10 h-full flex flex-col">
                        <div className="inline-flex items-center gap-3 mb-8 text-white/30 font-mono text-xs tracking-widest">
                          <span className={feature.color}>// SYSTEM_ARCHITECTURE</span>
                          <span>::</span>
                          <span className="uppercase">{feature.id}</span>
                        </div>

                        <h3 className="text-3xl md:text-4xl font-black text-white mb-8 leading-tight pl-6 border-l-4 border-primary">
                          {feature.outcome}
                        </h3>

                        <div className="space-y-8 flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                          <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-6 flex items-center gap-3">
                              <Zap className="w-4 h-4 text-yellow-400" />
                              Technical Breakdown
                            </h4>
                            <ul className="space-y-6">
                              {feature.technical.map((tech, i) => (
                                <li key={i} className="flex gap-4 group/item">
                                  <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white/20 group-hover/item:bg-primary transition-colors duration-300 flex-shrink-0" />
                                  <p className="text-white/60 text-sm leading-loose font-medium group-hover/item:text-white/90 transition-colors duration-300">
                                    {tech}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 pt-8 border-t border-white/5">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Production Ready
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            latency &lt; 50ms
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            99.9% Uptime
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
