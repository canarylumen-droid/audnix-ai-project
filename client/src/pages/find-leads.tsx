import React from "react";
import { DocumentationLayout, DocSection, DocGrid, HighlightCard } from "@/components/landing/DocumentationLayout";
import { Search, Database, Users, Target, Zap, Globe, BarChart3, ShieldCheck, Mail, Instagram } from "lucide-react";

export default function FindLeadsPage() {
    return (
        <DocumentationLayout
            title="Precision Lead Discovery"
            subtitle="Autonomous Ingestion Protocol"
            sections={[
                {
                    id: "logic",
                    title: "The Logic Engine",
                    icon: Target,
                    content: (
                        <DocSection title="Beyond Basic Scraping">
                            <p>
                                Most tools just dump a list of emails. Audnix uses a <strong>Multi-Vector Logic Engine</strong> to analyze intent before you ever click "Send."
                                We don't just find a person; we find a <i>reason</i> to talk to them.
                            </p>
                            <DocGrid>
                                <HighlightCard
                                    icon={Search}
                                    title="Contextual Scans"
                                    desc="Our agents scan recent news, social posts, and hiring trends to identify buying triggers."
                                />
                                <HighlightCard
                                    icon={Database}
                                    title="Data Hygiene"
                                    desc="12-point verification process for every email and social handle. Zero bounce guarantee."
                                />
                            </DocGrid>
                        </DocSection>
                    )
                },
                {
                    id: "channels",
                    title: "Omni-Channel Discovery",
                    icon: Globe,
                    content: (
                        <DocSection title="Where We Dig">
                            <p>
                                Audnix isn't limited to one platform. We navigate the entire digital landscape to build your prospect fortress.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                <div className="p-6 rounded-2xl bg-[#0d1117] border border-white/5 space-y-4">
                                    <Instagram className="w-8 h-8 text-[#E1306C]" />
                                    <h4 className="font-bold text-white">Instagram Neural</h4>
                                    <p className="text-xs text-white/40">Scans bios, followers, and engagement patterns to find high-growth creators.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-[#0d1117] border border-white/5 space-y-4">
                                    <Mail className="w-8 h-8 text-[#00d2ff]" />
                                    <h4 className="font-bold text-white">B2B Email Core</h4>
                                    <p className="text-xs text-white/40">Deep-level DNS lookups and corporate structure analysis for decision makers.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-[#0d1117] border border-white/5 space-y-4">
                                    <Database className="w-8 h-8 text-emerald-500" />
                                    <h4 className="font-bold text-white">Google Maps / Local</h4>
                                    <p className="text-xs text-white/40">Identification of service businesses based on reviews, rating gaps, and site tech.</p>
                                </div>
                            </div>
                        </DocSection>
                    )
                },
                {
                    id: "founders",
                    title: "For Founders",
                    icon: Zap,
                    content: (
                        <DocSection title="The Fundraising & Launch Protocol">
                            <p>Building in stealth or scaling to Series A? Audnix finds the specific partners you need.</p>
                            <ul className="list-disc pl-5 mt-4 space-y-4 text-white/60">
                                <li><strong className="text-primary italic">Investor Discovery:</strong> Find VCs who funded competitors in adjacent markets.</li>
                                <li><strong className="text-primary italic">Early Adopter Groups:</strong> Scrape localized tech meetups and Slack communities.</li>
                                <li><strong className="text-primary italic">PR & Media Leads:</strong> Identify journalists covering your specific tech stack.</li>
                            </ul>
                        </DocSection>
                    )
                },
                {
                    id: "agencies",
                    title: "For Agencies",
                    icon: Users,
                    content: (
                        <DocSection title="Infinite Pipeline for Clients">
                            <p>Stop the hiring cycle. Deploy Audnix to keep your client's calendars full 24/7.</p>
                            <div className="mt-6 p-6 rounded-2xl bg-primary/5 border border-primary/20 italic font-medium leading-relaxed">
                                "Audnix reduced our per-lead acquisition cost by 82% in the first 30 days by automating the manual 'VA' work of cleaning lists and finding fresh targets."
                            </div>
                        </DocSection>
                    )
                }
            ]}
        />
    );
}
