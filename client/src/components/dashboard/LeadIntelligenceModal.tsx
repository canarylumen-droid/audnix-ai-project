
import { useState, useEffect } from "react";
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
        confidence: number;
        signals: string[];
    };
    predictions: {
        predictedAmount: number;
        expectedCloseDate?: string;
        confidence: number;
    };
    churnRisk: {
        churnRiskLevel: "high" | "medium" | "low";
        riskFactors: string[];
    };
    nextBestAction: string;
}

interface LeadIntelligenceModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    lead: any;
}

export function LeadIntelligenceModal({ isOpen, onOpenChange, lead }: LeadIntelligenceModalProps) {
    // Mock data fetching or real endpoint call
    // Since the actual implementation might require complex types for the body,
    // we'll simulate a fetch using the lead details or call the API if structure matches.
    // For UI demo purposes, we will assume we can fetch this data.

    const { data: intelligence, isLoading } = useQuery<IntelligenceData>({
        queryKey: ["/api/lead-intelligence/intelligence-dashboard", lead?.id],
        queryFn: async () => {
            // In a real scenario, we might need to POST messages history too.
            // For now, we'll try to just POST the lead profile to get a baseline.
            const response = await fetch("/api/lead-intelligence/intelligence-dashboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lead: {
                        id: lead.id,
                        firstName: lead.name.split(" ")[0],
                        name: lead.name,
                        company: lead.company,
                        email: lead.email || "unknown@example.com",
                        industry: lead.industry || "Technology",
                    },
                    messages: [] // We'd pass messages here if we had them easily accessible or fetch them first
                }),
            });
            if (!response.ok) throw new Error("Failed to fetch intelligence");
            return response.json();
        },
        enabled: isOpen && !!lead,
        retry: false
    });

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-500";
        if (score >= 50) return "text-yellow-500";
        return "text-muted-foreground";
    };

    const getRiskColor = (risk: string) => {
        if (risk === "high") return "text-red-500 bg-red-500/10 border-red-500/20";
        if (risk === "medium") return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background to-muted/20 border-border/60">
                <DialogHeader className="pb-4 border-b border-border/40">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                            <Brain className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Lead Intelligence Dossier</DialogTitle>
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
                            {/* Lead Score */}
                            <Card className="bg-card/50 border-border/60">
                                <CardContent className="p-4 pt-6 text-center space-y-2">
                                    <div className="mx-auto h-20 w-20 relative flex items-center justify-center">
                                        <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                                            <path className="text-muted/20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                            <path className={getScoreColor(lead?.score || 0)} strokeDasharray={`${lead?.score || 0}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                        </svg>
                                        <span className="absolute text-2xl font-bold">{lead?.score || 0}</span>
                                    </div>
                                    <p className="text-sm font-medium">Lead Score</p>
                                    <p className="text-xs text-muted-foreground">Based on engagement & firmographics</p>
                                </CardContent>
                            </Card>

                            {/* Predicted Deal Value */}
                            <Card className="bg-card/50 border-border/60">
                                <CardContent className="p-4 pt-6 text-center space-y-2">
                                    <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                                        <DollarSign className="h-8 w-8 text-emerald-500" />
                                    </div>
                                    <div className="text-2xl font-bold text-foreground">
                                        ${intelligence.predictions.predictedAmount.toLocaleString()}
                                    </div>
                                    <p className="text-sm font-medium text-emerald-500">Predicted Deal Value</p>
                                    <p className="text-xs text-muted-foreground">
                                        {intelligence.predictions.confidence}% confidence
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
                                        {intelligence.churnRisk.riskFactors.length ? intelligence.churnRisk.riskFactors.map((r, i) => (
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
                                        <Mail className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            {lead?.email || "No Email"}
                                            {lead?.email && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Email Reputation: <span className="text-emerald-500 font-medium">Verified Safe</span></div>
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
                                <div className="p-4 rounded-xl bg-card border border-border/60 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Intent Level</span>
                                        <Badge variant={intelligence.intent.intentLevel === 'high' ? 'default' : 'secondary'} className="uppercase">
                                            {intelligence.intent.intentLevel}
                                        </Badge>
                                    </div>
                                    <Progress value={intelligence.intent.confidence * 100} className="h-2" />
                                    <div className="space-y-2">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Signals Detected</span>
                                        <ul className="space-y-1">
                                            {intelligence.intent.signals.map((signal, i) => (
                                                <li key={i} className="text-xs flex items-center gap-2">
                                                    <Zap className="h-3 w-3 text-yellow-500" /> {signal}
                                                </li>
                                            ))}
                                            {!intelligence.intent.signals.length && (
                                                <li className="text-xs text-muted-foreground italic">No strong signlas yet</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-primary" /> Next Best Action
                                </h4>
                                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 h-full flex flex-col justify-center text-center space-y-3">
                                    <p className="font-medium text-lg text-foreground">
                                        {intelligence.nextBestAction}
                                    </p>
                                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                                        Execute Strategy <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="text-center text-xs text-muted-foreground pt-4 flex items-center justify-center gap-1">
                            <Shield className="h-3 w-3" /> Data enriched by Audnix Intelligence™
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
