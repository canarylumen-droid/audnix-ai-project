import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Zap, Sparkles, Activity, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { getSortedPricingTiers } from "@shared/plan-utils";

export function PricingSection() {
  const pricingTiers = getSortedPricingTiers().filter(tier => tier.id !== 'trial' && tier.id !== 'free');

  return (
    <section id="pricing" className="py-60 px-4 relative overflow-hidden bg-black">
      {/* Background Ambience */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 blur-[200px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-40">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-12 flex items-center gap-3"
          >
            <ShieldCheck className="w-4 h-4" />
            Flexible Ecosystem Access
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-6xl md:text-[8.5rem] font-black tracking-[-0.05em] leading-[0.85] text-white uppercase italic mb-12"
          >
            THE YIELD <br />
            <span className="text-primary not-italic tracking-[-0.08em]">Tiers.</span>
          </motion.h2>
          <p className="text-white/40 font-bold italic text-2xl max-w-2xl mx-auto tracking-tight">
            Transparent pricing for <span className="text-white">high-performance operators</span>. No hidden tax, just raw growth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          {pricingTiers.map((tier, index) => {
            const isPopular = tier.id === 'pro';
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, scale: 0.95, y: 50 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                className={`p-16 rounded-[4rem] border relative flex flex-col h-full perspective-tilt premium-glow transition-all duration-700 ${isPopular ? "bg-white/[0.03] border-primary/20 shadow-2xl scale-105 z-10" : "bg-white/[0.01] border-white/5"
                  }`}
              >
                {isPopular && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-black px-10 py-2.5 rounded-full text-[10px] font-black tracking-[0.3em] uppercase shadow-[0_20px_40px_-10px_rgba(34,211,238,0.5)]">
                    Most Popular
                  </div>
                )}

                <div className="mb-16">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-white/20 text-xs font-black uppercase tracking-[0.5em] italic">{tier.name}</h3>
                    {isPopular && <Activity className="w-4 h-4 text-primary animate-pulse" />}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-black text-white tracking-tighter italic">
                      ${tier.price}
                    </span>
                    <span className="text-white/20 font-black uppercase tracking-[0.2em] text-[10px]">/ {tier.period}</span>
                  </div>
                </div>

                <div className="space-y-6 mb-16 flex-1">
                  {tier.features.slice(0, 8).map((feat, i) => (
                    <div key={i} className="flex items-start gap-4 group/item">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover/item:border-primary/50 transition-colors">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-white/40 font-bold italic text-base group-hover/item:text-white transition-colors">{feat}</span>
                    </div>
                  ))}
                </div>

                <Link href="/auth">
                  <Button
                    className={`h-24 w-full rounded-[2.5rem] text-sm font-black uppercase tracking-[0.2em] transition-all duration-700 active:scale-95 group relative overflow-hidden ${isPopular
                      ? "bg-white text-black shadow-2xl shadow-primary/20"
                      : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border-white/5"
                      }`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {isPopular ? "Initialize Pro Mode" : "Select Node"}
                      <Zap className={`w-4 h-4 ${isPopular ? "fill-current" : ""}`} />
                    </span>
                    {isPopular && <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-700" />}
                    <div className="absolute inset-x-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" />
                  </Button>
                </Link>

                <p className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/10 italic">
                  {isPopular ? "Unlocks Premium Support" : "Core Systems Only"}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
