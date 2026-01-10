import { SolutionPageTemplate } from "./SolutionPageTemplate";
import { Users, Sparkles, Zap, Globe, MessageSquare, TrendingUp } from "lucide-react";

export default function CreatorsPage() {
    return (
        <SolutionPageTemplate
            title="Monetize Your Audience 24/7."
            subtitle="For Creators & Personal Brands"
            description="Turn your DM's into a revenue engine. Audnix AI engages every fan and prospect with your unique voice, building trust and closing deals autonomously."
            metrics={[
                { label: "DM Conversion", value: "12x", sub: "Increase vs Manual" },
                { label: "Audience Reach", value: "100%", sub: "Leads Engaged" },
                { label: "Passive Growth", value: "$12k", sub: "Avg Addl Rev / Mo" },
                { label: "Time Reclaimed", value: "25h", sub: "Saved Weekly" },
            ]}
            features={[
                { title: "Voice Cloning", desc: "Our neural engine clones your personality, slang, and tone to ensure every interaction feels authentic.", icon: Sparkles },
                { title: "Seamless Funneling", desc: "Automatically guide fans from social DMs to your high-ticket offers or digital products.", icon: Zap },
                { title: "Global Presence", desc: "Engage your audience across every time zone without ever being 'offline'.", icon: Globe },
            ]}
            useCases={[
                "Instagram DM Automation",
                "Personalized Fan Engagement",
                "High-Ticket Course Sales",
                "Community Growth Loops",
                "Automated Lead Gen in DMs"
            ]}
        />
    );
}
