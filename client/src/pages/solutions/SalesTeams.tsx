import { SolutionPageTemplate } from "./SolutionPageTemplate";
import { Users, Target, Zap, Shield, MessageSquare, TrendingUp } from "lucide-react";

export default function SalesTeamsPage() {
    return (
        <SolutionPageTemplate
            title="Empower Your Elite Closers."
            subtitle="For High-Performance Sales Teams"
            description="Remove the manual follow-up grind. Let Audnix AI handle the 8-12 touches required to close while your team focuses on high-leverage closing calls."
            metrics={[
                { label: "Lead Engagement", value: "88%", sub: "Response Rate" },
                { label: "Team Velocity", value: "4x", sub: "More Calls Booked" },
                { label: "Close Rate", value: "+18%", sub: "Prequalified Leads" },
                { label: "SDR Overhead", value: "-60%", sub: "Cost Efficiency" },
            ]}
            features={[
                { title: "Objection Mastery", desc: "AI trained on 1M+ sales conversations handles every objection from price to timing flawlessly.", icon: Target },
                { title: "Instant Qualification", desc: "Leads are pre-vetted through neural dialogue before ever reaching your closer's calendar.", icon: Zap },
                { title: "Protocol Security", desc: "Enterprise-grade data protection ensures all sales intelligence stays within your organization.", icon: Shield },
            ]}
            useCases={[
                "Autonomous SDR Replacements",
                "High-Volume Lead Prequalification",
                "Infinite Follow-Up Loops",
                "Deterministic Revenue Prediction",
                "Live Dashboard Analytics"
            ]}
        />
    );
}
