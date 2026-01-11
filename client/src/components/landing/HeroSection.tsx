import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { motion, useMotionTemplate, useMotionValue, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Bot, Zap, Shield, PlayCircle, Users, Sparkles, Globe } from "lucide-react";
import { Link } from "wouter";
import { Magnetic } from "@/components/ui/Magnetic";

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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-xl shadow-[0_0_20px_rgba(var(--primary),0.1)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.5em] text-primary font-black">
                NEURAL_LINK: ACTIVE
              </span>
            </div>
          </motion.div>

          {/* Clean "Apple-style" Hero Content */}
          <div className="space-y-12">
            <h1 className="text-6xl md:text-[140px] font-black tracking-tighter text-white leading-[0.85] max-w-6xl mx-auto uppercase">
              {["The", "next", "evolution", "of"].map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-block mr-[0.2em]"
                >
                  {word}
                </motion.span>
              ))}
              <br />
              <motion.span
                initial={{ filter: "blur(20px)", opacity: 0 }}
                animate={{ filter: "blur(0px)", opacity: 1 }}
                transition={{ delay: 0.8, duration: 2 }}
                className="text-primary drop-shadow-[0_0_50px_rgba(0,210,255,0.3)] inline-block"
              >
                AU<span className="text-white">D</span>NIX
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1.2 }}
              className="text-xl md:text-2xl text-white/40 max-w-3xl mx-auto font-medium leading-relaxed tracking-tight"
            >
              Deploy autonomous neural agents that identify, engage, and close <span className="text-white">million-dollar pipelines</span> while you sleep.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-16 mb-24"
          >
            <Link href="/auth">
              <Magnetic>
                <Button size="lg" className="h-20 px-12 rounded-2xl bg-primary text-black font-black text-xl hover:brightness-110 transition-all shadow-[0_20px_40px_-10px_rgba(0,210,255,0.4)] relative group overflow-hidden">
                  <span className="relative z-10 flex items-center gap-3">
                    INITIALIZE SYSTEM <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </Button>
              </Magnetic>
            </Link>
            <Link href="#how-it-works">
              <Magnetic>
                <Button size="lg" variant="outline" className="h-20 px-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-xl backdrop-blur-md transition-all">
                  VIEW ARCHITECTURE
                </Button>
              </Magnetic>
            </Link>
          </motion.div>

          {/* Integrations Ribbon */}
          <div className="mt-40 border-y border-white/5 bg-black/20 backdrop-blur-sm w-full py-12 overflow-hidden relative group">
            <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

            <div className="flex justify-center items-center gap-16 md:gap-32 animate-marquee whitespace-nowrap">
              {["HUBSPOT", "SALESFORCE", "SLACK", "GOHIGHLEVEL", "ZAPIER"].map((brand) => (
                <span key={brand} className="text-2xl md:text-3xl font-black tracking-[-0.05em] text-white/10 group-hover:text-white/40 transition-colors duration-500 cursor-default select-none">
                  {brand}
                </span>
              ))}
            </div>

            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-black border border-white/10 rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
              Native Integrations
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none z-30" />
    </section>
  );
}
