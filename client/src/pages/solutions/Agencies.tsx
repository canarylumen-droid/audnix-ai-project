import { SolutionPageTemplate } from "./SolutionPageTemplate";
import { Users, Database, Globe, Zap, MessageSquare, TrendingUp } from "lucide-react";

export default function AgenciesPage() {
    return (
        <SolutionPageTemplate
            title="Scale Results for Every Client."
            subtitle="For Agencies & White-Label Partners"
            description="Automate the recovery and engagement process for your entire client roster. Deploy white-labeled intelligence that books meetings while you sleep."
            metrics={[
                { label: "Recovery Rate", value: "24%", sub: "Avg. ROI Increase" },
                { label: "Management Time", value: "-80%", sub: "Manual Labor Saved" },
                { label: "Client Retention", value: "92%", sub: "Protocol Efficiency" },
                { label: "Meeting Yield", value: "9x", sub: "VS Standard Outreach" },
            ]}
            features={[
                { title: "Multi-Client Control", desc: "Manage 100+ client accounts from a single unified command center with per-account neural training.", icon: Database },
                { title: "White-Label Reports", desc: "Generate deterministic USD tracking reports branded for your agency to show undeniable client ROI.", icon: TrendingUp },
                { title: "Neural Synchronization", desc: "Our AI learns each client's unique brand voice and objection patterns in less than 2 minutes.", icon: Zap },
            ]}
            useCases={[
                "Automated High-Ticket Lead Recovery",
                "Deterministic ROI Reporting for Clients",
                "24/7 Lead Nurturing & Qualification",
                "Seamless CRM Integration (Zapier/Direct)",
                "Global Infrastructure Scaling"
            ]}
        />
    );
}
