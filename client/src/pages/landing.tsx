import { useRef, useEffect } from "react";
import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { MoatSection } from "@/components/landing/MoatSection";
import { PrivacyModal } from "@/components/landing/PrivacyModal";
import { motion, useScroll, useSpring } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
    // GSAP Reveal Animations
    const ctx = gsap.context(() => {
      gsap.from(".reveal", {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out",
        stagger: 0.2,
        scrollTrigger: {
          trigger: ".reveal",
          start: "top 80%",
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#020409] text-white selection:bg-primary selection:text-black overflow-x-hidden">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-[60] origin-left"
        style={{ scaleX }}
      />

      <Navigation />

      <main>
        <HeroSection />

        <div className="reveal">
          <MoatSection />
        </div>

        <div className="reveal">
          <FeatureSection />
        </div>

        <div className="reveal">
          <PricingSection />
        </div>

        {/* Final High-Impact CTA */}
        <section className="py-40 px-4 relative flex flex-col items-center justify-center text-center overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full translate-y-1/2 scale-150 -z-10" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl"
          >
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-12">
              READY TO<br />
              <span className="text-primary tracking-[-0.1em] italic">OUTPERFORM?</span>
            </h2>

            <Link href="/auth">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="h-20 px-16 bg-white text-black text-2xl font-black rounded-full shadow-2xl shadow-primary/20 transition-all hover:bg-primary hover:text-white"
              >
                DEPLOY YOUR CLOSER
              </motion.button>
            </Link>

            <p className="mt-8 text-white/30 font-bold uppercase tracking-widest text-xs">
              No long-term contracts • Deploy in 10 minutes • 500 leads free
            </p>
          </motion.div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="py-20 px-8 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="Audnix" className="h-8 w-8 grayscale brightness-200" />
              <span className="text-2xl font-black tracking-tighter">AUDNIX<span className="text-primary">.AI</span></span>
            </div>
            <p className="text-white/40 font-medium max-w-sm leading-relaxed">
              The world's first predictive intelligence engine for DMs and Email.
              We don't automate conversations; we scale relationships.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white/20 mb-6">Security</h4>
            <ul className="space-y-4 text-sm font-bold text-white/60">
              <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Hub</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/data-deletion" className="hover:text-primary transition-colors">GDPR/Compliance</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white/20 mb-6">Support</h4>
            <ul className="space-y-4 text-sm font-bold text-white/60">
              <li className="hover:text-primary cursor-pointer">Live Operations</li>
              <li>support@audnixai.com</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20">
            © 2026 AUDNIX OPERATIONS CO. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6">
            {['𝕏', 'LinkedIn', 'Instagram'].map(social => (
              <span key={social} className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white cursor-pointer transition-colors">
                {social}
              </span>
            ))}
          </div>
        </div>
      </footer>

      <PrivacyModal />
    </div>
  );
}
