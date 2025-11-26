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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">Sales Assistant</h1>
          </div>
          <p className="text-lg text-slate-600">
            Paste what your prospect said during the call. AI instantly gives you the reframe, power question, and closing tactic.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="border-2 border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                What did they say?
              </CardTitle>
              <CardDescription>
                Paste the prospect's objection or concern exactly as they said it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="e.g., 'I'm not sure about the price... seems high compared to what we're paying now' or 'This sounds like spam, how did you get my number?'"
                value={prospectText}
                onChange={(e) => setProspectText(e.target.value)}
                className="min-h-32 resize-none border-slate-200"
              />
              <Button
                onClick={handleAnalyze}
                disabled={isLoading || !prospectText.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Analyzing..." : "Analyze Objection"}
              </Button>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                AI analyzes 110+ objection types in real-time
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysis && (
            <Card className="border-2 border-green-100 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Your Reframe</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    {analysis.category}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Copy & use during your call
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Best Reframe */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">💡 Best Reframe:</p>
                  <div className="bg-white p-3 rounded border border-green-200 flex items-start gap-2">
                    <p className="text-sm text-slate-700 flex-1">{analysis.reframes[0]}</p>
                    <button
                      onClick={() => copyToClipboard(analysis.reframes[0])}
                      className="flex-shrink-0 mt-1"
                    >
                      <Copy className="w-4 h-4 text-blue-600 hover:text-blue-800" />
                    </button>
                  </div>
                </div>

                {/* Power Question */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">❓ Power Question:</p>
                  <div className="bg-white p-3 rounded border border-green-200 flex items-start gap-2">
                    <p className="text-sm text-slate-700 flex-1">{analysis.powerQuestion}</p>
                    <button
                      onClick={() => copyToClipboard(analysis.powerQuestion)}
                      className="flex-shrink-0 mt-1"
                    >
                      <Copy className="w-4 h-4 text-blue-600 hover:text-blue-800" />
                    </button>
                  </div>
                </div>

                {/* Closing Tactic */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">🎯 Closing Tactic:</p>
                  <div className="bg-white p-3 rounded border border-green-200 flex items-start gap-2">
                    <p className="text-sm text-slate-700 flex-1">{analysis.closingTactic}</p>
                    <button
                      onClick={() => copyToClipboard(analysis.closingTactic)}
                      className="flex-shrink-0 mt-1"
                    >
                      <Copy className="w-4 h-4 text-blue-600 hover:text-blue-800" />
                    </button>
                  </div>
                </div>

                {/* Story */}
                {analysis.story && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">📖 Proof Story:</p>
                    <div className="bg-white p-3 rounded border border-green-200 flex items-start gap-2">
                      <p className="text-sm text-slate-700 flex-1">{analysis.story}</p>
                      <button
                        onClick={() => copyToClipboard(analysis.story)}
                        className="flex-shrink-0 mt-1"
                      >
                        <Copy className="w-4 h-4 text-blue-600 hover:text-blue-800" />
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
                  Clear & Try Another
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* How It Works */}
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <div className="flex gap-3">
              <div className="font-bold text-blue-600">1.</div>
              <p>During your sales call, the prospect raises an objection or concern</p>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-blue-600">2.</div>
              <p>Paste exactly what they said into the box above</p>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-blue-600">3.</div>
              <p>AI analyzes it against 110+ known objections and returns your reframe</p>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-blue-600">4.</div>
              <p>One-click copy the reframe and use it immediately on the call</p>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-blue-600">5.</div>
              <p>AI learns from what you used - makes better recommendations over time</p>
            </div>
          </CardContent>
        </Card>

        {/* Free for All Plans */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-900 font-semibold">
            ✨ Sales Assistant is <span className="text-lg">FREE</span> for all plans
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Same 110+ objections database as our autonomous AI sales engine
          </p>
        </div>
      </div>
    </div>
  );
}
