import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles } from "lucide-react";
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
  "Human-like timing & tone",
  "Voice notes in your voice",
  "Auto-booking + intelligent follow-ups"
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-8 py-24 mt-16 overflow-hidden">
      {/* Animated Background Elements */}
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
        {/* Logo */}
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <div className="bg-gradient-to-b from-[#0d1428] via-[#0a0f1f] to-[#0d1428] p-4 rounded-2xl border border-cyan-500/30 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-shadow">
            <img
              src="/logo.png"
              alt="Audnix AI Logo"
              className="h-16 w-16 object-contain"
            />
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div variants={itemVariants} className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-primary/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-white/90">
              Your AI Sales Closer — Available 24/7
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1 
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-tight text-white px-4 sm:px-6 md:px-0"
        >
          Stop Letting Warm Leads<br className="hidden xs:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            {" "}Go Cold
          </span>
        </motion.h1>
        
        {/* Subheadline */}
        <motion.p 
          variants={itemVariants}
          className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white mb-4 max-w-4xl mx-auto leading-relaxed font-light px-4 sm:px-6 md:px-0"
        >
          Your AI sales closer that handles objections, closes deals,{" "}
          <br className="hidden md:block" />
          and converts leads — 24/7, while you sleep.
        </motion.p>

        <motion.p 
          variants={itemVariants}
          className="text-sm sm:text-base md:text-lg text-white/70 mb-10 max-w-3xl mx-auto leading-relaxed px-4 sm:px-6 md:px-0"
        >
          Email sequences that close deals + voice notes on Instagram DMs.{" "}
          <br className="hidden sm:block" />
          AI handles objections and books meetings automatically.
        </motion.p>

        {/* Feature Pills */}
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
              <Check className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-white/90 text-sm sm:text-base">{feature}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div variants={itemVariants}>
          <Link href="/auth">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold text-base sm:text-lg px-8 sm:px-12 py-6 sm:py-7 rounded-full shadow-2xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start closing deals
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={false}
                />
              </Button>
            </motion.div>
          </Link>
          <motion.p 
            variants={itemVariants}
            className="text-white/50 text-sm mt-4"
          >
            3-day free trial • No credit card • Setup in 5 minutes
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  );
}
