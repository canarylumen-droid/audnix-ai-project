import { SolutionPageTemplate } from "./SolutionPageTemplate";
import { Sparkles, Zap, Globe, MessageSquare, Wallet, Instagram } from "lucide-react";

export default function CreatorsPage() {
    return (
        <SolutionPageTemplate
            title="Monetize Every DM."
            subtitle="For Creators & Personal Brands"
            description="Your DMs are a goldmine, but you can't reply to everyone. Audnix turns your inbox into a 24/7 sales machine that engages fans, qualifies buyers, and sells your products while you create content."
            metrics={[
                { label: "DM Reply Rate", value: "100%", sub: "No Fan Left Behind" },
                { label: "Sales Conversion", value: "18%", sub: "From Cold DM" },
                { label: "Passive Revenue", value: "$15k+", sub: "Avg Monthly Add-on" },
                { label: "Hours Saved", value: "30h", sub: "Weekly Admin Time" },
            ]}
            features={[
                {
                    title: "Smart DM Funnels",
                    desc: "Automatically detect buying intent in DMs. If a fan asks about your course or coaching, Audnix guides them to the checkout page instantly.",
                    icon: Instagram
                },
                {
                    title: "Persona Verification",
                    desc: "The AI learns your slang, emojis, and vibe. Fans won't know they're talking to a bot—they'll just feel heard and valued.",
                    icon: Sparkles
                },
                {
                    title: "High-Ticket Closer",
                    desc: "For coaching offers >$1k, the AI acts as an SDR, qualifying the lead's budget and pain points before booking a call for you.",
                    icon: Wallet
                },
            ]}
            useCases={[
                "Selling Digital Products on Autopilot",
                "Booking High-Ticket Coaching calls",
                "Engaging 100% of Fan Replies",
                "Filter Out Time-Wasters Automatically",
                "Upsell Free Followers to Paid Communities"
            ]}
            problemTitle="The Engagement Trap"
            problemText={`
                You’ve built the audience. You have the views. You have the likes.
                But your bank account doesn't reflect your influence. Why?
                
                Because 'Attention' is not 'Revenue.' To turn attention into revenue, you need one thing: Conversation.
                
                Here lies the trap:
                If you have 100,000 followers, you likely get 50-200 DMs a day.
                "How much is your course?"
                "Do you offer coaching?"
                "I love your video!"
                
                You have two choices, and both of them suck:
                1. Reply to everyone yourself. You spend 4 hours a day in the inbox. You burn out. You stop making content. Your channel dies.
                2. Ignore them. You leave thousands of dollars on the table every single day. Your fans feel ignored. Your community weakens.
                
                Most creators try to hire a VA to help. But a VA doesn't know your voice. They sound stiff. They send generic links. Your fans know it's not you, and the trust is broken.
                
                This is the 'Engagement Gap'. It's the glass ceiling of the creator economy.
                
                Audnix shatters this ceiling by cloning YOU.
                Not a chatbot. A digital extension of your mind.
                We train the model on your YouTube transcripts, your tweets, your emails. It learns your slang, your emojis, your worldview.
                
                It replies to every single fan, instantly. It jokes with them. It answers their specific questions.
                And when they are ready? It drops the link to your course or community.
                
                You get to be the Creator again. Let Audnix be the Closer.
            `}
            deepDiveTitle="Persona Authentication Layer"
            deepDiveText={`Audnix isn't a chatbot. It's a neural clone of your digital persona.
            
            We ingest your YouTube transcripts, past DM history, and course content to build a 'Knowledge Graph' of your worldview.
            
            When a fan asks a question, the AI doesn't just look up an answer. It constructs a response using your vocabulary, your sentence structure, and your specific teaching style. It even knows when to use emojis or when to be serious.
            
            This allows you to scale 'intimacy'—providing a 1-on-1 feeling to millions of followers simultaneously.`}
            faqs={[
                { question: "Will it sound like a robot?", answer: "No. The system is trained on YOUR specific data (videos, tweets, emails). It mimics your slang, tone, and even your typing style (lowercase vs uppercase, etc)." },
                { question: "Can I take over the chat?", answer: "Yes. The dashboard allows you to jump into any conversation live. The AI will pause immediately when it detects you typing." },
                { question: "Does it work for high-ticket?", answer: "Absolutely. We have specialized modules for high-ticket qualifying. It asks about budget, timeline, and pain points before ever sending a calendar link." },
                { question: "Is it safe for my account?", answer: "Yes. We use official Meta/Instagram APIs. We do not use unsafe scraping or 'login sharing' methods that get accounts banned." },
                { question: "What if it says something wrong?", answer: "You have full control. You can set 'Guardrails' and 'Never-Say' lists. You can also review all logs in real-time." }
            ]}
        />
    );
}
