import React from "react";
import { DocumentationLayout, DocSection, DocGrid, HighlightCard } from "@/components/landing/DocumentationLayout";
import { Brain, Code, Terminal, Shield, Cpu, Zap, Database, Layers } from "lucide-react";

export default function ApiDocsPage() {
    return (
        <DocumentationLayout
            title="Engineering Protocol"
            subtitle="API & Integration Docs"
            sections={[
                {
                    id: "infrastructure",
                    title: "Architecture",
                    icon: Cpu,
                    content: (
                        <DocSection title="The Neural Core">
                            <p>Audnix is built on a distributed agent architecture. We use low-latency vector databases (Pinecone/Milvus) coupled with Gemini 1.5 Pro inference to handle decision making in real-time.</p>
                            <DocGrid>
                                <HighlightCard
                                    icon={Brain}
                                    title="Deductive Logic Layer"
                                    desc="Our primary agent decision tree is deterministic, ensuring zero hallucinations."
                                />
                                <HighlightCard
                                    icon={Layers}
                                    title="Multi-Tenant Isolation"
                                    desc="Strict data-siloing architecture ensures your brand data never leaks between agents."
                                />
                            </DocGrid>
                        </DocSection>
                    )
                },
                {
                    id: "endpoints",
                    title: "API Reference",
                    icon: Terminal,
                    content: (
                        <DocSection title="Core Endpoints">
                            <div className="space-y-6">
                                <div className="p-6 rounded-2xl bg-black border border-white/10 font-mono text-xs">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-bold uppercase">POST</span>
                                        <span className="text-white/60">/api/prospecting/v1/trigger</span>
                                    </div>
                                    <p className="text-white/30 mb-4">// Initializes an autonomous scan cycle for a specific niche.</p>
                                    <div className="text-primary">{`{ "niche": "roofing", "limit": 500, "priority": "high" }`}</div>
                                </div>

                                <div className="p-6 rounded-2xl bg-black border border-white/10 font-mono text-xs">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 font-bold uppercase">GET</span>
                                        <span className="text-white/60">/api/intelligence/leads/:id</span>
                                    </div>
                                    <p className="text-white/30 mb-4">// Retrieves the full neural profile of a verified lead.</p>
                                </div>
                            </div>
                        </DocSection>
                    )
                },
                {
                    id: "webhooks",
                    title: "Event Webhooks",
                    icon: Code,
                    content: (
                        <DocSection title="Real-time Synchronization">
                            <p>Sync Audnix events to your custom CRM or internal workflows using our high-retry webhook engine.</p>
                            <ul className="list-disc pl-5 mt-4 space-y-4 text-white/60">
                                <li><code className="text-primary">lead.verified</code>: Triggered when a prospect clears the 12-point hygiene check.</li>
                                <li><code className="text-primary">reply.positive</code>: Sent when the AI detects a high-intent response.</li>
                                <li><code className="text-primary">meeting.booked</code>: Direct signal from our calendar orchestration layer.</li>
                            </ul>
                        </DocSection>
                    )
                }
            ]}
        />
    );
}
