import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus, Minus, MessageCircle, HelpCircle, Sparkles, Orbit } from "lucide-react";

const FAQS = [
    {
        question: "Is this just another GPT wrapper?",
        answer: "No. GPT is the engine, but we are the fuel and the cockpit. Audnix combines vector embeddings, real-time IMAP/OAuth listeners, and high-status sales methodology (Short-form logic) which base models lack. It's programmed to close, not just to talk."
    },
    {
        question: "Will it sound like a robot in my replies?",
        answer: "Only if you want it to. Our 'Tone Calibrator' allows you to feed it your own writing samples. It learns your slang, your punctuation style, and even how you handle specific common questions. Most people can't tell the difference."
    },
    {
        question: "Can I take over the conversation whenever I want?",
        answer: "Absolutely. One click in your dashboard pauses the AI for that specific lead. You can jump in, close the deal, and restart the AI whenever you need to. You have 100% control, 100% of the time."
    },
    {
        question: "What if the AI makes a mistake or gives wrong info?",
        answer: "Our 'Confidence Thresholds' prevent this. If the AI is less than 85% sure about an answer based on your Brand PDF, it will either ask for clarification or escalate to you. Accuracy is our #1 priority."
    },
    {
        question: "Is it safe for my email accounts?",
        answer: "We use official APIs and enterprise-grade rotation logic to ensure your account health. We simulate human-like typing delays and response windows so you're never flagged for 'automation' by platform algorithms."
    }
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-60 px-4 relative bg-black overflow-hidden">
            {/* Background Decorative */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 blur-[200px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-grid opacity-5 mask-radial" />

            <div className="max-w-5xl mx-auto relative z-10">
                <div className="text-center mb-32">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="flex items-center justify-center gap-3 mb-10"
                    >
                        <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-2xl">
                            <Orbit className="w-6 h-6 animate-spin-slow" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 italic">Intelligence Hub</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-[8rem] font-black tracking-[-0.05em] leading-[0.85] text-white uppercase italic mb-12"
                    >
                        COMMON <br />
                        <span className="text-primary not-italic tracking-[-0.08em]">OBJECTIONS.</span>
                    </motion.h2>
                    <p className="text-white/40 font-bold italic text-2xl max-w-2xl mx-auto tracking-tight">We handle questions just like our AI: <span className="text-white">efficiently and directly.</span></p>
                </div>

                <div className="space-y-6">
                    {FAQS.map((faq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`rounded-[3rem] border transition-all duration-700 overflow-hidden perspective-tilt ${openIndex === i ? "bg-white/[0.04] border-primary/20 shadow-2xl" : "bg-white/[0.01] border-white/5 hover:border-white/10"
                                }`}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full px-10 py-10 flex items-center justify-between text-left group"
                            >
                                <div className="flex items-center gap-6">
                                    <span className={`text-[10px] font-black italic tracking-widest transition-colors ${openIndex === i ? "text-primary" : "text-white/10"}`}>0{i + 1}</span>
                                    <span className={`text-xl md:text-2xl font-black uppercase tracking-tighter transition-colors duration-500 ${openIndex === i ? "text-white" : "text-white/40 group-hover:text-white"}`}>
                                        {faq.question}
                                    </span>
                                </div>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-700 ${openIndex === i ? "bg-primary border-primary text-black rotate-0 shadow-[0_0_20px_rgba(34,211,238,0.5)]" : "bg-transparent border-white/10 text-white/20 rotate-180"
                                    }`}>
                                    {openIndex === i ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                </div>
                            </button>

                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        <div className="px-10 pb-12 text-white/40 text-lg md:text-xl leading-relaxed font-bold italic max-w-4xl border-l-[3px] border-primary ml-10 mb-2">
                                            <Sparkles className="w-5 h-5 text-primary mb-4" />
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {/* Support Node */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-40 p-16 rounded-[4rem] bg-white/[0.02] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-12 group relative overflow-hidden"
                >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000" />
                    <div className="text-center md:text-left">
                        <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 italic">Still have questions?</h4>
                        <p className="text-white/40 text-lg font-bold italic">Talk to a human from our <span className="text-primary italic cursor-blink">Intelligence Operations</span> team.</p>
                    </div>
                    <button className="h-20 px-12 rounded-[2rem] bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all duration-700 flex items-center gap-4 shadow-2xl overflow-hidden group/btn relative">
                        <span className="relative z-10 flex items-center gap-3">
                            <MessageCircle className="w-5 h-5 fill-current" />
                            Initialize Support
                        </span>
                        <div className="absolute inset-0 bg-primary opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </button>
                </motion.div>
            </div>
        </section>
    );
}
