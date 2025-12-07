import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, TrendingUp, Zap, Brain, BarChart3, Sparkles, Lock, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { PrivacyModal } from "@/components/landing/PrivacyModal";
import { ProcessTimeline } from "@/components/landing/ProcessTimeline";
import { ROICalculator } from "@/components/landing/ROICalculator";
import { AnimatedCard } from "@/components/ui/animated-card";
import { motion } from "framer-motion";

export default function Landing() {
  // Placeholder for handleGetStarted, assuming it's defined elsewhere or not needed for this diff.
  const handleGetStarted = () => {
    console.log("Get started clicked");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d1428] via-[#0a0f1f] to-[#020409] text-white">
      <Navigation />

      <HeroSection />

      {/* Smart Outreach System Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-emerald-500/5 to-cyan-500/5 border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-block px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-6">
              <span className="text-emerald-400 text-sm font-semibold">🎯 AI SALES CLOSER</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Your AI Sales Closer That Converts Leads 24/7
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              AI closer that never sleeps. Segments leads, handles objections, auto-books calls—all like your best rep, at 1,000x scale.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <AnimatedCard className="bg-gradient-to-br from-emerald-500/15 to-cyan-500/5 border-emerald-500/40 p-8" glowColor="rgba(16, 185, 129, 0.3)">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-bold text-emerald-400 mb-3 text-lg">Close Hot Leads First</h3>
              <p className="text-white/80">Intent scoring. Hot prospects first. Maximum velocity.</p>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-cyan-500/15 to-blue-500/5 border-cyan-500/40 p-8" glowColor="rgba(34, 211, 238, 0.3)">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="font-bold text-cyan-400 mb-3 text-lg">Smart Objection Handling</h3>
              <p className="text-white/80">AI reframes and closes objections automatically.</p>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-purple-500/15 to-pink-500/5 border-purple-500/40 p-8" glowColor="rgba(168, 85, 247, 0.3)">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-bold text-purple-400 mb-3 text-lg">Email + Instagram Voice</h3>
              <p className="text-white/80">Email sequences + voice notes on Instagram DMs.</p>
            </AnimatedCard>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 p-6 rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 max-w-3xl mx-auto"
          >
            <p className="text-center text-white/90">
              Works while you sleep. <span className="font-bold text-emerald-400">Converts systematically</span>. Zero missed leads.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Problem/Solution Section */}
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
              <div className="p-4 sm:p-6">
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
                  <h3 className="text-2xl font-bold text-emerald-400">Audnix AI Closer</h3>
                </div>
                <ul className="space-y-3">
                  {["Closes deals in minutes, not days", "Handles objections like a pro", "Books meetings automatically", "Converts leads while you sleep"].map((item, i) => (
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

      {/* How It Works - Upload PDF, AI Learns Your Voice */}
      <section className="py-20 px-4 border-y border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent">
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
              Upload your PDF. AI learns your value prop, testimonials, metrics, and positioning—then automates everything.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            <AnimatedCard className="bg-gradient-to-br from-purple-500/10 to-cyan-500/5 border-purple-500/30 p-8">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">What AI Extracts</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>✓ Your unique value proposition</li>
                <li>✓ Target audience & industry positioning</li>
                <li>✓ Success metrics & testimonials</li>
                <li>✓ Case studies & real results</li>
                <li>✓ Your brand tone & voice</li>
                <li>✓ Competitive landscape gaps</li>
                <li>✓ Pricing & offer structure</li>
              </ul>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border-emerald-500/30 p-8">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">How AI Uses It</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>✓ Personalize every message automatically</li>
                <li>✓ Match your exact tone & voice</li>
                <li>✓ Reference your real testimonials</li>
                <li>✓ Highlight relevant success metrics</li>
                <li>✓ Position you vs competitors</li>
                <li>✓ Handle objections with your data</li>
                <li>✓ Adapt across 24/7 automation</li>
              </ul>
            </AnimatedCard>
          </div>

          <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-2xl p-8 text-center">
            <p className="text-lg text-white/90">
              <span className="font-bold text-purple-400">Result:</span> Personalized messages that sound like you, not a bot. Higher response rates.
            </p>
          </div>
        </div>
      </section>

      {/* AI Insights - Deep Learning That Improves Your Sales */}
      <section className="py-20 px-4 border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="w-8 h-8 text-cyan-400" />
              <span className="text-cyan-400 font-semibold">AI THAT LEARNS YOUR LEADS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Know Why Leads Go Cold
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              AI studies your lead patterns, finds drop-off points, and tells you exactly what's working.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-10">
            {[
              { title: "Drop-off Detection", desc: "Spots where leads lose interest in your funnel" },
              { title: "Channel Intelligence", desc: "Learns which channel works best for YOUR leads" },
              { title: "Adaptive Strategy", desc: "Adjusts recommendations based on what converts" },
              { title: "Cold Lead Analysis", desc: "Explains why leads went cold with actionable fixes" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, boxShadow: "0 0 30px rgba(34, 211, 238, 0.3)" }}
                className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/60 cursor-pointer group"
              >
                <h3 className="font-bold text-cyan-400 mb-3 text-base group-hover:text-cyan-300 transition-colors">{item.title}</h3>
                <p className="text-white/75 text-sm group-hover:text-white/90 transition-colors">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Intelligence Layer - Advanced Sales AI */}
      <section className="py-20 px-4 border-b border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30 mb-6">
              <span className="text-orange-400 text-sm font-semibold">INTELLIGENCE LAYER</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              AI That Thinks Like Your Best Sales Rep
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Not just automation. Actual intelligence that learns patterns, predicts behavior, and adapts in real-time.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            <AnimatedCard className="bg-gradient-to-br from-orange-500/15 to-red-500/5 border-orange-500/40 p-8" glowColor="rgba(249, 115, 22, 0.3)">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Behavioral Modeling</h3>
              <p className="text-white/80 text-sm mb-3">
                AI learns how each lead interacts: response times, message length preferences, engagement patterns.
              </p>
              <ul className="space-y-1 text-white/70 text-xs">
                <li>• Tracks click patterns</li>
                <li>• Measures response velocity</li>
                <li>• Identifies buying signals</li>
              </ul>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-red-500/15 to-pink-500/5 border-red-500/40 p-8" glowColor="rgba(239, 68, 68, 0.3)">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Objection Pattern Recognition</h3>
              <p className="text-white/80 text-sm mb-3">
                Detects objections before they kill deals. AI identifies "I need to think" patterns and responds strategically.
              </p>
              <ul className="space-y-1 text-white/70 text-xs">
                <li>• Price objection handling</li>
                <li>• Timing objection responses</li>
                <li>• Trust-building sequences</li>
              </ul>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-yellow-500/15 to-orange-500/5 border-yellow-500/40 p-8" glowColor="rgba(234, 179, 8, 0.3)">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Smart Prioritization</h3>
              <p className="text-white/80 text-sm mb-3">
                Not all leads are equal. AI ranks by intent, engagement, and conversion probability.
              </p>
              <ul className="space-y-1 text-white/70 text-xs">
                <li>• Intent scoring (0-100)</li>
                <li>• Engagement heat mapping</li>
                <li>• Hot lead alerts</li>
              </ul>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-pink-500/15 to-purple-500/5 border-pink-500/40 p-8" glowColor="rgba(236, 72, 153, 0.3)">
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Tone & Voice Evolution</h3>
              <p className="text-white/80 text-sm mb-3">
                AI adapts its communication style based on what works. If casual converts better, it goes casual.
              </p>
              <ul className="space-y-1 text-white/70 text-xs">
                <li>• A/B tests tone automatically</li>
                <li>• Learns winning phrases</li>
                <li>• Adapts per lead segment</li>
              </ul>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-purple-500/15 to-indigo-500/5 border-purple-500/40 p-8" glowColor="rgba(168, 85, 247, 0.3)">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Predictive Follow-up Timing</h3>
              <p className="text-white/80 text-sm mb-3">
                No fixed schedule. AI predicts the BEST time to reach each lead based on their behavior.
              </p>
              <ul className="space-y-1 text-white/70 text-xs">
                <li>• Optimal send time prediction</li>
                <li>• Activity-based triggers</li>
                <li>• Weekend vs weekday intelligence</li>
              </ul>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-indigo-500/15 to-blue-500/5 border-indigo-500/40 p-8" glowColor="rgba(99, 102, 241, 0.3)">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Context Memory</h3>
              <p className="text-white/80 text-sm mb-3">
                AI remembers every interaction. Never asks "who are you?" twice. References past conversations naturally.
              </p>
              <ul className="space-y-1 text-white/70 text-xs">
                <li>• Full conversation history</li>
                <li>• Preference tracking</li>
                <li>• Relationship scoring</li>
              </ul>
            </AnimatedCard>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 max-w-4xl mx-auto"
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-3 text-white">The Result?</h3>
              <p className="text-white/90 text-lg mb-4">
                8-12% conversion rates instead of industry-standard 2-3%. Because AI that actually thinks beats automation that just sends.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <span className="px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 font-semibold">3x Higher Response Rates</span>
                <span className="px-4 py-2 rounded-full bg-red-500/20 text-red-400 font-semibold">2x Faster Deal Cycles</span>
                <span className="px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 font-semibold">50% Fewer Lost Leads</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Email + Voice Automation */}
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
              Email sequences that close deals. Voice notes on Instagram DMs (paid plans).
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            <AnimatedCard className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border-emerald-500/30 p-8" delay={0}>
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Day 1-7 Email Sequences</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>• Day 0: Hook (personalized)</li>
                <li>• Day 1: Value proposition</li>
                <li>• Day 2: Social proof & benefits</li>
                <li>• Day 5: Soft check-in</li>
                <li>• Day 7: Final close</li>
                <li>• AI subject lines & timing</li>
              </ul>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-cyan-500/30 p-8" delay={0.1}>
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Voice Notes (Instagram)</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>• AI clones your exact voice</li>
                <li>• Personal touch at scale</li>
                <li>• 80%+ prefer voice over text</li>
                <li>• Paid feature (Starter+)</li>
                <li>• Instagram DMs only</li>
                <li>• Unlimited custom messages</li>
              </ul>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/30 p-8" delay={0.2}>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">AI Personalization</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>• Learns from lead behavior</li>
                <li>• Smart objection handling</li>
                <li>• Adapts messaging by stage</li>
                <li>• Re-engages cold leads</li>
                <li>• Real-time intent detection</li>
                <li>• 24/7 automation</li>
              </ul>
            </AnimatedCard>
          </div>

          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-3 text-white">Your Voice on Instagram</h3>
            <p className="text-white/90 text-lg">
              Upload your voice once. AI sends personalized voice notes on Instagram DMs.
            </p>
          </div>
        </div>
      </section>

      {/* Legal Compliance - REAL Protection */}
      <section className="py-20 px-4 border-b border-purple-500/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Lock className="w-8 h-8 text-purple-400" />
              <span className="text-purple-400 font-semibold">LEGALLY PROTECTED</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Audit Trail + User Control + Privacy First
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-lg bg-white/5 border border-purple-500/20">
              <h3 className="text-lg font-bold text-white mb-3">✓ Audit Trail</h3>
              <p className="text-white/80 text-sm">
                Every message timestamped. Full conversation history. Dispute-proof.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-white/5 border border-purple-500/20">
              <h3 className="text-lg font-bold text-white mb-3">✓ Lead Control</h3>
              <p className="text-white/80 text-sm">
                Opt-out anytime. Privacy-first. Fully transparent communication.
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 rounded-lg border border-purple-500/20 text-center">
            <p className="text-white/90 text-sm">
              Full details: <Link href="/terms-of-service" className="text-purple-400 hover:text-purple-300 font-semibold">Terms of Service</Link> and <Link href="/privacy-policy" className="text-purple-400 hover:text-purple-300 font-semibold">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Instagram Features Section */}
      <section id="instagram" className="py-20 px-4 bg-gradient-to-b from-emerald-500/5 to-transparent border-y border-emerald-500/10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Instagram DM Automation<br />
              <span className="text-primary">That Actually Works</span>
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Real AI intent detection. Understands emotion, context, intent—not just keywords.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            <AnimatedCard className="bg-gradient-to-br from-emerald-500/15 to-cyan-500/5 border-emerald-500/40 p-8" glowColor="rgba(16, 185, 129, 0.3)">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold mb-5 text-white">Intelligent Comment Detection</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-white/85">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>Understands "This is cool!" as buying intent (no keywords needed)</span>
                </li>
                <li className="flex items-start gap-3 text-white/85">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>Detects emotion from emojis: 🔥 = excitement, 👀 = curiosity</span>
                </li>
                <li className="flex items-start gap-3 text-white/85">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>Multi-language support - works in any language</span>
                </li>
                <li className="flex items-start gap-3 text-white/85">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>Context-aware: "wow" means different things in different contexts</span>
                </li>
              </ul>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-cyan-500/15 to-blue-500/5 border-cyan-500/40 p-8" glowColor="rgba(34, 211, 238, 0.3)">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold mb-5 text-white">Personalized DM Automation</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-white/85">
                  <span className="text-cyan-400 font-bold mt-0.5">•</span>
                  <span>Uses actual Instagram usernames in replies</span>
                </li>
                <li className="flex items-start gap-3 text-white/85">
                  <span className="text-cyan-400 font-bold mt-0.5">•</span>
                  <span>References what the lead said and wants</span>
                </li>
                <li className="flex items-start gap-3 text-white/85">
                  <span className="text-cyan-400 font-bold mt-0.5">•</span>
                  <span>Human-like timing: 2-8 minute delays</span>
                </li>
                <li className="flex items-start gap-3 text-white/85">
                  <span className="text-cyan-400 font-bold mt-0.5">•</span>
                  <span>Handles objections and closes deals automatically</span>
                </li>
              </ul>
            </AnimatedCard>
          </div>

          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-12 text-center text-white">Why Audnix Actually Works</h3>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <AnimatedCard className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20 p-8" glowColor="rgba(239, 68, 68, 0.2)">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                  <X className="w-6 h-6 text-red-400" />
                </div>
                <h4 className="font-bold text-red-400 mb-5 text-lg">Traditional Automation Tools</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-white/80">
                    <span className="text-red-400 font-bold mt-0.5">→</span>
                    <span>Keyword-based triggers (misses context, creates false positives)</span>
                  </li>
                  <li className="flex items-start gap-3 text-white/80">
                    <span className="text-red-400 font-bold mt-0.5">→</span>
                    <span>Static scripts that repeat (sounds robotic, kills credibility)</span>
                  </li>
                  <li className="flex items-start gap-3 text-white/80">
                    <span className="text-red-400 font-bold mt-0.5">→</span>
                    <span>No real objection handling (dead ends, lost leads)</span>
                  </li>
                  <li className="flex items-start gap-3 text-white/80">
                    <span className="text-red-400 font-bold mt-0.5">→</span>
                    <span>One-channel only (Instagram or email, not both)</span>
                  </li>
                </ul>
              </AnimatedCard>

              <AnimatedCard className="bg-gradient-to-br from-emerald-500/15 to-cyan-500/5 border-emerald-500/40 p-8" glowColor="rgba(16, 185, 129, 0.3)">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                  <Check className="w-6 h-6 text-emerald-400" />
                </div>
                <h4 className="font-bold text-emerald-400 mb-5 text-lg">Audnix AI Real-Time Sales</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-white/90">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>Understands intent, emotion, context in real-time (catches every opportunity)</span>
                  </li>
                  <li className="flex items-start gap-3 text-white/90">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>Handles objections instantly (like your best closer, always on)</span>
                  </li>
                  <li className="flex items-start gap-3 text-white/90">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>Adapts mid-conversation (speaks naturally, builds trust)</span>
                  </li>
                  <li className="flex items-start gap-3 text-white/90">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>Email + Instagram + auto-booking (full pipeline automation)</span>
                  </li>
                </ul>
              </AnimatedCard>
            </div>
          </div>
        </div>
      </section>

      <FeatureSection />

      <section className="py-20 px-4 border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            Why It's Different
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
            <div className="bg-white/5 border border-red-500/20 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-4 text-white/90">Most tools:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-white/70">
                  <X className="w-5 h-5 text-red-400" />
                  <span>Keyword triggers</span>
                </li>
                <li className="flex items-center gap-2 text-white/70">
                  <X className="w-5 h-5 text-red-400" />
                  <span>Static scripts</span>
                </li>
                <li className="flex items-center gap-2 text-white/70">
                  <X className="w-5 h-5 text-red-400" />
                  <span>Robotic</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-4 text-emerald-400">Audnix:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-white/90">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span>Context-aware</span>
                </li>
                <li className="flex items-center gap-2 text-white/90">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span>Natural timing</span>
                </li>
                <li className="flex items-center gap-2 text-white/90">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span>Objection-handling</span>
                </li>
                <li className="flex items-center gap-2 text-white/90">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span>Voice + text</span>
                </li>
                <li className="flex items-center gap-2 text-white/90">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span>Continues conversations intelligently</span>
                </li>
              </ul>
            </div>
          </div>

          <p className="text-2xl font-bold text-center text-primary">
            Not automation. Automated persuasion.
          </p>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-primary">Your voice</span> → automated
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            <span className="text-emerald-400">Your follow-up</span> → at scale
          </h3>
          <h3 className="text-3xl md:text-4xl font-bold mb-8">
            <span className="text-cyan-400">Your pipeline</span> → always warm
          </h3>

          <p className="text-xl text-white/90">
            Perfect for: Email sequences • Voice personalization • Objection handling • Warm leads
          </p>
        </div>
      </section>

      <ProcessTimeline />

      <section className="py-20 px-4 border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Features
          </h2>
          <p className="text-xl text-primary mb-12 text-center font-semibold">
            You're not buying software. You're hiring a closer.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              "Day 1-7 email sequences",
              "Voice notes (Instagram)",
              "Smart objection handling",
              "PDF brand understanding",
              "Intent scoring",
              "Auto-booking",
              "Re-engagement sequences",
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

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            Comparison
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-4 text-white/90">Feature</th>
                  <th className="text-center p-4 text-primary font-bold">Audnix</th>
                  <th className="text-center p-4 text-white/60">ManyChat</th>
                  <th className="text-center p-4 text-white/60">CommentGuard</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Email sequences", audnix: true, manychat: false, commentguard: false },
                  { feature: "AI objection handling", audnix: true, manychat: false, commentguard: false },
                  { feature: "Voice cloning", audnix: "Instagram", manychat: false, commentguard: false },
                  { feature: "Auto-booking meetings", audnix: true, manychat: false, commentguard: false },
                  { feature: "Flow builder", audnix: false, manychat: true, commentguard: false },
                  { feature: "Context-aware AI", audnix: true, manychat: "Limited", commentguard: false }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/10">
                    <td className="p-4 text-white/90">{row.feature}</td>
                    <td className="text-center p-4">
                      {row.audnix === true ? <Check className="w-6 h-6 text-emerald-400 mx-auto" /> : row.audnix}
                    </td>
                    <td className="text-center p-4 text-white/60">
                      {row.manychat === true ? <Check className="w-6 h-6 text-emerald-400 mx-auto" /> :
                       row.manychat === false ? <X className="w-6 h-6 text-red-400/50 mx-auto" /> : row.manychat}
                    </td>
                    <td className="text-center p-4 text-white/60">
                      {row.commentguard === true ? <Check className="w-6 h-6 text-emerald-400 mx-auto" /> :
                       row.commentguard === false ? <X className="w-6 h-6 text-red-400/50 mx-auto" /> : row.commentguard}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-2xl font-bold text-center mt-8 text-primary">
            Audnix isn't a chatbot. It's a closer.
          </p>
        </div>
      </section>

      <ROICalculator />

      <PricingSection />

      {/* Final CTA */}
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
              Stop letting prospects vanish.
            </h2>
            <p className="text-xl md:text-2xl text-white/80 mb-10 leading-relaxed">
              Let Audnix follow up, handle objections, and book meetings.<br />
              <span className="text-primary font-semibold">You close.</span>
            </p>

            <Link href="/auth">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold text-sm md:text-lg lg:text-xl px-4 py-4 md:px-12 md:py-7 lg:py-8 rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 group w-full md:w-auto max-w-sm md:max-w-none"
                >
                  <span className="flex items-center justify-center gap-2">
                    Start Free – No Card Required
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
              Join hundreds of closers automating their follow-up
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
                AI-powered sales automation that converts leads while you sleep.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy-policy" className="text-white/60 hover:text-primary transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="text-white/60 hover:text-primary transition-colors">Terms of Service</Link>
                </li>
                <li>
                  <Link href="/data-deletion" className="text-white/60 hover:text-primary transition-colors">Data Deletion</Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">Contact</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li>support@audnixai.com</li>
                <li>privacy@audnixai.com</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} Audnix AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Privacy Modal */}
      <PrivacyModal />
    </div>
  );
}