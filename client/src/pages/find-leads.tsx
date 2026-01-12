import React from "react";
import { DocumentationLayout, DocSection, DocGrid, HighlightCard } from "@/components/landing/DocumentationLayout";
import { Search, Database, Users, Target, Zap, Globe, BarChart3, ShieldCheck, Mail, Instagram, Linkedin, Youtube, Fingerprint, Activity } from "lucide-react";
import { ProspectionVideo } from "@/components/landing/ProspectionVideo";

export default function FindLeadsPage() {
    return (
        <DocumentationLayout
            title="Precision Lead Discovery"
            subtitle="Autonomous Ingestion Protocol"
            sections={[
                {
                    id: "simulation",
                    title: "Live Simulation",
                    icon: Activity,
                    content: (
                        <DocSection title="System in Action">
                            <p className="mb-8">
                                Observe how the Audnix Neural Core processes complex, sentiment-driven requests. Unlike static lead databases, our system performs live, on-demand analysis of the digital landscape to find prospects based on specific "Pain Signals."
                            </p>
                            <ProspectionVideo />
                            <p className="mt-8 mb-4">
                                The simulation above demonstrates our <strong>Inference Engine</strong> identifying agency owners who are experiencing high lead-generation friction. By analyzing historical performance data and social sentiment, we filter out the "noise" and target the "bleeding" businesses that need your solution immediately.
                            </p>
                        </DocSection>
                    )
                },
                {
                    id: "logic",
                    title: "The Logic Engine",
                    icon: Target,
                    content: (
                        <DocSection title="Beyond Basic Scraping">
                            <p className="mb-8">
                                Most tools just dump a list of emails. Audnix uses a <strong>Multi-Vector Logic Engine</strong> to analyze intent before you ever click "Send." We don't just find a person; we find a reason to talk to them.
                            </p>
                            <p className="mb-8">
                                Our backend infrastructure (built on Gemini 1.5 and specialized vector stores) cross-references every prospect against four independent data silos: Professional Status, Financial Stability, Social Engagement, and Technical Infrastructure.
                            </p>
                            <DocGrid>
                                <HighlightCard
                                    icon={Search}
                                    title="Contextual Scans"
                                    desc="Our agents scan recent news, social posts, and hiring trends to identify live buying triggers and organizational shifts."
                                />
                                <HighlightCard
                                    icon={Database}
                                    title="Data Hygiene"
                                    desc="12-point verification process for every email and social handle. Zero bounce guarantee with real-time SMTP handshakes."
                                />
                                <HighlightCard
                                    icon={Fingerprint}
                                    title="Identity Resolution"
                                    desc="Mapping fragmented social identities into a single, unified prospect profile for precision targeting."
                                />
                                <HighlightCard
                                    icon={BarChart3}
                                    title="Growth Velocity"
                                    desc="Tracking employee count and revenue signals to find companies in the 'Goldilocks' scaling zone."
                                />
                            </DocGrid>
                        </DocSection>
                    )
                },
                {
                    id: "personas",
                    title: "Dynamic Personas",
                    icon: Users,
                    content: (
                        <DocSection title="Neural Identity Mapping">
                            <p className="mb-8">
                                Audnix doesn't just look for "leads"; it identifies <strong>High-Intent Personas</strong>. We process thousands of data points to categorize prospects by their likely pain points and psychological profile.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Target className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-xl font-black uppercase tracking-tight text-white">The Bleeding Founder</h4>
                                    <p className="text-sm text-white/40 leading-relaxed font-medium">Owners of service businesses with clear operational gaps. They have high volume but low automation, making them prime candidates for efficiency solutions.</p>
                                </div>
                                <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-xl font-black uppercase tracking-tight text-white">The Scale-Bound Agency</h4>
                                    <p className="text-sm text-white/40 leading-relaxed font-medium">Agencies hitting a profit ceiling due to high headcount. Our engine identifies these by analyzing hiring patterns versus client intake spikes.</p>
                                </div>
                            </div>
                        </DocSection>
                    )
                },
                {
                    id: "channels",
                    title: "Omni-Channel Discovery",
                    icon: Globe,
                    content: (
                        <DocSection title="Global Scraping Footprint">
                            <p className="mb-8">
                                Audnix navigates the entire digital landscape. Our distributed scrapers operate across all major professional and social networks to build a 360-degree view of your target market.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                                <div className="p-6 rounded-2xl bg-[#0d1117] border border-white/5 space-y-4">
                                    <Linkedin className="w-8 h-8 text-[#0077b5]" />
                                    <h4 className="font-bold text-white uppercase tracking-tight">LinkedIn Enterprise</h4>
                                    <p className="text-xs text-white/40 leading-relaxed">Cross-references employee growth, job postings, and executive sentiment to identify expansion phases.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-[#0d1117] border border-white/5 space-y-4">
                                    <Instagram className="w-8 h-8 text-[#E1306C]" />
                                    <h4 className="font-bold text-white uppercase tracking-tight">Instagram Neural</h4>
                                    <p className="text-xs text-white/40 leading-relaxed">Scans bios, followers, and engagement patterns to find high-growth creators and D2C brand owners.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-[#0d1117] border border-white/5 space-y-4">
                                    <Mail className="w-8 h-8 text-primary" />
                                    <h4 className="font-bold text-white uppercase tracking-tight">Direct Email Core</h4>
                                    <p className="text-xs text-white/40 leading-relaxed">Deep-level DNS/MX lookups and corporate structure analysis for direct decision maker access.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-[#0d1117] border border-white/5 space-y-4">
                                    <Youtube className="w-8 h-8 text-[#FF0000]" />
                                    <h4 className="font-bold text-white uppercase tracking-tight">YouTube Intelligence</h4>
                                    <p className="text-xs text-white/40 leading-relaxed">Monitors channel growth and comment section sentiment to identify creators ready for monetization.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-[#0d1117] border border-white/5 space-y-4">
                                    <Database className="w-8 h-8 text-emerald-500" />
                                    <h4 className="font-bold text-white uppercase tracking-tight">Google Maps / Local</h4>
                                    <p className="text-xs text-white/40 leading-relaxed">Identifies local service businesses based on review velocity, rating gaps, and site tech deficiencies.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-[#0d1117] border border-white/5 space-y-4">
                                    <Fingerprint className="w-8 h-8 text-purple-500" />
                                    <h4 className="font-bold text-white uppercase tracking-tight">The Dark Net Scraper</h4>
                                    <p className="text-xs text-white/40 leading-relaxed">Accesses private business registries and professional associations to find valid leads others miss.</p>
                                </div>
                            </div>
                        </DocSection>
                    )
                },
                {
                    id: "verification",
                    title: "Active Verification",
                    icon: ShieldCheck,
                    content: (
                        <DocSection title="The 12-Point Hygiene Check">
                            <p className="mb-8">
                                To ensure your domains remain healthy and your reply rates stay high, every single lead passes through our proprietary verification wall.
                            </p>
                            <div className="space-y-4">
                                {[
                                    { title: "Syntax & Domain Validation", desc: "Checking for typos and ensuring the domain is capable of receiving mail." },
                                    { title: "MX Record Deep-Dive", desc: "Confirming existence of valid mail servers." },
                                    { title: "SMTP Handshake (No Send)", desc: "Pinging the server to verify the mailbox exists without actually sending an email." },
                                    { title: "Catch-all Detection", desc: "Identifying 'risky' mailboxes that accept everything to protect your sender reputation." },
                                    { title: "Blacklist Scrubbing", desc: "Ensuring your prospects aren't already on global spam traps." }
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 font-medium">
                                        <div className="text-primary font-black uppercase text-[10px] w-8">0{i + 1}</div>
                                        <div>
                                            <h5 className="text-white text-sm mb-1 uppercase tracking-tight">{step.title}</h5>
                                            <p className="text-xs text-white/30">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DocSection>
                    )
                },
                {
                    id: "wealth",
                    title: "Neural Wealth Mapping",
                    icon: Zap,
                    content: (
                        <DocSection title="Predictive Financial Intelligence">
                            <p className="mb-8">
                                Audnix doesn't just find contact info; it finds <strong>buying power</strong>. Our system analyzes millions of public data points to estimate a prospect's liquid wealth and corporate budget.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-8 rounded-[2rem] bg-[#0d1117] border border-white/5 space-y-4">
                                    <h4 className="text-xl font-black uppercase text-white tracking-tight">Revenue Estimation</h4>
                                    <p className="text-sm text-white/40 leading-relaxed">Cross-referencing ad spend, employee growth, and average contract values to predict accurate revenue tiers.</p>
                                </div>
                                <div className="p-8 rounded-[2rem] bg-[#0d1117] border border-white/5 space-y-4">
                                    <h4 className="text-xl font-black uppercase text-white tracking-tight">Luxury Signal Detection</h4>
                                    <p className="text-sm text-white/40 leading-relaxed">Analyzing social lifestyle markers to identify high-net-worth individuals for private mastermind and coaching closures.</p>
                                </div>
                            </div>
                        </DocSection>
                    )
                }
            ]}
        />
    );
}
