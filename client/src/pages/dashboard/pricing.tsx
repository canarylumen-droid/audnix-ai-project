import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Zap, ShieldCheck, Activity, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getSortedPricingTiers } from "@shared/plan-utils";

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
  const isPaidUser = currentPlan !== 'trial' && currentPlan !== '';

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
    <div className="min-h-screen pb-20 bg-background text-foreground mt-[-4rem] pt-32 px-4 scroll-smooth">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Background Ambience */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-primary/5 blur-[200px] rounded-full pointer-events-none -z-10" />

        {/* Header Section */}
        <div className="text-center mb-24 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-8"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Simple, Transparent Pricing
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-8"
          >
            Scale your <span className="text-primary">outreach.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-medium text-xl max-w-2xl mx-auto"
          >
            Choose the plan that fits your business goals. No hidden fees, just pure growth.
          </motion.p>
        </div>

        {/* Pricing Cards Grid */}
        <div className={`grid gap-8 ${isPaidUser ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
          {pricingTiers.filter(tier => isPaidUser ? tier.id !== 'trial' : true).map((tier, index) => {
            const isPopular = tier.id === 'pro';
            const isCurrentPlan = currentPlan === tier.id;
            const isPaidPlan = tier.id !== 'trial';

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-10 rounded-3xl border flex flex-col h-full transition-all duration-300 ${isCurrentPlan
                  ? "bg-primary/[0.03] border-primary/40 ring-1 ring-primary/20"
                  : isPopular
                    ? "bg-muted/10 border-primary/20 shadow-xl"
                    : "bg-muted/5 border-border/50"
                  }`}
              >
                {isCurrentPlan && (
                  <Badge className="self-center -mt-14 mb-4 bg-emerald-500 text-white border-0 font-bold px-4 py-1 rounded-full uppercase text-[10px] tracking-wider">
                    Current Plan
                  </Badge>
                )}
                {!isCurrentPlan && isPopular && (
                  <Badge className="self-center -mt-14 mb-4 bg-primary text-primary-foreground border-0 font-bold px-4 py-1 rounded-full uppercase text-[10px] tracking-wider">
                    Most Popular
                  </Badge>
                )}

                <div className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{tier.name}</h3>
                    {isPopular && <Zap className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold tracking-tight">
                      ${tier.price}
                    </span>
                    <span className="text-muted-foreground font-semibold text-xs lowercase">/ {tier.period}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-10 flex-1">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary" />
                      </div>
                      <span className="text-muted-foreground font-medium text-sm leading-snug">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-6 border-t border-border/50 space-y-6">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{tier.leadsLimit.toLocaleString()} Leads</span>
                    </div>
                    {tier.voiceMinutes > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        <span>{tier.voiceMinutes} Voice Mins</span>
                      </div>
                    )}
                  </div>

                  <Button
                    className={`h-14 w-full rounded-2xl text-sm font-semibold transition-all ${isCurrentPlan
                      ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 pointer-events-none"
                      : isPopular
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border-border/50 hover:bg-muted"
                      }`}
                    variant={isCurrentPlan ? "outline" : isPopular ? "default" : "outline"}
                    onClick={() => isPaidPlan ? handleUpgrade(tier.id) : null}
                    disabled={isCurrentPlan || (loadingPlan === tier.id)}
                  >
                    {loadingPlan === tier.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {isCurrentPlan ? "Active Plan" : isPopular ? "Get Started" : "Choose Plan"}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-center space-y-6"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
            Secure checkout powered by Stripe. All transactions are encrypted.
          </p>
          <div className="flex justify-center gap-10 opacity-30">
            <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
              <ShieldCheck className="w-4 h-4" />
              Secure Data
            </div>
            <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
              <Activity className="w-4 h-4" />
              Priority Support
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
