import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Brain, Zap, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";

export function HeroSection() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-4 overflow-hidden bg-[#020409]">
      {/* Background Layers */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-grid opacity-20 mask-radial" />
        <div
          className="absolute inset-0 spotlight opacity-40 transition-opacity duration-500"
          style={{ '--x': `${mousePos.x}px`, '--y': `${mousePos.y}px` } as any}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] max-h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Floating AI Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="glass px-4 py-2 rounded-full flex items-center gap-2 border-white/10 group cursor-default">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-white/60">
              The World's Most <span className="text-white">Relentless</span> AI Sales Closer
            </span>
          </div>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tighter leading-[0.9] text-white mb-8"
        >
          CONVERT<br />
          <span className="text-gradient-cyan">WHILE YOU SLEEP</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-2xl text-white/50 max-w-2xl font-medium mb-12"
        >
          Audnix syncs with your DMs and Email, identifies buying intent,
          and handles objections instantly. <span className="text-white">Your new top-performing closer works 24/7.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/auth">
            <Button size="lg" className="h-16 px-12 rounded-full bg-white text-black text-lg font-black hover:scale-105 transition-transform">
              Start Closing Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4 px-6">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-white/10 overflow-hidden backdrop-blur-md">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="avatar" />
                </div>
              ))}
            </div>
            <div className="text-left">
              <div className="text-white text-sm font-bold">500+ Closers</div>
              <div className="text-white/40 text-xs uppercase tracking-widest font-bold">Scaling with Audnix</div>
            </div>
          </div>
        </motion.div>

        {/* Feature Highlights Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl"
        >
          {[
            { icon: Brain, title: "Deep Memory", desc: "Remembers every lead across all channels." },
            { icon: Zap, title: "Instant Reply", desc: "Average response time under 4 minutes." },
            { icon: ShieldCheck, title: "TOS Secure", desc: "100% compliant with IG & Email protocols." }
          ].map((feat, i) => (
            <div key={i} className="glass-card p-6 rounded-[2rem] flex items-center gap-4 text-left border-white/5 bg-white/[0.02]">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary border border-white/10 shadow-inner">
                <feat.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm tracking-tight">{feat.title}</h3>
                <p className="text-white/40 text-xs font-medium">{feat.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Hero Visual - Floating Dashboard Fragment */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 0.2, y: 0 }}
        transition={{ duration: 1.5, delay: 1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[400px] bg-gradient-to-t from-primary/20 to-transparent blur-[100px] -z-10"
      />
    </section>
  );
}
