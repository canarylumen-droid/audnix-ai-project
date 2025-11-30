import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, Sparkles, Phone, Clock } from "lucide-react";

interface ObjectionAnalysis {
  category: string;
  confidence: number;
  reframes: string[];
  powerQuestion: string;
  closingTactic: string;
  story: string;
}

export default function SalesAssistant() {
  const [prospectText, setProspectText] = useState("");
  const [analysis, setAnalysis] = useState<ObjectionAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch("/api/sales-engine/analyze-objection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectMessage: text }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to analyze objection");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setAnalysis(data);
      toast({
        title: "Objection analyzed",
        description: "Get your reframe ready for the call",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (!prospectText.trim()) {
      toast({
        title: "Enter prospect message",
        description: "Paste what the prospect said during the call",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    analyzeMutation.mutate(prospectText);
    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Ready to use during your call",
    });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Sales Assistant</h1>
          </div>
          <p className="text-base text-muted-foreground">
            Paste what your prospect said. AI gives you the reframe, power question, and closing tactic.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                What did they say?
              </CardTitle>
              <CardDescription>
                Paste the prospect's objection exactly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="e.g., 'Not sure about the price... seems high' or 'How did you get my number?'"
                value={prospectText}
                onChange={(e) => setProspectText(e.target.value)}
                className="min-h-32 resize-none"
              />
              <Button
                onClick={handleAnalyze}
                disabled={isLoading || !prospectText.trim()}
                className="w-full"
              >
                {isLoading ? "Analyzing..." : "Analyze Objection"}
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-4 h-4" />
                AI analyzes 110+ objection types
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysis && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Your Reframe</span>
                  <Badge className="bg-primary/20 text-primary">
                    {analysis.category}
                  </Badge>
                </CardTitle>
                <CardDescription>Copy & use during your call</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">💡 Reframe:</p>
                  <div className="p-3 rounded border border-primary/20 flex items-start gap-2">
                    <p className="text-sm flex-1">{analysis.reframes[0]}</p>
                    <button
                      onClick={() => copyToClipboard(analysis.reframes[0])}
                      className="flex-shrink-0 mt-1"
                    >
                      <Copy className="w-4 h-4 text-primary hover:text-primary/80" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">❓ Power Question:</p>
                  <div className="p-3 rounded border border-primary/20 flex items-start gap-2">
                    <p className="text-sm flex-1">{analysis.powerQuestion}</p>
                    <button
                      onClick={() => copyToClipboard(analysis.powerQuestion)}
                      className="flex-shrink-0 mt-1"
                    >
                      <Copy className="w-4 h-4 text-primary hover:text-primary/80" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">🎯 Closing Tactic:</p>
                  <div className="p-3 rounded border border-primary/20 flex items-start gap-2">
                    <p className="text-sm flex-1">{analysis.closingTactic}</p>
                    <button
                      onClick={() => copyToClipboard(analysis.closingTactic)}
                      className="flex-shrink-0 mt-1"
                    >
                      <Copy className="w-4 h-4 text-primary hover:text-primary/80" />
                    </button>
                  </div>
                </div>

                {analysis.story && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">📖 Story:</p>
                    <div className="p-3 rounded border border-primary/20 flex items-start gap-2">
                      <p className="text-sm flex-1">{analysis.story}</p>
                      <button
                        onClick={() => copyToClipboard(analysis.story)}
                        className="flex-shrink-0 mt-1"
                      >
                        <Copy className="w-4 h-4 text-primary hover:text-primary/80" />
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    setProspectText("");
                    setAnalysis(null);
                  }}
                >
                  Try Another
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-3">
              <div className="font-bold text-primary">1.</div>
              <p className="text-muted-foreground">During your sales call, prospect raises an objection</p>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-primary">2.</div>
              <p className="text-muted-foreground">Paste exactly what they said above</p>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-primary">3.</div>
              <p className="text-muted-foreground">AI analyzes against 110+ objections and returns reframe</p>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-primary">4.</div>
              <p className="text-muted-foreground">One-click copy and use on the call</p>
            </div>
          </CardContent>
        </Card>

        {/* Free for All Plans */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
          <p className="font-semibold">
            ✨ Sales Assistant is FREE for all plans
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Same 110+ objections database as autonomous AI sales engine
          </p>
        </div>
      </div>
    </div>
  );
}
