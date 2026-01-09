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
import { ROICalculator } from "@/components/landing/ROICalculator";
import { Logo } from "@/components/ui/Logo";
import { Twitter, Linkedin, Github } from "lucide-react";
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
    // GSAP Reveal Animations for all sections
    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray('.reveal-section');
      sections.forEach((section: any) => {
        gsap.from(section, {
          y: 40,
          opacity: 0,
          duration: 1,
          ease: "power2.out",
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
    <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-primary z-[200] origin-left"
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
        <section id="how-it-works" className="reveal-section">
          <HowItWorksSection />
        </section>

        {/* ROI CALCULATOR */}
        <section id="calc" className="reveal-section">
          <ROICalculator />
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

        {/* FINAL CTA */}
        <section className="py-32 md:py-48 px-4 relative flex flex-col items-center justify-center text-center overflow-hidden border-t">
          <div className="absolute inset-0 bg-primary/5 blur-[150px] rounded-full translate-y-1/2 -z-10" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-10">
              Ready to scale?
            </div>

            <h2 className="text-5xl md:text-8xl font-bold tracking-tight mb-8">
              Start closing more <br />
              <span className="text-primary">deals today.</span>
            </h2>

            <p className="text-muted-foreground text-lg md:text-xl font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              Join hundreds of high-growth companies using Audnix to automate their sales outreach and recovery.
            </p>

            <Link href="/auth">
              <Button
                size="lg"
                className="h-16 px-12 rounded-full font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 transition-all duration-300"
              >
                Start Scalable Growth
              </Button>
            </Link>

            <div className="mt-12 flex flex-wrap justify-center gap-8 items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Free 500 leads included
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Cancel anytime
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="py-24 px-8 border-t border-border/50 bg-muted/5 selection:bg-primary/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-16 md:gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <Logo />
            </div>
            <p className="text-muted-foreground font-medium max-w-xs leading-relaxed text-base mb-8">
              Architecting the next generation of sales engagement.
              Autonomous intelligence designed for high-growth operations.
            </p>
            <div className="flex gap-4">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <Link key={i} href="#" className="w-10 h-10 rounded-xl bg-muted border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:border-primary/50 transition-colors text-muted-foreground hover:text-primary">
                  <Icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-6">Product</h4>
            <ul className="space-y-4 text-sm font-medium text-muted-foreground">
              <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="#calc" className="hover:text-primary transition-colors">ROI Calculator</Link></li>
              <li><Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-6">Company</h4>
            <ul className="space-y-4 text-sm font-medium text-muted-foreground">
              <li><Link href="/auth" className="hover:text-primary transition-colors">Login</Link></li>
              <li><Link href="/auth" className="hover:text-primary transition-colors">Get Started</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-6">Legal</h4>
            <ul className="space-y-4 text-sm font-medium text-muted-foreground">
              <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/data-deletion" className="hover:text-primary transition-colors">Data Deletion</Link></li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                System Status
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] font-medium text-muted-foreground/60">
            © 2026 Audnix Operations Co. All rights reserved.
          </p>
          <div className="flex gap-8 text-[11px] font-medium text-muted-foreground/60">
            <Link href="#" className="hover:text-foreground transition-colors">Status</Link>
            <Link href="#" className="hover:text-foreground transition-colors">API</Link>
          </div>
        </div>
      </footer>

      <PrivacyModal />
      <CookieConsent />
    </div>
  );
}
