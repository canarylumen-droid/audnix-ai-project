import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Brain, Lightbulb, TrendingUp, MessageSquare, Target } from "lucide-react";

interface ObjectionResponse {
  objection: string;
  category: string;
  reframes: string[];
  questions: string[];
  closingTactics: string[];
  nextStep: string;
}

export function ObjectionsHandler() {
  const [prospectObjection, setProspectObjection] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("creator");
  const [response, setResponse] = useState<ObjectionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const industries = [
    "creator",
    "agency",
    "founder",
    "retailer",
    "B2B",
    "coach",
    "all",
  ];

  const handleAnalyzeObjection = async () => {
    if (!prospectObjection.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/sales-engine/analyze-objection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objection: prospectObjection,
          industry: selectedIndustry,
        }),
        credentials: "include",
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error("Error analyzing objection:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            Prospect Objection Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-white/70 mb-2 block">
              What did your prospect say?
            </label>
            <textarea
              value={prospectObjection}
              onChange={(e) => setProspectObjection(e.target.value)}
              placeholder="E.g., 'Let me think about it' or 'It's too expensive' or 'I'll tell my wife'"
              className="w-full h-24 bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-sm text-white/70 mb-2 block">
              Your Industry
            </label>
            <div className="grid grid-cols-4 gap-2">
              {industries.map((ind) => (
                <button
                  key={ind}
                  onClick={() => setSelectedIndustry(ind)}
                  className={`py-2 px-3 rounded text-sm font-medium transition ${
                    selectedIndustry === ind
                      ? "bg-cyan-500 text-white"
                      : "bg-slate-700 text-white/70 hover:bg-slate-600"
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleAnalyzeObjection}
            disabled={!prospectObjection.trim() || loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold"
          >
            {loading ? "Analyzing..." : "Analyze Objection & Get Response"}
          </Button>
        </CardContent>
      </Card>

      {/* Response Section */}
      {response && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Objection Category */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wide">
                    Objection Type
                  </p>
                  <p className="text-lg font-semibold text-white capitalize">
                    {response.category}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reframes */}
          <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border-emerald-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5 text-emerald-400" />
                How to Reframe This
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {response.reframes.map((reframe, idx) => (
                  <li key={idx} className="flex gap-2 text-white/90">
                    <span className="text-emerald-400 font-bold">→</span>
                    <span>{reframe}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Questions to Ask */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                Closing Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {response.questions.map((question, idx) => (
                  <li key={idx} className="flex gap-2 text-white/90">
                    <span className="text-purple-400 font-bold">Q:</span>
                    <span>"{question}"</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Closing Tactics */}
          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/5 border-orange-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-orange-400" />
                Closing Tactics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {response.closingTactics.map((tactic, idx) => (
                  <li key={idx} className="flex gap-2 text-white/90">
                    <span className="text-orange-400 font-bold">•</span>
                    <span>{tactic}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Next Step */}
          <Card className="bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border-cyan-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wide mb-1">
                    Next Step
                  </p>
                  <p className="text-white/90">{response.nextStep}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => {
              setProspectObjection("");
              setResponse(null);
            }}
            variant="outline"
            className="w-full"
          >
            Analyze Another Objection
          </Button>
        </motion.div>
      )}

      {/* Tips Section */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-sm">💡 Pro Tips for Handling Objections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-white/80">
          <p>✓ Listen fully before responding - understand the REAL objection</p>
          <p>✓ Validate their concern - don't dismiss it</p>
          <p>✓ Ask questions instead of giving answers</p>
          <p>✓ Use stories from similar companies - they're more believable</p>
          <p>✓ Focus on their ROI, not your features</p>
          <p>✓ Assume the close - "When we get you started..."</p>
          <p>✓ One objection = interest - they're still in the conversation</p>
        </CardContent>
      </Card>
    </div>
  );
}
