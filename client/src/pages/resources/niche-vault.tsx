import React from "react";
import { DocumentationLayout, DocSection, DocGrid, HighlightCard } from "@/components/landing/DocumentationLayout";
import { LayoutGrid, Shield, Zap, Target, Rocket, Search, Users, Database, Globe, Briefcase } from "lucide-react";

export default function NicheVaultPage() {
    return (
        <DocumentationLayout
            title="Niche Intelligence Vault"
            subtitle="20+ Pre-Trained Sectors"
            sections={[
                {
                    id: "overview",
                    title: "Sector Overview",
                    icon: LayoutGrid,
                    content: (
                        <DocSection title="Specialized Neural Clusters">
                            <p>
                                Audnix doesn't use generic AI. Our agents are organized into <strong>Niche Clusters</strong>. Each cluster is pre-loaded with industry terminology, objection patterns, and closing cycles specific to that market.
                            </p>
                            <DocGrid>
                                <HighlightCard
                                    icon={Briefcase}
                                    title="Professional Services"
                                    desc="Tailored for Legal, Accounting, and high-ticket Consulting."
                                />
                                <HighlightCard
                                    icon={Globe}
                                    title="Digital Media"
                                    desc="Specialized in Creative Agencies and Personal Brand scaling."
                                />
                            </DocGrid>
                        </DocSection>
                    )
                },
                {
                    id: "industries",
                    title: "The Top 20",
                    icon: Database,
                    content: (
                        <DocSection title="Pre-Analyzed Markets">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { name: "Roofing & Solar", focus: "Storm-damage triggers & permit data." },
                                    { name: "Real Estate SaaS", focus: "CRM migration & lead management." },
                                    { name: "SaaS B2B", focus: "Enterprise churn & tech-stack replacement." },
                                    { name: "Venture Capital", focus: "LP discovery & portfolio matching." },
                                    { name: "Fintech Ops", focus: "Compliance and security-first outreach." },
                                    { name: "EdTech", focus: "Curriculum director outreach." },
                                    { name: "HealthTech", focus: "Clinic and hospital network integration." },
                                    { name: "Logistics", focus: "Supply chain bottleneck solving." },
                                    { name: "Manufacturing", focus: "Industrial equipment sales." },
                                    { name: "Law Firms", focus: "Case acquisition & plaintiff discovery." }
                                ].map((n, i) => (
                                    <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                                        <h4 className="text-sm font-bold text-primary mb-1 uppercase tracking-tighter">{n.name}</h4>
                                        <p className="text-[10px] text-white/40 font-medium">{n.focus}</p>
                                    </div>
                                ))}
                            </div>
                        </DocSection>
                    )
                },
                {
                    id: "case-studies",
                    title: "Performance Metrics",
                    icon: Zap,
                    content: (
                        <DocSection title="Real-World Inbound Results">
                            <p>Every niche follows a deterministic success path engineered over 1M+ conversations.</p>
                            <DocGrid>
                                <div className="p-8 rounded-[2rem] bg-black border border-white/5 space-y-4">
                                    <div className="text-4xl font-black text-white italic tracking-tighter">4.2x</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-primary">Conversion Velocity</div>
                                    <p className="text-xs text-white/40">Average increase in meeting volume for B2B Agency clients.</p>
                                </div>
                                <div className="p-8 rounded-[2rem] bg-black border border-white/5 space-y-4">
                                    <div className="text-4xl font-black text-white italic tracking-tighter">$12k</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-primary">Labor Recovery</div>
                                    <p className="text-xs text-white/40">Monthly savings on SDR headcount per 1,000 leads.</p>
                                </div>
                            </DocGrid>
                        </DocSection>
                    )
                }
            ]}
        />
    );
}
