import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, MessageSquare, Zap, BarChart3, Flame, ArrowRight, Sparkles, Clock, Shield } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useReducedMotion } from "@/lib/animation-utils";
import Hero3D from "@/components/ui/3d-hero";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const [userCount, setUserCount] = useState(0);
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/users/count"],
    enabled: isSupabaseConfigured(),
  });

  useEffect(() => {
    if (countData?.count) {
      setUserCount(countData.count);
    }
  }, [countData]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      return;
    }

    const channel = supabase
      .channel('users-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          setUserCount(prev => prev + 1);
          
          const newUser = payload.new as any;
          if (newUser.name) {
            toast({
              title: "New user joined!",
              description: `${newUser.name} just started their free trial`,
              duration: 3000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [toast]);

  useGSAP(() => {
    if (prefersReducedMotion) return;

    const features = featuresRef.current?.querySelectorAll('.feature-card');
    if (features) {
      gsap.fromTo(
        features,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.2,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }

    if (comparisonRef.current) {
      gsap.fromTo(
        comparisonRef.current,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: comparisonRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }
  }, { scope: containerRef });

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-[#0a0f1f] to-[#020409] text-white overflow-x-hidden">
      {/* Hero Section - Enhanced with 3D */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div 
          className="absolute inset-0 overflow-hidden"
          style={{ opacity }}
        >
          <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl ${!prefersReducedMotion ? 'animate-pulse' : ''}`} />
          <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl ${!prefersReducedMotion ? 'animate-pulse' : ''}`} style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl" />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8 }}
              style={prefersReducedMotion ? {} : { scale }}
            >
              <motion.div
                className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                data-testid="badge-new-feature"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-white/90">AI-Powered Follow-ups</span>
              </motion.div>

              <motion.h1
                className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6"
                animate={prefersReducedMotion ? {} : { 
                  textShadow: [
                    "0 0 20px rgba(0, 170, 255, 0.3)",
                    "0 0 40px rgba(0, 170, 255, 0.5)",
                    "0 0 20px rgba(0, 170, 255, 0.3)"
                  ]
                }}
                transition={prefersReducedMotion ? {} : { duration: 3, repeat: Infinity }}
                data-testid="heading-hero"
              >
                <span className="bg-gradient-to-r from-white via-primary to-white bg-clip-text text-transparent">
                  Follow up like a human,
                </span>
                <br />
                <span className="text-primary glow-text">close deals like a pro</span>
              </motion.h1>

              <motion.p
                className="text-xl md:text-2xl mb-8 text-white/95 max-w-2xl leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                data-testid="text-hero-subtext"
              >
                The autopilot CRM that responds, nurtures, and converts leads <span className="text-primary font-semibold">humanly</span> across Instagram, WhatsApp & Email.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <Link href="/auth">
                  <Button 
                    size="lg" 
                    className="glow text-lg px-8 py-6 group"
                    data-testid="button-start-trial"
                  >
                    Start Free Trial (3 Days)
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6 glass"
                  onClick={scrollToFeatures}
                  data-testid="button-learn-more"
                >
                  Learn More
                </Button>
              </motion.div>

              <motion.div
                className="flex flex-wrap gap-4 text-sm text-white/90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center gap-2" data-testid="badge-no-card">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2" data-testid="badge-setup-time">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>5 minute setup</span>
                </div>
                <div className="flex items-center gap-2" data-testid="badge-cancel">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Cancel anytime</span>
                </div>
              </motion.div>

              <motion.div
                className="mt-12 inline-flex items-center gap-2 glass-card px-6 py-3 rounded-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                data-testid="card-social-proof"
              >
                <Flame className="w-5 h-5 text-primary" data-testid="icon-flame" />
                <span className="text-white/90">
                  <motion.span 
                    className="font-bold text-primary"
                    key={userCount}
                    initial={{ scale: 1.2, color: "#00aaff" }}
                    animate={{ scale: 1, color: "#00aaff" }}
                    transition={{ duration: 0.3 }}
                    data-testid="text-user-count"
                  >
                    {userCount}
                  </motion.span> people joined Audnix this week
                </span>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative lg:h-[600px] h-[400px]"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.4 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl" />
              <Hero3D />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced with GSAP */}
      <section id="features" ref={featuresRef} className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl md:text-6xl font-bold mb-6"
              data-testid="heading-features"
            >
              Why creators choose <span className="text-primary">Audnix</span>
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Built for modern creators who value their time and want to close more deals
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: "Human-Like Conversations",
                description: "AI-powered follow-ups that sound natural, maintain context, and build real relationships.",
                testId: "feature-conversations",
                gradient: "from-primary/20 to-blue-500/20"
              },
              {
                icon: Zap,
                title: "Zero Setup Required",
                description: "Connect your Instagram, WhatsApp, and Email in minutes. Audnix handles the rest automatically.",
                testId: "feature-setup",
                gradient: "from-emerald-500/20 to-green-500/20"
              },
              {
                icon: BarChart3,
                title: "Smart AI Insights",
                description: "Weekly reports showing engagement patterns, conversion trends, and actionable recommendations.",
                testId: "feature-insights",
                gradient: "from-purple-500/20 to-pink-500/20"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
              >
                <Card 
                  className="glass-card p-8 h-full border-white/10 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group relative overflow-hidden" 
                  data-testid={`card-${feature.testId}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <feature.icon className="w-8 h-8 text-primary group-hover:text-white transition-colors duration-300" data-testid={`icon-${feature.testId}`} />
                    </div>
                    <h3 className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300" data-testid={`heading-${feature.testId}`}>
                      {feature.title}
                    </h3>
                    <p className="text-white/80 leading-relaxed group-hover:text-white/95 transition-colors duration-300" data-testid={`text-${feature.testId}`}>
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table - Enhanced */}
      <section ref={comparisonRef} className="py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl md:text-6xl font-bold mb-6"
              data-testid="heading-comparison"
            >
              Not your average CRM
            </h2>
            <p className="text-xl text-white/90">
              See how Audnix stacks up against the competition
            </p>
          </motion.div>

          <Card className="glass-card overflow-hidden border-primary/20" data-testid="card-comparison-table">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left p-6 text-lg font-semibold">Feature</th>
                    <th className="text-center p-6 text-lg font-semibold">
                      <div className="inline-flex items-center gap-2 text-primary">
                        <Sparkles className="w-5 h-5" />
                        Audnix
                      </div>
                    </th>
                    <th className="text-center p-6 text-lg font-semibold text-white/60">ManyChat</th>
                    <th className="text-center p-6 text-lg font-semibold text-white/60">HubSpot</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Human-like AI replies", audnix: true, manychat: false, hubspot: false },
                    { feature: "Auto nurture & smart tagging", audnix: true, manychat: "partial", hubspot: "manual" },
                    { feature: "Real-time AI insights", audnix: true, manychat: false, hubspot: true },
                    { feature: "5-minute setup", audnix: true, manychat: false, hubspot: false },
                    { feature: "Voice cloning", audnix: true, manychat: false, hubspot: false }
                  ].map((row, index) => (
                    <motion.tr 
                      key={index} 
                      className="border-b border-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 group"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <td className="p-6 font-medium text-white/90 group-hover:text-white transition-colors" data-testid={`text-feature-${index}`}>{row.feature}</td>
                      <td className="text-center p-6">
                        {row.audnix === true && (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/30 group-hover:bg-primary/50 group-hover:scale-110 transition-all duration-200">
                            <Check className="w-5 h-5 text-primary group-hover:text-white transition-colors" data-testid={`icon-check-audnix-${index}`} />
                          </div>
                        )}
                      </td>
                      <td className="text-center p-6">
                        {row.manychat === true && <Check className="w-6 h-6 text-emerald-400 mx-auto" data-testid={`icon-check-manychat-${index}`} />}
                        {row.manychat === false && <X className="w-6 h-6 text-red-400/70 mx-auto" data-testid={`icon-x-manychat-${index}`} />}
                        {row.manychat === "partial" && <span className="text-yellow-400/90" data-testid={`text-partial-manychat-${index}`}>Partial</span>}
                      </td>
                      <td className="text-center p-6">
                        {row.hubspot === true && <Check className="w-6 h-6 text-emerald-400 mx-auto" data-testid={`icon-check-hubspot-${index}`} />}
                        {row.hubspot === false && <X className="w-6 h-6 text-red-400/70 mx-auto" data-testid={`icon-x-hubspot-${index}`} />}
                        {row.hubspot === "manual" && <span className="text-yellow-400/90" data-testid={`text-manual-hubspot-${index}`}>Manual</span>}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link href="/auth">
              <Button size="lg" className="glow text-lg px-12 py-6 group" data-testid="button-cta-bottom">
                Start Your Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6" data-testid="heading-pricing">
              Simple plans. <span className="text-primary">Serious results</span>
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Start with a 3-day free trial. No credit card required. Cancel anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: 49,
                description: 'Perfect for creators just getting started',
                features: [
                  '100 leads per month',
                  '30 voice minutes',
                  'Instagram & WhatsApp',
                  'Basic AI insights',
                  'Email support',
                ],
                paymentLink: import.meta.env.VITE_STRIPE_LINK_STARTER,
                testId: 'starter',
              },
              {
                name: 'Pro',
                price: 149,
                description: 'For growing creators who need more power',
                features: [
                  '500 leads per month',
                  '150 voice minutes',
                  'All integrations',
                  'Advanced AI insights',
                  'Voice cloning',
                  'Priority support',
                  'Custom automations',
                ],
                popular: true,
                paymentLink: import.meta.env.VITE_STRIPE_LINK_PRO,
                testId: 'pro',
              },
              {
                name: 'Enterprise',
                price: 499,
                description: 'Unlimited power for scaling businesses',
                features: [
                  'Unlimited leads',
                  'Unlimited voice minutes',
                  'All integrations + API',
                  'AI insights & reports',
                  'Custom voice cloning',
                  'Dedicated manager',
                  'White-label option',
                  'SLA guarantee',
                ],
                paymentLink: import.meta.env.VITE_STRIPE_LINK_ENTERPRISE,
                testId: 'enterprise',
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                    <div className="glass-card px-4 py-1 rounded-full border-primary text-sm font-semibold text-primary">
                      Most Popular
                    </div>
                  </div>
                )}
                <Card
                  className={`glass-card p-8 h-full transition-all duration-300 group hover:scale-105 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/30 ${
                    plan.popular ? 'border-primary/50 shadow-lg shadow-primary/20 scale-105' : 'border-white/10'
                  }`}
                  data-testid={`card-pricing-${plan.testId}`}
                >
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors" data-testid={`text-plan-name-${plan.testId}`}>
                      {plan.name}
                    </h3>
                    <p className="text-white/80 text-sm" data-testid={`text-plan-description-${plan.testId}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-primary group-hover:scale-110 inline-block transition-transform" data-testid={`text-price-${plan.testId}`}>
                        ${plan.price}
                      </span>
                      <span className="text-white/70">/month</span>
                    </div>
                  </div>

                  <div className="mb-8 space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 group/feature">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 group-hover/feature:scale-110 transition-transform" />
                        <span className="text-white/90 group-hover/feature:text-white transition-colors" data-testid={`text-feature-${plan.testId}-${idx}`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full text-lg py-6 transition-all duration-300 ${
                      plan.popular ? 'glow hover:scale-105' : 'hover:bg-primary hover:text-black hover:border-primary'
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => {
                      if (plan.paymentLink && plan.paymentLink.startsWith('http')) {
                        window.open(plan.paymentLink, '_blank');
                      } else {
                        window.location.href = '/auth';
                      }
                    }}
                    data-testid={`button-buy-${plan.testId}`}
                  >
                    {(plan.paymentLink && plan.paymentLink.startsWith('http')) ? `Choose ${plan.name}` : 'Start Free Trial'}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-12 text-white/80"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p data-testid="text-pricing-footnote">
              All plans include a 3-day free trial. Need custom limits? <a href="#" className="text-primary hover:text-primary/80 hover:underline transition-colors">Contact us</a>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-white/70" data-testid="text-copyright">
              © 2025 Audnix AI. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-white/70 hover:text-primary hover:scale-110 inline-block transition-all duration-200" data-testid="link-privacy">Privacy Policy</a>
              <a href="#" className="text-white/70 hover:text-primary hover:scale-110 inline-block transition-all duration-200" data-testid="link-contact">Contact</a>
              <a href="#" className="text-white/70 hover:text-primary hover:scale-110 inline-block transition-all duration-200" data-testid="link-terms">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
