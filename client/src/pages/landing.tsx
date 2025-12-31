import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, TrendingUp, Zap, Brain, BarChart3, Sparkles, Lock, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { PrivacyModal } from "@/components/landing/PrivacyModal";
import { ProcessTimeline } from "@/components/landing/ProcessTimeline";
import { LethalROICalculator } from "@/components/landing/LethalROICalculator";
import { AnimatedCard } from "@/components/ui/animated-card";
import { motion } from "framer-motion";

export default function Landing() {
  const handleGetStarted = () => {
    console.log("Get started clicked");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d1428] via-[#0a0f1f] to-[#020409] text-white">
      <Navigation />

      {/* HERO SECTION */}
      <HeroSection />

      {/* PROBLEM: Why Leads Go Cold */}
      <section className="py-20 px-4 border-y border-white/10 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why You're Losing Money
            </h2>
            <p className="text-2xl text-white/80 max-w-3xl mx-auto">
              Leads don't die because they don't want what you sell —<br />
              they die because <span className="text-red-400 font-bold">you're slow</span>.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto px-4 sm:px-0">
            <AnimatedCard
              className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30"
              glowColor="rgba(239, 68, 68, 0.2)"
            >
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-400">Manual Follow-Up</h3>
                </div>
                <ul className="space-y-3">
                  {["Miss messages while sleeping", "Forget to follow up", "Reply hours (or days) late", "Lose hot leads to competitors"].map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 text-white/80"
                    >
                      <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </AnimatedCard>

            <AnimatedCard
              className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border-emerald-500/30"
              glowColor="rgba(16, 185, 129, 0.3)"
            >
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-400">Audnix AI</h3>
                </div>
                <ul className="space-y-3">
                  {["Replies in minutes, not days", "Handles objections automatically", "Auto-books via Calendly", "Converts while you sleep"].map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 text-white/90"
                    >
                      <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 p-4 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30"
                >
                  <p className="text-white/90 text-center font-medium">
                    Right timing + right tone = more booked calls
                  </p>
                </motion.div>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - DIAGRAM */}
      <ProcessTimeline />

      {/* CONDENSED INTELLIGENCE LAYER - Core differentiators only */}
      <section className="py-20 px-4 border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 mb-6">
              <span className="text-cyan-400 text-sm font-semibold">MEMORY + TIMING</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Audnix Remembers Every Lead
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              AI learns lead behavior, conversation history, and buying signals—then follows up at exactly the right moment.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            <AnimatedCard className="bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border-cyan-500/30 p-8" glowColor="rgba(34, 211, 238, 0.3)">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Full Context Memory</h3>
              <p className="text-white/80 text-sm">
                Never asks "who are you?" twice. References past conversations naturally and maintains consistent messaging across all channels.
              </p>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border-emerald-500/30 p-8" glowColor="rgba(16, 185, 129, 0.3)">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Intent Scoring</h3>
              <p className="text-white/80 text-sm">
                Ranks leads by engagement and buying signals. Hot prospects prioritized. No wasted outreach on cold leads.
              </p>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/30 p-8" glowColor="rgba(168, 85, 247, 0.3)">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Smart Objection Handling</h3>
              <p className="text-white/80 text-sm">
                Detects common objections and responds with personalized, persuasive answers—like your best closer, always available.
              </p>
            </AnimatedCard>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 max-w-4xl mx-auto"
          >
            <div className="text-center">
              <p className="text-white/90 text-lg">
                <span className="font-bold text-emerald-400">Result:</span> Teams typically see 3x higher response rates and 2x faster deal cycles.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BRAND PDF UPLOAD - Key Differentiator */}
      <section className="py-20 px-4 border-b border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Upload Your Brand PDF → AI Learns Your Voice
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              One PDF. AI extracts your value prop, testimonials, metrics, and positioning—then automates everything in your voice.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            <AnimatedCard className="bg-gradient-to-br from-purple-500/10 to-cyan-500/5 border-purple-500/30 p-8">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold mb-3 text-white">What AI Extracts</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>✓ Your unique value proposition</li>
                <li>✓ Success metrics & testimonials</li>
                <li>✓ Brand tone & voice</li>
                <li>✓ Competitive positioning</li>
              </ul>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border-emerald-500/30 p-8">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold mb-3 text-white">How AI Uses It</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>✓ Personalize every message automatically</li>
                <li>✓ Match your exact tone in replies</li>
                <li>✓ Handle objections with your data</li>
                <li>✓ Close deals in your voice</li>
              </ul>
            </AnimatedCard>
          </div>

          <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl p-8 text-center">
            <p className="text-lg text-white/90">
              <span className="font-bold text-purple-400">Result:</span> Personalized messages that sound like you, not a bot. Higher conversion rates.
            </p>
          </div>
        </div>
      </section>

      {/* EMAIL + INSTAGRAM AUTOMATION */}
      <section className="py-20 px-4 border-b border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Email + Instagram Automation
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Day 1-7 email sequences that close deals. Voice notes on Instagram DMs (paid plans). All automated, all personal.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            <AnimatedCard className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border-emerald-500/30 p-8">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold mb-3 text-white">Email Sequences</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>• Day 0: Personalized hook</li>
                <li>• Day 1: Value proposition</li>
                <li>• Day 2: Social proof</li>
                <li>• Day 5: Soft check-in</li>
                <li>• Day 7: Final close</li>
                <li>• AI timing & subject lines</li>
              </ul>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-cyan-500/30 p-8">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold mb-3 text-white">Voice Notes (Paid)</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>• Your voice, AI-cloned</li>
                <li>• Personal touch at scale</li>
                <li>• Instagram DMs only</li>
                <li>• Starter+ plans: 100–1000 mins/mo</li>
                <li>• Objections + personalization</li>
              </ul>
            </AnimatedCard>
          </div>

          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
            <p className="text-white/90 text-lg">
              <span className="font-bold">Free for all users:</span> Email + Instagram DM automation. Voice notes upgrade available.
            </p>
          </div>
        </div>
      </section>

      {/* TRUST & LEGAL - Before Pricing */}
      <section className="py-16 px-4 border-b border-purple-500/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Lock className="w-8 h-8 text-purple-400" />
              <span className="text-purple-400 font-semibold">PRIVACY-FIRST</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Audit Trail + Lead Control + Compliance
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-lg bg-white/5 border border-purple-500/20 text-center">
              <h3 className="text-lg font-bold text-white mb-2">✓ Audit Trail</h3>
              <p className="text-white/80 text-sm">
                Every message timestamped. Full history. Dispute-proof.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-white/5 border border-purple-500/20 text-center">
              <h3 className="text-lg font-bold text-white mb-2">✓ Lead Control</h3>
              <p className="text-white/80 text-sm">
                Opt-out anytime. Privacy-first. Fully transparent.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-white/5 border border-purple-500/20 text-center">
              <h3 className="text-lg font-bold text-white mb-2">✓ Compliant</h3>
              <p className="text-white/80 text-sm">
                GDPR ready. Instagram ToS compliant. Data secure.
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-lg border border-purple-500/20 text-center">
            <p className="text-white/90 text-sm">
              Details: <Link href="/terms-of-service" className="text-purple-400 hover:text-purple-300 font-semibold">Terms</Link> • <Link href="/privacy-policy" className="text-purple-400 hover:text-purple-300 font-semibold">Privacy</Link> • <Link href="/data-deletion" className="text-purple-400 hover:text-purple-300 font-semibold">Data Deletion</Link>
            </p>
          </div>
        </div>
      </section>

      {/* REVENUE LOSS CALCULATOR - Before Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Slow Follow-Up Is Costing You
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              See how much revenue you're losing every month to delayed responses.
            </p>
          </motion.div>
        </div>
      </section>

      <LethalROICalculator />

      {/* PRICING */}
      <PricingSection />

      {/* FEATURES - Condensed */}
      <section className="py-16 px-4 border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Features
            </h2>
            <p className="text-lg text-white/80">
              You're not buying software—you're hiring a closer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              "Day 1-7 email sequences",
              "Voice notes (Instagram, paid)",
              "Smart objection handling",
              "Brand PDF learning",
              "Intent scoring",
              "Auto-booking (Calendly)",
              "Real-time personalization",
              "Unified inbox",
              "Lead analytics"
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-white/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON - Simplified */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            How Audnix Compares
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-3 text-white/90">Feature</th>
                  <th className="text-center p-3 text-emerald-400 font-bold">Audnix</th>
                  <th className="text-center p-3 text-white/60">ManyChat</th>
                  <th className="text-center p-3 text-white/60">Others</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Email sequences", audnix: true, manychat: false, others: false },
                  { feature: "AI objection handling", audnix: true, manychat: false, others: false },
                  { feature: "Voice cloning", audnix: "Instagram", manychat: false, others: false },
                  { feature: "Auto-booking", audnix: true, manychat: false, others: false },
                  { feature: "Context memory", audnix: true, manychat: "Limited", others: false }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/10">
                    <td className="p-3 text-white/90">{row.feature}</td>
                    <td className="text-center p-3">
                      {row.audnix === true ? <Check className="w-5 h-5 text-emerald-400 mx-auto" /> : row.audnix}
                    </td>
                    <td className="text-center p-3 text-white/60">
                      {row.manychat === true ? <Check className="w-5 h-5 text-emerald-400 mx-auto" /> :
                       row.manychat === false ? <X className="w-5 h-5 text-red-400/50 mx-auto" /> : row.manychat}
                    </td>
                    <td className="text-center p-3 text-white/60">
                      {row.others === true ? <Check className="w-5 h-5 text-emerald-400 mx-auto" /> :
                       row.others === false ? <X className="w-5 h-5 text-red-400/50 mx-auto" /> : row.others}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/70">
              Stop Losing Deals to Slow Follow-Up
            </h2>
            <p className="text-xl md:text-2xl text-white/80 mb-10 leading-relaxed">
              Let Audnix handle replies, objections, and bookings.<br />
              <span className="text-emerald-400 font-semibold">You close the deals.</span>
            </p>

            <Link href="/auth">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold text-base md:text-lg px-8 md:px-12 py-6 md:py-7 rounded-full shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 group w-full md:w-auto max-w-sm md:max-w-none"
                >
                  <span className="flex items-center justify-center gap-2">
                    Recover My Lost Leads
                    <ArrowRight className="w-4 h-4 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </motion.div>
            </Link>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-white/50 text-sm mt-6"
            >
              No card required • 500 leads free • Setup in minutes
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-b from-[#0d1428] via-[#0a0f1f] to-[#0d1428] p-1 rounded">
                  <img src="/logo.png" alt="Audnix AI" className="h-10 w-auto" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Audnix AI
                </span>
              </div>
              <p className="text-white/60 text-sm">
                AI sales closer that remembers every lead and knows when to follow up.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy-policy" className="text-white/60 hover:text-emerald-400 transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="text-white/60 hover:text-emerald-400 transition-colors">Terms of Service</Link>
                </li>
                <li>
                  <Link href="/data-deletion" className="text-white/60 hover:text-emerald-400 transition-colors">Data Deletion</Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li>support@audnixai.com</li>
                <li>privacy@audnixai.com</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-white/40 text-sm">
              © 2026 Audnix AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Privacy Modal */}
      <PrivacyModal />
    </div>
  );
}
