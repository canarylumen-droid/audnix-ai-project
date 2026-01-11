import { SolutionPageTemplate } from "./SolutionPageTemplate";
import { Users, Database, Globe, Zap, MessageSquare, TrendingUp, ScanSearch, Bot } from "lucide-react";

export default function AgenciesPage() {
    return (
        <SolutionPageTemplate
            title="Scale Without Headcount."
            subtitle="For Growth-Focused Agencies"
            description="Stop hiring expensive VAs to do manual outreach. Audnix deploys autonomous prospecting and closing agents for every client in your roster, syncing leads instantly to your CRM."
            metrics={[
                { label: "Margin / Client", value: "+40%", sub: "Net Profit Increase" },
                { label: "Manual Labor", value: "-95h", sub: "Hours Saved / Month" },
                { label: "Client Retention", value: "98%", sub: "Through Results" },
                { label: "Meeting Show Rate", value: "2x", sub: "Vs Cold Email" },
            ]}
            features={[
                {
                    title: "Infinite Prospecting Engine",
                    desc: "Don't just wait for leads. Our engine scrapes targeted prospects from LinkedIn, Instagram, and Google Maps tailored to your client's niche.",
                    icon: ScanSearch
                },
                {
                    title: "White-Label Neural Cloning",
                    desc: "Train a unique AI agent for each client that perfectly mimics their tone, handles their specific objections, and books meetings in their name.",
                    icon: Bot
                },
                {
                    title: "Automated ROI Reporting",
                    desc: "Your clients see the meetings, not the messy middle. Generate automated, white-label performance reports that prove your agency's value.",
                    icon: TrendingUp
                },
            ]}
            useCases={[
                "Automated Cold Outreach for Clients",
                "Instant Lead Qualification & Routing",
                "Reactivating Dead Client Lists",
                "24/7 Response on Weekends & Holidays",
                "Zero-Touch Meeting Booking"
            ]}
            problemTitle="The 'Scale-Break' Paradox"
            problemText={`
                You started your agency to buy freedom, but somewhere along the way, you built yourself another job. 
                
                The 'Scale-Break' Paradox is what kills 90% of agencies between $10k and $50k MRR. It works like this:
                To get more clients, you need to send more outreach. To send more outreach, you need to hire more SDRs or VAs. 
                SDRs are expensive ($3k-$5k/mo), require constant management, and often have bad days.
                VAs are cheaper but require intense training, have language barriers, and often paste the wrong scripts.
                
                So, you hire them. Your payroll swells. Your margins shrink.
                Then, your new hires make mistakes. They ghost leads. They sound robotic. 
                Your clients start complaining. "The leads are bad," they say. "Nobody is booking calls."
                
                Client A churns. Then Client B.
                Suddenly, you're back to square one—doing all the sales yourself just to keep the lights on, but now with a bloated payroll you can't afford.
                
                This is the Churn Cycle. It's the silent killer of agency growth.
                
                Audnix breaks this cycle permanently.
                By replacing human SDRs with autonomous neural agents, you decouple your revenue from your headcount.
                You can onboard 10 new clients tomorrow without hiring a single new person.
                Your margins explode because your cost-per-agent is a fraction of a human salary.
                Your quality goes UP, not down, because the AI never forgets a script, never gets tired, and never has a 'bad day'.
            `}
            deepDiveTitle="Multi-Tenant Neural Ops"
            deepDiveText={`Audnix was built for agencies first. Our 'Commander' dashboard allows you to toggle between 50+ client sub-accounts in seconds.
            
            Each client gets their own isolated 'Brain' (Knowledge Base) and 'Voice' (Style Guide). This means Client A's bot will never talk like Client B's bot.
            
            You can verify ROI with our 'Deterministic Attribution' engine. We track exactly which AI conversation led to a booked meeting or sale, giving you undeniable proof of performance to show your clients.`}
            faqs={[
                { question: "Can I white-label this?", answer: "Yes. The reports and client-facing dashboards can be branded with your agency's logo and domain." },
                { question: "Do I pay per client?", answer: "We have agency volumes packs. The more clients you onboard, the cheaper the per-seat cost becomes." },
                { question: "How fast is onboarding?", answer: "You can spin up a new client agent in about 30 minutes once you have their offer docs and login details." },
                { question: "Does it work for B2B?", answer: "Yes. Our LinkedIn and Email modules are specifically designed for B2B lead generation and appointment setting." },
                { question: "Can it handle complex offers?", answer: "Yes. The AI can be trained on technical specifications, case studies, and complex objection handling trees." }
            ]}
        />
    );
}
