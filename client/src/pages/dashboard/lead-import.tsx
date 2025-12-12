
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LeadImportPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{imported: number; skipped: number} | null>(null);

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
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Import Leads</h1>
        <p className="text-muted-foreground">
          Upload your contacts and AI will start engaging them automatically
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload File
          </CardTitle>
          <CardDescription>
            Supports CSV, Excel, and PDF files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              onChange={handleFileUpload}
              disabled={importing}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium mb-1">
                {file ? file.name : 'Click to upload or drag & drop'}
              </p>
              <p className="text-sm text-muted-foreground">
                CSV, Excel (.xlsx, .xls), or PDF
              </p>
            </label>
          </div>
          
          {file && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              {file.name.toLowerCase().endsWith('.pdf') ? (
                <FileText className="h-5 w-5 text-green-600" />
              ) : (
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
              )}
              <div className="flex-1">
                <p className="font-medium text-green-800 dark:text-green-200 text-sm">
                  {file.name}
                </p>
                {importResults && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {importResults.imported} imported, {importResults.skipped} skipped
                  </p>
                )}
              </div>
              {importResults && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
            </motion.div>
          )}

          {importing && progress > 0 && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {progress < 30 ? 'Uploading...' : progress < 70 ? 'AI processing...' : 'Creating leads...'}
              </p>
            </div>
          )}

          <Button 
            onClick={handleImport} 
            disabled={!file || importing}
            className="w-full"
            size="lg"
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {file?.name.toLowerCase().endsWith('.pdf') ? 'Extracting...' : 'Importing...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import Leads
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary mb-1">CSV</div>
          <p className="text-xs text-muted-foreground">Name, Email, Phone</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary mb-1">Excel</div>
          <p className="text-xs text-muted-foreground">.xlsx, .xls files</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary mb-1">PDF</div>
          <p className="text-xs text-muted-foreground">AI extracts contacts</p>
        </Card>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">Tip</Badge>
            <p className="text-sm text-muted-foreground">
              Using Apollo.io or similar tools? Export as CSV, upload here, and AI will auto-detect columns and start outreach.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
