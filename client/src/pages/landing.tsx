import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, MessageSquare, Zap, BarChart3, Flame, ArrowRight, Sparkles, Clock, Shield, Brain, Mic, Target, TrendingUp, Users, Globe, Phone, Mail, Instagram as InstagramIcon, CheckCircle2, Star, Play } from "lucide-react";
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
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-[#0d1428] via-[#0a0f1f] to-[#020409] text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div 
          className="absolute inset-0 overflow-hidden"
          style={{ opacity }}
        >
          <div className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/30 rounded-full blur-3xl ${!prefersReducedMotion ? 'animate-pulse' : ''}`} />
          <div className={`absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-3xl ${!prefersReducedMotion ? 'animate-pulse' : ''}`} style={{ animationDelay: '1s' }} />
          <div className={`absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-pink-500/20 rounded-full blur-3xl ${!prefersReducedMotion ? 'animate-pulse' : ''}`} style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/20 rounded-full blur-3xl" />
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ boxShadow: "0 0 30px rgba(0, 200, 255, 0.2)" }}
              >
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-semibold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">AI-Powered Voice & Message Automation</span>
              </motion.div>

              <motion.h1
                className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6"
                animate={prefersReducedMotion ? {} : { 
                  textShadow: [
                    "0 0 30px rgba(0, 200, 255, 0.4)",
                    "0 0 50px rgba(147, 51, 234, 0.5)",
                    "0 0 30px rgba(236, 72, 153, 0.4)"
                  ]
                }}
                transition={prefersReducedMotion ? {} : { duration: 4, repeat: Infinity }}
              >
                <span className="bg-gradient-to-r from-cyan-200 via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
                  Follow up like a human,
                </span>
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent" style={{ textShadow: "0 0 60px rgba(0, 200, 255, 0.5)" }}>close deals like a pro</span>
              </motion.h1>

              <motion.p
                className="text-xl md:text-2xl mb-8 text-white max-w-2xl leading-relaxed font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                The <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-bold">AI-powered autopilot CRM</span> that responds, nurtures, and converts warm leads with personalized voice messages and intelligent conversations across Instagram, WhatsApp & Email.
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
                    className="text-lg px-10 py-7 group bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300"
                    style={{ boxShadow: "0 0 40px rgba(0, 200, 255, 0.4)" }}
                  >
                    Start Free Trial (3 Days) ✨
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-10 py-7 bg-white/5 border-2 border-white/20 hover:bg-white/10 hover:border-cyan-400/50 text-white font-semibold transition-all duration-300"
                  onClick={scrollToFeatures}
                >
                  See How It Works
                </Button>
              </motion.div>

              <motion.div
                className="flex flex-wrap gap-4 text-sm text-white/90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>5 minute setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Cancel anytime</span>
                </div>
              </motion.div>

              <motion.div
                className="mt-12 inline-flex items-center gap-2 glass-card px-6 py-3 rounded-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <Flame className="w-5 h-5 text-primary" />
                <span className="text-white/90">
                  <motion.span 
                    className="font-bold text-primary"
                    key={userCount}
                    initial={{ scale: 1.2, color: "#00aaff" }}
                    animate={{ scale: 1, color: "#00aaff" }}
                    transition={{ duration: 0.3 }}
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

      {/* Stats Section */}
      <section className="py-20 px-4 relative border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "10x", label: "Faster Follow-ups", icon: Zap },
              { value: "85%", label: "Response Rate", icon: TrendingUp },
              { value: "3.2x", label: "More Conversions", icon: Target },
              { value: "24/7", label: "AI Availability", icon: Clock }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-white/80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Voice System Showcase */}
      <section className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-6">
              <Mic className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-semibold">Revolutionary AI Voice Technology</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Your Voice, <span className="text-primary">Multiplied by AI</span>
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Audnix clones your voice with stunning accuracy, delivering personalized voice messages to warm leads while you focus on closing deals. Each message is tailored based on lead behavior, engagement history, and AI-powered intent analysis.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {[
              {
                title: "AI Voice Cloning",
                description: "Upload 3 minutes of your voice. Audnix learns your tone, cadence, and speaking style to create authentic voice messages that sound exactly like you.",
                icon: Mic,
                features: ["Lifelike voice replication", "Emotional tone matching", "Multiple language support", "Natural pauses & inflections"]
              },
              {
                title: "Smart Context Analysis",
                description: "Our AI analyzes each lead's behavior, previous interactions, and intent signals to craft perfectly timed, contextually relevant voice messages.",
                icon: Brain,
                features: ["Intent recognition", "Behavioral triggers", "Conversation history", "Sentiment analysis"]
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="glass-card p-8 h-full border-primary/20 hover:border-primary/50 transition-all duration-300 group">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-6">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-white/80 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.features.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-white/90">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              From Lead to Sale in <span className="text-primary">4 Simple Steps</span>
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Set up once, convert forever. Audnix runs on autopilot while you sleep.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Connect Channels",
                description: "Link Instagram, WhatsApp, and Email in under 5 minutes. No technical skills needed.",
                icon: Globe
              },
              {
                step: "02",
                title: "Clone Your Voice",
                description: "Upload a 3-minute audio sample. Our AI learns your unique speaking style and tone.",
                icon: Mic
              },
              {
                step: "03",
                title: "AI Takes Over",
                description: "Audnix monitors leads 24/7, analyzes intent, and sends personalized voice messages automatically.",
                icon: Brain
              },
              {
                step: "04",
                title: "Close More Deals",
                description: "Focus on hot leads while Audnix nurtures the rest. Watch your conversion rate soar.",
                icon: TrendingUp
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="text-6xl font-bold text-primary/20">{item.step}</div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                        <item.icon className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-white/80 leading-relaxed">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden lg:block absolute top-12 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" ref={featuresRef} className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Everything you need to <span className="text-primary">dominate your market</span>
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Audnix isn't just a CRM. It's your AI-powered sales team that never sleeps, never forgets, and never misses a follow-up.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "Human-Like AI Conversations",
                description: "Natural language processing creates conversations so authentic, leads think they're talking to you. Context-aware responses adapt to each lead's unique journey.",
                gradient: "from-primary/20 to-blue-500/20"
              },
              {
                icon: Mic,
                title: "Custom Voice Cloning",
                description: "Your voice, scaled infinitely. Send personalized voice messages to hundreds of leads while maintaining your authentic tone and personality.",
                gradient: "from-emerald-500/20 to-green-500/20"
              },
              {
                icon: Brain,
                title: "Intent-Based Automation",
                description: "AI analyzes every interaction to understand lead intent. Automatically prioritize hot leads, re-engage cold ones, and nurture those in-between.",
                gradient: "from-purple-500/20 to-pink-500/20"
              },
              {
                icon: Target,
                title: "Smart Lead Scoring",
                description: "Machine learning ranks leads by conversion probability. Focus your energy where it matters most while AI handles the rest.",
                gradient: "from-orange-500/20 to-red-500/20"
              },
              {
                icon: BarChart3,
                title: "Real-Time Analytics",
                description: "Live dashboards show engagement rates, response times, conversion funnels, and AI performance metrics. Make data-driven decisions instantly.",
                gradient: "from-cyan-500/20 to-blue-500/20"
              },
              {
                icon: Zap,
                title: "Multi-Channel Sync",
                description: "Instagram DMs, WhatsApp messages, and emails - all unified in one intelligent inbox. Never lose a conversation thread again.",
                gradient: "from-yellow-500/20 to-orange-500/20"
              },
              {
                icon: Users,
                title: "Automated Segmentation",
                description: "AI automatically tags and segments leads based on behavior, interests, and engagement level. Perfect targeting, zero manual work.",
                gradient: "from-pink-500/20 to-purple-500/20"
              },
              {
                icon: Clock,
                title: "Follow-Up Sequences",
                description: "Set it and forget it. AI triggers perfectly-timed follow-ups based on lead behavior, ensuring no opportunity slips through the cracks.",
                gradient: "from-green-500/20 to-emerald-500/20"
              },
              {
                icon: Shield,
                title: "Enterprise-Grade Security",
                description: "End-to-end encryption, GDPR compliant, SOC 2 certified. Your data and your leads' privacy are our top priority.",
                gradient: "from-blue-500/20 to-cyan-500/20"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 3) * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
              >
                <Card className="glass-card p-6 h-full border-white/10 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <feature.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg font-semibold mb-3 group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed group-hover:text-white/95 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Built for <span className="text-primary">High-Performance Teams</span>
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              From solo creators to enterprise sales teams, Audnix scales with your ambition
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Content Creators & Influencers",
                description: "Convert followers into customers. Audnix nurtures your audience with personalized voice messages, turning engagement into revenue.",
                benefits: ["Monetize DMs automatically", "Scale personal touch", "Never miss a collaboration opportunity"]
              },
              {
                title: "Course Creators & Coaches",
                description: "Pre-qualify leads and book sales calls on autopilot. AI handles objections, answers FAQs, and warms up prospects before they talk to you.",
                benefits: ["Automated lead qualification", "24/7 calendar booking", "Higher show-up rates"]
              },
              {
                title: "E-commerce & D2C Brands",
                description: "Recover abandoned carts, upsell existing customers, and turn browsers into buyers with timely, personalized voice outreach.",
                benefits: ["Cart recovery automation", "Post-purchase follow-ups", "Customer retention campaigns"]
              }
            ].map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <Card className="glass-card p-8 h-full border-white/10 hover:border-primary/50 transition-all duration-300">
                  <h3 className="text-2xl font-bold mb-4 text-primary">{useCase.title}</h3>
                  <p className="text-white/90 mb-6 leading-relaxed">{useCase.description}</p>
                  <ul className="space-y-3">
                    {useCase.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="text-white/80">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section ref={comparisonRef} className="py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Not your average CRM
            </h2>
            <p className="text-xl text-white/90">
              See why thousands are switching to Audnix from legacy platforms
            </p>
          </motion.div>

          <Card className="glass-card overflow-hidden border-primary/20">
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
                    { feature: "AI Voice Messages", audnix: true, manychat: false, hubspot: false },
                    { feature: "Voice Cloning Technology", audnix: true, manychat: false, hubspot: false },
                    { feature: "Intent-Based Automation", audnix: true, manychat: "partial", hubspot: "manual" },
                    { feature: "Real-time AI Insights", audnix: true, manychat: false, hubspot: true },
                    { feature: "Multi-Channel Inbox (Instagram, WhatsApp, Email)", audnix: true, manychat: "Instagram only", hubspot: "Email only" },
                    { feature: "Smart Lead Scoring", audnix: true, manychat: false, hubspot: true },
                    { feature: "5-minute setup", audnix: true, manychat: false, hubspot: false },
                    { feature: "Behavioral Segmentation", audnix: true, manychat: "Basic", hubspot: true },
                    { feature: "Custom AI Training", audnix: true, manychat: false, hubspot: false },
                    { feature: "Starting Price", audnix: "$49/mo", manychat: "$15/mo", hubspot: "$800/mo" }
                  ].map((row, index) => (
                    <motion.tr 
                      key={index} 
                      className="border-b border-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 group"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="p-6 font-medium text-white/90 group-hover:text-white transition-colors">{row.feature}</td>
                      <td className="text-center p-6">
                        {row.audnix === true ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/30 group-hover:bg-primary/50 group-hover:scale-110 transition-all duration-200">
                            <Check className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                          </div>
                        ) : (
                          <span className="text-white/90 font-semibold">{row.audnix}</span>
                        )}
                      </td>
                      <td className="text-center p-6 text-white/70">
                        {row.manychat === true && <Check className="w-6 h-6 text-emerald-400 mx-auto" />}
                        {row.manychat === false && <X className="w-6 h-6 text-red-400/70 mx-auto" />}
                        {typeof row.manychat === 'string' && row.manychat !== 'true' && row.manychat !== 'false' && <span className="text-sm">{row.manychat}</span>}
                      </td>
                      <td className="text-center p-6 text-white/70">
                        {row.hubspot === true && <Check className="w-6 h-6 text-emerald-400 mx-auto" />}
                        {row.hubspot === false && <X className="w-6 h-6 text-red-400/70 mx-auto" />}
                        {typeof row.hubspot === 'string' && row.hubspot !== 'true' && row.hubspot !== 'false' && <span className="text-sm">{row.hubspot}</span>}
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
              <Button size="lg" className="glow text-lg px-12 py-6 group">
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
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Simple plans. <span className="text-primary">Serious results</span>
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Start with a 3-day free trial. No credit card required. Scale as you grow.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: 49,
                description: 'Perfect for creators just getting started',
                features: [
                  '100 warm leads per month',
                  '30 AI voice minutes',
                  'Instagram & WhatsApp integration',
                  'Basic AI conversation engine',
                  'Smart lead tagging',
                  'Email support',
                  'Real-time analytics dashboard',
                ],
                paymentLink: import.meta.env.VITE_STRIPE_LINK_STARTER,
                testId: 'starter',
              },
              {
                name: 'Pro',
                price: 149,
                description: 'For growing creators who need more power',
                features: [
                  '500 warm leads per month',
                  '150 AI voice minutes',
                  'All channel integrations (Instagram, WhatsApp, Email)',
                  'Advanced AI with intent recognition',
                  'Custom voice cloning',
                  'Automated segmentation',
                  'Priority support',
                  'Custom AI training',
                  'Weekly performance reports',
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
                  'Unlimited leads & contacts',
                  'Unlimited voice minutes',
                  'All integrations + Custom API access',
                  'Advanced AI with custom models',
                  'Multiple voice clones',
                  'Team collaboration tools',
                  'Dedicated success manager',
                  'White-label options',
                  '99.9% SLA guarantee',
                  'Custom integrations',
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
                >
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {plan.name}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <span className="text-5xl font-bold text-primary">${plan.price}</span>
                    <span className="text-white/60">/month</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-white/90 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/auth">
                    <Button 
                      className={`w-full group ${plan.popular ? 'glow' : 'glass'}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      Start Free Trial
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-12 text-white/70"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="mb-2">All plans include 3-day free trial • Cancel anytime • No credit card required</p>
            <p className="text-sm">Need more leads? Add top-up packages starting at $29 for 1,000 additional leads</p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12 md:p-16 rounded-3xl border-primary/30 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to <span className="text-primary">10x your conversions</span>?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                Join thousands of creators who are closing more deals with less effort. Your AI sales team is ready to start working for you today.
              </p>
              <Link href="/auth">
                <Button size="lg" className="glow text-xl px-12 py-8 group">
                  Start Your Free 3-Day Trial
                  <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <p className="mt-6 text-white/70 text-sm">
                ✨ Setup takes 5 minutes • 🔒 No credit card required • 🚀 Start converting today
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-white/70 text-sm">
              © 2025 Audnix AI. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-white/70 text-sm">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
