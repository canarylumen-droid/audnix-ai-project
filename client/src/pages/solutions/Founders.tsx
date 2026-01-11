import { SolutionPageTemplate } from "./SolutionPageTemplate";
import { Users, Target, Zap, Shield, Wallet, Crown } from "lucide-react";

export default function FoundersPage() {
    return (
        <SolutionPageTemplate
            title="Clone Your Best Closer."
            subtitle="For Founders & High-Ticket Sales"
            description="You are the bottleneck. You can't take every call or reply to every DM. Audnix clones your sales logic so you can stop doing demos for unqualified leads and start closing deal flow on autopilot."
            metrics={[
                { label: "Calendar Efficiency", value: "100%", sub: "Only Qualified Calls" },
                { label: "Deal Velocity", value: "3x", sub: "Faster Close Rates" },
                { label: "Founder Time", value: "+20h", sub: "Saved Per Week" },
                { label: "Cost vs SDR", value: "-90%", sub: "More Profit" },
            ]}
            features={[
                { title: "Surgical Qualification", desc: "The AI grills leads on budget and timeline before they ever see your calendar link.", icon: Target },
                { title: "Founder-Level Logic", desc: "It doesn't just read a script. It uses your past successful calls to navigate complex negotiations.", icon: Crown },
                { title: "Instant Response", desc: "Leads are contacted within seconds of interest, drastically increasing conversion rates over human SDRs.", icon: Zap },
            ]}
            useCases={[
                "Replacing Expensive Sales Reps",
                "Filtering Out 'Tire Kickers'",
                "Reactivating Old Leady Lists",
                "Handling Pricing Objections 24/7",
                "Scaling Offer Testing Rapidly"
            ]}
            problemTitle="The Founder's Bottleneck"
            problemText={`
                There is a brutal truth in B2B sales:
                Nobody sells the product as well as the Founder.
                
                You know the vision. You know the pain points. You have the passion.
                When you take the call, the close rate is 40%.
                When you hire a sales rep, it drops to 15%.
                
                But you cannot take every call. You have a product to build, a team to manage, and a vision to execute.
                So you are stuck in the 'Founder's Bottleneck'.
                
                You try to hire sales reps. It's a nightmare.
                You pay a recruiter $10k. You pay the rep a $5k base.
                You spend 3 months training them. They burn your leads. They miss follow-ups. They don't handle objections correctly.
                Then, just as they start to get good—they quit for a higher commission elsewhere.
                
                Meanwhile, your calendar is full of "tire kickers"—people who booked a time but have $0 budget.
                You spend 30 minutes on a Zoom call just to find out they can't afford you.
                That is 30 minutes of your life you will never get back.
                
                Audnix removes this friction entirely.
                We clone your sales logic—your best objection handlers, your qualification criteria, your tone—into an autonomous agent.
                
                This agent sits at the front door. It talks to every lead.
                It asks the hard questions: "What is your budget?", "When are you looking to start?", "Who is the decision maker?"
                
                It ruthlessly filters out the unqualified leads.
                It nurtures the 'maybe' leads.
                And it only puts the 'Hell Yes' leads on your calendar.
                
                Stop doing unpaid consulting. Start closing deal flow.
            `}
            deepDiveTitle="The Closer Protocol"
            deepDiveText={`We analyzed over 100,000 successful high-ticket sales conversations to build our 'Closer Protocol' logic.
            
            Audnix doesn't just answer questions; it drives the conversation. It uses 'Micro-Agreements', 'Labeling', and 'Mirroring' techniques (from Chris Voss negotiation frameworks) to uncover real pain points.
            
            It will respectfully challenge prospects who say 'it's too expensive' by re-anchoring the conversation to the cost of inaction. It qualifies strictly: if a lead doesn't have the budget, it won't let them book a call.`}
            faqs={[
                { question: "Can it really replace a human?", answer: "For the initial qualification and appointment setting phase: Yes, and often better. For the final closing call on a $10k+ offer, you might still want a human, but Audnix ensures that human only talks to qualified buyers." },
                { question: "What CRMs do you integrate with?", answer: "We integrate natively with HubSpot, Salesforce, GoHighLevel, and Slack. We also have a robust Zapier integration." },
                { question: "How much time does it save?", answer: "Founders typically save 20-30 hours a week by removing themselves from the inbox and initial discovery calls." },
                { question: "Is there a setup fee?", answer: "No. Our self-serve plans allow you to get started instantly. We do offer white-glove onboarding for larger teams." },
                { question: "What if my offer changes?", answer: "You can update the AI's knowledge base in seconds. Just upload a new PDF or edit the text instructions." }
            ]}
        />
    );
}
