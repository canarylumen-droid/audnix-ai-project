import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, MessageSquare, Mic, Calendar, Phone, Check, Zap } from "lucide-react";
import { AnimatedCard } from "@/components/ui/animated-card";

const features = [
  {
    number: 1,
    title: "Multi-Channel Lead Import",
    desc: "Connect your WhatsApp, Email, and CSV contacts instantly",
    icon: Phone,
    details: [
      "WhatsApp Business API integration",
      "Email inbox sync (Gmail, Outlook)",
      "Bulk CSV upload with auto-mapping",
      "Real-time contact deduplication"
    ],
    comingSoon: ["Instagram DM automation (paid plans)"]
  },
  {
    number: 2,
    title: "AI-Powered Conversations",
    desc: "Natural dialogue that understands context and your brand voice",
    icon: MessageSquare,
    details: [
      "Learns from your PDFs and documentation",
      "Remembers conversation history",
      "Adapts tone based on lead behavior",
      "Handles multi-turn objections naturally"
    ]
  },
  {
    number: 3,
    title: "Smart Objection Handling",
    desc: "Converts hesitation into commitment with proven frameworks",
    icon: Check,
    details: [
      "Price objections → value reframing",
      "Stalling tactics → urgency creation",
      "Competitor comparisons → differentiation",
      "Trust building through micro-commitments"
    ]
  },
  {
    number: 4,
    title: "Voice Notes in Your Tone",
    desc: "Clone your voice for authentic, personalized outreach at scale",
    icon: Mic,
    details: [
      "Upload 30-second voice sample",
      "AI generates natural voice messages",
      "Adjustable pace and emotion",
      "85%+ human recognition rate"
    ]
  },
  {
    number: 5,
    title: "Automated Meeting Booking",
    desc: "Seamlessly schedules calls when leads show buying intent",
    icon: Calendar,
    details: [
      "Calendar integration (Google, Outlook)",
      "Timezone detection and conversion",
      "Buffer time and availability rules",
      "Confirmation + reminder sequences"
    ]
  },
  {
    number: 6,
    title: "Intelligent Lead Scoring",
    desc: "Prioritizes hot leads so you focus on closable deals",
    icon: Zap,
    details: [
      "Real-time engagement tracking",
      "Intent signals (questions, urgency)",
      "Auto-tagging based on behavior",
      "Alert system for high-value prospects"
    ]
  }
];

export function FeatureSection() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            What Audnix Does
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            The complete AI sales automation suite that works 24/7
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <AnimatedCard 
              key={feature.number} 
              delay={index * 0.1}
              className="bg-white/5 border-white/10 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-primary/30">
                    <span className="text-lg font-bold text-primary">
                      {feature.number}
                    </span>
                  </div>
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                
                <h3 className="text-xl font-bold mb-2 text-white">
                  {feature.title}
                </h3>
                <p className="text-white/70 mb-4">{feature.desc}</p>

                <button
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  className="flex items-center justify-between w-full text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
                >
                  <span>See details</span>
                  <motion.div
                    animate={{ rotate: expandedIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {expandedIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                        {feature.details.map((detail, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-2 text-sm text-white/80"
                          >
                            <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span>{detail}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
}
