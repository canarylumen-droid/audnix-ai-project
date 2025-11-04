
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Users, Mail, Phone, Sparkles, FileText, Loader2 } from "lucide-react";
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
        title: "✅ Import Complete",
        description: isPDF 
          ? `Extracted and imported ${result.leadsImported || 0} leads from PDF`
          : `Imported ${result.imported || 0} leads, skipped ${result.skipped || 0} duplicates`
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
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Import Leads</h1>
        <p className="text-muted-foreground">
          Upload CSV, Excel, or PDF - Our AI extracts Name, Email, WhatsApp Number automatically
        </p>
      </div>

      {/* Active Import Form */}
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            CSV/Excel: Name (required), Email, Phone, Company • PDF: AI extracts contact info automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              onChange={handleFileUpload}
              disabled={importing}
            />
            <p className="text-xs text-muted-foreground">
              📄 Supported formats: CSV, Excel (.xlsx, .xls), PDF (with contact lists)
            </p>
          </div>
          
          {file && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                {file.name.toLowerCase().endsWith('.pdf') ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                ✓ File ready: {file.name}
              </p>
              {importResults && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✅ {importResults.imported} leads imported • {importResults.skipped} duplicates skipped
                </p>
              )}
            </div>
          )}

          {importing && progress > 0 && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {progress < 30 ? 'Uploading file...' : progress < 70 ? 'Processing with AI...' : 'Creating leads...'}
              </p>
            </div>
          )}

          <Button 
            onClick={handleImport} 
            disabled={!file || importing}
            className="w-full"
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {file?.name.toLowerCase().endsWith('.pdf') ? 'Extracting from PDF...' : 'Importing...'}
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

      {/* Success Message */}
      {file && !importing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-lg border-2 border-emerald-500 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-background p-6"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="h-6 w-6 text-emerald-500" />
              <Badge variant="outline" className="border-emerald-500 text-emerald-500">
                Ready to Import
              </Badge>
            </div>
            <h2 className="text-2xl font-bold mb-2">CSV Upload Successful</h2>
            <p className="text-muted-foreground max-w-2xl">
              Your file is ready. Click "Import Leads" above to add these contacts to your dashboard.
            </p>
          </div>
        </motion.div>
      )}

      {/* Feature Preview Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              CSV File Import
            </CardTitle>
            <CardDescription>
              Upload spreadsheets with lead data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <p><strong>Auto-detect columns:</strong> AI automatically identifies Name, Email, Phone, Company fields</p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <p><strong>Smart validation:</strong> Validates phone numbers and email formats before import</p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <p><strong>Bulk import:</strong> Upload thousands of leads at once from Excel or Google Sheets</p>
              </div>
            </div>
            <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/50">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                Drag & drop CSV/Excel files here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supported: .csv, .xlsx, .xls (up to 10,000 rows)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              WhatsApp Auto-Outreach
            </CardTitle>
            <CardDescription>
              Automatically reach out via Twilio WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <p><strong>Twilio integration:</strong> Connect your Twilio account to send WhatsApp messages</p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <p><strong>AI personalization:</strong> Each message is personalized based on lead data</p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <p><strong>Smart scheduling:</strong> Send messages at optimal times based on timezone</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium mb-2">💡 Use Case Example:</p>
              <p className="text-xs text-muted-foreground">
                Import 500 leads from event attendees → AI sends personalized WhatsApp intro → 
                Auto-follow up if no reply → Book meetings automatically
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Email Campaign Automation
            </CardTitle>
            <CardDescription>
              Send personalized email sequences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <p><strong>Email extraction:</strong> Automatically extracts emails from CSV and validates deliverability</p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <p><strong>AI-powered sequences:</strong> Create multi-step email campaigns with smart follow-ups</p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <p><strong>Reply detection:</strong> AI pauses sequence when lead replies and hands off to you</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium mb-2">🎯 Perfect For:</p>
              <p className="text-xs text-muted-foreground">
                Cold outreach, event follow-ups, webinar attendees, purchased lead lists
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Manual Lead Management
            </CardTitle>
            <CardDescription>
              Full control over your imported leads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <p><strong>Tag & segment:</strong> Automatically tag leads by source, industry, or custom fields</p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <p><strong>Deduplication:</strong> Prevents duplicate imports across all channels</p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <p><strong>Export anytime:</strong> Download your leads with all conversation history as CSV</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium mb-2">🔐 Data Security:</p>
              <p className="text-xs text-muted-foreground">
                All lead data encrypted at rest • GDPR compliant • Delete anytime
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How It Works Section */}
      <Card>
        <CardHeader>
          <CardTitle>How CSV Lead Import Will Work</CardTitle>
          <CardDescription>
            Simple 4-step process to import and activate your leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2">Upload CSV</h3>
              <p className="text-sm text-muted-foreground">
                Drag & drop your CSV file with lead data
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold mb-2">Map Fields</h3>
              <p className="text-sm text-muted-foreground">
                AI auto-detects columns or map manually
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold mb-2">Configure Campaign</h3>
              <p className="text-sm text-muted-foreground">
                Choose WhatsApp or Email + customize message
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">4</span>
              </div>
              <h3 className="font-semibold mb-2">AI Takes Over</h3>
              <p className="text-sm text-muted-foreground">
                Automated outreach + follow-ups + booking
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notify Me Section */}
      <Card className="border-primary">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Get Notified When This Feature Launches</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're working hard to make CSV lead import the most powerful feature in Audnix. 
              You'll be notified automatically via dashboard notification when it's ready.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="text-primary border-primary">
                ETA: Q2 2025
              </Badge>
              <Badge variant="outline">
                Early Access for Pro Users
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
