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
import { Twitter, Linkedin, Github, ShieldCheck, Zap, ArrowRight, Instagram } from "lucide-react";
import { useScroll, useSpring, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CookieConsent } from "@/components/landing/CookieConsent";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

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
        gsap.from(section, {
          y: 40,
          // REMOVED opacity: 0 to ensure content is always visible even if ScrollTrigger fails
          duration: 1.0,
          ease: "expo.out",
          scrollTrigger: {
            trigger: section,
            start: "top 90%", // Trigger drastically earlier
            toggleActions: "play none none reverse"
          }
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white selection:bg-primary selection:text-black overflow-x-hidden font-sans">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-primary z-[200] origin-left"
        style={{ scaleX }}
      />

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

            <div className="mt-16 flex flex-wrap justify-center gap-12 items-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
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
          {/* Meet the Founder Section */}
          <section className="py-24 px-8 border-t border-white/5 bg-black/50" id="founder">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Founder & CEO</span>
                </div>
                <h2 className="text-5xl font-black tracking-tighter uppercase italic leading-none">
                  Nleanya <br />
                  <span className="text-primary">Treasure</span>
                </h2>
                <p className="text-xl text-white/60 font-medium leading-relaxed max-w-lg">
                  Building the infrastructure for autonomous commerce. Nleanya Treasure founded Audnix AI with a singular vision:
                  to replace inefficient, manual sales processes with intelligent agents that work harder, faster, and smarter
                  than any human SDR.
                </p>
                <div className="flex gap-4">
                  <a
                    href="https://twitter.com/nleanyatreasure"
                    target="_blank"
                    className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold uppercase text-xs"
                  >
                    Follow Founder
                  </a>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-cyan-500/50 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative aspect-square rounded-[2rem] overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center p-12">
                  <Logo className="w-32 h-32" />
                  <div className="absolute bottom-8 left-8 right-8 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Built with 100% Autonomous DNA</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <DeepFAQ />
      </main>

      <footer className="py-24 px-8 border-t border-white/5 bg-black relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-20">
          <div className="lg:col-span-2 space-y-10">
            <Link href="/">
              <Logo />
            </Link>
            <p className="text-white/40 font-bold max-w-sm leading-relaxed text-xl tracking-tight">
              Architecting the next generation of sales intelligence.
              Autonomous agents designed for high-growth operations.
            </p>
            <div className="flex gap-6">
              {[
                { Icon: Twitter, href: "https://twitter.com/nleanyatreasure", label: "Twitter" },
                { Icon: Linkedin, href: "https://linkedin.com/in/nleanyatreasure", label: "LinkedIn" },
                { Icon: Github, href: "https://github.com/audnixai", label: "Github" },
                { Icon: Instagram, href: "https://instagram.com/nleanyatreasure", label: "Instagram" }
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/10 hover:border-primary/50 transition-all duration-500 text-white group"
                  title={`${social.label} - @nleanyatreasure`}
                >
                  <social.Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white mb-10">Solutions</h4>
            <ul className="space-y-6 text-sm font-bold text-white/40 uppercase tracking-tighter">
              <li><Link href="/solutions/agencies" className="hover:text-primary transition-colors">Agencies</Link></li>
              <li><Link href="/solutions/sales-teams" className="hover:text-primary transition-colors">Founders & Closers</Link></li>
              <li><Link href="/solutions/creators" className="hover:text-primary transition-colors">Personal Brands</Link></li>
              <li><Link href="/#calc" className="hover:text-primary transition-colors">ROI Modeling</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white mb-10">Intelligence</h4>
            <ul className="space-y-6 text-sm font-bold text-white/40 uppercase tracking-tighter">
              <li><Link href="/find-leads" className="hover:text-primary transition-colors">Intelligence Core (Find Leads)</Link></li>
              <li><Link href="/resources/niche-vault" className="hover:text-primary transition-colors">Niche Vault (20+)</Link></li>
              <li><Link href="/resources/outreach-playbooks" className="hover:text-primary transition-colors">Outreach Playbooks</Link></li>
              <li><Link href="/#pricing" className="hover:text-primary transition-colors">Cloud Pricing</Link></li>
              <li><Link href="/auth" className="hover:text-primary transition-colors">Access Console</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white mb-10">Security</h4>
            <ul className="space-y-6 text-sm font-bold text-white/40 uppercase tracking-tighter">
              <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Growth</Link></li>
              <li><Link href="/data-deletion" className="hover:text-primary transition-colors">Data Erasure</Link></li>
              <li className="flex items-center gap-3 text-emerald-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                All Systems Normal
              </li>
              <li className="text-[10px] text-white/10 font-mono">v2.4.0-stable</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-40 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/10">
            © 2026 AUDNIX OPERATIONS CO. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-white/10">
            <Link href="#" className="hover:text-white transition-colors">Global Status</Link>
            <Link href="/resources/api-docs" className="hover:text-white transition-colors">API Documentation</Link>
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
