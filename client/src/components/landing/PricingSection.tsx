import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";
import { Link } from "wouter";
import { AnimatedCard } from "@/components/ui/animated-card";
import { getSortedPricingTiers } from "@shared/plan-utils";

export function PricingSection() {
  const pricingTiers = getSortedPricingTiers().filter(tier => tier.id !== 'trial');

  return (
    <section id="pricing" className="py-20 px-4 bg-gradient-to-b from-white/[0.02] to-transparent">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Pricing Built for<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              Closers, Not Browsers
            </span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Start free → upgrade when you're closing deals
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {pricingTiers.map((tier, index) => {
            const isPopular = tier.id === 'pro';
            const isEnterprise = tier.id === 'enterprise';

            return (
              <AnimatedCard
                key={tier.id}
                delay={index * 0.1}
                className={`bg-gradient-to-b ${
                  isPopular 
                    ? 'from-primary/10 to-primary/5 border-primary shadow-lg shadow-primary/20' 
                    : 'from-white/5 to-white/[0.02] border-white/10'
                } overflow-hidden`}
                glowColor={isPopular ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.2)"}
              >
                <div className="p-6 relative">
                  {isPopular && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2"
                    >
                      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                        <Zap className="w-3 h-3" />
                        Most Popular
                      </div>
                    </motion.div>
                  )}

                  <h3 className="text-2xl font-bold mb-2 text-white">{tier.name}</h3>
                  
                  <div className="mb-4">
                    <motion.span 
                      className="text-5xl font-bold text-white"
                      whileHover={{ scale: 1.05 }}
                    >
                      ${tier.price}
                    </motion.span>
                    <span className="text-white/60 text-lg">/{tier.period}</span>
                  </div>

                  <p className="text-white/70 mb-6 min-h-[3rem]">{tier.description}</p>

                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2.5 text-sm group"
                      >
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="text-white/80 group-hover:text-white transition-colors">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <Link href="/auth">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        className={`w-full rounded-full font-bold ${
                          isPopular
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-primary/25'
                            : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-primary/20'
                        } transition-all duration-300`}
                        size="lg"
                      >
                        {tier.id === 'free' ? 'Start Free →' : 'Get Started →'}
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </AnimatedCard>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-white/60 text-sm">
            Add-ons (paid plans only): Voice top-ups • Advanced analytics •{" "}
            <span className="text-cyan-400 font-medium">Instagram DM automation (coming soon)</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
