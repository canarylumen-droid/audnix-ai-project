import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Sparkles, Play, ShieldCheck, Zap, Activity } from "lucide-react";
import { NeuralFlowMockup } from "./NeuralFlowMockup";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-4 overflow-hidden bg-black">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute inset-0 bg-grid opacity-20 mask-radial" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 w-full">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <div className="glass px-8 py-3 rounded-full flex items-center gap-3 border-white/5 backdrop-blur-3xl shadow-2xl premium-border">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping absolute inset-0" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary relative" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/50">
                PREDICTIVE INTELLIGENCE <span className="text-white">v4.0 ACTIVE</span>
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-6xl md:text-[10rem] font-black tracking-[-0.04em] leading-[0.85] text-white italic mb-12 uppercase drop-shadow-2xl"
          >
            STOP LEAD <br />
            <span className="text-primary tracking-[-0.06em] not-italic">DECAY.</span> <br />
            FOREVER.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-white/40 text-xl md:text-3xl font-medium max-w-3xl leading-snug mb-16 tracking-tight"
          >
            Audnix analyzes lead behavior, learns from past conversations, and <span className="text-white">follows up only when intent peaks</span>. Real timing. Real context. Real revenue.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-8 mb-24"
          >
            <Link href="/auth">
              <Button size="lg" className="group relative h-24 px-16 rounded-3xl bg-white text-black text-lg font-black uppercase tracking-widest hover:scale-105 transition-all duration-700 shadow-[0_40px_80px_-20px_rgba(255,255,255,0.2)] overflow-hidden">
                <span className="relative z-10 flex items-center gap-3">
                  Start Free Deployment
                  <Zap className="w-5 h-5 fill-current" />
                </span>
                <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-x-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </Button>
            </Link>

            <button className="flex items-center gap-4 text-white/40 hover:text-white transition-colors duration-500 group">
              <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/5 transition-all">
                <Play className="w-5 h-5 fill-current ml-1" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Watch Protocol</p>
                <p className="text-sm font-black uppercase tracking-widest">Neural Demo</p>
              </div>
            </button>
          </motion.div>

          {/* Neural Flow Section */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.8 }}
            className="w-full relative py-20"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent blur-3xl opacity-50" />
            <div className="relative text-center mb-12">
              <h3 className="text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-4 italic">Predictive Alignment Flow</h3>
              <div className="w-px h-20 bg-gradient-to-b from-primary/50 to-transparent mx-auto" />
            </div>
            <NeuralFlowMockup />
          </motion.div>

          {/* Social Proof / Trust */}
          <div className="flex flex-wrap items-center justify-center gap-12 mt-20 opacity-30 grayscale hover:grayscale-0 transition-all duration-[1s]">
            <div className="flex items-center gap-2 group cursor-default">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="text-xs font-black uppercase tracking-widest">Enterprise Safe</span>
            </div>
            {['REPLY FLOW', 'KYNOX AI', 'ORBIEON', 'SAS REC'].map(brand => (
              <span key={brand} className="text-2xl font-black text-white italic tracking-tighter uppercase">{brand}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
