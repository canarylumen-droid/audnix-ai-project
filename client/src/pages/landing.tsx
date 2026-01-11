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
import { Twitter, Linkedin, Github, ShieldCheck, Zap, ArrowRight, Instagram } from "lucide-react";
import { useScroll, useSpring, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PrivacyModal } from "@/components/landing/PrivacyModal";
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
    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray('.reveal-section');
      sections.forEach((section: any) => {
        gsap.from(section, {
          y: 60,
          opacity: 0,
          duration: 1.2,
          ease: "expo.out",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
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
        <section className="py-60 px-4 relative flex flex-col items-center justify-center text-center overflow-hidden border-t border-white/5">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-primary/5 blur-[120px] rounded-full -z-10" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl"
          >
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-12 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
              Initialization Complete
            </div>

            <h2 className="text-6xl md:text-[9rem] font-black tracking-tighter mb-10 leading-[0.85] uppercase">
              Start your <br />
              <span className="text-primary">Final Evolution.</span>
            </h2>

            <p className="text-white/40 text-xl md:text-2xl font-bold mb-16 max-w-3xl mx-auto leading-tight">
              Legacy CRMs track history. Audnix architects the future. Join the elite top 1% of sales operations today.
            </p>

            <Link href="/auth">
              <Button
                size="lg"
                className="h-20 px-16 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm bg-primary text-black hover:bg-primary/90 shadow-[0_30px_60px_rgba(var(--primary),0.25)] hover:scale-105 transition-all duration-500"
              >
                Access Protocol Now <ArrowRight className="ml-2 w-5 h-5" />
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
        </section>
      </main>

      <footer className="py-40 px-8 border-t border-white/5 bg-black relative overflow-hidden">
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
              {[Twitter, Linkedin, Github, Instagram].map((Icon, i) => (
                <Link key={i} href="#" className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/10 hover:border-primary/50 transition-all duration-500 text-white group">
                  <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </Link>
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
              <li><Link href="#features" className="hover:text-primary transition-colors">Neural Core</Link></li>
              <li><Link href="#how-it-works" className="hover:text-primary transition-colors">Automation Flow</Link></li>
              <li><Link href="#pricing" className="hover:text-primary transition-colors">Cloud Pricing</Link></li>
              <li><Link href="/auth" className="hover:text-primary transition-colors">Access Console</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white mb-10">Security</h4>
            <ul className="space-y-6 text-sm font-bold text-white/40 uppercase tracking-tighter">
              <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Protocol</Link></li>
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
            <Link href="#" className="hover:text-white transition-colors">API Documentation</Link>
          </div>
        </div>
      </footer>

      <PrivacyModal />
      <CookieConsent />
    </div>
  );
}
