import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Zap, Sparkles } from "lucide-react";
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
  const plans = getSortedPricingTiers(); // Include all plans: trial, free, starter, pro, enterprise

  const { data: user } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
    retry: false,
  });

  const currentPlan = user?.subscriptionTier || user?.plan || 'free';

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
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-primary/20 backdrop-blur-sm mb-6">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white/90">
            Scale your reach
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white" data-testid="heading-pricing">
          Plans That Grow With You
        </h1>
        <p className="text-lg text-white/70" data-testid="text-subtitle">
          Start free, upgrade when you're closing deals. Pay only for what you scale.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan, index) => {
          const isPopular = plan.popular;
          const isEnterprise = plan.id === 'enterprise';
          const isCurrentPlan = currentPlan === plan.id;
          
          return (
            <AnimatedCard
              key={plan.name}
              delay={index * 0.1}
              className={`bg-gradient-to-b overflow-hidden ${
                isCurrentPlan
                  ? 'from-emerald-500/20 to-emerald-500/5 border-emerald-500 shadow-lg ring-2 ring-emerald-500/50'
                  : isPopular 
                  ? 'from-primary/10 to-primary/5 border-primary shadow-lg' 
                  : 'from-white/5 to-white/[0.02] border-white/10'
              }`}
              glowColor={isCurrentPlan ? "rgba(16, 185, 129, 0.5)" : isPopular ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.2)"}
            >
              <div className="p-6 relative" data-testid={`card-plan-${plan.name.toLowerCase()}`}>
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
                    <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg" data-testid="badge-popular">
                      <Zap className="w-3 h-3" />
                      Most Popular
                    </div>
                  </motion.div>
                )}

                <h3 className="text-2xl font-bold mb-2 text-white" data-testid={`text-plan-name-${index}`}>
                  {plan.name}
                </h3>
                
                <p className="text-white/70 mb-4 text-sm" data-testid={`text-plan-description-${index}`}>
                  {plan.description}
                </p>

                <div className="mb-6">
                  <motion.span 
                    className="text-4xl font-bold text-white"
                    whileHover={{ scale: 1.05 }}
                    data-testid={`text-plan-price-${index}`}
                  >
                    ${plan.price.toFixed(0)}
                  </motion.span>
                  <span className="text-white/60 text-base">/{plan.period}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.slice(0, 5).map((feature, featureIndex) => (
                    <motion.li
                      key={featureIndex}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: featureIndex * 0.05 }}
                      className="flex items-start gap-2 text-sm"
                      data-testid={`feature-${index}-${featureIndex}`}
                    >
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80">{feature}</span>
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
                        : isEnterprise
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    } transition-all duration-300`}
                    size="lg"
                    data-testid={`button-cta-${index}`}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrentPlan || loadingPlan === plan.id}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : (
                      `Get ${plan.name}`
                    )}
                  </Button>
                </motion.div>
              </div>
            </AnimatedCard>
          );
        })}
      </div>

      <div className="max-w-2xl mx-auto mt-12">
        <h2 className="text-xl font-bold mb-4 text-center text-white">FAQ</h2>
        <div className="space-y-3">
          {[
            {
              q: "Can I change plans?",
              a: "Yes, upgrade or downgrade anytime. Changes apply immediately.",
            },
            {
              q: "Is there a refund policy?",
              a: "30-day money-back guarantee on all paid plans.",
            },
          ].map((faq, index) => (
            <Card key={index} className="bg-white/5 border-white/10" data-testid={`card-faq-${index}`}>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-white">{faq.q}</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <p className="text-sm text-white/70">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
