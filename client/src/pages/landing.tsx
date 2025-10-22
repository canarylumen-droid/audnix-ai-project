import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, MessageSquare, Zap, BarChart3, Flame } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export default function Landing() {
  const [userCount, setUserCount] = useState(247);
  const { toast } = useToast();
  const demoMode = import.meta.env.NEXT_PUBLIC_DEMO === "true";
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const demoNames = useRef(['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Skyler', 'Cameron']);

  // Fetch initial user count from API (only if not in demo mode)
  const { data: countData } = useQuery({
    queryKey: ["/api/users/count"],
    enabled: !demoMode && isSupabaseConfigured(),
  });

  useEffect(() => {
    if (countData?.count) {
      setUserCount(countData.count);
    }
  }, [countData]);

  // Set up Supabase Realtime subscription or Demo mode
  useEffect(() => {
    // Demo mode: simulate user joins with variable intervals
    if (demoMode) {
      const scheduleDemoJoin = () => {
        const randomDelay = Math.random() * 60000 + 30000; // 30-90 seconds
        demoIntervalRef.current = setTimeout(() => {
          setUserCount(prev => {
            const newCount = prev + 1;
            const name = demoNames.current[Math.floor(Math.random() * demoNames.current.length)];
            toast({
              title: "New user joined!",
              description: `${name} just started their free trial`,
              duration: 3000,
            });
            return newCount;
          });
          scheduleDemoJoin(); // Schedule next join
        }, randomDelay);
      };
      
      scheduleDemoJoin();
      
      return () => {
        if (demoIntervalRef.current) {
          clearTimeout(demoIntervalRef.current);
        }
      };
    }

    // Real-time mode: only if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      return;
    }

    // Real-time subscription to users table
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
          
          // Show toast notification for new signups
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
      supabase.removeChannel(channel);
    };
  }, [demoMode, toast]);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f1f] to-[#020409] text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6 glow-text"
              animate={{ 
                textShadow: [
                  "0 0 20px rgba(0, 170, 255, 0.3)",
                  "0 0 40px rgba(0, 170, 255, 0.5)",
                  "0 0 20px rgba(0, 170, 255, 0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              data-testid="heading-hero"
            >
              Follow up like a human,
              <br />
              close deals like a pro
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl mb-8 text-white/85 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              data-testid="text-hero-subtext"
            >
              The autopilot CRM that responds, nurtures, and converts leads
              humanly across Instagram, WhatsApp & Email.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="glow text-lg px-8 py-6"
                  data-testid="button-start-trial"
                >
                  Start Free Trial (3 Days)
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

            {/* Social Proof Counter */}
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
                </motion.span> people have joined Audnix this week
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            data-testid="heading-features"
          >
            Why Audnix?
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: "Human-Like Conversations",
                description: "Real-time AI follow-ups that sound natural, not robotic.",
                testId: "feature-conversations"
              },
              {
                icon: Zap,
                title: "Zero Setup",
                description: "Just connect your socials; Audnix handles everything automatically.",
                testId: "feature-setup"
              },
              {
                icon: BarChart3,
                title: "Smart Insights",
                description: "Get weekly AI reports showing engagement and conversion trends.",
                testId: "feature-insights"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="glass-card p-8 h-full hover:border-primary/30 transition-all" data-testid={`card-${feature.testId}`}>
                  <feature.icon className="w-12 h-12 text-primary mb-4" data-testid={`icon-${feature.testId}`} />
                  <h3 className="text-2xl font-semibold mb-3" data-testid={`heading-${feature.testId}`}>{feature.title}</h3>
                  <p className="text-white/70" data-testid={`text-${feature.testId}`}>{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            data-testid="heading-comparison"
          >
            How We Compare
          </motion.h2>

          <Card className="glass-card overflow-hidden" data-testid="card-comparison-table">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-6 text-lg font-semibold">Feature</th>
                    <th className="text-center p-6 text-lg font-semibold text-primary">Audnix</th>
                    <th className="text-center p-6 text-lg font-semibold text-white/60">ManyChat</th>
                    <th className="text-center p-6 text-lg font-semibold text-white/60">HubSpot</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Human-like replies", audnix: true, manychat: false, hubspot: false },
                    { feature: "Auto nurture & tagging", audnix: true, manychat: "partial", hubspot: "manual" },
                    { feature: "Real-time insights", audnix: true, manychat: false, hubspot: true },
                    { feature: "Zero setup", audnix: true, manychat: false, hubspot: false }
                  ].map((row, index) => (
                    <tr key={index} className="border-b border-white/5">
                      <td className="p-6" data-testid={`text-feature-${index}`}>{row.feature}</td>
                      <td className="text-center p-6">
                        {row.audnix === true && <Check className="w-6 h-6 text-emerald-500 mx-auto" data-testid={`icon-check-audnix-${index}`} />}
                      </td>
                      <td className="text-center p-6">
                        {row.manychat === true && <Check className="w-6 h-6 text-emerald-500 mx-auto" data-testid={`icon-check-manychat-${index}`} />}
                        {row.manychat === false && <X className="w-6 h-6 text-red-500 mx-auto" data-testid={`icon-x-manychat-${index}`} />}
                        {row.manychat === "partial" && <span className="text-yellow-500" data-testid={`text-partial-manychat-${index}`}>Partial</span>}
                      </td>
                      <td className="text-center p-6">
                        {row.hubspot === true && <Check className="w-6 h-6 text-emerald-500 mx-auto" data-testid={`icon-check-hubspot-${index}`} />}
                        {row.hubspot === false && <X className="w-6 h-6 text-red-500 mx-auto" data-testid={`icon-x-hubspot-${index}`} />}
                        {row.hubspot === "manual" && <span className="text-yellow-500" data-testid={`text-manual-hubspot-${index}`}>Manual</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-white/60" data-testid="text-copyright">
              © 2025 Audnix AI. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-white/60 hover:text-white transition-colors" data-testid="link-privacy">Privacy Policy</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors" data-testid="link-contact">Contact</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors" data-testid="link-terms">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
