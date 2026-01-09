import { useRef, useEffect } from "react";
import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { MoatSection } from "@/components/landing/MoatSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { LethalROICalculator } from "@/components/landing/LethalROICalculator";
import { PrivacyModal } from "@/components/landing/PrivacyModal";
import { CookieConsent } from "@/components/landing/CookieConsent";
import { motion, useScroll, useSpring } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "wouter";
import { MessageSquare, Twitter, Linkedin, Github } from "lucide-react";

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
    // GSAP Reveal Animations for all sections
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
            start: "top 90%",
            toggleActions: "play none none reverse"
          }
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white selection:bg-primary selection:text-black overflow-x-hidden font-sans">
      {/* Premium Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-purple-500 to-primary z-[200] origin-left shadow-[0_0_10px_rgba(34,211,238,0.5)]"
        style={{ scaleX }}
      />

      <Navigation />

      <main>
        {/* HERO */}
        <section id="hero" className="reveal-section">
          <HeroSection />
        </section>

        {/* PROBLEM */}
        <section id="problem" className="reveal-section">
          <ProblemSection />
        </section>

        {/* MOAT / COMPARISON */}
        <section id="moat" className="reveal-section">
          <MoatSection />
        </section>

        {/* HOW IT WORKS */}
        <section id="framework" className="reveal-section">
          <HowItWorksSection />
        </section>

        {/* ROI CALCULATOR */}
        <section id="calc" className="reveal-section">
          <LethalROICalculator />
        </section>

        {/* FEATURES */}
        <section id="features" className="reveal-section">
          <FeatureSection />
        </section>

        {/* COMPARISON TABLE */}
        <section id="comparison" className="reveal-section">
          <ComparisonSection />
        </section>

        {/* PRICING */}
        <section id="pricing" className="reveal-section">
          <PricingSection />
        </section>

        {/* FAQ */}
        <section id="faq" className="reveal-section">
          <FAQSection />
        </section>

        {/* FINAL HIGH-IMPACT CTA */}
        <section className="py-80 px-4 relative flex flex-col items-center justify-center text-center overflow-hidden bg-black">
          <div className="absolute inset-0 bg-primary/10 blur-[200px] rounded-full translate-y-1/2 scale-150 -z-10 animate-pulse" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-6xl"
          >
            <div className="inline-block px-8 py-3 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.6em] mb-16 italic">
              FINAL CALL FOR DEPLOYMENT
            </div>

            <h2 className="text-7xl md:text-[12rem] font-black tracking-[-0.06em] leading-[0.8] mb-16 uppercase italic">
              STOP GHOSTING<br />
              <span className="text-primary not-italic tracking-[-0.08em] drop-shadow-[0_0_50px_rgba(34,211,238,0.3)]">YOUR GROWTH.</span>
            </h2>

            <p className="text-white/40 text-2xl md:text-4xl font-medium mb-24 max-w-4xl mx-auto leading-relaxed italic tracking-tight">
              Join 500+ high-performance founders who have automated their revenue recovery. <span className="text-white">Raw outcomes only.</span>
            </p>

            <Link href="/auth">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="h-28 px-24 bg-white text-black text-2xl font-black rounded-[3rem] shadow-2xl transition-all hover:bg-primary hover:text-white group relative overflow-hidden uppercase tracking-widest"
              >
                <span className="relative z-10">INITIALIZE ECOSYSTEM</span>
                <div className="absolute top-0 -inset-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent rotate-12 group-hover:animate-shimmer" />
              </motion.button>
            </Link>

            <div className="mt-20 flex flex-wrap justify-center gap-12 items-center text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                500 Leads Included
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                No Credit Card Required
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                SSL 256-Bit Encrypted
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* High-Status Modern Footer */}
      <footer className="py-40 px-8 border-t border-white/5 bg-black relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-20">
          <div className="col-span-2">
            <div className="flex items-center gap-4 mb-10 group cursor-default">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:border-primary/50 transition-colors relative overflow-hidden">
                <img src="/logo.png" alt="Audnix" className="h-8 w-8 grayscale brightness-200" />
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-3xl font-black tracking-tighter uppercase italic">AUDNIX<span className="text-primary">.AI</span></span>
            </div>
            <p className="text-white/40 font-bold italic max-w-sm leading-relaxed text-xl mb-12">
              The world's first predictive intelligence engine for high-status sales.
              We don't automate conversations; we scale deterministic relationships.
            </p>
            <div className="flex gap-4">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <div key={i} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-primary hover:text-primary transition-all cursor-pointer group/social">
                  <Icon className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 mb-10 italic">Join Movement</h4>
            <ul className="space-y-6 text-sm font-black uppercase tracking-widest text-white/40 italic">
              <li><Link href="#pricing" className="hover:text-primary transition-colors">See Pricing</Link></li>
              <li><Link href="/auth" className="hover:text-primary transition-colors">Try Audnix Free</Link></li>
              <li><Link href="/auth" className="hover:text-primary transition-colors">Login Admin</Link></li>
              <li className="text-primary/60">Expert Program</li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 mb-10 italic">Product Node</h4>
            <ul className="space-y-6 text-sm font-black uppercase tracking-widest text-white/40 italic">
              <li><Link href="#features" className="hover:text-primary transition-colors">Capabilities</Link></li>
              <li><Link href="#framework" className="hover:text-primary transition-colors">Deployment</Link></li>
              <li><Link href="#calc" className="hover:text-primary transition-colors">ROI Oracle</Link></li>
              <li className="text-white/20">Roadmap 2026</li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 mb-10 italic">Governance</h4>
            <ul className="space-y-6 text-sm font-black uppercase tracking-widest text-white/40 italic">
              <li className="hover:text-white cursor-pointer" onClick={() => document.getElementById('privacy-modal')?.classList.remove('hidden')}>Privacy Hub</li>
              <li className="hover:text-white cursor-pointer">Terms Protocol</li>
              <li className="hover:text-white cursor-pointer">Data Deletion</li>
              <li className="text-emerald-500/50 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Status: Up
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-40 pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 italic">
            © 2026 AUDNIX OPERATIONS CO. REGISTERED IN DELAWARE. SYSTEM AUTHORIZED.
          </p>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.4em] text-white/10 italic">
            <span className="hover:text-white cursor-pointer transition-colors">TERMINAL ACCESS</span>
            <span className="hover:text-white cursor-pointer transition-colors">API DOCS</span>
          </div>
        </div>
      </footer>

      <PrivacyModal />
      <CookieConsent />
    </div>
  );
}
