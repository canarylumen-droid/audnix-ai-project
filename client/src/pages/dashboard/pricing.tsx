import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Zap, ShieldCheck, Activity, TrendingUp, Sparkles } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getSortedPricingTiers } from "@shared/plan-utils";
import { Badge } from "@/components/ui/badge";

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
      const response = await apiRequest('POST', '/api/billing/payment-link', { planKey: planId });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
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
    <div className="min-h-screen pb-40 bg-black text-white selection:bg-primary selection:text-black">
      <div className="max-w-7xl mx-auto px-6 relative">
        {/* Background Ambience */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none -z-10" />

        {/* Header Section */}
        <div className="text-center pt-32 mb-32 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-12 shadow-[0_0_20px_rgba(var(--primary),0.1)]"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Select Your Scaling Engine
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-[7rem] font-black tracking-tighter mb-10 leading-[0.85] uppercase"
          >
            Scale your <br />
            <span className="text-primary drop-shadow-[0_0_40px_rgba(var(--primary),0.3)]">Intelligence.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/40 font-bold text-2xl max-w-2xl mx-auto leading-tight"
          >
            Deploy autonomous agents that handle outreach, objection mastery, and closed revenue.
            <span className="text-white ml-2 underline underline-offset-8 decoration-primary/40">Zero setup fees.</span>
          </motion.p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
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
                className={`
                  relative w-full p-10 rounded-[2.5rem] border flex flex-col h-full transition-all duration-500 group
                  ${isCurrentPlan
                    ? "bg-primary/[0.05] border-primary/50 shadow-[0_0_50px_rgba(var(--primary),0.15)] z-10 scale-[1.02]"
                    : isPopular
                      ? "bg-white/[0.03] border-primary/30 shadow-2xl hover:border-primary/60 hover:bg-white/[0.05] z-10 lg:-mt-6 lg:mb-6"
                      : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                  }
                `}
              >
                {isPopular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-primary rounded-full text-black text-[10px] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(var(--primary),0.4)]">
                    Most Popular
                  </div>
                )}

                <div className="mb-10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">{tier.name}</h3>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors duration-500
                        ${isPopular ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/10 text-white/20'}
                    `}>
                      {isPopular ? <Zap className="w-5 h-5 fill-primary" /> : <Sparkles className="w-5 h-5" />}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white tracking-tighter">
                      ${tier.price}
                    </span>
                    <span className="text-white/30 font-bold text-xs uppercase tracking-widest">/ {tier.period}</span>
                  </div>
                </div>

                <div className="space-y-5 mb-10 flex-1">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-colors">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-white/70 font-bold text-[13px] leading-snug uppercase tracking-tight">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-8 border-t border-white/5 space-y-6">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      <span>{tier.leadsLimit.toLocaleString()} Leads / Mo</span>
                    </div>
                    {tier.voiceMinutes > 0 && (
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-primary" />
                        <span>{tier.voiceMinutes} AI Mins</span>
                      </div>
                    )}
                  </div>

                  <Button
                    className={`
                        h-14 w-full rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500
                        ${isCurrentPlan
                        ? "bg-white/5 text-white/20 cursor-default border-white/5"
                        : isPopular
                          ? "bg-primary text-black hover:bg-primary/90 shadow-[0_20px_40px_rgba(var(--primary),0.2)]"
                          : "bg-white text-black hover:bg-white/90"
                      }
                    `}
                    onClick={() => isPaidPlan ? handleUpgrade(tier.id) : null}
                    disabled={isCurrentPlan || (loadingPlan === tier.id)}
                  >
                    {loadingPlan === tier.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {isCurrentPlan ? "Current Plan" : "Initialize Scale"}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-32 text-center"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10 mb-12">
            Secure Infrastructure powered by Stripe PCI-DSS Level 1
          </p>
          <div className="flex justify-center flex-wrap gap-12 text-white/30">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Enterprise Grade Security
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
              <Activity className="w-5 h-5 text-primary" />
              99.99% Uptime SLA
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
              <TrendingUp className="w-5 h-5 text-primary" />
              Autonomous Recovery
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
