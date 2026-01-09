import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { NeuralFlowMockup } from "./NeuralFlowMockup";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-4 overflow-hidden bg-black text-white"
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight Effect Background */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(14, 165, 233, 0.15),
              transparent 80%
            )
          `,
        }}
      />

      {/* Static Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute inset-0 bg-grid opacity-20 mask-radial" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 w-full">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto mb-20">

          {/* Status Chip */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md hover:border-primary/50 transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-medium tracking-wide text-gray-300">
                AI PREDICTIVE ENGINE V4.0
              </span>
            </div>
          </motion.div>

          {/* Interactive Hero Text */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-6xl md:text-[10rem] font-black tracking-[-0.04em] leading-[0.85] italic mb-12 uppercase drop-shadow-2xl relative group cursor-default"
          >
            <span className="relative z-10 mix-blend-overlay">STOP LEAD<br />DECAY</span>

            {/* Cursor Follow Mask on Text */}
            <motion.div
              className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
              style={{
                maskImage: useMotionTemplate`
                    radial-gradient(
                      200px circle at ${mouseX}px ${mouseY}px,
                      black,
                      transparent
                    )
                 `,
                WebkitMaskImage: useMotionTemplate`
                    radial-gradient(
                      200px circle at ${mouseX}px ${mouseY}px,
                      black,
                      transparent
                    )
                 `
              }}
            >
              <span className="text-primary">STOP LEAD<br />DECAY</span>
            </motion.div>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-white/60 text-xl md:text-3xl font-medium max-w-3xl leading-snug mb-16 tracking-tight"
          >
            Audnix analyzes behaviors, automates follow-ups, and <span className="text-white">closes deals</span> when intent peaks.
          </motion.p>

          {/* CTA Buttons - Anchors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-6 mb-24"
          >
            <Link href="/auth">
              <Button size="lg" className="h-16 px-10 rounded-full bg-white text-black text-lg font-bold hover:bg-primary hover:text-white transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                Initialize System <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>

            <div className="flex gap-4">
              <Button
                variant="outline"
                size="lg"
                className="h-16 px-8 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() => {
                  document.getElementById('calc')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Privacy ROI
              </Button>

              <Button
                variant="ghost"
                size="lg"
                className="h-16 px-8 rounded-full text-white/70 hover:text-white"
                onClick={() => {
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                View Pricing
              </Button>
            </div>
          </motion.div>

          {/* Neural Flow Section */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.8 }}
            className="w-full relative py-20"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent blur-3xl opacity-50" />
            <NeuralFlowMockup />
          </motion.div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-12 mt-10 opacity-40">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Enterprise Ready</span>
            </div>
            {['SOC2 Type II', 'GDPR Compliant', 'ISO 27001'].map(badge => (
              <span key={badge} className="text-sm font-bold uppercase tracking-wider">{badge}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
