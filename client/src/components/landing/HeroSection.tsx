import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles, Brain, Clock, Target } from "lucide-react";
import { Link } from "wouter";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

const features = [
  { icon: Clock, text: "Smart timing — knows when each lead responds best" },
  { icon: Brain, text: "Learns from conversations — never one-size-fits-all" },
  { icon: Target, text: "Predicts ROI — only follows up when it matters" }
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-8 py-24 mt-16 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 -left-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-7xl mx-auto text-center"
      >
        <motion.div variants={itemVariants} className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-primary/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-white/90">
              AI Sales Closer with Predictive Intelligence
            </span>
          </div>
        </motion.div>

        <motion.h1 
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-tight text-white px-4 sm:px-6 md:px-0"
        >
          Stop Letting Warm Leads<br className="hidden xs:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            {" "}Go Cold
          </span>
        </motion.h1>
        
        <motion.p 
          variants={itemVariants}
          className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white mb-4 max-w-4xl mx-auto leading-relaxed font-light px-4 sm:px-6 md:px-0"
        >
          AI that learns each lead's behavior, predicts the perfect follow-up time,{" "}
          <br className="hidden md:block" />
          and only reaches out when it'll actually convert.
        </motion.p>

        <motion.p 
          variants={itemVariants}
          className="text-sm sm:text-base md:text-lg text-white/70 mb-10 max-w-3xl mx-auto leading-relaxed px-4 sm:px-6 md:px-0"
        >
          No spam. No pushy timing. Just intelligent outreach that{" "}
          <span className="text-emerald-400 font-semibold">feels human</span> because it{" "}
          <span className="text-cyan-400 font-semibold">thinks like one</span>.
        </motion.p>

        <motion.div 
          variants={itemVariants}
          className="flex flex-wrap gap-3 justify-center mb-10"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm group hover:border-primary/50 transition-all"
            >
              <feature.icon className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-white/90 text-sm sm:text-base">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="mb-8 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 max-w-2xl mx-auto"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-semibold">Intelligence Layer</span>
          </div>
          <p className="text-white/80 text-sm">
            Analyzes conversation history, detects buying signals, predicts optimal timing,{" "}
            and decides if following up now will actually get ROI — all automatically.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Link href="/auth">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold text-base sm:text-lg px-8 sm:px-12 py-6 sm:py-7 rounded-full shadow-2xl shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Recover My Lost Clients
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={false}
                />
              </Button>
            </motion.div>
          </Link>
          <motion.p 
            variants={itemVariants}
            className="text-white/50 text-sm mt-4"
          >
            Start free — 500 leads included — no card required
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  );
}
