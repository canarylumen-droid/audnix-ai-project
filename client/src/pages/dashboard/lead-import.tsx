
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { PdfIcon, CsvIcon } from "@/components/ui/CustomIcons";

export default function LeadImportPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ imported: number; skipped: number } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isPDF = selectedFile.name.toLowerCase().endsWith('.pdf');
    const isCSV = selectedFile.name.toLowerCase().endsWith('.csv');
    const isExcel = selectedFile.name.toLowerCase().match(/\.(xlsx|xls)$/i);

    if (!isPDF && !isCSV && !isExcel) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV, Excel, or PDF file",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    setImportResults(null);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(10);
    const formData = new FormData();

    const isPDF = file.name.toLowerCase().endsWith('.pdf');

    if (isPDF) {
      formData.append('pdf', file);
    } else {
      formData.append('csv', file);
    }

    try {
      setProgress(30);
      const endpoint = isPDF ? '/api/leads/import-pdf' : '/api/leads/import-csv';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      setProgress(70);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Import failed');
      }

      const result = await response.json();
      setProgress(100);

      setImportResults({
        imported: result.leadsImported || result.imported || 0,
        skipped: result.duplicates || result.skipped || 0
      });

      toast({
        title: "Import Complete",
        description: isPDF
          ? `Extracted ${result.leadsImported || 0} leads from PDF`
          : `Imported ${result.imported || 0} leads, ${result.skipped || 0} duplicates skipped`
      });

      setTimeout(() => setFile(null), 3000);
    } catch (error: any) {
      setProgress(0);
      toast({
        title: "Import failed",
        description: error.message || `Could not process ${isPDF ? 'PDF' : 'CSV'} file`,
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setImporting(false);
        setProgress(0);
      }, 2000);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Lead Import</h1>
        <p className="text-muted-foreground text-lg">
          Upload your contact lists to begin automated outreach.
        </p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Upload className="h-5 w-5 text-primary" />
            Direct Upload
          </CardTitle>
          <CardDescription>
            Selected file will be analyzed for contact information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:bg-muted/30 transition-all cursor-pointer group">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              onChange={handleFileUpload}
              disabled={importing}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="mb-6 flex justify-center">
                {file ? (
                  file.name.toLowerCase().endsWith('.pdf') ? <PdfIcon /> : <CsvIcon />
                ) : (
                  <div className="p-4 rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                )}
              </div>
              <p className="text-lg font-semibold mb-2">
                {file ? file.name : 'Click to select or drag & drop'}
              </p>
              <p className="text-sm text-muted-foreground">
                Supports CSV, Excel, and PDF formats
              </p>
            </label>
          </div>

          {file && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 p-4 bg-muted/50 border border-border rounded-xl"
            >
              <div className="w-10 h-10 flex items-center justify-center">
                {file.name.toLowerCase().endsWith('.pdf') ? <PdfIcon /> : <CsvIcon />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  {file.name}
                </p>
                {importResults && (
                  <p className="text-xs text-muted-foreground">
                    {importResults.imported} entries imported • {importResults.skipped} duplicates
                  </p>
                )}
              </div>
              {importResults && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </motion.div>
          )}

          {importing && progress > 0 && (
            <div className="space-y-3">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs font-medium text-center text-muted-foreground">
                {progress < 30 ? 'Uploading file...' : progress < 70 ? 'Processing engagement data...' : 'Finalizing leads...'}
              </p>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/10"
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Start Import'
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'CSV', desc: 'Standard contact export', icon: <CsvIcon /> },
          { label: 'Excel', desc: 'SaaS & CRM exports', icon: <CsvIcon /> },
          { label: 'PDF', desc: 'Reports and brand lists', icon: <PdfIcon /> },
        ].map((type) => (
          <Card key={type.label} className="p-6 border-border/50 shadow-sm flex flex-col items-center text-center">
            <div className="mb-4">
              {type.icon}
            </div>
            <div className="font-bold text-lg mb-1">{type.label}</div>
            <p className="text-xs text-muted-foreground">{type.desc}</p>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/5 border-primary/10 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Badge variant="outline" className="mt-1 bg-background">Pro Tip</Badge>
            <p className="text-sm text-balance leading-relaxed font-medium">
              Importing from Apollo, LinkedIn, or HubSpot? Our intelligent system automatically maps columns for instant outreach synchronization.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
