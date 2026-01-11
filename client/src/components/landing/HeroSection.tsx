import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import { motion, useMotionTemplate, useMotionValue, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Bot, Zap, Shield, PlayCircle, Users, Sparkles, Globe } from "lucide-react";
import { Link } from "wouter";

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
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-white/60 font-medium">
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
              <span className="text-white">autonomous intelligence.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto font-normal leading-relaxed">
              Deploys AI agents that fill your calendar while you sleep.
              Zero friction. Total control. Built for high-growth creators and agencies.
            </p>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12 mb-32"
          >
            <Link href="/auth">
              <Button size="lg" className="h-16 px-8 rounded-full bg-primary text-black font-bold text-lg hover:bg-primary/90 transition-all shadow-[0_0_40px_-10px_rgba(var(--primary),0.5)] hover:shadow-[0_0_60px_-10px_rgba(var(--primary),0.7)] hover:scale-105">
                Start Deploying <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="h-16 px-8 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-lg backdrop-blur-md transition-all hover:scale-105">
                View Architecture
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none z-30" />
    </section>
  );
}
00" />

  < div className = "flex justify-center items-center gap-16 md:gap-32 animate-marquee whitespace-nowrap" >
  {
    ["HUBSPOT", "SALESFORCE", "SLACK", "GOHIGHLEVEL", "ZAPIER"].map((brand) => (
      <span key={brand} className="text-2xl md:text-3xl font-black tracking-[-0.05em] text-white/10 group-hover:text-white/40 transition-colors duration-500 cursor-default select-none">
        {brand}
      </span>
    ))
  }
            </div >

  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-black border border-white/10 rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-white/30">
    Native Integrations
  </div>
          </div >
        </div >
      </div >

  {/* Bottom Fade */ }
  < div className = "absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none z-30" />
    </section >
  );
}
