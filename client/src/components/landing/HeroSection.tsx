import { useRef, useState, useEffect } from "react";
import { motion, useMotionTemplate, useMotionValue, AnimatePresence, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MessageSquare,
  Brain,
  Zap,
  CheckCircle2,
  TrendingUp,
  Mail,
  Instagram,
  Calendar,
  UserCheck,
  Sparkles
} from "lucide-react";
import { Link } from "wouter";
import { Magnetic } from "@/components/ui/Magnetic";

// ============================================
// ANIMATED UI MOCKUP COMPONENT
// Premium Dashboard Preview
// ============================================
const NeuralEngineMockup = () => {
  const [activeConvo, setActiveConvo] = useState(0);

  const conversations = [
    { name: "Sarah M.", message: "When's the next availability?", score: 92, channel: "instagram" },
    { name: "James K.", message: "What's included in the pro tier?", score: 87, channel: "email" },
    { name: "Alex R.", message: "I'm ready to move forward", score: 98, channel: "instagram" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveConvo((prev) => (prev + 1) % conversations.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-xl"
    >
      {/* Glow Background */}
      <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />

      {/* Main Dashboard Card */}
      <motion.div
        className="relative bg-[#0a0f1a]/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl"
        whileHover={{ scale: 1.02, rotateY: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Neural Engine</h4>
              <p className="text-white/40 text-[10px] uppercase tracking-widest">Live Protocol</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Active</span>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Leads Today", value: "47", icon: UserCheck, color: "text-primary" },
            { label: "Meetings", value: "12", icon: Calendar, color: "text-emerald-400" },
            { label: "Close Rate", value: "34%", icon: TrendingUp, color: "text-amber-400" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.1 }}
              className="bg-white/5 border border-white/5 rounded-xl p-3 text-center group hover:bg-white/10 transition-all"
            >
              <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1 group-hover:scale-110 transition-transform`} />
              <p className="text-white font-black text-lg">{stat.value}</p>
              <p className="text-white/30 text-[8px] uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Live Conversations */}
        <div className="space-y-2">
          <p className="text-white/40 text-[9px] uppercase tracking-[0.2em] mb-3">Live Conversations</p>
          <AnimatePresence mode="wait">
            {conversations.map((convo, i) => (
              <motion.div
                key={convo.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: activeConvo === i ? 1 : 0.4,
                  x: 0,
                  scale: activeConvo === i ? 1 : 0.98,
                }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${activeConvo === i
                    ? "bg-primary/10 border-primary/30"
                    : "bg-white/5 border-white/5"
                  }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${convo.channel === 'instagram' ? 'bg-fuchsia-500/20' : 'bg-primary/20'
                  }`}>
                  {convo.channel === 'instagram'
                    ? <Instagram className="w-4 h-4 text-fuchsia-400" />
                    : <Mail className="w-4 h-4 text-primary" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{convo.name}</p>
                  <p className="text-white/40 text-xs truncate">{convo.message}</p>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-black ${convo.score >= 90 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                    {convo.score}%
                  </div>
                  <p className="text-white/20 text-[8px] uppercase">Intent</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* AI Response Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="mt-4 p-4 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs leading-relaxed">
                <span className="text-primary font-bold">AI Response:</span> "Perfect timing! I have a slot tomorrow at 2 PM. Should I send you the calendar invite?"
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating Cards */}
      <motion.div
        initial={{ opacity: 0, x: -50, y: -50 }}
        animate={{ opacity: 1, x: -30, y: -30 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute -top-8 -left-8 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-xl"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-white text-xs font-bold">Meeting Booked</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50, y: 50 }}
        animate={{ opacity: 1, x: 20, y: 20 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        className="absolute -bottom-4 -right-4 bg-black/80 backdrop-blur-md border border-amber-500/20 rounded-xl p-3 shadow-xl"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-white text-xs font-bold">+$12,400 Pipeline</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

const GridPattern = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.08]">
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
    </div>
  );
};

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        mouseX.set(clientX - rect.left);
        mouseY.set(clientY - rect.top);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const mouseGlow = useMotionTemplate`radial-gradient(800px circle at ${mouseX}px ${mouseY}px, rgba(59, 130, 246, 0.06), transparent 60%)`;

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center pt-24 pb-20 px-4 overflow-hidden bg-black font-sans"
    >
      <GridPattern />

      {/* Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] z-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/15 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-fuchsia-500/10 blur-[130px] rounded-full" />
      </div>

      <motion.div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: mouseGlow }} />

      <div className="max-w-7xl mx-auto relative z-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left Side - Copy */}
          <div className="space-y-8">
            {/* Protocol Chip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-xl">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-black">
                  Revenue Protocol Active
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[0.9]"
            >
              Your AI closer.
              <br />
              <span className="text-primary">Zero human lag.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="text-lg md:text-xl text-white/50 max-w-lg font-medium leading-relaxed"
            >
              For{" "}
              <span className="text-primary/80 font-bold">agencies</span>,{" "}
              <span className="text-emerald-400/80 font-bold">founders</span>, and{" "}
              <span className="text-fuchsia-400/80 font-bold">creators</span>{" "}
              who refuse to let leads slip through the cracks.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/auth">
                <Magnetic>
                  <Button
                    size="lg"
                    className="h-14 px-8 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary/90 transition-all shadow-[0_20px_40px_-10px_rgba(59,130,246,0.4)] group"
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Magnetic>
              </Link>
              <Link href="#how-it-works">
                <Magnetic>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-base backdrop-blur-md transition-all"
                  >
                    See How It Works
                  </Button>
                </Magnetic>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex items-center gap-6 pt-4"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-white/40 text-sm">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-white/40 text-sm">Setup in 60 seconds</span>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Mockup */}
          <div className="relative lg:pl-10 hidden lg:block">
            <NeuralEngineMockup />
          </div>
        </div>

        {/* Competitor Tools Ribbon */}
        <div className="mt-32 border-y border-white/5 bg-black/20 backdrop-blur-sm w-full py-10 overflow-hidden relative group">
          <div className="absolute inset-0 bg-red-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

          <div className="flex items-center gap-16 md:gap-20 animate-marquee whitespace-nowrap">
            {["GENERIC CRM", "CHATGPT WRAPPERS", "VA AGENCIES", "MANUAL OUTREACH", "COLD EMAIL TOOLS", "GENERIC CRM", "CHATGPT WRAPPERS", "VA AGENCIES", "MANUAL OUTREACH", "COLD EMAIL TOOLS"].map((brand, i) => (
              <span
                key={`${brand}-${i}`}
                className="text-lg md:text-xl font-black tracking-[-0.02em] text-white/10 hover:text-red-400/50 transition-all duration-300 cursor-none select-none"
              >
                {brand}
              </span>
            ))}
          </div>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-1.5 bg-black border border-red-500/20 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-red-400/60">
            🚨 Legacy Tools Bleeding Revenue
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-30" />
    </section>
  );
}

