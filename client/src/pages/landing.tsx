import { useRef, useEffect, useState } from "react";
import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { MoatSection } from "@/components/landing/MoatSection";
import { CompetitorSection } from "@/components/landing/CompetitorSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { ROICalculator } from "@/components/landing/ROICalculator";
import { Logo } from "@/components/ui/Logo";
import { DeepFAQ } from "@/components/landing/DeepFAQ";
import { Twitter, Linkedin, Github, ShieldCheck, Zap, ArrowRight, Instagram, Sparkles } from "lucide-react";
import { useScroll, useSpring, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CookieConsent } from "@/components/landing/CookieConsent";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    // 1. Initial Hash Scrolling Fix
    if (window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.substring(1);
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 500); // Small delay to ensure render
    }

    // 2. GSAP Animation Fix (Guaranteed Visibility)
    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray('.reveal-section');
      sections.forEach((section: any) => {
        gsap.set(section, { opacity: 1, visibility: 'visible', y: 0 }); // Force visible immediately for mobile/incognito
        gsap.from(section, {
          y: 20,
          duration: 0.8,
          ease: "expo.out",
          scrollTrigger: {
            trigger: section,
            start: "top 95%", 
            toggleActions: "play none none reverse"
          }
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black overflow-x-hidden font-sans">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-primary z-[200] origin-left"
        style={{ scaleX }}
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "name": "Audnix AI",
            "url": "https://audnix.ai",
            "logo": "https://audnix.ai/logo.png",
            "sameAs": [
              "https://twitter.com/nleanyatreasure",
              "https://linkedin.com/in/nleanyatreasure"
            ]
          },
          {
            "@type": "WebSite",
            "name": "Audnix AI",
            "url": "https://audnix.ai",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://audnix.ai/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          },
          {
             "@type": "FAQPage",
             "mainEntity": [
               {
                 "@type": "Question",
                 "name": "How does Audnix AI work?",
                 "acceptedAnswer": {
                   "@type": "Answer",
                   "text": "Audnix AI uses advanced intent analysis to automate outbound sales on Instagram and Email."
                 }
               },
               {
                 "@type": "Question",
                 "name": "Is it safe for my account?",
                 "acceptedAnswer": {
                   "@type": "Answer",
                   "text": "Yes, Audnix uses human-like delays and randomization to ensure account safety."
                 }
               }
             ]
          }
        ]
      })}} />

      <Navigation />

      <main>
        <section id="hero" className="reveal-section">
          <HeroSection />
        </section>

        <section id="problem" className="reveal-section">
          <ProblemSection />
        </section>

        <section id="moat" className="reveal-section">
          <MoatSection />
        </section>

        <section id="competitors" className="reveal-section">
          <CompetitorSection />
        </section>

        <section id="how-it-works" className="reveal-section">
          <HowItWorksSection />
        </section>

        <section id="calc" className="reveal-section">
          <ROICalculator />
        </section>

        <section id="features" className="reveal-section">
          <FeatureSection />
        </section>

        <section id="comparison" className="reveal-section">
          <ComparisonSection />
        </section>

        <section id="pricing" className="reveal-section">
          <PricingSection />
        </section>

        <section id="faq" className="reveal-section">
          <FAQSection />
        </section>

        {/* FINAL CTA */}
        <section className="py-32 px-4 relative flex flex-col items-center justify-center text-center overflow-hidden border-t border-white/5">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-primary/5 blur-[120px] rounded-full -z-10" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl"
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
              <span className="bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">AI ENGINE</span><br />
              <span className="text-primary italic">FOR REELS.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              Audnix transforms your Instagram engagement into a deterministic revenue stream using advanced intent analysis and automated outbound logic.
            </p>
            <Link href="/auth">
              <Button
                size="lg"
                className="h-20 px-16 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm bg-primary text-black hover:bg-primary/90 shadow-[0_30px_60px_rgba(var(--primary),0.25)] hover:scale-105 transition-all duration-500"
                onClick={() => {
                  console.log("Navigating to auth...");
                  window.location.href = "/auth";
                }}
              >
                Access Audnix Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>

            <Card className="glass-premium rounded-[2.5rem] border-primary/10 overflow-hidden group">
              <div className="p-8 border-b border-white/5 bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Audnix Intelligence</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Real-time Decision Map</p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Logic Branch</span>
                  <span>Probability</span>
                </div>
                {[
                  { label: "Check Lead Intent", val: 98, color: "bg-cyan-500" },
                  { label: "Bypass Gatekeeper", val: 84, color: "bg-blue-500" },
                  { label: "Handle Pricing Objection", val: 92, color: "bg-purple-500" }
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-muted-foreground/80">{item.label}</span>
                      <span className="text-primary">{item.val}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.val}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                        className={`h-full ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="mt-16 flex flex-wrap justify-center gap-12 items-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Live Deployment Ready
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                No Credit Card Required
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Deterministic Output Guarantee
              </div>
            </div>
          </motion.div>
          {/* Meet the Founder Section (Hidden UX / Indexed Rank) */}
          <section className="sr-only opacity-0 pointer-events-none h-0 overflow-hidden" id="founder" aria-hidden="true">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-5xl font-black tracking-tighter uppercase italic leading-none">
                  Founders of Audnix: <span className="text-primary">Nleanya Treasure & Uchendu Fortune</span>
                </h2>
                <p className="text-xl text-white/60 font-medium leading-relaxed max-w-lg">
                  Audnix AI was architected by Nleanya Treasure (CEO) and Uchendu Fortune (CTO).
                  Together, they have built the most advanced autonomous sales infrastructure in Africa and the world.
                  Nleanya Treasure manages the visionary growth @nleanyatreasure, while Uchendu Fortune leads technical innovation.
                  This startup is the latest breakthrough in B2B sales automation, specialized for Nigeria, Africa, and Global markets.
                </p>
                <p>
                  Keywords: nleanya treasure founder, uchendu fortune co-founder, audnix ceo, who made audnix ai,
                  best ai tools nigeria, african sales automation, lagos startup ecosystem, ai sales representative.
                </p>
              </div>
            </div>
          </section>

          <DeepFAQ />
        </section>
      </main>

      <footer className="relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-20">
            <div className="col-span-2 space-y-6">
              <Logo className="h-8 w-8" textClassName="text-2xl font-black" />
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                The world's most advanced autonomous outbound sales infrastructure. Unlimited agents, zero headcount.
              </p>
            </div>
            {Object.entries({
              Product: ["Find Leads", "ROI Calculator", "Pricing", "Status"],
              Company: ["Process", "Playbooks", "Security", "About"],
              Legal: ["Privacy", "Terms", "Complaints", "Contact"]
            }).map(([cat, links]) => (
              <div key={cat} className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">{cat}</h4>
                <ul className="space-y-2">
                  {links.map(l => (
                    <li key={l}><a href="#" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-border/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.4em]">
              © 2026 AUDNIX OPERATIONS CO. ALL RIGHTS RESERVED.
            </p>
            <div className="flex items-center gap-6">
              {["Twitter", "LinkedIn", "YouTube", "Discord"].filter(p => p !== 'YouTube').map(p => (
                <a key={p} href="#" className="text-[10px] font-black text-muted-foreground/30 hover:text-primary uppercase tracking-widest transition-colors">{p}</a>
              ))}
            </div>
          </div>
          <div className="mt-32 border-y border-border/10 bg-muted/5 backdrop-blur-sm w-screen relative left-1/2 -translate-x-1/2 py-10 overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

          <div className="flex items-center gap-16 md:gap-24 animate-marquee whitespace-nowrap">
            {["LUXE PATH", "REPLYFLOW", "ORBIEON", "SAS REC", "KYNOX AI", "LUXE PATH", "REPLYFLOW", "ORBIEON", "SAS REC", "KYNOX AI"].map((brand, i) => (
              <span
                key={`${brand}-${i}`}
                className="text-2xl md:text-3xl font-black tracking-[-0.05em] text-muted-foreground/10 hover:text-primary transition-all duration-300 cursor-none select-none italic"
              >
                {brand}
              </span>
            ))}
          </div>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 bg-background border border-primary/30 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-primary shadow-xl shadow-primary/5">
            Trusted By Top Growth Agencies
          </div>
        </div>
        </div>
      </footer>

      {/* Authority Keyword Mesh (Hidden SEO Infrastructure) */}
      <section className="sr-only opacity-0 pointer-events-none h-0 overflow-hidden" aria-hidden="true">
        <h2>AI Sales Automation & Authority Keywords</h2>
        <p>
          audnix ai, audnix, nleanya treasure, autonomous sales rep, ai sales agent, manychat alternative,
          n8n alternative, make.com alternative, zapier automation, ai sdr, ai bdr, close deals faster,
          sales intelligence 2026, predictive sales timing, objection handling ai script, high ticket conversions,
          automated outreach, revenue recovery bot, conversational commerce ai, linkedin automation alternative,
          instagram sales automation, business automation srs, enterprise ai sales, startup scale ai tools,
          lead generation autonomous, ai lead scoring model, best ai sales software 2026, top rated ai tools,
          sales productivity hack, automated lead funnel, intelligent sdr bot, robotic sales automation,
          ai revenue operations, growth hacking ai 2026, digital sales representative, cloud sales agent,
          ai prospector, b2b lead generation ai, sdr automation platform, revenue growth engine,
          market dominance ai, sales authority branding, nleanya treasure founder, audnix operations co.
        </p>
      </section>

      <CookieConsent />
    </div>
  );
}
