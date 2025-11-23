import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Mic, Zap, Sparkles } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getSortedPricingTiers } from "@shared/plan-utils";
import { AnimatedCard } from "@/components/ui/animated-card";

const topups = [
  {
    name: "Quick Boost",
    minutes: 100,
    price: 7,
    description: "1.5+ hours of AI voice notes",
    popular: false,
    topupKey: "voice_100",
  },
  {
    name: "Best Value",
    minutes: 300,
    price: 20,
    description: "5 hours of AI voice notes",
    popular: true,
    topupKey: "voice_300",
  },
  {
    name: "Popular",
    minutes: 600,
    price: 40,
    description: "10 hours of AI voice notes",
    popular: false,
    topupKey: "voice_600",
  },
  {
    name: "Power User",
    minutes: 1200,
    price: 80,
    description: "20 hours of AI voice notes",
    popular: false,
    topupKey: "voice_1200",
  },
];

export default function PricingPage() {
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const plans = getSortedPricingTiers().filter(tier => tier.id !== 'free');

  const handleUpgrade = async (planId: string) => {
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

  const handleTopup = async (topupKey: string) => {
    setLoadingPlan(topupKey);
    try {
      const response = await apiRequest<{ url: string }>('/api/billing/topup-link', {
        method: 'POST',
        body: JSON.stringify({ topupKey }),
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
      console.error('Error getting topup link:', error);
      toast({
        title: "Error",
        description: "Failed to get payment link. Please try again.",
        variant: "destructive",
      });
      setLoadingPlan(null);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-primary/20 backdrop-blur-sm mb-6">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white/90">
            Upgrade to unlock full automation power
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70" data-testid="heading-pricing">
          Pricing Built for Closers
        </h1>
        <p className="text-xl text-white/70" data-testid="text-subtitle">
          Start free → upgrade when you're closing deals
        </p>
      </motion.div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan, index) => {
          const isPopular = plan.popular;
          const isEnterprise = plan.id === 'enterprise';
          
          return (
            <AnimatedCard
              key={plan.name}
              delay={index * 0.1}
              className={`bg-gradient-to-b overflow-hidden ${
                isPopular 
                  ? 'from-primary/10 to-primary/5 border-primary shadow-lg' 
                  : 'from-white/5 to-white/[0.02] border-white/10'
              }`}
              glowColor={isPopular ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.2)"}
            >
              <div className="p-6 relative" data-testid={`card-plan-${plan.name.toLowerCase()}`}>
                {isPopular && (
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
                
                <p className="text-white/70 mb-4" data-testid={`text-plan-description-${index}`}>
                  {plan.description}
                </p>

                <div className="mb-6">
                  <motion.span 
                    className="text-5xl font-bold text-white"
                    whileHover={{ scale: 1.05 }}
                    data-testid={`text-plan-price-${index}`}
                  >
                    ${plan.price.toFixed(2)}
                  </motion.span>
                  <span className="text-white/60 text-lg">/{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.li
                      key={featureIndex}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: featureIndex * 0.05 }}
                      className="flex items-start gap-2.5 text-sm group"
                      data-testid={`feature-${index}-${featureIndex}`}
                    >
                      <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <span className="text-white/80 group-hover:text-white transition-colors">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    className={`w-full rounded-full font-bold ${
                      isPopular
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-primary/25'
                        : isEnterprise
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    } transition-all duration-300`}
                    size="lg"
                    data-testid={`button-cta-${index}`}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loadingPlan === plan.id}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      plan.id === 'enterprise' ? 'Talk to Sales →' : 'Upgrade →'
                    )}
                  </Button>
                </motion.div>
              </div>
            </AnimatedCard>
          );
        })}
      </div>

      {/* Voice Minutes Top-ups */}
      <div id="topups" className="max-w-6xl mx-auto mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 text-white">Voice Minutes Top-Ups</h2>
          <p className="text-xl text-white/70">
            Ran out of voice minutes? Top up instantly and keep the AI working
          </p>
          <p className="text-sm text-cyan-400 mt-2 font-medium">
            Available for paid plans only
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topups.map((topup, index) => (
            <AnimatedCard
              key={topup.name}
              delay={index * 0.1}
              className={`bg-gradient-to-b overflow-hidden ${
                topup.popular
                  ? 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/50'
                  : 'from-white/5 to-white/[0.02] border-white/10'
              }`}
              glowColor={topup.popular ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.2)"}
            >
              <div className="p-6 relative">
                {topup.popular && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2"
                  >
                    <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      Best Value
                    </div>
                  </motion.div>
                )}
                
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white mb-2">{topup.name}</h3>
                  <div className="mb-4">
                    <motion.span 
                      className="text-3xl font-bold text-white"
                      whileHover={{ scale: 1.05 }}
                    >
                      ${topup.price}
                    </motion.span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <p className="text-2xl font-bold text-primary">
                      {topup.minutes} minutes
                    </p>
                    <p className="text-sm text-white/70">{topup.description}</p>
                  </div>

                  <div className="space-y-2 text-sm text-white/60 mb-6">
                    {["Instant delivery", "Never expires", "85%+ profit margin"].map((item, i) => (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4 text-emerald-400" />
                        {item}
                      </motion.p>
                    ))}
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      className={`w-full rounded-full font-bold ${
                        topup.popular
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      } transition-all duration-300`}
                      onClick={() => handleTopup(topup.topupKey)}
                      disabled={loadingPlan === topup.topupKey}
                    >
                      {loadingPlan === topup.topupKey ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Mic className="mr-2 h-4 w-4" />
                          Buy Now →
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-white/60">
            All top-ups sync in real-time via Stripe webhooks • Balance updates instantly
          </p>
        </motion.div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto mt-20">
        <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            {
              q: "Can I change my plan later?",
              a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.",
            },
            {
              q: "What happens after my trial ends?",
              a: "After your 3-day trial, you'll need to select a paid plan to continue using Audnix. Your data is safe during the trial period.",
            },
            {
              q: "Do you offer refunds?",
              a: "We offer a 30-day money-back guarantee on all paid plans. No questions asked.",
            },
          ].map((faq, index) => (
            <Card key={index} data-testid={`card-faq-${index}`}>
              <CardHeader>
                <CardTitle className="text-lg text-white" data-testid={`text-faq-q-${index}`}>{faq.q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70" data-testid={`text-faq-a-${index}`}>{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}