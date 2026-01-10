import { useRef, useState, useEffect, useMemo } from "react";
import { motion, useMotionTemplate, useMotionValue, AnimatePresence, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Sparkles as SparkleIcon, Globe } from "lucide-react";
import { AutomationFlowMockup } from "./NeuralFlowMockup";

const StarField = () => {
  const stars = useMemo(() => {
    return Array.from({ length: 150 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute bg-white rounded-full opacity-20"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring for smoother mouse following elements (nebula)
  const springConfig = { damping: 30, stiffness: 100 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

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

  const maskImage = useMotionTemplate`radial-gradient(450px circle at ${mouseX}px ${mouseY}px, white, transparent)`;
  const mouseGlow = useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, hsla(var(--primary) / 0.15), transparent)`;

  return (
    <section
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative min-h-screen flex items-center justify-center pt-40 pb-32 px-4 overflow-hidden bg-black selection:bg-primary selection:text-black cursor-none"
    >
      {/* Galaxy Background */}
      <StarField />

      {/* Nebula Spheres */}
      <motion.div
        style={{ x: smoothX, y: smoothY, translateX: "-50%", translateY: "-50%" }}
        className="absolute top-0 left-0 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none mix-blend-screen opacity-40 transition-opacity duration-1000"
      />
      <motion.div
        style={{ x: smoothX, y: smoothY, translateX: "-30%", translateY: "-70%" }}
        className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none mix-blend-screen opacity-30"
      />

      {/* Main Ambient Glow */}
      <div className="absolute inset-0 z-0 mesh-gradient-bg opacity-30 pointer-events-none" />

      {/* Interactive Mouse Glow */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none opacity-40 bg-black/40"
        style={{ background: mouseGlow }}
      />

      <div className="max-w-7xl mx-auto relative z-10 w-full">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto">

          {/* Premium Branding Reveal */}
          <div className="relative mb-16 group cursor-none perspective-1000">
            <motion.div
              style={{ maskImage, WebkitMaskImage: maskImage }}
              className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none mix-blend-overlay"
            >
              <h2 className="text-9xl md:text-[16rem] font-black tracking-tighter text-white opacity-100 uppercase select-none drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                AUDNIX <span className="text-primary">AI</span>
              </h2>
            </motion.div>

            <h2 className="text-9xl md:text-[16rem] font-black tracking-tighter text-white/5 uppercase select-none transition-all duration-1000 blur-[2px] group-hover:blur-0 group-hover:text-white/10">
              AUDNIX <span className="text-white/5">AI</span>
            </h2>

            {/* Glowing Accent */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 180, 270, 360],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 blur-[60px] rounded-full mix-blend-screen pointer-events-none"
            />
          </div>

          {/* Status Protocol Chip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "circOut" }}
            className="mb-12 relative"
          >
            <div className="relative z-10 inline-flex items-center gap-4 px-8 py-3 rounded-full border border-white/10 bg-black/40 backdrop-blur-3xl shadow-[0_0_50px_rgba(var(--primary),0.1)] group hover:border-primary/40 transition-all duration-500">
              <div className="relative w-2 h-2">
                <div className="absolute inset-0 bg-primary rounded-full animate-ping" />
                <div className="absolute inset-0 bg-primary rounded-full" />
              </div>
              <span className="text-[10px] font-black tracking-[0.6em] text-white/60 group-hover:text-primary transition-colors uppercase">
                Protocol: Active / Neural Sync Stable
              </span>
            </div>
          </motion.div>

          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "expoOut" }}
            className="space-y-10"
          >
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] uppercase">
              The Sovereign <br />
              <span className="text-primary italic">Intelligence.</span>
            </h1>

            <p className="text-white/40 text-xl md:text-3xl font-bold max-w-3xl mx-auto leading-tight italic tracking-tight">
              Architecting a future where <span className="text-white underline decoration-primary/30 underline-offset-8">zero latency</span> meets human-grade empathy.
              Deploy your first autonomous closer in <span className="text-white">60 Seconds.</span>
            </p>

            {/* CTA Container */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-10">
              <Link href="/auth">
                <Button size="lg" className="h-24 px-16 rounded-[2.5rem] bg-white text-black font-black uppercase tracking-[0.3em] text-xs shadow-[0_40px_80px_rgba(255,255,255,0.1)] hover:scale-105 transition-all duration-700 group hover:shadow-[0_0_100px_rgba(var(--primary),0.3)]">
                  Launch Nexus <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
              <Link href="#pricing">
                <Button variant="ghost" className="h-24 px-12 rounded-[2.5rem] border border-white/5 bg-white/5 backdrop-blur-xl text-white font-black uppercase tracking-[0.3em] text-xs hover:bg-white/10 transition-all">
                  View Models
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Unified Trust Section */}
          <div className="mt-32 w-full max-w-5xl border-t border-white/5 pt-12 flex flex-col md:flex-row items-center justify-between gap-10 text-[9px] font-black uppercase tracking-[0.5em] text-white/20">
            <div className="flex items-center gap-4 group cursor-none">
              <Globe className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              Global Infrastructure Scale: 99.99%
            </div>
            <div className="flex items-center gap-10">
              <span className="hover:text-white transition-colors">SOC2 TYPE II</span>
              <span className="hover:text-white transition-colors">GDPR READY</span>
              <span className="hover:text-white transition-colors">ISO 27001</span>
            </div>
          </div>
        </div>
      </div>

      {/* Extreme Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black to-transparent pointer-events-none z-20" />
    </section>
  );
}
