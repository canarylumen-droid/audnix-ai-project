import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MessageSquare, Calendar, Target, Smartphone, Sparkles, Activity, Bookmark, MousePointer2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const capabilities = [
  {
    title: "Lead Scoring",
    desc: "Predictive intent analysis that surfaces high-value conversion opportunities autonomously.",
    icon: Target,
    badge: "Vector Logic",
    features: ["Strategic prioritization", "Behavioral tracking", "Intent detection"]
  },
  {
    title: "Brand Intelligence",
    desc: "A neural layer that mirrors your business's cognitive patterns and communication ethos.",
    icon: Bookmark,
    badge: "Identity Sync",
    features: ["Tone synchronization", "Detailed knowledge", "Brand-safe logic"]
  },
  {
    title: "Live Audit Trail",
    desc: "A deterministic log of every psychological shift and tactical decision made by your agents.",
    icon: Activity,
    badge: "Real-time Insight",
    features: ["Conversation logs", "Decision transparency", "Real-time oversight"]
  },
  {
    title: "Atomic Booking",
    desc: "Automated finalization and meeting orchestration without human latency or friction.",
    icon: Calendar,
    badge: "Calendar Core",
    features: ["Calendar sync", "Timezone master", "Soft-close expertise"]
  },
  {
    title: "Objection Mastery",
    desc: "Deterministic reframing of prospect resistance into ROI-calculated pathwards.",
    icon: MessageSquare,
    badge: "Tactical Response",
    features: ["Value reframing", "Signal detection", "Risk reversal"]
  },
  {
    title: "Omni-Flow DMs",
    desc: "Unified presence across platforms that transitions seamlessly with prospect movement.",
    icon: Smartphone,
    badge: "Channel Unity",
    features: ["Instagram Native", "Email Automation", "Unified Sync"]
  }
];

const FeatureCard = ({ cap, index }: { cap: any; index: number }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function onMouseMove({ currentTarget, clientX, clientY }: any) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: "circOut" }}
      onMouseMove={onMouseMove}
      className="group relative p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-700 overflow-hidden"
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(var(--primary), 0.15), transparent 80%)`
          ),
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/30 transition-all duration-500">
            <cap.icon className="w-6 h-6 text-white/40 group-hover:text-primary transition-colors" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-primary/50 transition-colors">
            {cap.badge}
          </span>
        </div>

        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4 group-hover:translate-x-1 transition-transform duration-500">
          {cap.title}
        </h3>
        <p className="text-white/40 font-bold text-md leading-tight mb-10 min-h-[4rem]">
          {cap.desc}
        </p>

        <div className="space-y-4 pt-8 border-t border-white/5">
          {cap.features.map((feat: string) => (
            <div key={feat} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-primary transition-colors duration-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white/60 transition-colors">
                {feat}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export function FeatureSection() {
  return (
    <section id="features" className="py-40 px-4 relative overflow-hidden bg-black">
      {/* Structural Grid Background */}
      <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent)]" />

      {/* Epic Ambient Glows */}
      <div className="absolute top-1/2 left-0 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full translate-x-1/4 translate-y-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center mb-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-12 flex items-center gap-3 shadow-[0_0_30px_rgba(var(--primary),0.1)]"
          >
            <Sparkles className="w-4 h-4" />
            Deterministic Intelligence Layers
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-6xl md:text-9xl font-black tracking-[calc(-0.04em)] mb-12 leading-[0.85] text-white uppercase"
          >
            The New Core of <br />
            <span className="text-primary">High-Performance.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-white/40 text-xl md:text-2xl max-w-3xl font-bold leading-tight"
          >
            We don't provide features. We deploy autonomous protocols that transform raw opportunity into confirmed revenue.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {capabilities.map((cap, i) => (
            <FeatureCard key={cap.title} cap={cap} index={i} />
          ))}
        </div>

        {/* Global Scaling Indicator Block */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-32 p-12 rounded-[4rem] border border-white/5 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent text-center"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-16 md:gap-32">
            <div className="space-y-4">
              <h4 className="text-4xl font-black text-white tracking-tighter">99.98%</h4>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Operational Availability</p>
            </div>
            <div className="w-px h-12 bg-white/5 hidden md:block" />
            <div className="space-y-4">
              <h4 className="text-4xl font-black text-white tracking-tighter">&lt; 800ms</h4>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Neural Response Latency</p>
            </div>
            <div className="w-px h-12 bg-white/5 hidden md:block" />
            <div className="space-y-4">
              <h4 className="text-4xl font-black text-white tracking-tighter">14 Zones</h4>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Edge Processing Capacity</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
