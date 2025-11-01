import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Starter",
    price: 49.99,
    description: "Perfect for solo entrepreneurs and small businesses",
    features: [
      "2,500 leads",
      "100 voice minutes (~1.5 hours)",
      "Instagram + WhatsApp + Email",
      "AI follow-ups & insights",
      "Basic analytics",
    ],
    cta: "Upgrade to Starter",
    planId: "starter",
    popular: false,
  },
  {
    name: "Pro",
    price: 99.99,
    description: "For growing teams that need more power",
    features: [
      "7,000 leads",
      "400 voice minutes (~6.5 hours)",
      "All Starter features",
      "Calendar integration",
      "Advanced insights",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    planId: "pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: 199.99,
    description: "Unlimited power for scaling teams",
    features: [
      "20,000+ leads",
      "1,000 voice minutes (16+ hours)",
      "All Pro features",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    cta: "Upgrade to Enterprise",
    planId: "enterprise",
    popular: false,
  },
];

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

  const handleUpgrade = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const response = await apiRequest<{ url: string }>('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planKey: planId }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
      setLoadingPlan(null);
    }
  };

  const handleTopup = async (topupKey: string) => {
    setLoadingPlan(topupKey);
    try {
      const response = await apiRequest<{ url: string }>('/api/billing/topup', {
        method: 'POST',
        body: JSON.stringify({ topupKey }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating topup checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
      setLoadingPlan(null);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-white" data-testid="heading-pricing">
          Choose Your Plan
        </h1>
        <p className="text-xl text-white/80" data-testid="text-subtitle">
          Start with a 3-day free trial. No credit card required.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`relative ${
                plan.popular ? "border-primary shadow-lg scale-105" : ""
              } hover-elevate`}
              data-testid={`card-plan-${plan.name.toLowerCase()}`}
            >
              {plan.popular && (
                <Badge
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                  data-testid="badge-popular"
                >
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white" data-testid={`text-plan-name-${index}`}>
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-white/70" data-testid={`text-plan-description-${index}`}>
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white" data-testid={`text-plan-price-${index}`}>
                    ${plan.price}
                  </span>
                  <span className="text-white/60">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start gap-2"
                      data-testid={`feature-${index}-${featureIndex}`}
                    >
                      <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/90">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.popular ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white' : 'bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white border-0'}`}
                  variant={plan.popular ? "default" : "secondary"}
                  data-testid={`button-cta-${index}`}
                  onClick={() => handleUpgrade(plan.planId)}
                  disabled={loadingPlan === plan.planId}
                >
                  {loadingPlan === plan.planId ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    plan.cta
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Voice Minutes Top-ups */}
      <div id="topups" className="max-w-6xl mx-auto mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-white">Voice Minutes Top-Ups</h2>
          <p className="text-xl text-white/80">
            Ran out of voice minutes? Top up instantly and keep the AI working
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topups.map((topup, index) => (
            <motion.div
              key={topup.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`relative ${
                  topup.popular ? "border-emerald-500 shadow-lg scale-105" : ""
                } hover-elevate`}
              >
                {topup.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500">
                    Best Value
                  </Badge>
                )}
                <CardHeader className="text-center pb-3">
                  <CardTitle className="text-lg text-white">{topup.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-white">${topup.price}</span>
                  </div>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-primary">
                      {topup.minutes} minutes
                    </p>
                    <p className="text-sm text-white/70">{topup.description}</p>
                  </div>
                  <div className="space-y-2 text-sm text-white/60">
                    <p>✓ Instant delivery</p>
                    <p>✓ Never expires</p>
                    <p>✓ 85%+ profit margin</p>
                  </div>
                  <Button
                    className={`w-full ${
                      topup.popular
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 border-0'
                    }`}
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
                        Buy Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-white/60">
            All top-ups sync in real-time via Stripe webhooks • Balance updates instantly
          </p>
        </div>
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
