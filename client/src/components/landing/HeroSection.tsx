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
  Sparkles as SparklesIcon,
  Server,
  Activity,
  ShieldCheck
} from "lucide-react";
import { Link } from "wouter";
import { Magnetic } from "@/components/ui/Magnetic";

// ============================================
// ANIMATED UI MOCKUP COMPONENT
// Demonstrating "Real Backend" Logic
// ============================================
const NeuralEngineMockup = () => {
  const [activeStep, setActiveStep] = useState(0);

  // Simulating the "Deep Backend" analysis loop
  const systemLogs = [
    { type: 'intent', text: 'Analyzing Lead Intent...', status: 'Verified', color: 'text-emerald-400' },
    { type: 'objection', text: 'Checking 110+ Objections...', status: 'Clear', color: 'text-blue-400' },
    { type: 'timing', text: 'Predictive Timing Algorithm', status: 'Delay: 4m 12s (Humanizing)', color: 'text-purple-400' },
    { type: 'churn', text: 'Drop-off Risk Detection', status: 'Low (2%)', color: 'text-orange-400' }
  ];

  const conversations = [
    { name: "Sarah M.", action: "Deploying 'Closer Protocol'...", status: "Intent Verified", channel: "instagram" },
    { name: "James K.", action: "Simulating Objection (Price)...", status: "Handling...", channel: "email" },
    { name: "Alex R.", action: "Scheduling Call (Auto-Pilot)", status: "Booked", channel: "instagram" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % systemLogs.length);
    }, 2000);
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
        className="relative bg-[#0a0f1a]/95 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl overflow-hidden"
        whileHover={{ scale: 1.02, rotateY: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Neural Core v2.4</h3>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">System Active</span>
              </div>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/50">
            Latency: 42ms
          </div>
        </div>

        {/* Real-time System Logs */}
        <div className="space-y-3 mb-8">
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-2">Live Logic Stream</p>
          {systemLogs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: activeStep === i ? 1 : 0.3, x: activeStep === i ? 5 : 0 }}
              className={`flex items-center justify-between p-3 rounded-lg border ${activeStep === i ? 'border-white/10 bg-white/5' : 'border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <Activity className={`w-3 h-3 ${log.color}`} />
                <span className="text-xs font-mono text-white/80">{log.text}</span>
              </div>
              <span className={`text-[10px] font-bold ${log.color}`}>{log.status}</span>
            </motion.div>
          ))}
        </div>

        {/* Active Conversations Preview */}
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Active Threads</p>
          {conversations.map((convo, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${convo.channel === 'instagram' ? 'bg-fuchsia-500/20 text-fuchsia-500' : 'bg-blue-500/20 text-blue-500'}`}>
                  {convo.channel === 'instagram' ? <Instagram className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{convo.name}</p>
                  <p className="text-[10px] text-white/40">{convo.action}</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold">
                {convo.status}
              </div>
            </div>
          ))}
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

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

  const mouseGlow = useMotionTemplate`radial-gradient(800px circle at ${mouseX}px ${mouseY}px, rgba(0, 210, 255, 0.06), transparent 60%)`;

  return (
    <section
      ref={containerRef}
      className="relative min-h-[85vh] flex items-center pt-24 pb-12 px-4 overflow-hidden bg-black font-sans"
    >
      <GridPattern />

      {/* Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] z-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full" />
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
                  System Online: 14,203 Agents
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white leading-[0.95] lg:max-w-2xl"
            >
              Scale <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary/50 uppercase italic">
                Without Limits.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="text-base md:text-lg text-white/50 max-w-md font-medium leading-relaxed"
            >
              The AI Sales Rep that handles your Instagram and Email 24/7. Book meetings while you sleep.
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
                    ref={buttonRef}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    size="lg"
                    className="h-14 px-8 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary/90 transition-all shadow-[0_20px_40px_-10px_rgba(0,210,255,0.4)] group"
                  >
                    Deploy Your Agent
                    <ArrowRight className={`ml-2 w-5 h-5 transition-transform duration-300 ${isHovered ? "translate-x-1" : ""}`} />
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
                    See System Logic
                  </Button>
                </Magnetic>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex items-center gap-6 pt-4 border-t border-white/5"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-white/40 text-sm font-bold uppercase tracking-wider">Intent Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span className="text-white/40 text-sm font-bold uppercase tracking-wider">Voice Cloning</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-white/40 text-sm font-bold uppercase tracking-wider">Drop-off Detection</span>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Mockup */}
          <div className="relative lg:pl-10 hidden lg:block">
            <NeuralEngineMockup />
          </div>
        </div>

        {/* Trusted By Ribbon */}
        <div className="mt-32 border-y border-white/5 bg-black/20 backdrop-blur-sm w-full py-10 overflow-hidden relative group">
          <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

          <div className="flex items-center gap-16 md:gap-20 animate-marquee whitespace-nowrap">
            {["LUXE PATH", "REPLYFLOW", "ORBIEON", "SAS REC", "KYNOX AI", "LUXE PATH", "REPLYFLOW", "ORBIEON", "SAS REC", "KYNOX AI"].map((brand, i) => (
              <span
                key={`${brand}-${i}`}
                className="text-lg md:text-xl font-black tracking-[-0.02em] text-white/20 hover:text-white transition-all duration-300 cursor-none select-none"
              >
                {brand}
              </span>
            ))}
          </div>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-1.5 bg-black border border-primary/20 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">
            Trusted By Top Agencies
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-30" />
    </section>
  );
}
