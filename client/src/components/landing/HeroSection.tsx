import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { motion, useMotionTemplate, useMotionValue, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Globe, Sparkles } from "lucide-react";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 40, stiffness: 200 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

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

  // Clean brand glow effect
  const mouseGlow = useMotionTemplate`radial-gradient(1000px circle at ${mouseX}px ${mouseY}px, rgba(59, 130, 246, 0.08), transparent 70%)`;

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-4 overflow-hidden bg-black font-sans"
    >
      {/* 1. Brand Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] z-0 pointer-events-none opacity-30 bg-black">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/10 blur-[130px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* 2. Interactive Background Glow */}
      <motion.div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: mouseGlow }}
      />

      <div className="max-w-7xl mx-auto relative z-20 w-full">
        <div className="flex flex-col items-center text-center">

          {/* Protocol Chip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "circOut" }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-medium">
                NEURAL INTERFACE STATUS: OPERATIONAL
              </span>
            </div>
          </motion.div>

          {/* Clean "Apple-style" Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "circOut" }}
            className="space-y-8"
          >
            <h1 className="text-6xl md:text-9xl font-medium tracking-tight text-white leading-[1.1] max-w-5xl mx-auto">
              The next evolution of <br />
              <span className="text-white/40">autonomous intelligence.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto font-normal leading-relaxed">
              Deploy surgical-grade AI agents that architect revenue while you sleep.
              Zero latency. Zero friction. Total dominance.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
              <Link href="/auth">
                <Button size="lg" className="h-16 px-10 rounded-2xl bg-blue-600 text-white font-semibold uppercase tracking-widest text-[11px] shadow-[0_20px_40px_rgba(37,99,235,0.2)] hover:bg-blue-700 hover:scale-105 transition-all duration-300">
                  Initialize Control <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="ghost" className="h-16 px-10 rounded-2xl border border-white/10 text-white/60 font-semibold uppercase tracking-widest text-[11px] hover:bg-white/5 hover:text-white transition-all">
                  Explore Architecture
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1.5 }}
            className="mt-32 w-full max-w-3xl flex flex-wrap justify-center items-center gap-10 text-[10px] font-medium uppercase tracking-[0.2em] text-white/10"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3" />
              Global Infrastructure
            </div>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <div>Enterprise Encryption</div>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <div>Deterministic Logic</div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none z-30" />
    </section>
  );
}
