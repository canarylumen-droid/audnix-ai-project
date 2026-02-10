
import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, CheckCircle2, Sparkles, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PdfIcon, CsvIcon } from "@/components/ui/CustomIcons";
import { EmailPreview } from "@/components/dashboard/EmailPreview";
import { LeadsDisplayModal } from "@/components/dashboard/LeadsDisplayModal";
import OutreachConfigModal from "@/components/outreach/OutreachConfigModal";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function LeadImportPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [mPreviewOpen, setMPreviewOpen] = useState(false);
  const [mLeadsOpen, setMLeadsOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ subject: string; body: string }>({
    subject: "Intelligence Collaboration Proposal",
    body: "I saw your work in the industry..."
  });
  const [importing, setImporting] = useState(false);
  const [enableAi, setEnableAi] = useState(true);
  const [progress, setProgress] = useState(0);
  const [manualPasteText, setManualPasteText] = useState("");
  const [importResults, setImportResults] = useState<{ imported: number; skipped: number; filtered?: number; leads?: any[] } | null>(null);
  const [isOutreachModalOpen, setIsOutreachModalOpen] = useState(false);

  const handleManualImport = async () => {
    if (!manualPasteText.trim()) {
      toast({ title: "No text provided", description: "Please paste email content to extract leads.", variant: "destructive" });
      return;
    }

    setImporting(true);
    setProgress(20);

    try {
      // 1. Parse structured data from text
      setProgress(40);
      const parseRes = await fetch('/api/ai/parse-body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: manualPasteText }),
        credentials: 'include'
      });

      if (!parseRes.ok) throw new Error("Failed to parse text");
      const { leads: extractedLeads } = await parseRes.json();
      setProgress(60);

      if (!extractedLeads || extractedLeads.length === 0) {
        toast({ title: "No leads found", description: "AI couldn't find any lead data in the pasted text.", variant: "destructive" });
        return;
      }

      // 2. Import into DB
      setProgress(80);
      const importRes = await apiRequest("POST", "/api/bulk/import-bulk", {
        leads: extractedLeads,
        aiPaused: !enableAi
      });

      const result = await importRes.json();
      setImportResults(result);
      setProgress(100);
      toast({ title: "Manual Import Success", description: `Imported ${result.imported} leads.` });
    } catch (e: any) {
      toast({ title: "Manual import failed", description: e.message, variant: "destructive" });
    } finally {
      setTimeout(() => {
        setImporting(false);
        setProgress(0);
      }, 500);
    }
  };

  const handleOpenPreview = async () => {
    try {
      setImporting(true); // Reusing importing state for loading indicator
      const response = await fetch('/api/outreach/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: { name: "Sample Prospect", company: "Growth Corp", email: "target@prospect.com" }
        }),
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        setPreviewData(data.preview);
        setMPreviewOpen(true);
      }
    } catch (e) {
      toast({ title: "Preview failed", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

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

    // Pass the aiPaused flag (inverted trigger)
    formData.append('aiPaused', (!enableAi).toString());

    try {
      setProgress(30);
      // For CSV, we now use preview mode first
      const endpoint = isPDF ? '/api/leads/import-pdf' : '/api/leads/import-csv?preview=true';
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

      if (isPDF) {
        setImportResults({
          imported: result.leadsImported || 0,
          skipped: 0,
          leads: result.leads || []
        });
        toast({
          title: "PDF Processed",
          description: `Extracted ${result.leadsImported} leads. Reviewing...`
        });
      } else {
        // CSV Preview Mode
        if (result.preview) {
          setImportResults({
            imported: 0, // Not imported yet
            skipped: 0,
            leads: result.leads || [] // These are the preview leads
          });
          setMLeadsOpen(true); // Open modal for confirmation
          toast({
            title: "Preview Ready",
            description: `Found ${result.total} leads. Please review and confirm import.`
          });
          setImporting(false); // Stop loading main spinner, modal takes over
          return;
        }

        // Fallback for direct import (shouldn't happen with new flow but safe to keep)
        setImportResults({
          imported: result.leadsImported || 0,
          skipped: result.errors?.length || 0,
          leads: result.leads || []
        });
      }

    } catch (error: any) {
      setProgress(0);
      toast({
        title: "Import failed",
        description: error.message || `Could not process ${isPDF ? 'PDF' : 'CSV'} file`,
        variant: "destructive"
      });
    } finally {
      if (!isPDF) { // For CSV preview, we stop loading early in the success case
        // if not preview (error case), we stop here
      } else {
        setTimeout(() => {
          setImporting(false);
          setProgress(0);
        }, 2000);
      }
    }
  };

  const handleFinalizeImport = async () => {
    if (!importResults?.leads || importResults.leads.length === 0) return;

    setImporting(true); // Reuse loading state provided to modal
    try {
      const response = await fetch('/api/bulk/import-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: importResults.leads.map(l => ({
            name: l.name,
            email: l.email,
            phone: l.phone,
            company: l.company,
            ...l.metadata // Include mapped metadata
          })),
          channel: 'email',
          aiPaused: !enableAi
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to finalize import");
      }

      const result = await response.json();

      setImportResults({
        imported: result.leadsImported,
        skipped: result.leadsFiltered || 0,
        leads: importResults.leads // Keep them visible
      });

      toast({
        title: "Import Success",
        description: `Successfully imported ${result.leadsImported} leads.`
      });

      setMLeadsOpen(false); // Close modal on success
      setTimeout(() => setFile(null), 2000);

    } catch (error: any) {
      toast({
        title: "Import Finalization Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto animate-in fade-in duration-700">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter bg-gradient-to-br from-foreground via-foreground/90 to-primary/80 bg-clip-text text-transparent">
          Network Data Ingestion
        </h1>
        <p className="text-muted-foreground/80 text-lg font-medium tracking-tight">
          Synchronize your high-intent leads into the Audnix intelligence core.
        </p>
      </div>

      <Card className="border-border/40 shadow-2xl relative overflow-hidden group bg-card">
        <CardHeader className="p-8 pb-0 text-center relative z-10">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-primary/10 mb-6">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-4xl font-black tracking-tight mb-2 uppercase italic text-foreground">
            Lead Intelligence Sync
          </CardTitle>
          <CardDescription className="text-sm font-bold tracking-widest text-muted-foreground/60">
            UPLOAD CSV, EXCEL, OR PDF FOR CAMPAIGN ANALYSIS
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 space-y-10 relative z-10">
          <div className="flex justify-center">
            <div className="bg-muted/10 p-1.5 rounded-2xl flex gap-1 border border-border/10">
              <Button
                variant={!manualPasteText.trim() ? "default" : "ghost"}
                size="sm"
                onClick={() => setManualPasteText("")}
                className={cn(
                  "rounded-xl text-[10px] font-bold h-10 px-6 transition-all",
                  !manualPasteText.trim() ? "bg-primary shadow-lg text-primary-foreground" : "hover:bg-primary/10 text-muted-foreground"
                )}
              >
                FILE UPLOAD
              </Button>
              <Button
                variant={manualPasteText.trim() ? "default" : "ghost"}
                size="sm"
                onClick={() => setManualPasteText(" ")} // Trigger manual mode
                className={cn(
                  "rounded-xl text-[10px] font-bold h-10 px-6 transition-all",
                  manualPasteText.trim() ? "bg-primary shadow-lg text-primary-foreground" : "hover:bg-primary/10 text-muted-foreground"
                )}
              >
                PASTE TEXT
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="space-y-1">
              <Label className="text-sm font-bold flex items-center gap-2">
                Enable AI Agent?
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/20 text-primary uppercase tracking-widest">Recommended</Badge>
              </Label>
              <p className="text-xs text-muted-foreground">Automatically qualify and engage leads immediately after import.</p>
            </div>
            <Switch
              checked={enableAi}
              onCheckedChange={setEnableAi}
            />
          </div>

          <div className="border-2 border-dashed border-border/40 rounded-[2rem] p-16 text-center hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer group/upload relative overflow-hidden">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              onChange={handleFileUpload}
              disabled={importing}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer relative z-10">
              <div className="mb-6 flex justify-center">
                {file ? (
                  <div className="animate-in zoom-in duration-300">
                    {file.name.toLowerCase().endsWith('.pdf') ? <PdfIcon /> : <CsvIcon />}
                  </div>
                ) : (
                  <div className="p-6 rounded-[2rem] bg-primary/5 group-hover/upload:bg-primary/10 transition-all transform group-hover/upload:scale-110">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                )}
              </div>
              <p className="text-xl font-bold tracking-tight mb-2">
                {file ? file.name : 'Select Data Source'}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                DRAG & DROP OR BROWSE • CSV, EXCEL, PDF
              </p>
            </label>
          </div>

          {importResults && (
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-4 p-4 bg-muted/50 border border-border rounded-xl"
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  {file?.name.toLowerCase().endsWith('.pdf') ? <PdfIcon /> : <CsvIcon />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {file?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {importResults.imported} entries imported • {importResults.skipped} duplicates
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </motion.div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider">Recently Uploaded</h3>
                  <div className="flex flex-wrap gap-2">
                    {importResults.leads && importResults.leads.length > 0 && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setMLeadsOpen(true)} className="text-[10px] font-bold border-primary/20 hover:bg-primary/10">VIEW LEADS</Button>
                        <Button
                          size="sm"
                          onClick={() => setIsOutreachModalOpen(true)}
                          className="text-[10px] font-bold bg-primary hover:bg-primary/90 gap-1"
                        >
                          <Send className="h-3 w-3" />
                          START OUTREACH
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard/prospecting')} className="text-[10px] font-bold">PIPELINE</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Your leads have been successfully synchronized to the pipeline.</p>
                </div>
              </div>
            </div>
          )}

          {importing && progress > 0 && (
            <div className="space-y-3">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs font-medium text-center text-muted-foreground">
                {progress < 30 ? 'Uploading file...' : progress < 70 ? 'Processing engagement data...' : 'Finalizing leads...'}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <Button
              onClick={handleOpenPreview}
              variant="outline"
              disabled={importing}
              className="px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest border-border/40 hover:bg-muted/30 h-12 sm:h-14 w-full sm:w-auto"
            >
              Preview Outreach
            </Button>
            <Button
              onClick={manualPasteText.trim() ? handleManualImport : handleImport}
              disabled={(manualPasteText.trim() ? false : !file) || importing}
              className="flex-1 h-12 sm:h-14 rounded-2xl text-[10px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-[0.2em] shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all min-w-0"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
                  <span className="truncate">Synchronizing...</span>
                </>
              ) : (
                <span className="truncate">{manualPasteText.trim() ? 'Extract Leads' : 'Start Import'}</span>
              )}
            </Button>
          </div>

          <EmailPreview
            isOpen={mPreviewOpen}
            onClose={() => setMPreviewOpen(false)}
            subject={previewData.subject}
            body={previewData.body}
          />

          <LeadsDisplayModal
            isOpen={mLeadsOpen}
            onClose={() => setMLeadsOpen(false)}
            leads={importResults?.leads || []}
            onConfirm={handleFinalizeImport}
            isImporting={importing}
            canConfirm={!importing}
          />

          <OutreachConfigModal
            isOpen={isOutreachModalOpen}
            onClose={() => setIsOutreachModalOpen(false)}
            leads={importResults?.leads || []}
            onSuccess={() => {
              toast({ title: "Outreach Started", description: "Emails will be sent according to your settings." });
            }}
          />

          {importResults && (importResults.filtered ?? 0) > 0 && (
            <div className="p-4 rounded-xl bg-orange-400/5 border border-orange-400/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-orange-400" />
                <span className="text-xs font-bold text-orange-400/80 uppercase tracking-widest">Intelligence Filter Active</span>
              </div>
              <span className="text-xs font-black text-orange-400">{importResults.filtered} Leads Blocked</span>
            </div>
          )}

          {/* Subtle Glow */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 blur-[100px] opacity-10 bg-primary rounded-full group-hover:opacity-20 transition-opacity" />
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

      <Card className="bg-primary/5 border-primary/20 rounded-[2rem] overflow-hidden relative">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <Badge variant="outline" className="mt-1 bg-primary text-primary-foreground border-0 font-bold tracking-widest text-[10px] px-3 py-1">PRO TIP</Badge>
            <p className="text-sm text-balance leading-relaxed font-bold tracking-tight text-foreground/80">
              Importing from Apollo, LinkedIn, or HubSpot? Our intelligent system automatically maps columns for instant outreach synchronization.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 bg-primary rounded-full translate-x-10 -translate-y-10" />
        </CardContent>
      </Card>
    </div>
  );
}
