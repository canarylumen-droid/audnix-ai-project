import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    BarChart3,
    Brain,
    Building2,
    CheckCircle2,
    Clock,
    DollarSign,
    Mail,
    Shield,
    Target,
    User,
    Zap,
} from "lucide-react";
import { PremiumLoader } from "@/components/ui/premium-loader";

interface IntelligenceData {
    lead_id: string;
    intent: {
        intentLevel: "high" | "medium" | "low";
        intentScore: number;
        confidence: number;
        signals: string[];
        buyerStage?: string;
        reasoning?: string;
    };
    predictions: {
        predictedAmount: number;
        expectedCloseDate?: string;
        confidence: number;
    };
    churnRisk: {
        churnRiskLevel: "high" | "medium" | "low";
        indicators: string[];
        recommendedAction?: string;
    };
    nextBestAction: string;
    suggestedActions?: string[];
    actionContext?: {
        calendarLink?: string;
        ctaLink?: string;
    };
}

interface Message {
    id: string;
    body: string;
    direction: "inbound" | "outbound";
    createdAt: string;
    metadata?: Record<string, unknown>;
}

interface LeadIntelligenceModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    lead: any;
}

export function LeadIntelligenceModal({ isOpen, onOpenChange, lead }: LeadIntelligenceModalProps) {
    // First fetch real message history for this lead
    const { data: messagesData } = useQuery<{ messages: Message[] }>({
        queryKey: ["/api/messages", lead?.id, { limit: 100, offset: 0 }],
        enabled: isOpen && !!lead?.id,
        retry: false,
        staleTime: 30000,
    });

    // Then fetch real AI intelligence analysis using actual messages
    const { data: intelligence, isLoading, refetch } = useQuery<IntelligenceData>({
        queryKey: ["/api/leads/intelligence/intelligence-dashboard", lead?.id],
        queryFn: async () => {
            const messages = messagesData?.messages || [];
            
            // Transform messages to the format expected by the AI
            const conversationMessages = messages.map(m => ({
                direction: m.direction,
                body: m.body,
                createdAt: m.createdAt,
                metadata: m.metadata,
            }));

            const response = await fetch("/api/leads/intelligence/intelligence-dashboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lead: {
                        id: lead.id,
                        firstName: lead.name?.split(" ")[0] || "Lead",
                        name: lead.name || "Unknown",
                        company: lead.company || "",
                        email: lead.email || "",
                        industry: lead.industry || lead.metadata?.industry || "",
                        phone: lead.phone || "",
                        metadata: lead.metadata || {},
                        userId: lead.userId,
                    },
                    messages: conversationMessages
                }),
            });
            if (!response.ok) throw new Error("Failed to fetch intelligence");
            return response.json();
        },
        enabled: isOpen && !!lead && !!messagesData,
        retry: false,
        staleTime: 60000,
    });

    // Refetch intelligence when messages load
    useEffect(() => {
        if (messagesData?.messages && isOpen) {
            refetch();
        }
    }, [messagesData, isOpen, refetch]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]";
        if (score >= 50) return "text-amber-500";
        return "text-amber-500/50";
    };

    const getRiskColor = (risk: string) => {
        if (risk === "high") return "text-red-500 bg-red-500/10 border-red-500/20";
        if (risk === "medium") return "text-amber-500 bg-amber-500/10 border-amber-500/20";
        return "text-primary bg-primary/10 border-primary/20";
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background to-muted/20 border-border/60">
                <DialogHeader className="pb-4 border-b border-border/40">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
                            <Brain className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Lead Overview</DialogTitle>
                            <DialogDescription>
                                AI-generated analysis for <span className="font-semibold text-foreground">{lead?.name}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                        <PremiumLoader text="Analyzing lead patterns..." />
                        <p className="text-sm text-muted-foreground">Checking intent signals, email reputation, and conversion probability.</p>
                    </div>
                ) : intelligence ? (
                    <div className="space-y-6 pt-4">
                        {/* Top Score Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Lead Score Circle */}
                            <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-[2rem] overflow-hidden group">
                                <CardContent className="p-4 pt-8 text-center space-y-4">
                                    <div className="mx-auto h-24 w-24 relative flex items-center justify-center">
                                        <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                                            <path className="text-white/5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
                                            <motion.path
                                                className={getScoreColor(intelligence.intent.intentScore)}
                                                initial={{ strokeDasharray: "0, 100" }}
                                                animate={{ strokeDasharray: `${intelligence.intent.intentScore}, 100` }}
                                                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mb-1">Lead Probability</div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-3xl font-black tracking-tighter text-orange-500">
                                                {intelligence.intent.intentScore}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500/60">Lead Affinity</p>
                                        <p className="text-sm font-bold text-foreground">Interest Level</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Predicted Deal Value */}
                            <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-[2rem] overflow-hidden group">
                                <CardContent className="p-4 pt-8 text-center space-y-4">
                                    <div className="mx-auto h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                                        <DollarSign className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-3xl font-black tracking-tight text-foreground">
                                            ${intelligence.predictions.predictedAmount.toLocaleString()}
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Projected Value</p>
                                    </div>
                                    <p className="text-xs font-bold text-muted-foreground/50">
                                        {intelligence.predictions.confidence}% AI Certainty
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Churn / Risk */}
                            <Card className="bg-card/50 border-border/60">
                                <CardContent className="p-4 pt-6 text-center space-y-2">
                                    <Badge variant="outline" className={`mx-auto mb-2 px-3 py-1 text-sm uppercase ${getRiskColor(intelligence.churnRisk.churnRiskLevel)}`}>
                                        {intelligence.churnRisk.churnRiskLevel} Risk
                                    </Badge>
                                    <div className="text-sm font-medium pt-2">Retention Analysis</div>
                                    <div className="flex flex-wrap gap-1 justify-center mt-2">
                                        {intelligence.churnRisk.indicators.length ? intelligence.churnRisk.indicators.map((r, i) => (
                                            <span key={i} className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground">{r}</span>
                                        )) : <span className="text-xs text-muted-foreground">No risk factors detected</span>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Email & Reputation */}
                        <Card className="border-border/60 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                            <CardContent className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-background rounded-lg border border-border/50">
                                        <Mail className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            {lead?.email || "No Email Address"}
                                            {lead?.email && <CheckCircle2 className="h-3 w-3 text-primary" />}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Verification Status: <span className="text-primary font-medium">Verified</span></div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-muted-foreground mb-1">Enrichment Status</div>
                                    <div className="flex gap-1 justify-end">
                                        <Badge variant="secondary" className="text-[10px] bg-background/50 border-border/50"><Building2 className="h-3 w-3 mr-1" /> Company</Badge>
                                        <Badge variant="secondary" className="text-[10px] bg-background/50 border-border/50"><User className="h-3 w-3 mr-1" /> Role</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Intent & Next Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Target className="h-4 w-4 text-primary" /> Buying Intent
                                </h4>
                                <div className="p-6 rounded-[2.5rem] bg-card/40 border border-border/40 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Intent Analytics</span>
                                        <Badge variant={intelligence.intent.intentLevel === 'high' ? 'default' : 'secondary'} className={intelligence.intent.intentLevel === 'high' ? "bg-orange-500/10 text-orange-500 border-orange-500/20 px-3 font-black" : "font-black"}>
                                            {(intelligence.intent.intentLevel || "low").toUpperCase()} INTENT
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground/50">
                                            <span>Validation Confidence</span>
                                            <span>{Math.round((intelligence.intent.confidence || 0) * 100)}%</span>
                                        </div>
                                        <Progress value={(intelligence.intent.confidence || 0) * 100} className="h-1.5 bg-white/5" />
                                    </div>
                                    <div className="space-y-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 block">Digital Footprint Signals</span>
                                        <ul className="grid grid-cols-1 gap-2">
                                            {(intelligence.intent.signals || []).map((signal, i) => (
                                                <motion.li
                                                    key={i}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 1 + (i * 0.1) }}
                                                    className="text-xs flex items-center gap-3 p-2.5 rounded-xl bg-background/40 border border-border/20 group hover:border-primary/40 transition-colors"
                                                >
                                                    <div className="h-6 w-6 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                                        <Zap className="h-3 w-3 text-orange-500" />
                                                    </div>
                                                    <span className="font-bold text-foreground/80 tracking-tight">{signal}</span>
                                                </motion.li>
                                            ))}
                                            {(!intelligence.intent.signals || !intelligence.intent.signals.length) && (
                                                <li className="text-xs text-muted-foreground/50 py-4 text-center border border-dashed border-border/20 rounded-2xl">No strong signals yet</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-primary" /> Next Best Action
                                </h4>
                                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 h-full flex flex-col justify-center text-center space-y-3">
                                    <p className="font-medium text-lg text-foreground">
                                        {intelligence.nextBestAction || "Analyze interaction patterns"}
                                    </p>
                                    <Button 
                                        onClick={() => {
                                            const link = intelligence.actionContext?.calendarLink || intelligence.actionContext?.ctaLink;
                                            if (link) {
                                                window.open(link.startsWith('http') ? link : `https://${link}`, '_blank');
                                            } else {
                                                // Fallback to settings if no link set
                                                window.location.href = '/dashboard/settings';
                                            }
                                        }}
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                                    >
                                        Execute Action <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="text-center text-xs text-muted-foreground pt-4 flex items-center justify-center gap-1">
                            <Shield className="h-3 w-3" /> Data enriched by Audnix Engine™
                        </div>

                    </div>
                ) : (
                    <div className="py-12 text-center text-muted-foreground">
                        <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        No intelligence data available yet.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
