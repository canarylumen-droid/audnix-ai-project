import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

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
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardContent className="pt-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white">Analyzing your brand PDF...</p>
          </CardContent>
        </Card>
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
