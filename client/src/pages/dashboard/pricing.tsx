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
    <div className="min-h-screen pb-20 bg-black text-white selection:bg-primary selection:text-black mt-[-4rem] pt-32 px-4 scroll-smooth">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Background Ambience */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-primary/5 blur-[200px] rounded-full pointer-events-none -z-10" />

        {/* Header Section */}
        <div className="text-center mb-32 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.5em] mb-12"
          >
            <ShieldCheck className="w-4 h-4" />
            Flexible Ecosystem Access
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-[8rem] font-black tracking-[-0.05em] leading-[0.85] uppercase italic mb-12"
          >
            THE YIELD <br />
            <span className="text-primary not-italic tracking-[-0.08em]">TIERS.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/40 font-bold italic text-2xl max-w-2xl mx-auto tracking-tight"
          >
            Transparent pricing for <span className="text-white">high-performance operators</span>. No hidden tax, just raw growth.
          </motion.p>
        </div>

        {/* Pricing Cards Grid */}
        <div className={`grid gap-10 ${isPaidUser ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
          {pricingTiers.filter(tier => isPaidUser ? tier.id !== 'trial' : true).map((tier, index) => {
            const isPopular = tier.id === 'pro';
            const isCurrentPlan = currentPlan === tier.id;
            const isPaidPlan = tier.id !== 'trial';

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                className={`p-10 md:p-14 rounded-[3.5rem] border relative flex flex-col h-full perspective-tilt premium-glow transition-all duration-700 ${isCurrentPlan
                  ? "bg-primary/[0.03] border-primary/40 shadow-2xl scale-[1.02] z-10"
                  : isPopular
                    ? "bg-white/[0.03] border-primary/20 shadow-2xl scale-105 z-10"
                    : "bg-white/[0.01] border-white/5"
                  }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-10 py-2.5 rounded-full text-[10px] font-black tracking-[0.3em] uppercase shadow-[0_20px_40px_-10px_rgba(16,185,129,0.5)]">
                    Active Protocol
                  </div>
                )}
                {!isCurrentPlan && isPopular && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-black px-10 py-2.5 rounded-full text-[10px] font-black tracking-[0.3em] uppercase shadow-[0_20px_40px_-10px_rgba(34,211,238,0.5)]">
                    Most Popular
                  </div>
                )}

                <div className="mb-14">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-white/20 text-xs font-black uppercase tracking-[0.5em] italic">{tier.name}</h3>
                    {(isPopular || isCurrentPlan) && <Activity className="w-4 h-4 text-primary animate-pulse" />}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl md:text-7xl font-black text-white tracking-tighter italic">
                      ${tier.price}
                    </span>
                    <span className="text-white/20 font-black uppercase tracking-[0.2em] text-[10px]">/ {tier.period}</span>
                  </div>
                </div>

                <div className="space-y-6 mb-14 flex-1">
                  {tier.features.map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (index * 0.1) + (i * 0.05) }}
                      className="flex items-start gap-4 group/item"
                    >
                      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover/item:border-primary/50 transition-colors">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-white/40 font-bold italic text-base group-hover/item:text-white transition-colors leading-tight">
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-auto pt-6 border-t border-white/5 space-y-6">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/20">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-primary/40" />
                      <span>{tier.leadsLimit.toLocaleString()} Leads</span>
                    </div>
                    {tier.voiceMinutes > 0 && (
                      <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-primary/40" />
                        <span>{tier.voiceMinutes} Voice Mins</span>
                      </div>
                    )}
                  </div>

                  <Button
                    className={`h-20 w-full rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] transition-all duration-700 active:scale-95 group relative overflow-hidden ${isCurrentPlan
                      ? "bg-primary/10 text-primary border border-primary/20 cursor-default"
                      : isPopular
                        ? "bg-white text-black shadow-2xl shadow-primary/20"
                        : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border-white/10"
                      }`}
                    onClick={() => isPaidPlan ? handleUpgrade(tier.id) : null}
                    disabled={isCurrentPlan || (loadingPlan === tier.id)}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {loadingPlan === tier.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing
                        </>
                      ) : isCurrentPlan ? (
                        "Current Node"
                      ) : isPopular ? (
                        "Initialize Pro"
                      ) : (
                        "Select Node"
                      )}
                      {!isCurrentPlan && !loadingPlan && <Zap className={`w-4 h-4 ${isPopular ? "fill-current" : ""}`} />}
                    </span>
                    {!isCurrentPlan && isPopular && (
                      <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    )}
                    {!isCurrentPlan && (
                      <div className="absolute inset-x-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-24 text-center space-y-6"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 italic">
            SECURE CHECKOUT VIA STRIPE PROTOCOL. AES-256 ENCRYPTED.
          </p>
          <div className="flex justify-center gap-12 opacity-20 filter grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
              <ShieldCheck className="w-4 h-4" />
              Enterprise Ready
            </div>
            <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
              <Activity className="w-4 h-4" />
              99.9% Uptime
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
