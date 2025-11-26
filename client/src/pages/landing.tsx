import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, TrendingUp, Zap, Brain, BarChart3, Sparkles, Lock, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { PrivacyModal } from "@/components/landing/PrivacyModal";
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
                  <h3 className="text-2xl font-bold text-emerald-400">Audnix Automation</h3>
                </div>
                <ul className="space-y-3">
                  {["Instant replies 24/7", "Never forgets a follow-up", "Perfect timing every time", "Converts while you sleep"].map((item, i) => (
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
              Stop writing emails. Upload your brand PDF once, and AI instantly understands your unique value proposition, testimonials, success metrics, and competitive positioning.
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
              <span className="font-bold text-purple-400">Result:</span> Leads receive personalized, data-driven messages that sound like YOU—not a bot. Instant credibility + higher response rates.
            </p>
          </div>
        </div>
      </section>

      {/* Real Analytics - What You Actually See */}
      <section className="py-20 px-4 border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <BarChart3 className="w-8 h-8 text-cyan-400" />
              <span className="text-cyan-400 font-semibold">REAL-TIME INSIGHTS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              See What's Working. Immediately.
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Track lead engagement, response rates, and AI insights in real-time. Free tier gives you 1 insight preview. Pro tier unlocks unlimited analysis to scale.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <AnimatedCard className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-cyan-500/30 p-8">
              <h3 className="text-xl font-bold text-white mb-4">Dashboard Tracks</h3>
              <ul className="space-y-3 text-white/80 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold mt-0.5">→</span>
                  <span><strong>Channel breakdown:</strong> Email vs WhatsApp vs Instagram performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold mt-0.5">→</span>
                  <span><strong>Conversion funnel:</strong> New → Replied → Converted</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold mt-0.5">→</span>
                  <span><strong>Lead scoring:</strong> AI ranks leads by buying intent (0-100)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold mt-0.5">→</span>
                  <span><strong>Response rates:</strong> Message-by-message engagement</span>
                </li>
              </ul>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/30 p-8">
              <h3 className="text-xl font-bold text-white mb-4">AI Insights</h3>
              <ul className="space-y-3 text-white/80 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold mt-0.5">→</span>
                  <span><strong>Free tier:</strong> 1 preview insight + upgrade prompts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold mt-0.5">→</span>
                  <span><strong>Pro tier:</strong> Unlimited AI-generated insights & recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold mt-0.5">→</span>
                  <span><strong>Real-time charts:</strong> 7-day trends for all channels</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold mt-0.5">→</span>
                  <span><strong>Lead intelligence:</strong> Buyer stage detection & churn risk alerts</span>
                </li>
              </ul>
            </AnimatedCard>
          </div>

          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-center">
            <p className="text-lg text-white/90">
              <span className="font-bold text-cyan-400">Strategy:</span> Free tier limits you to 500 leads/month to close your first deal fast. After your first $1K, upgrade to Pro for unlimited scale.
            </p>
          </div>
        </div>
      </section>

      {/* Multi-Channel Automation - Not Just DMs */}
      <section className="py-20 px-4 border-b border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Automated Across Every Channel
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Day-aware sequences that escalate across Email → WhatsApp → Instagram. Not DMs-only. Not a chatbot. Real multi-channel automation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            <AnimatedCard className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border-emerald-500/30 p-8" delay={0}>
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Email Sequences</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>• Day 0: Initial hook</li>
                <li>• Day 1: Value prop</li>
                <li>• Day 2: Benefit deep-dive</li>
                <li>• Day 5: Soft check-in</li>
                <li>• Day 7: Final close</li>
                <li>• AI subject lines included</li>
              </ul>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-cyan-500/30 p-8" delay={0.1}>
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">WhatsApp + Instagram</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>• Escalates if email ignored</li>
                <li>• Day 3, 6, 8 timing</li>
                <li>• Voice messages supported</li>
                <li>• Real-time engagement detection</li>
                <li>• Respects rate limits (human-like)</li>
                <li>• Multi-language auto-detect</li>
              </ul>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/30 p-8" delay={0.2}>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Always Personalized</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>• Learns from lead behavior</li>
                <li>• Detects objections in real-time</li>
                <li>• Suggests negotiation strategies</li>
                <li>• Adapts messaging by stage</li>
                <li>• Scores lead warmth automatically</li>
                <li>• 24/7 follow-up, no sleep</li>
              </ul>
            </AnimatedCard>
          </div>

          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-3 text-white">Not A Sequence Blaster</h3>
            <p className="text-white/90 text-lg">
              Audnix doesn't just send emails. It <strong>learns</strong> which channels work best for each lead. If a lead replies on WhatsApp, it stops emailing and focuses there. If they're a hot lead, it replies in 50 seconds. Cold lead? It waits 8 minutes to feel human.
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
              AI Disclaimers + Audit Trail + User Control
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-lg bg-white/5 border border-purple-500/20">
              <h3 className="text-lg font-bold text-white mb-3">✓ AI Disclaimers</h3>
              <p className="text-white/80 text-sm">
                Auto-included in every AI message (not a popup that scares leads). Blends naturally. Legally protects you.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-white/5 border border-purple-500/20">
              <h3 className="text-lg font-bold text-white mb-3">✓ Complete Audit Trail</h3>
              <p className="text-white/80 text-sm">
                Every message timestamped. Proves disclaimers were included. Essential for disputes.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-white/5 border border-purple-500/20">
              <h3 className="text-lg font-bold text-white mb-3">✓ Lead Control</h3>
              <p className="text-white/80 text-sm">
                Leads can opt-out anytime. Privacy + data security built in. Transparent, trustworthy.
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 text-center">
            <p className="text-white/90 text-sm">
              Full details: <Link href="/terms-of-service"><a className="text-purple-400 hover:text-purple-300 font-semibold">Terms of Service</a></Link> (Section 13: AI Communications) and <Link href="/privacy-policy"><a className="text-purple-400 hover:text-purple-300 font-semibold">Privacy Policy</a></Link>
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
              Unlike ManyChat's keyword triggers, Audnix uses real AI to understand intent, emotion, and context in every comment and DM.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <AnimatedCard className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border-emerald-500/30 p-8">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Intelligent Comment Detection</h3>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Understands "This is cool!" as buying intent (no keywords needed)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Detects emotion from emojis: 🔥 = excitement, 👀 = curiosity</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Multi-language support - works in any language</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Context-aware: "wow" means different things in different contexts</span>
                </li>
              </ul>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-cyan-500/30 p-8">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Personalized DM Automation</h3>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Uses actual Instagram usernames in replies</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>References what the lead said and wants</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Human-like timing: 2-8 minute delays</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Handles objections and closes deals automatically</span>
                </li>
              </ul>
            </AnimatedCard>
          </div>

          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-primary/20 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-white">The Audnix Difference</h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-emerald-400 mb-2">ManyChat</h4>
                <ul className="space-y-1 text-white/60 text-sm">
                  <li>• Keyword-based triggers</li>
                  <li>• Misses 70% of interested leads</li>
                  <li>• Generic template responses</li>
                  <li>• Instagram only</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-cyan-400 mb-2">CommentGuard</h4>
                <ul className="space-y-1 text-white/60 text-sm">
                  <li>• Basic spam filtering</li>
                  <li>• No conversation AI</li>
                  <li>• No follow-up system</li>
                  <li>• Instagram only</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-2">Audnix AI</h4>
                <ul className="space-y-1 text-white/90 text-sm">
                  <li>✅ Real AI intent detection</li>
                  <li>✅ Catches every interested lead</li>
                  <li>✅ Personalized conversations</li>
                  <li>✅ Instagram + WhatsApp + Email</li>
                </ul>
              </div>
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
            <span className="text-primary">Your voice</span> → at scale
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            <span className="text-emerald-400">Your follow-up</span> → automated
          </h3>
          <h3 className="text-3xl md:text-4xl font-bold mb-8">
            <span className="text-cyan-400">Your pipeline</span> → constantly warmed
          </h3>

          <p className="text-xl text-white/90">
            Perfect for: Instagram DMs • WhatsApp leads • Email follow-ups • ghosted prospects
          </p>
        </div>
      </section>

      <section className="py-20 px-4 bg-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Numbers That Matter
          </h2>
          <p className="text-xl text-white/90 mb-4">
            24/7 human-timed replies → more responses → more booked meetings
          </p>
          <p className="text-white/70">
            No fake % claims — just throughput + consistency.
          </p>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto px-2 sm:px-0">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            Simple Setup
          </h2>

          <div className="grid md:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {[
              { num: 1, text: "Connect Instagram, WhatsApp & Email" },
              { num: 2, text: "Upload voice sample + brand PDF" },
              { num: 3, text: "Add calendar link" },
              { num: 4, text: "Done — it takes over" }
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-4">
                  {step.num}
                </div>
                <p className="text-white/90">{step.text}</p>
              </div>
            ))}
          </div>

          <p className="text-2xl font-bold text-center text-primary">
            Your job: show up and close.
          </p>
        </div>
      </section>

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
              "AI-powered Instagram DM automation",
              "Video comment monitoring & replies",
              "Human-like WhatsApp & Email follow-ups",
              "Context + PDF understanding",
              "Voice messages in your voice",
              "Smart intent scoring",
              "Auto-booking",
              "Objection handling",
              "Unified inbox across all channels",
              "Real-time analytics"
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
                  { feature: "Human-like convo", audnix: true, manychat: false, commentguard: false },
                  { feature: "Objection handling", audnix: true, manychat: false, commentguard: false },
                  { feature: "Voice notes", audnix: true, manychat: false, commentguard: false },
                  { feature: "Auto-booking", audnix: true, manychat: false, commentguard: false },
                  { feature: "Multi-channel", audnix: "✅", manychat: "IG-only", commentguard: "IG-only" },
                  { feature: "Memory/context", audnix: true, manychat: false, commentguard: false }
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
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold text-base md:text-lg lg:text-xl px-6 py-5 md:px-12 md:py-7 lg:py-8 rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 group"
                >
                  <span className="flex items-center gap-2">
                    Start Free – No Card Required
                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
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
                  <Link href="/privacy-policy">
                    <a className="text-white/60 hover:text-primary transition-colors">Privacy Policy</a>
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service">
                    <a className="text-white/60 hover:text-primary transition-colors">Terms of Service</a>
                  </Link>
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