import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Send, Wand2, Mail, Clock, Users, Smartphone, Monitor,
  Upload, CheckCircle2, ChevronRight, ChevronLeft, Sparkles,
  FileText, Plus, Database, Inbox
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CsvIcon, PdfIcon } from "@/components/ui/CustomIcons";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

interface UnifiedCampaignWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialLeads?: any[];
}

export default function UnifiedCampaignWizard({ isOpen, onClose, onSuccess, initialLeads = [] }: UnifiedCampaignWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"ios" | "android">("ios");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

  // Step 1: Import State
  const [sourceType, setSourceType] = useState<'upload' | 'database'>('upload');
  const [leads, setLeads] = useState<any[]>(initialLeads);
  const [importProgress, setImportProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  const [mailboxLimits, setMailboxLimits] = useState<Record<string, number>>({});

  // Step 2: Campaign Config
  const [campaignName, setCampaignName] = useState("");
  const [followUpDays, setFollowUpDays] = useState("3");
  const [aiPaused, setAiPaused] = useState(false);
  const [excludeWeekends, setExcludeWeekends] = useState(false);
  const [selectedMailboxes, setSelectedMailboxes] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState("");

  const { data: integrations = [] } = useQuery<any[]>({
    queryKey: ['/api/integrations'],
    staleTime: 300000
  });

  const availableMailboxes = (integrations || []).filter((i: any) =>
    ['custom_email', 'gmail', 'outlook'].includes(i.provider) && i.connected
  );

  // Initialize mailbox limits
  useEffect(() => {
    if (availableMailboxes.length > 0) {
      const initialLimits: Record<string, number> = {};
      availableMailboxes.forEach((mb: any) => {
        initialLimits[mb.id] = mb.metadata?.dailyLimit || 50;
      });
      setMailboxLimits(initialLimits);
    }
  }, [availableMailboxes]);

  // Auto-select first mailbox if none selected
  useEffect(() => {
    if (availableMailboxes.length > 0 && selectedMailboxes.length === 0) {
      setSelectedMailboxes([availableMailboxes[0].id]);
    }
  }, [availableMailboxes]);

  const totalDailyVolume = selectedMailboxes.reduce((sum, id) => sum + (mailboxLimits[id] || 0), 0);
  const estimatedDays = Math.ceil(leads.length / (totalDailyVolume || 1));

  // Templates
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [followUpSubject, setFollowUpSubject] = useState("");
  const [followUpBody, setFollowUpBody] = useState("");
  const [followUpSubject2, setFollowUpSubject2] = useState("");
  const [followUpBody2, setFollowUpBody2] = useState("");
  const [autoReplyBody, setAutoReplyBody] = useState("");

  // Persistence: Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("campaign_draft");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.campaignName) setCampaignName(data.campaignName);
        if (data.subject) setSubject(data.subject);
        if (data.body) setBody(data.body);
        if (data.followUpSubject) setFollowUpSubject(data.followUpSubject);
        if (data.followUpBody) setFollowUpBody(data.followUpBody);
        if (data.followUpSubject2) setFollowUpSubject2(data.followUpSubject2);
        if (data.followUpBody2) setFollowUpBody2(data.followUpBody2);
        if (data.autoReplyBody) setAutoReplyBody(data.autoReplyBody);
        if (data.totalDailyVolume) { /* managed via mailboxLimits */ }
        if (data.followUpDays) setFollowUpDays(data.followUpDays);
      } catch (e) {
        console.error("Failed to load campaign draft", e);
      }
    }
  }, []);

  // Persistence: Save to localStorage
  useEffect(() => {
    if (isOpen) {
      const draft = {
        campaignName, subject, body,
        followUpSubject, followUpBody,
        followUpSubject2, followUpBody2,
        autoReplyBody,
        totalDailyVolume, followUpDays,
        excludeWeekends
      };
      localStorage.setItem("campaign_draft", JSON.stringify(draft));
    }
  }, [campaignName, subject, body, followUpSubject, followUpBody, followUpSubject2, followUpBody2, autoReplyBody, totalDailyVolume, followUpDays, excludeWeekends, isOpen]);

  // "RE: " Logic for Follow-up Subjects
  useEffect(() => {
    if (subject && subject.trim() !== "") {
      if (!followUpSubject || followUpSubject.trim() === "") {
        setFollowUpSubject(`RE: ${subject}`);
      }
      if (!followUpSubject2 || followUpSubject2.trim() === "") {
        setFollowUpSubject2(`RE: ${subject}`);
      }
    }
  }, [subject]);

  // Transitions
  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 })
  };

  useEffect(() => {
    // Prefill follow-up subjects with RE: logic
    if (subject && !followUpSubject) setFollowUpSubject(`Re: ${subject}`);
    if (subject && !followUpSubject2) setFollowUpSubject2(`Re: ${subject}`);
  }, [subject]);

  // Load defaults
  useEffect(() => {
    if (!subject) {
      setSubject("Quick question about {{company}}");
      setBody(`Hi {{firstName}},\n\nI came across {{company}} and was impressed by what you're building.\n\nWe help businesses scale their outreach with AI.\n\nWould you be open to a quick chat?\n\nBest,\n[Your Name]`);
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    setImporting(true);
    setImportProgress(20);
    const formData = new FormData();
    const isPDF = selectedFile.name.toLowerCase().endsWith('.pdf');
    formData.append(isPDF ? 'pdf' : 'csv', selectedFile);

    try {
      setImportProgress(40);
      const endpoint = isPDF ? '/api/leads/import-pdf' : '/api/leads/import-csv?preview=false';
      const res = await fetch(endpoint, { method: 'POST', body: formData, credentials: 'include' });
      if (!res.ok) throw new Error("Import failed");
      const data = await res.json();
      setLeads(data.leads || []);
      setImportProgress(100);
      toast({ title: "Import Successful", description: `Captured ${data.leadsImported || data.leads?.length} leads.` });
      // Auto advance to step 2 after brief delay
      setTimeout(() => setStep(2), 1000);
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setTimeout(() => setImporting(false), 500);
    }
  };

  const handleFetchLeads = async () => {
    setIsLoadingLeads(true);
    try {
      const res = await apiRequest("GET", "/api/leads?limit=1000");
      const data = await res.json();
      if (data.leads && Array.isArray(data.leads)) {
        setLeads(data.leads);
        toast({ title: "Leads Fetched", description: `Successfully loaded ${data.leads.length} leads from database.` });
      } else {
        toast({ title: "No leads found", description: "Database seems empty." });
      }
    } catch (err: any) {
      toast({ title: "Fetch failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingLeads(false);
    }
  };

  const handleLaunch = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/outreach/campaigns", {
        name: campaignName || `Campaign ${new Date().toLocaleDateString()}`,
        leads: leads.map((l: any) => l.id || l),
        excludeWeekends,
        config: {
          dailyLimit: totalDailyVolume,
          mailboxLimits: mailboxLimits, // Send the per-mailbox overrides
          followUpDelayDays: parseInt(followUpDays),
          mailboxIds: selectedMailboxes,
          replyTo: replyTo || undefined
        },
        template: {
          subject, body,
          autoReplyBody,
          followups: [
            { delayDays: parseInt(followUpDays), subject: followUpSubject, body: followUpBody },
            { delayDays: parseInt(followUpDays) + 4, subject: followUpSubject2, body: followUpBody2 }
          ]
        }
      });
      const campaign = await res.json();
      await apiRequest("POST", `/api/outreach/campaigns/${campaign.id}/start`, {});
      toast({ title: "Campaign Launched!", description: "Sending queue established." });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast({ title: "Launch failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const renderPreview = (subj: string, content: string) => {
    const sampleLead = leads[0] || { name: "Prospect Name", company: "Company Inc." };
    const firstName = sampleLead.name?.trim().split(' ')[0] || 'Prospect';

    const replaceTags = (text: string) => {
      return (text || "")
        .replace(/{{name}}/g, sampleLead.name)
        .replace(/{{firstName}}/g, firstName)
        .replace(/{{lead_name}}/g, firstName)
        .replace(/{{company}}/g, sampleLead.company || 'Acme Corp')
        .replace(/{{business_name}}/g, sampleLead.company || 'Acme Corp');
    };

    const filledSubject = replaceTags(subj);
    const filledBody = replaceTags(content);

    return (
      <div className="flex justify-center h-full items-center p-4 transform scale-[0.75] sm:scale-90 md:scale-100 origin-center">
        <div className={cn(
          "relative bg-background border-[6px] border-gray-900 shadow-2xl overflow-hidden transition-all duration-500",
          previewDevice === 'ios' ? 'w-[280px] h-[580px] rounded-[3rem]' : 'w-[320px] h-[600px] rounded-[2rem]'
        )}>
          {/* Status Bar */}
          <div className="h-6 bg-background flex items-center justify-between px-6 pt-1">
            <span className="text-[10px] font-bold">9:41</span>
            <div className="flex gap-1 items-center">
              <div className="w-3 h-2 bg-foreground rounded-[2px]" />
            </div>
          </div>
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/40">
            <div className="flex items-center gap-2 mb-1">
              <Avatar className="w-7 h-7 border border-border shadow-sm rounded-full">
                <AvatarImage src={sampleLead.avatar} />
                <AvatarFallback className="rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  {sampleLead.name?.[0] || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="text-[11px] font-bold truncate">{sampleLead.name}</div>
            </div>
            <div className="text-xs font-bold line-clamp-2 leading-tight">{filledSubject}</div>
          </div>
          {/* Body */}
          <ScrollArea className="h-[calc(100%-100px)] p-4">
            <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{filledBody}</div>
          </ScrollArea>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-full sm:max-w-[95vw] w-full h-[100dvh] sm:h-[95vh] rounded-none sm:rounded-[2rem] p-0 overflow-hidden bg-background border-border/40 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex-none p-6 md:p-8 flex items-center justify-between border-b border-border/40 bg-card/50 backdrop-blur-xl shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Send className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg md:text-2xl font-black tracking-tighter uppercase italic">Outreach Wizard</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className={cn("h-1.5 rounded-full transition-all duration-500", step === i ? "w-6 md:w-8 bg-primary" : "w-2 bg-muted")} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Main Workspace */}
          <div className={cn(
            "flex-1 overflow-y-auto w-full transition-all duration-500 ease-in-out pb-24", // Add padding bottom for footer
            step === 2 && viewMode === 'preview' ? 'hidden md:block' : 'block'
          )}>
            <div className="max-w-4xl mx-auto p-6 md:p-10">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial="enter" animate="center" exit="exit" variants={variants} className="space-y-8 pb-10">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tighter uppercase">Lead Source</h2>
                      <p className="text-muted-foreground text-sm font-medium">Select existing leads or upload new ones.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-black uppercase tracking-widest text-primary/60">Select Source</Label>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold uppercase gap-1.5 opacity-60 hover:opacity-100">
                              <Sparkles className="w-3 h-3" /> Syntax Guide
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-border/40">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-black uppercase italic italic">Personalization Tags</DialogTitle>
                              <DialogDescription>Use these dynamic variables in your message templates to maximize engagement.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  { tag: "{{firstName}}", desc: "Lead's first name" },
                                  { tag: "{{company}}", desc: "Target company name" },
                                  { tag: "{{name}}", desc: "Lead's full name" },
                                  { tag: "{{industry}}", desc: "Detected niche" }
                                ].map(item => (
                                  <div key={item.tag} className="p-3 bg-muted/30 rounded-xl border border-border/10">
                                    <code className="text-primary font-bold text-xs">{item.tag}</code>
                                    <p className="text-[10px] text-muted-foreground mt-1 uppercase font-black opacity-50">{item.desc}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                <p className="text-[11px] leading-relaxed">
                                  <span className="font-bold text-primary">Pro Tip:</span> Always include a fallback like "Hi {"{{firstName || 'there'}}"}" for the most human feel.
                                </p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setSourceType('database')}
                          className={cn(
                            "p-4 rounded-2xl border-2 transition-all text-left",
                            sourceType === 'database'
                              ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                              : "border-border/40 bg-card hover:border-border"
                          )}
                        >
                          <Inbox className={cn("w-6 h-6 mb-2", sourceType === 'database' ? "text-primary" : "text-muted-foreground/40")} />
                          <p className="text-sm font-bold">Imported Leads</p>
                          <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest mt-1">From Database</p>
                        </button>
                        <button
                          onClick={() => setSourceType('upload')}
                          className={cn(
                            "p-4 rounded-2xl border-2 transition-all text-left",
                            sourceType === 'upload'
                              ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                              : "border-border/40 bg-card hover:border-border"
                          )}
                        >
                          <Upload className={cn("w-6 h-6 mb-2", sourceType === 'upload' ? "text-primary" : "text-muted-foreground/40")} />
                          <p className="text-sm font-bold">New CSV/Excel</p>
                          <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest mt-1">Fresh Upload</p>
                        </button>
                      </div>
                    </div>

                    {sourceType === 'upload' ? (
                      <label className="border-2 border-dashed border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all p-6 rounded-3xl text-center cursor-pointer relative group flex flex-col items-center justify-center gap-2 min-h-[160px]">
                        <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv,.xlsx,.pdf" />
                        <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                          <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <div className="font-bold text-lg">Upload File</div>
                        <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mt-1 opacity-50">CSV • EXCEL • PDF</div>
                      </label>
                    ) : (
                      <div className="p-6 rounded-3xl bg-card border border-border/40 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-primary" />
                            <div className="font-bold text-base">Available Leads</div>
                          </div>
                          <Badge variant="secondary" className="px-3 py-1 font-bold text-sm">{leads.length > 0 ? leads.length : (initialLeads?.length || 0)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground/60 leading-relaxed">
                          {leads.length > 0
                            ? "Review the leads below or proceed to the next step."
                            : "Your database repository is ready. Click below to synchronize your active leads."}
                        </p>

                        <div className="pt-2">
                          {leads.length === 0 ? (
                            <Button
                              onClick={handleFetchLeads}
                              disabled={isLoadingLeads}
                              variant="default"
                              className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-[0.2em] gap-3 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            >
                              {isLoadingLeads ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                              Fetch leads from Database
                            </Button>
                          ) : (
                            <div className="space-y-3">
                              <Button
                                onClick={() => setStep(2)}
                                className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20"
                              >
                                Use {leads.length} Leads & Continue
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={handleFetchLeads}
                                className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                              >
                                Refresh Lead Pool
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {importing && (
                      <div className="space-y-4 animate-in fade-in duration-500">
                        <Progress value={importProgress} className="h-1 bg-muted rounded-full overflow-hidden shadow-inner" />
                        <p className="text-xs font-bold text-center animate-pulse text-muted-foreground">Analyzing network data clusters...</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial="enter" animate="center" exit="exit" variants={variants} className="space-y-8 pb-10">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h2 className="text-3xl font-black tracking-tighter">CAMPAIGN DESIGN</h2>
                        <p className="text-muted-foreground text-sm font-medium">Construct your outreach sequence with AI assistance.</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-8 bg-card rounded-[2.5rem] border border-border/40 space-y-8 shadow-xl">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs font-black uppercase tracking-[0.3em] text-primary/60">Sequence Distribution</Label>
                            <p className="text-[10px] text-muted-foreground font-medium">Automatic lead allocation based on server capacity.</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-primary/5 text-primary border-primary/20 shadow-sm self-start md:self-auto">
                            {leads.length} leads • ~{estimatedDays} days total
                          </Badge>
                        </div>

                        {/* Distribution Preview Card */}
                        {selectedMailboxes.length > 1 && (
                          <div className="p-6 rounded-[2rem] bg-muted/20 border border-border/10 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Allocation Forecast</span>
                              <Sparkles className="h-3.5 w-3.5 text-primary/40" />
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {selectedMailboxes.map(id => {
                                const mb = availableMailboxes.find(m => m.id === id);
                                const count = Math.floor(leads.length * ((mailboxLimits[id] || 50) / (totalDailyVolume || 1)));
                                return (
                                  <div key={id} className="px-4 py-2 bg-background/50 rounded-xl border border-border/10 flex items-center gap-2 shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span className="text-[11px] font-bold truncate max-w-[120px]">{mb?.email?.split('@')[0]}</span>
                                    <Badge variant="secondary" className="text-[9px] font-black h-4 px-1.5">{count} leads</Badge>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-6">
                            <span className="text-[11px] font-black uppercase block tracking-widest text-muted-foreground/80">Active Mailboxes</span>
                            <div className="space-y-4">
                              {availableMailboxes.length === 0 ? (
                                <span className="text-xs text-destructive">No mailboxes connected</span>
                              ) : (
                                availableMailboxes.map((mb: any) => {
                                  const isSelected = selectedMailboxes.includes(mb.id);
                                  return (
                                    <div key={mb.id} className="space-y-3">
                                      <div
                                        className={cn(
                                          "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
                                          isSelected
                                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/5 ring-1 ring-primary/20"
                                            : "border-border/40 bg-muted/20 hover:border-border/80 opacity-60"
                                        )}
                                        onClick={() => {
                                          if (isSelected && selectedMailboxes.length > 1) {
                                            setSelectedMailboxes(selectedMailboxes.filter(id => id !== mb.id));
                                          } else if (!isSelected) {
                                            setSelectedMailboxes([...selectedMailboxes, mb.id]);
                                          }
                                        }}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={cn("p-2 rounded-xl transition-colors", isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                                            <Mail className="h-4 w-4" />
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-xs font-bold truncate max-w-[140px]">{mb.email || mb.provider}</span>
                                            <span className="text-[9px] uppercase font-black tracking-tighter opacity-40">{mb.provider}</span>
                                          </div>
                                        </div>
                                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                      </div>

                                      <AnimatePresence>
                                        {isSelected && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden px-2"
                                          >
                                            <div className="space-y-3 pt-1 pb-4">
                                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-primary/80">
                                                <span>Custom Daily Limit</span>
                                                <span className="bg-primary/10 px-2 rounded text-primary">{mailboxLimits[mb.id] || 50}/day</span>
                                              </div>
                                              <Slider
                                                value={[mailboxLimits[mb.id] || 50]}
                                                onValueChange={v => setMailboxLimits(prev => ({ ...prev, [mb.id]: v[0] }))}
                                                min={10}
                                                max={mb.provider === 'gmail' || mb.provider === 'outlook' ? 50 : 500}
                                                step={5}
                                                className="py-1"
                                              />
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          <div className="space-y-8">
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary/60" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80">Timing & Logic</span>
                              </div>

                              <div className="space-y-6">
                                <div className="space-y-3">
                                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Follow-up Delay</Label>
                                  <Select value={followUpDays} onValueChange={setFollowUpDays}>
                                    <SelectTrigger className="h-12 bg-muted/30 border- border-border/20 rounded-2xl focus:ring-0 px-6 font-bold text-xs uppercase tracking-widest">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border/40 bg-card/95 backdrop-blur-xl">
                                      {[1, 2, 3, 5, 7, 10].map(d => (
                                        <SelectItem key={d} value={d.toString()} className="font-bold text-[10px] uppercase tracking-widest py-3">
                                          {d} {d === 1 ? 'Day' : 'Days'} Wait
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-3">
                                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Safety Rules</Label>
                                  <div
                                    className={cn(
                                      "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                                      excludeWeekends ? "bg-primary/5 border-primary shadow-sm" : "bg-muted/20 border-border/40 opacity-60"
                                    )}
                                    onClick={() => setExcludeWeekends(!excludeWeekends)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={cn("p-2 rounded-xl", excludeWeekends ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                                        <Clock className="h-4 w-4" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-xs font-bold">Skip Weekends</span>
                                        <span className="text-[9px] uppercase font-black tracking-tighter opacity-40">Safety Protocol</span>
                                      </div>
                                    </div>
                                    <Switch
                                      checked={excludeWeekends}
                                      onCheckedChange={setExcludeWeekends}
                                      className="data-[state=checked]:bg-primary"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="p-5 bg-primary/5 rounded-3xl border border-primary/10 space-y-2">
                              <div className="flex items-center gap-2 text-primary">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Distribution Summary</span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-muted-foreground/80">
                                This campaign will utilize <span className="text-primary font-black">{selectedMailboxes.length} mailboxes</span> to engagement <span className="text-primary font-black">{leads.length} leads</span>.
                                Total daily volume is capped at <span className="text-primary font-black">{totalDailyVolume} messages/day</span>.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Tabs defaultValue="initial" className="w-full" key={step}>
                        <TabsList className="h-auto w-full bg-muted/40 p-1.5 rounded-2xl border border-border/10 mb-6 flex flex-wrap sm:flex-nowrap gap-2">
                          <TabsTrigger value="initial" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-md transition-all h-10 sm:h-full">Initial</TabsTrigger>
                          <TabsTrigger value="followup" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-md transition-all h-10 sm:h-full">Follow-up 1</TabsTrigger>
                          <TabsTrigger value="followup2" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-md transition-all h-10 sm:h-full">Follow-up 2</TabsTrigger>
                          <TabsTrigger value="reply" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-md transition-all h-10 sm:h-full">Auto-Reply</TabsTrigger>
                        </TabsList>

                        <TabsContent value="initial" className="space-y-4 animate-in fade-in duration-300">
                          <Input
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="INITIAL SUBJECT LINE"
                            className="h-14 bg-muted/30 border-0 font-bold text-lg rounded-2xl px-6 focus-visible:ring-1 focus-visible:ring-primary/20"
                          />
                          <Textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            className="min-h-[300px] bg-muted/10 border-0 rounded-2xl p-6 text-sm leading-relaxed resize-none focus-visible:ring-1 focus-visible:ring-primary/10"
                            placeholder="WRITE YOUR PROPOSAL..."
                          />
                        </TabsContent>

                        <TabsContent value="followup" className="space-y-4 animate-in fade-in duration-300">
                          <Input
                            value={followUpSubject}
                            onChange={e => setFollowUpSubject(e.target.value)}
                            placeholder="FOLLOW-UP SUBJECT LINE"
                            className="h-14 bg-muted/30 border-0 font-bold text-lg rounded-2xl px-6 focus-visible:ring-1 focus-visible:ring-primary/20"
                          />
                          <Textarea
                            value={followUpBody}
                            onChange={e => setFollowUpBody(e.target.value)}
                            className="min-h-[300px] bg-muted/10 border-0 rounded-2xl p-6 text-sm leading-relaxed resize-none"
                            placeholder="AUTOMATIC REENGAGEMENT COPY..."
                          />
                        </TabsContent>

                        <TabsContent value="followup2" className="space-y-4 animate-in fade-in duration-300">
                          <Input
                            value={followUpSubject2}
                            onChange={e => setFollowUpSubject2(e.target.value)}
                            placeholder="FINAL FOLLOW-UP SUBJECT LINE"
                            className="h-14 bg-muted/30 border-0 font-bold text-lg rounded-2xl px-6 focus-visible:ring-1 focus-visible:ring-primary/20"
                          />
                          <Textarea
                            value={followUpBody2}
                            onChange={e => setFollowUpBody2(e.target.value)}
                            className="min-h-[300px] bg-muted/10 border-0 rounded-2xl p-6 text-sm leading-relaxed resize-none"
                            placeholder="FINAL CHANCE COPY..."
                          />
                        </TabsContent>

                        <TabsContent value="reply" className="space-y-4 animate-in fade-in duration-300">
                          <div className="p-4 bg-muted/30 border border-border/20 rounded-2xl mb-2 flex items-start gap-4">
                            <Clock className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                              <p className="text-xs font-bold leading-relaxed">Intelligent Auto-Reply enabled</p>
                              <p className="text-[10px] font-medium text-muted-foreground mt-1">When a lead replies to this campaign, we will send this exact template automatically after a randomized 2 to 4 minute human-like delay.</p>
                            </div>
                          </div>
                          <Textarea
                            value={autoReplyBody}
                            onChange={e => setAutoReplyBody(e.target.value)}
                            className="min-h-[260px] bg-muted/10 border-0 rounded-2xl p-6 text-sm leading-relaxed resize-none"
                            placeholder="Thanks for responding! We'll get back to you shortly..."
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial="enter" animate="center" exit="exit" variants={variants} className="space-y-8 pb-10">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tighter text-emerald-500 uppercase">Deployment Core</h2>
                      <p className="text-muted-foreground text-sm font-medium">Review the campaign parameters and initiate the sending core.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                      <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] space-y-8 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600/60">Campaign Summary</span>
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 uppercase tracking-widest text-[9px] px-3 font-black">verified</Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                          <div className="space-y-1">
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Target List</div>
                            <div className="text-3xl font-black tracking-tighter italic">{leads.length} <span className="text-xs uppercase not-italic font-bold text-foreground/80 ml-1">Leads</span></div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Volume Rate</div>
                            <div className="text-3xl font-black tracking-tighter italic">{totalDailyVolume} <span className="text-xs uppercase not-italic font-bold text-foreground/80 ml-1">/day</span></div>
                          </div>
                          <div className="space-y-1 hidden md:block">
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Sequence</div>
                            <div className="text-3xl font-black tracking-tighter italic">3 <span className="text-xs uppercase not-italic font-bold text-foreground/80 ml-1">Steps</span></div>
                          </div>
                        </div>

                        <div className="pt-8 border-t border-emerald-500/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-5 bg-background/60 rounded-2xl border border-border/10">
                            <div className="flex items-center gap-4">
                              <div className="p-2.5 bg-emerald-500/10 rounded-xl"><Sparkles className="h-5 w-5 text-emerald-500" /></div>
                              <div>
                                <div className="text-[10px] font-black uppercase tracking-widest mb-0.5">Neural Filter</div>
                                <div className="text-[9px] text-muted-foreground font-bold italic">AI intent detection</div>
                              </div>
                            </div>
                            <Switch checked={true} disabled className="data-[state=checked]:bg-emerald-500" />
                          </div>
                          <div className="flex items-center justify-between p-5 bg-background/60 rounded-2xl border border-border/10">
                            <div className="flex items-center gap-4">
                              <div className="p-2.5 bg-emerald-500/10 rounded-xl"><Inbox className="h-5 w-5 text-emerald-500" /></div>
                              <div>
                                <div className="text-[10px] font-black uppercase tracking-widest mb-0.5">Auto-Pilot</div>
                                <div className="text-[9px] text-muted-foreground font-bold italic">Handle replies</div>
                              </div>
                            </div>
                            <Switch checked={!aiPaused} onCheckedChange={(v) => setAiPaused(!v)} className="data-[state=checked]:bg-emerald-500" />
                          </div>
                        </div>

                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                          <p className="text-[10px] text-muted-foreground/60 leading-relaxed italic">
                            The campaign will initiate sequentially. Leads will be engaged based on your volume limit to ensure maximum deliverability.
                          </p>
                        </div>
                      </div>

                      <div className="p-8 bg-card border border-border/20 rounded-[2.5rem] space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Campaign Deployment Alias</Label>
                        <Input
                          value={campaignName}
                          onChange={e => setCampaignName(e.target.value)}
                          placeholder="e.g. Enterprise Expansion Q1"
                          className="h-14 bg-muted/20 border-0 font-bold text-lg rounded-2xl px-6 focus-visible:ring-1 focus-visible:ring-primary/20 w-full"
                        />
                      </div>
                      <div className="p-8 bg-card border border-border/20 rounded-[2.5rem] space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Reply-To Email (Optional)</Label>
                        <Input
                          value={replyTo}
                          onChange={e => setReplyTo(e.target.value)}
                          placeholder="Routing email for replies"
                          className="h-14 bg-muted/20 border-0 font-bold text-lg rounded-2xl px-6 focus-visible:ring-1 focus-visible:ring-primary/20 w-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="p-6 md:p-8 border-t border-border/20 bg-card flex items-center justify-between shrink-0">
              <Button
                variant="ghost"
                onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                className="h-14 px-8 rounded-2xl font-bold gap-2 text-muted-foreground hover:text-foreground transition-all uppercase tracking-widest text-[10px]"
              >
                <ChevronLeft className="h-4 w-4" /> {step === 1 ? 'Discard' : 'Go Back'}
              </Button>

              {step < 3 ? (
                <Button
                  disabled={step === 1 && leads.length === 0}
                  onClick={() => setStep(step + 1)}
                  className="h-14 px-12 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all gap-3 text-xs"
                >
                  Save & Continue <ChevronRight className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  onClick={handleLaunch}
                  disabled={isLoading}
                  className="h-14 px-14 rounded-2xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 text-white transition-all gap-4 text-xs"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                  INITIATE DEPLOYMENT
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-transparent to-primary/5">
            <Tabs key={viewMode} defaultValue="p1" className="h-full">
              <TabsList className="absolute top-6 left-1/2 -translate-x-1/2 z-30 shadow-2xl rounded-full p-1.5 bg-background/80 backdrop-blur border border-border/20 flex gap-2 h-auto md:scale-110 lg:scale-125">
                <TabsTrigger value="p1" className="h-8 md:h-10 text-[9px] md:text-[10px] font-black uppercase px-5 md:px-8 rounded-full transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">S1</TabsTrigger>
                <TabsTrigger value="p2" className="h-8 md:h-10 text-[9px] md:text-[10px] font-black uppercase px-5 md:px-8 rounded-full transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">S2</TabsTrigger>
                <TabsTrigger value="p3" className="h-8 md:h-10 text-[9px] md:text-[10px] font-black uppercase px-5 md:px-8 rounded-full transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">S3</TabsTrigger>
                <TabsTrigger value="reply" className="h-8 md:h-10 text-[9px] md:text-[10px] font-black uppercase px-5 md:px-8 rounded-full transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Reply</TabsTrigger>
              </TabsList>
              <TabsContent value="p1" className="h-full m-0 pt-16 md:pt-0">{renderPreview(subject, body)}</TabsContent>
              <TabsContent value="p2" className="h-full m-0 pt-16 md:pt-0">{renderPreview(followUpSubject, followUpBody)}</TabsContent>
              <TabsContent value="p3" className="h-full m-0 pt-16 md:pt-0">{renderPreview(followUpSubject2, followUpBody2)}</TabsContent>
              <TabsContent value="reply" className="h-full m-0 pt-16 md:pt-0">{renderPreview(`Re: ${subject}`, autoReplyBody)}</TabsContent>
            </Tabs>
          </div>

          <div className="p-6 border-t border-border/10 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Real-time engagement simulation</p>
          </div>
        </div>
      </DialogContent>

      {/* Mobile View Toggle (Floating) - Persistent and clear */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] flex sm:hidden bg-background/90 backdrop-blur-2xl border border-primary/20 rounded-full p-1.5 shadow-2xl shadow-primary/20 scale-110">
        <Button
          variant={viewMode === 'edit' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('edit')}
          className={cn(
            "rounded-full text-[10px] font-black uppercase tracking-widest px-6 h-9 transition-all",
            viewMode === 'edit' && "bg-primary text-primary-foreground shadow-lg"
          )}
        >
          Editor
        </Button>
        <Button
          variant={viewMode === 'preview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('preview')}
          className={cn(
            "rounded-full text-[10px] font-black uppercase tracking-widest px-6 h-9 transition-all",
            viewMode === 'preview' && "bg-primary text-primary-foreground shadow-lg"
          )}
        >
          Preview
        </Button>
      </div>
    </Dialog >
  );
}
