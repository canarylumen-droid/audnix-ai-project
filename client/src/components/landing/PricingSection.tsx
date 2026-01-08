import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Zap, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { getSortedPricingTiers } from "@shared/plan-utils";

export function PricingSection() {
  const pricingTiers = getSortedPricingTiers().filter(tier => tier.id !== 'trial' && tier.id !== 'free');

  return (
    <section id="pricing" className="py-32 px-4 relative overflow-hidden bg-[#020409]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-primary">Scalable Pricing</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-7xl font-black tracking-tight text-white mb-6"
          >
            PICK YOUR PACE.<br />
            <span className="text-white/40">NO SURPRISES.</span>
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pricingTiers.map((tier, index) => {
            const isPopular = tier.id === 'pro';
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`glass-card p-10 rounded-[3rem] border-white/5 relative flex flex-col h-full ${isPopular ? "bg-white/[0.04] border-primary/20 shadow-primary/10" : "bg-white/[0.01]"
                  }`}
              >
                {isPopular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-black px-6 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-white/40 text-xs font-black uppercase tracking-widest mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-6xl font-black text-white tracking-tighter">${tier.price}</span>
                    <span className="text-white/40 font-bold uppercase tracking-widest text-xs">/ {tier.period}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-12 flex-1">
                  {tier.features.slice(0, 6).map((feat, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-white/70 text-sm font-semibold">{feat}</span>
                    </div>
                  ))}
                </div>

                <Link href="/auth">
                  <Button
                    className={`h-16 w-full rounded-full text-lg font-black tracking-tight transition-transform active:scale-95 ${isPopular
                        ? "bg-primary text-black shadow-xl shadow-primary/20 hover:bg-primary/90"
                        : "bg-white/10 text-white hover:bg-white/20 border-white/10"
                      }`}
                  >
                    {isPopular ? "Scale My Revenue" : "Get Started"}
                    <Zap className="w-5 h-5 ml-2 fill-current" />
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
