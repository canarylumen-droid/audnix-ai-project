import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Zap,
  Brain,
  Copy,
  CheckCircle,
  MessageSquare,
  Lightbulb,
  TrendingUp,
  Phone,
} from "lucide-react";

interface AssistantResponse {
  reframe: string;
  question: string;
  tactic: string;
  copied: boolean;
}

export function SalesAssistant() {
  const [prospectSays, setProspectSays] = useState("");
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGetResponse = async () => {
    if (!prospectSays.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/sales-engine/analyze-objection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objection: prospectSays,
          industry: "all",
        }),
        credentials: "include",
      });

      const data = await res.json();

      setResponse({
        reframe: data.reframes?.[0] || "Let me reframe that for you...",
        question: data.questions?.[0] || "What would make this work for you?",
        tactic: data.closingTactics?.[0] || "Assume the close",
        copied: false,
      });
    } catch (error) {
      console.error("Error getting response:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Phone className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">Sales Assistant</h1>
            <Zap className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-lg text-white/80">
            Real-time cheat sheet for handling objections during calls
          </p>
        </motion.div>

        {/* Main Input Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-cyan-400" />
                What Did They Just Say?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-white/70 mb-2">
                  Paste exactly what your prospect said (copy from chat/transcript):
                </p>
                <textarea
                  value={prospectSays}
                  onChange={(e) => setProspectSays(e.target.value)}
                  placeholder="E.g., 'Let me think about it' or 'It's too expensive' or 'I need to talk to my team first'"
                  className="w-full h-24 bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <Button
                onClick={handleGetResponse}
                disabled={!prospectSays.trim() || loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 rounded-lg transition"
              >
                {loading ? "Analyzing..." : "Get Instant Response →"}
              </Button>

              <p className="text-xs text-white/60 text-center">
                ⚡ Real-time AI analysis - Get your response in seconds
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Response Cards */}
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* What to Say - Reframe */}
            <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border-emerald-500/30 relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="w-5 h-5 text-emerald-400" />
                  What to Say (Reframe)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-emerald-500/20">
                  <p className="text-white text-lg leading-relaxed italic">
                    "{response.reframe}"
                  </p>
                </div>
                <Button
                  onClick={() => copyToClipboard(response.reframe, "reframe")}
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full"
                >
                  {copied === "reframe" ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Closing Question */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  Then Ask Them This
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/20">
                  <p className="text-white text-lg leading-relaxed">
                    "{response.question}"
                  </p>
                </div>
                <Button
                  onClick={() => copyToClipboard(response.question, "question")}
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full"
                >
                  {copied === "question" ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Question
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Closing Tactic */}
            <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/5 border-orange-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-orange-400" />
                  How to Close
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-orange-500/20">
                  <p className="text-white text-base leading-relaxed">
                    {response.tactic}
                  </p>
                </div>
                <Button
                  onClick={() => copyToClipboard(response.tactic, "tactic")}
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full"
                >
                  {copied === "tactic" ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Tactic
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Another Objection Button */}
            <Button
              onClick={() => {
                setProspectSays("");
                setResponse(null);
              }}
              variant="outline"
              className="w-full text-white border-white/20 hover:bg-white/5"
            >
              Handle Another Objection
            </Button>
          </motion.div>
        )}

        {/* Tips Section */}
        {!response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-4"
          >
            <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/30">
              <CardContent className="pt-6">
                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-400" />
                  How It Works
                </h3>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>✓ Paste what prospect said</li>
                  <li>✓ Get instant reframe</li>
                  <li>✓ See closing question</li>
                  <li>✓ Copy & paste while on call</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/10 to-teal-500/5 border-cyan-500/30">
              <CardContent className="pt-6">
                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Pro Tips
                </h3>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>✓ Use during live calls</li>
                  <li>✓ Reference during meetings</li>
                  <li>✓ Learn from responses</li>
                  <li>✓ Improve objection handling</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default SalesAssistant;
