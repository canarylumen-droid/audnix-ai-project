import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Zap, Brain, Sparkles } from "lucide-react";

interface PDFChecklistItem {
  name: string;
  present: boolean;
  required: boolean;
}

interface PDFAnalysisResult {
  overall_score: number;
  items: PDFChecklistItem[];
  missing_critical: string[];
  recommendations: string[];
}

export function PDFUploadModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PDFAnalysisResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("pdf", selectedFile);

      const response = await fetch("/api/admin/analyze-pdf", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysis(result);
      } else {
        toast({
          title: "Error",
          description: "Failed to analyze PDF",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error analyzing PDF:", error);
      toast({
        title: "Error",
        description: "Failed to analyze PDF",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpload = async (forceContinue = false) => {
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("skipValidation", String(forceContinue));

      const response = await fetch("/api/admin/upload-brand-pdf", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Brand PDF uploaded successfully",
        });
        onClose();
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to upload PDF",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!file) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Upload Your Brand PDF</CardTitle>
            <CardDescription>
              Help your AI closer sound exactly like you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm text-gray-300 font-semibold">What to include:</p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>✓ Company overview (what you do, who you serve)</li>
                <li>✓ Your offer (pricing, packages, deliverables)</li>
                <li>✓ Your tone (formal, casual, friendly, bold)</li>
                <li>✓ Success stories / wins</li>
                <li>✓ Objections you handle often</li>
                <li>✓ Your brand language (prefer/avoid)</li>
                <li>✓ Target client description</li>
              </ul>
            </div>

            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-input"
              />
              <label htmlFor="pdf-input">
                <Button
                  asChild
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold cursor-pointer"
                >
                  <span>Select PDF</span>
                </Button>
              </label>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Clear details = better AI responses. Include specific details.
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={onClose}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (analyzing) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="w-full bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 overflow-hidden">
            <CardContent className="pt-8 text-center space-y-6">
              {/* Animated AI brain */}
              <div className="flex justify-center gap-6 h-12">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-cyan-400"
                >
                  <Brain className="w-8 h-8" />
                </motion.div>
                
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-purple-400"
                >
                  <Zap className="w-8 h-8" />
                </motion.div>
                
                <motion.div
                  animate={{ rotate: [0, 360], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-yellow-400"
                >
                  <Sparkles className="w-8 h-8" />
                </motion.div>
              </div>

              {/* Main text */}
              <div className="space-y-2">
                <motion.p
                  animate={{ opacity: [0.8, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-white font-semibold text-lg"
                >
                  🧠 AI is analyzing...
                </motion.p>
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-slate-300 text-sm"
                >
                  Extracting context • Understanding tone • Learning your brand
                </motion.p>
              </div>

              {/* Animated progress bar */}
              <div className="space-y-2">
                <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ 
                      width: ['0%', '100%', '0%'],
                      backgroundPosition: ['0% center', '100% center', '0% center']
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                  />
                </div>
                <p className="text-xs text-slate-400">Analyzing quality...</p>
              </div>

              {/* Floating particles effect */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      x: [0, Math.random() * 100 - 50],
                      y: [0, Math.random() * 100 - 50],
                      opacity: [1, 0],
                    }}
                    transition={{
                      duration: 2 + i * 0.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                    className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                    style={{
                      left: `${25 + i * 25}%`,
                      top: '50%',
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (analysis) {
    const missingCount = analysis.missing_critical.length;
    const hasIssues = missingCount > 0;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700 max-h-[80vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Brand PDF Analysis</CardTitle>
                <CardDescription>Quality Score: {analysis.overall_score}%</CardDescription>
              </div>
              <div className="text-2xl font-bold">{analysis.overall_score}%</div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Checklist */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Content Found:</p>
              {analysis.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm"
                >
                  {item.present ? (
                    <span className="text-green-400">✅</span>
                  ) : (
                    <span className="text-red-400">❌</span>
                  )}
                  <span className={item.present ? "text-gray-300" : "text-gray-500"}>
                    {item.name}
                    {item.required && !item.present && " (required)"}
                  </span>
                </div>
              ))}
            </div>

            {/* Missing Critical */}
            {hasIssues && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm font-semibold text-red-300 mb-2">
                  ⚠️ Missing {missingCount} critical item{missingCount > 1 ? "s" : ""}:
                </p>
                <ul className="text-xs text-red-200 space-y-1">
                  {analysis.missing_critical.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-sm font-semibold text-blue-300 mb-2">💡 Recommendations:</p>
                <ul className="text-xs text-blue-200 space-y-1">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-2 pt-4 border-t border-slate-700">
              {hasIssues ? (
                <>
                  <Button
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                    onClick={() => {
                      setFile(null);
                      setAnalysis(null);
                    }}
                  >
                    Go Back & Fix
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleUpload(true)}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Continue Anyway"}
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                  onClick={() => handleUpload()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload PDF"}
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={onClose}
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
