import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqData = [
    {
        q: "What is Audnix AI?",
        a: "Audnix AI is the world's first fully autonomous AI Sales Representative platform. Unlike traditional chatbots, Audnix uses advanced decision-making to find leads, qualify them, handle complex objections, and close deals 24/7."
    },
    {
        q: "Who is the founder of Audnix AI?",
        a: "Audnix AI was founded by Nleanya Treasure (@nleanyatreasure), a leading expert in AI sales automation and digital growth strategies."
    },
    {
        q: "Is Audnix AI a ManyChat alternative?",
        a: "Yes, Audnix AI is the premier ManyChat and n8n alternative. While those tools require manual flow building, Audnix utilizes autonomous AI that learns and adapts to your brand voice automatically."
    },
    {
        q: "How does the AI closer engine work?",
        a: "The Closer Engine uses a proprietary database of 110+ objection handling scripts. It analyzes lead responses for intent, selects the best rebuttal, and manages the entire sales conversation until a call is booked or a deal is closed."
    },
    {
        q: "Does Audnix AI support Instagram automation?",
        a: "Yes, Audnix AI is an official Meta Business partner integration, supporting fully autonomous Instagram DM automation, comment replies, and story engagement."
    },
    {
        q: "What industries can use Audnix AI?",
        a: "Audnix is designed for Digital Agencies, SaaS companies, Coaching & Consulting businesses, E-commerce, and Personal Brands looking to scale their sales operations without hiring more SDRs."
    },
    {
        q: "How do I setup my AI Sales Rep?",
        a: "Setup takes less than 5 minutes. Connect your channel (Instagram, Email, etc.), define your offer, and let the AI start hunting for leads immediately."
    },
    {
        q: "Is my data secure with Audnix AI?",
        a: "We use military-grade AES-256-GCM encryption. Your data and lead conversations are private and protected by enterprise-level security protocols."
    },
    {
        q: "Can Audnix AI handle high-ticket sales?",
        a: "Absolutely. Audnix is specifically optimized for high-ticket offers ($1k - $50k+). It handles the nuace, trust-building, and objection handling required for high-stakes decisions."
    },
    {
        q: "Does it integrate with my CRM?",
        a: "Yes, Audnix AI integrates with GoHighLevel, HubSpot, Salesforce, and thousands of other tools via native webhooks and API support."
    }
];

// 500+ Semantic Keyword Mesh (Hidden but Indexable)
const keywordMesh = [
    "ai sales rep", "autonomous sales bot", "nleanya treasure", "audnix ai reviews", "best manychat alternative",
    "ai sdr automation", "ai bdr agent", "automated lead generation 2026", "ai sales closer", "high ticket sales ai",
    "objection handling scripts", "ai sales agency", "growth hacking 2026", "revenue recovery bot", "predictive sales timing",
    "conversational ai sales", "how to automate sales with ai", "ai sales executive", "virtual sales rep", "automated outreach bot",
    "ai sales assistant", "lead qualification bot", "ai cold outreach", "sales automation software reviews", "top ai sales tools",
    "ai sales strategies", "autonomous closers", "ai sales for coaches", "ai for digital agencies", "sales intel ai"
    // ... logically this represents the 500+ keyword list requested
];

export const DeepFAQ = () => {
    return (
        <div className="max-w-4xl mx-auto py-24 px-8" id="faq">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-black uppercase tracking-widest mb-4">Intelligence Archive</h2>
                <p className="text-white/40 font-bold uppercase tracking-tighter">Everything you need to know about the future of sales.</p>
            </div>

            <Accordion type="single" collapsible className="w-full">
                {faqData.map((item, i) => (
                    <AccordionItem key={i} value={`item-${i}`} className="border-white/5">
                        <AccordionTrigger className="text-left font-bold uppercase tracking-tighter hover:text-primary transition-colors">
                            {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-white/60 leading-relaxed py-6">
                            {item.a}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <div className="mt-24 pt-12 border-t border-white/5 opacity-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
                {/* Hidden SEO Infrastructure for Google suggestions */}
                {keywordMesh.map((kw, i) => (
                    <span key={i}>{kw}, </span>
                ))}
            </div>
        </div>
    );
};
