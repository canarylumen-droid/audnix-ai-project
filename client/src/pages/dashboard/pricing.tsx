import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getSortedPricingTiers } from "@shared/plan-utils";
import { AnimatedCard } from "@/components/ui/animated-card";

interface UserProfile {
  id: string;
  email: string;
  plan?: string;
  subscriptionTier?: string;
}

export default function PricingPage() {
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const pricingTiers = getSortedPricingTiers();

  const { data: user } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
    retry: false,
  });

  const currentPlan = user?.subscriptionTier || user?.plan || 'trial';

  const handleUpgrade = async (planId: string) => {
    if (currentPlan === planId) return;
    
    setLoadingPlan(planId);
    try {
      const response = await apiRequest<{ url: string }>('/api/billing/payment-link', {
        method: 'POST',
        body: JSON.stringify({ planKey: planId }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No payment link returned');
      }
    } catch (error) {
      console.error('Error getting payment link:', error);
      toast({
        title: "Error",
        description: "Failed to get payment link. Please try again.",
        variant: "destructive",
      });
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen py-20 px-4 bg-gradient-to-b from-white/[0.02] to-transparent">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              No Surprises
            </span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Start free. Add voice to reach more leads on Instagram. Scale as you close deals.
          </p>
        </motion.div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {pricingTiers.map((tier, index) => {
            const isPopular = tier.id === 'pro';
            const isCurrentPlan = currentPlan === tier.id;
            const isPaidPlan = tier.id !== 'trial';

            return (
              <AnimatedCard
                key={tier.id}
                delay={index * 0.1}
                className={`bg-gradient-to-b ${
                  isCurrentPlan
                    ? 'from-emerald-500/20 to-emerald-500/5 border-emerald-500 shadow-lg ring-2 ring-emerald-500/50'
                    : isPopular 
                    ? 'from-primary/10 to-primary/5 border-primary shadow-lg shadow-primary/20' 
                    : 'from-black/80 to-black/60 border-white/20'
                } overflow-hidden`}
                glowColor={isCurrentPlan ? "rgba(16, 185, 129, 0.5)" : isPopular ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.1)"}
              >
                <div className="p-6 relative">
                  {isCurrentPlan && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2"
                    >
                      <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                        <Check className="w-3 h-3" />
                        Current Plan
                      </div>
                    </motion.div>
                  )}
                  {!isCurrentPlan && isPopular && (
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

                  <p className="text-white/70 mb-6 min-h-[3rem] text-sm">{tier.description}</p>

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

                  <motion.div
                    whileHover={isCurrentPlan ? {} : { scale: 1.02 }}
                    whileTap={isCurrentPlan ? {} : { scale: 0.98 }}
                  >
                    <Button
                      className={`w-full rounded-full font-bold ${
                        isCurrentPlan
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 cursor-default'
                          : isPopular
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-primary/25'
                          : 'bg-black hover:bg-black/80 text-white border border-white/30 hover:border-white/50'
                      } transition-all duration-300`}
                      size="lg"
                      onClick={() => isPaidPlan ? handleUpgrade(tier.id) : null}
                      disabled={isCurrentPlan || loadingPlan === tier.id}
                    >
                      {loadingPlan === tier.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : (
                        'Get Started →'
                      )}
                    </Button>
                  </motion.div>
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
            Add-ons (paid plans only): Voice top-ups • Advanced analytics
          </p>
        </motion.div>
      </div>
    </div>
  );
}
