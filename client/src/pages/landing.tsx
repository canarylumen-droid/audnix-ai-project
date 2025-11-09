import { Button } from "@/components/ui/button";
import { Check, X, MessageSquare, Mic, Calendar, ArrowRight, Clock, Phone, Mail, Instagram as InstagramIcon } from "lucide-react";
import { Link } from "wouter";
import { Navigation } from "@/components/landing/Navigation";
import { getSortedPricingTiers } from "@shared/plan-utils";
import { Card } from "@/components/ui/card";

export default function Landing() {
  const pricingTiers = getSortedPricingTiers();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d1428] via-[#0a0f1f] to-[#020409] text-white">
      <Navigation />

      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-24 mt-16">
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Stop Letting Warm Leads Go Cold
          </h1>
          
          <p className="text-xl sm:text-2xl text-white/90 mb-4 max-w-4xl mx-auto leading-relaxed">
            Your AI sales rep that follows up, handles objections, and books meetings — 24/7.
          </p>

          <p className="text-lg text-white/80 mb-8 max-w-3xl mx-auto">
            Audnix replies like a real human across WhatsApp + Email (+ Instagram soon).<br />
            Natural timing (2–8 minutes), remembers context, and engages only when leads show intent.<br />
            It nurtures → handles objections → books meetings → you close.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <div className="flex items-center gap-2 text-white/90">
              <Check className="w-5 h-5 text-emerald-400" />
              <span>Human-like timing & tone</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Check className="w-5 h-5 text-emerald-400" />
              <span>Voice notes in your voice</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Check className="w-5 h-5 text-emerald-400" />
              <span>Auto-booking + intelligent follow-ups</span>
            </div>
          </div>

          <Link href="/auth">
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold text-lg px-8 py-6">
              Start Closing Deals → No Card Required
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-20 px-4 border-y border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Why You're Losing Money
          </h2>
          
          <p className="text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Leads don't die because they don't want what you sell —<br />
            they die because you're slow.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-8 max-w-4xl mx-auto">
            <div className="bg-white/5 border border-red-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-red-400 mb-4">You:</h3>
              <ul className="space-y-2 text-white/80 text-left">
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Miss messages</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Forget follow-ups</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Reply late</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Sleep while prospects are active</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-emerald-400 mb-4">Audnix fixes that.</h3>
              <p className="text-white/90 text-lg">
                Right timing → right tone → more booked calls.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            What Audnix Does
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                number: 1,
                title: "Auto-imports leads",
                desc: "WhatsApp + Email + CSV",
                note: "(Instagram coming soon)",
                icon: Phone
              },
              {
                number: 2,
                title: "Talks like you",
                desc: "Understands your tone, docs, and offers.",
                icon: MessageSquare
              },
              {
                number: 3,
                title: "Handles objections",
                desc: "Price → stalling → questions → hesitations",
                icon: Check
              },
              {
                number: 4,
                title: "Sends voice notes in your tone",
                desc: "",
                icon: Mic
              },
              {
                number: 5,
                title: "Books meetings automatically",
                desc: "Checks your calendar → confirms",
                icon: Calendar
              }
            ].map((item) => (
              <Card key={item.number} className="bg-white/5 border-white/10 p-6 hover:border-primary/50 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {item.number}
                  </div>
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-white/80">{item.desc}</p>
                {item.note && <p className="text-white/60 text-sm mt-2">{item.note}</p>}
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            Why It's Different
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
            <div className="bg-white/5 border border-red-500/20 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-white/90">Most tools:</h3>
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

            <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-emerald-400">Audnix:</h3>
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
            Perfect for: DMs • inbound leads • price shoppers • ghosted prospects
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
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            Simple Setup
          </h2>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[
              { num: 1, text: "Connect channels (WhatsApp + Email — IG soon)" },
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
              "Human-like replies",
              "Context + PDF understanding",
              "Objection handling",
              "Voice messages",
              "Smart intent scoring",
              "Auto-booking",
              "Cold lead re-engagement",
              "Email + WhatsApp + CSV",
              "Unified inbox",
              "Analytics"
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

      <section id="pricing" className="py-20 px-4 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Pricing
          </h2>
          <p className="text-xl text-white/90 mb-12 text-center">
            Start free → upgrade when serious
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.filter(tier => tier.id !== 'trial').map((tier) => (
              <Card key={tier.id} className={`bg-white/5 border p-6 ${tier.id === 'pro' ? 'border-primary shadow-lg shadow-primary/20' : 'border-white/10'}`}>
                {tier.id === 'pro' && (
                  <div className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">${tier.price}</span>
                  <span className="text-white/60">/{tier.period}</span>
                </div>
                <p className="text-white/70 mb-6">{tier.description}</p>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={tier.id === 'free' ? '/auth' : tier.id === 'enterprise' ? '/contact' : '/dashboard/pricing'}>
                  <Button className={`w-full ${tier.id === 'pro' ? 'bg-primary hover:bg-primary/90' : 'bg-white/10 hover:bg-white/20'}`}>
                    {tier.id === 'free' ? 'Start Free' : tier.id === 'enterprise' ? 'Talk to Sales' : 'Upgrade'} →
                  </Button>
                </Link>
              </Card>
            ))}
          </div>

          <p className="text-center text-white/70 mt-8">
            Add-ons (paid plans only): Voice top-ups • Lead packs
          </p>
        </div>
      </section>

      <section className="py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Stop letting prospects vanish.
          </h2>
          <p className="text-2xl text-white/90 mb-8">
            Let Audnix follow up, handle objections, and book meetings.<br />
            You close.
          </p>

          <Link href="/auth">
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold text-xl px-12 py-7">
              Start Free – No Card
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
