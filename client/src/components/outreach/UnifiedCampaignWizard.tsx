import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
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
  const [previewTab, setPreviewTab] = useState<"p1" | "p2" | "p3">("p1");

  // Step 1: Import State
  const [leads, setLeads] = useState<any[]>(initialLeads);
  const [importProgress, setImportProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Step 2: Campaign Config
  const [campaignName, setCampaignName] = useState("");
  const [dailyLimit, setDailyLimit] = useState(50);
  const [followUpDays, setFollowUpDays] = useState("3");
  const [aiPaused, setAiPaused] = useState(false);

  // Templates
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [followUpSubject, setFollowUpSubject] = useState("");
  const [followUpBody, setFollowUpBody] = useState("");
  const [followUpSubject2, setFollowUpSubject2] = useState("");
  const [followUpBody2, setFollowUpBody2] = useState("");

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

  const handleLaunch = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/outreach/campaigns", {
        name: campaignName || `Campaign ${new Date().toLocaleDateString()}`,
        leads: leads.map(l => l.id || l),
        config: { dailyLimit, followUpDelayDays: parseInt(followUpDays) },
        template: {
          subject, body,
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
    const filledSubject = (subj || "").replace(/{{name}}/g, sampleLead.name).replace(/{{firstName}}/g, sampleLead.name.split(' ')[0]).replace(/{{company}}/g, sampleLead.company || 'Acme');
    const filledBody = (content || "").replace(/{{name}}/g, sampleLead.name).replace(/{{firstName}}/g, sampleLead.name.split(' ')[0]).replace(/{{company}}/g, sampleLead.company || 'Acme');

    return (
      <div className="flex justify-center h-full items-center p-4">
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
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{sampleLead.name[0]}</div>
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[100dvh] md:h-[90vh] p-0 flex flex-col border-border/40 bg-card/95 backdrop-blur-2xl md:rounded-[2.5rem] overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-8 md:pb-6 border-b border-border/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
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
          <div className="flex items-center gap-2 md:gap-3">
             <div className="bg-muted/50 p-1 rounded-xl hidden sm:flex">
                <Button variant={viewMode === 'edit' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('edit')} className="h-8 text-[10px] font-bold uppercase tracking-widest">Construct</Button>
                <Button variant={viewMode === 'preview' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('preview')} className="h-8 text-[10px] font-bold uppercase tracking-widest">Simulate</Button>
             </div>
             <DialogClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-destructive/10 hover:text-destructive h-8 w-8 md:h-10 md:w-10">×</Button>
             </DialogClose>
          </div>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 relative">
          {/* Main Workspace */}
          <div className={cn("flex flex-col h-full bg-background/50 overflow-y-auto lg:overflow-hidden", viewMode === 'preview' && 'hidden lg:flex')}>
            <ScrollArea className="flex-1 p-4 md:p-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial="enter" animate="center" exit="exit" variants={variants} className="space-y-8 pb-10">
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black tracking-tighter">DATA INGESTION</h2>
                       <p className="text-muted-foreground text-sm font-medium">Upload leads or connect your platforms to start syncing targets.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <label className="border-2 border-dashed border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all p-8 rounded-3xl text-center cursor-pointer relative group">
                          <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv,.xlsx,.pdf" />
                          <div className="p-4 bg-primary/10 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                             <Upload className="h-6 w-6 text-primary" />
                          </div>
                          <div className="font-bold text-lg">Upload File</div>
                          <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mt-2 opacity-50">CSV • EXCEL • PDF</div>
                       </label>

                       <div className="border border-border/40 bg-card p-8 rounded-3xl space-y-4 flex flex-col justify-center">
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center"><Smartphone className="h-5 w-5 text-purple-500" /></div>
                             <div className="font-bold">Connect Platform</div>
                          </div>
                          <p className="text-xs text-muted-foreground">Import directly from ManyChat, Instagram, or Gmail.</p>
                          <Button variant="outline" className="w-full text-[10px] font-bold uppercase tracking-widest h-10 rounded-xl border-border/60">Connect Sources</Button>
                       </div>
                    </div>

                    {importing && (
                      <div className="space-y-4 animate-in fade-in duration-500">
                         <Progress value={importProgress} className="h-1 bg-muted rounded-full overflow-hidden shadow-inner" />
                         <p className="text-xs font-bold text-center animate-pulse text-muted-foreground">Analyzing network data clusters...</p>
                      </div>
                    )}

                    {leads.length > 0 && (
                      <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between animate-in slide-in-from-bottom-5">
                         <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xl">{leads.length}</div>
                            <div>
                               <div className="font-bold">Leads Ready</div>
                               <div className="text-xs text-muted-foreground">Intelligence core synchronization complete.</div>
                            </div>
                         </div>
                         <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="rounded-xl font-bold gap-2 group">
                            Configure <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                         </Button>
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial="enter" animate="center" exit="exit" variants={variants} className="space-y-8 pb-10">
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black tracking-tighter">CAMPAIGN DESIGN</h2>
                       <p className="text-muted-foreground text-sm font-medium">Construct your outreach sequence with AI assistance.</p>
                    </div>

                    <div className="space-y-6">
                       <div className="p-6 bg-card rounded-3xl border border-border/40 space-y-4">
                          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Sequence Logic</Label>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                             <div className="space-y-3">
                                <div className="flex justify-between text-[11px] font-bold">
                                   <span>DAILY VOLUME</span>
                                   <Badge variant="secondary" className="font-mono">{dailyLimit}/day</Badge>
                                </div>
                                <Slider value={[dailyLimit]} onValueChange={v => setDailyLimit(v[0])} min={10} max={500} step={10} className="py-2" />
                             </div>
                             <div className="space-y-3">
                                <span className="text-[11px] font-bold uppercase block tracking-widest">FOLLOW-UP DELAY</span>
                                <Select value={followUpDays} onValueChange={setFollowUpDays}>
                                   <SelectTrigger className="h-10 bg-muted/30 border-0 rounded-xl focus:ring-0">
                                      <SelectValue />
                                   </SelectTrigger>
                                    <SelectContent>
                                       {[1, 2, 3, 5, 7, 10].map(d => <SelectItem key={d} value={d.toString()}>{d} {d === 1 ? 'Day' : 'Days'}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                             </div>
                          </div>
                       </div>

                        <Tabs defaultValue="initial" className="w-full" key={step}>
                           <div className="bg-muted/40 p-1.5 rounded-2xl border border-border/10 mb-6">
                             <TabsList className="h-10 w-full bg-transparent p-0 flex gap-1">
                                <TabsTrigger value="initial" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full">Step 1</TabsTrigger>
                                <TabsTrigger value="followup" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full">Step 2</TabsTrigger>
                                <TabsTrigger value="followup2" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full">Step 3</TabsTrigger>
                             </TabsList>
                           </div>

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
                                className="min-h-[250px] bg-muted/10 border-0 rounded-2xl p-6 text-sm leading-relaxed resize-none focus-visible:ring-1 focus-visible:ring-primary/10"
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
                                className="min-h-[250px] bg-muted/10 border-0 rounded-2xl p-6 text-sm leading-relaxed resize-none"
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
                                className="min-h-[250px] bg-muted/10 border-0 rounded-2xl p-6 text-sm leading-relaxed resize-none"
                                placeholder="FINAL CHANCE COPY..." 
                             />
                          </TabsContent>
                       </Tabs>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial="enter" animate="center" exit="exit" variants={variants} className="space-y-8 pb-10">
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black tracking-tighter text-emerald-500">READY FOR DEPLOYMENT</h2>
                       <p className="text-muted-foreground text-sm font-medium">Review the campaign parameters and initiate the sending core.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                       <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] space-y-6">
                          <div className="flex items-center justify-between">
                             <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600/60">Campaign Summary</span>
                             <Badge className="bg-emerald-500 hover:bg-emerald-600 uppercase tracking-widest text-[10px] px-3">verified</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-8">
                             <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Target List</div>
                                <div className="text-2xl font-black">{leads.length} Leads</div>
                             </div>
                             <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Send Speed</div>
                                <div className="text-2xl font-black">{dailyLimit}/day</div>
                             </div>
                          </div>
                          
                          <div className="pt-6 border-t border-emerald-500/20 space-y-4">
                             <div className="flex items-center justify-between p-4 bg-background/40 rounded-2xl border border-emerald-500/10">
                                <div className="flex items-center gap-3">
                                   <div className="p-2 bg-emerald-500/20 rounded-lg"><Sparkles className="h-4 w-4 text-emerald-600" /></div>
                                   <div className="text-xs font-bold uppercase tracking-widest">Neural Filter Active</div>
                                </div>
                                <Switch checked={true} disabled className="data-[state=checked]:bg-emerald-500" />
                             </div>
                             <div className="flex items-center justify-between p-4 bg-background/40 rounded-2xl border border-emerald-500/10">
                                <div className="flex items-center gap-3">
                                   <div className="p-2 bg-emerald-500/20 rounded-lg"><Inbox className="h-4 w-4 text-emerald-600" /></div>
                                   <div className="text-xs font-bold uppercase tracking-widest">Autonomous Replies</div>
                                </div>
                                <Switch checked={!aiPaused} onCheckedChange={(v) => setAiPaused(!v)} className="data-[state=checked]:bg-emerald-500" />
                             </div>
                          </div>
                       </div>

                       <div className="p-6 bg-muted/10 border border-border/20 rounded-3xl space-y-4">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Deployment Alias</Label>
                          <Input 
                            value={campaignName} 
                            onChange={e => setCampaignName(e.target.value)} 
                            placeholder="e.g. Enterprise Expansion Q1" 
                            className="h-12 bg-background border-0 font-bold rounded-xl px-4"
                          />
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollArea>

            {/* Footer Navigation */}
            <div className="p-8 border-t border-border/20 bg-card/10 backdrop-blur-sm flex items-center justify-between">
               <Button 
                variant="ghost" 
                onClick={() => step > 1 ? setStep(step - 1) : onClose()} 
                className="h-14 px-8 rounded-2xl font-bold gap-2 text-muted-foreground hover:text-foreground transition-all"
               >
                 <ChevronLeft className="h-4 w-4" /> {step === 1 ? 'Cancel mission' : 'Previous Module'}
               </Button>

               {step < 3 ? (
                 <Button 
                  disabled={step === 1 && leads.length === 0} 
                  onClick={() => setStep(step + 1)} 
                  className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all gap-3"
                 >
                   Continue <ChevronRight className="h-5 w-5" />
                 </Button>
               ) : (
                 <Button 
                  onClick={handleLaunch} 
                  disabled={isLoading}
                  className="h-14 px-12 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 text-white transition-all gap-4"
                 >
                   {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                   DEPLOY CAMPAIGN
                 </Button>
               )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className={cn(
            "h-full overflow-hidden bg-muted/10 border-l border-border/10 flex-col",
            viewMode === 'preview' ? 'flex col-span-2 lg:col-span-1' : 'hidden lg:flex'
          )}>
            <div className="p-4 border-b border-border/10 flex justify-center gap-3 shrink-0">
               {['ios', 'android'].map(d => (
                 <Button 
                  key={d} 
                  variant={previewDevice === d ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setPreviewDevice(d as any)}
                  className="h-8 text-[9px] font-black uppercase tracking-[0.2em] rounded-full px-6 transition-all"
                 >
                   {d}
                 </Button>
               ))}
            </div>
            
            <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-transparent to-primary/5">
                <div className="h-full relative">
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 shadow-2xl rounded-full p-1 bg-background/80 backdrop-blur border border-border/20 flex gap-1 h-auto">
                     {['p1', 'p2', 'p3'].map((t) => (
                       <button
                         key={t}
                         onClick={() => setPreviewTab(t as any)}
                         className={cn(
                           "h-7 text-[8px] font-black uppercase px-4 rounded-full transition-all",
                           previewTab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                         )}
                       >
                         {t === 'p1' ? 'S1' : t === 'p2' ? 'S2' : 'S3'}
                       </button>
                     ))}
                  </div>
                  <div className="h-full m-0">
                    {previewTab === 'p1' && renderPreview(subject, body)}
                    {previewTab === 'p2' && renderPreview(followUpSubject, followUpBody)}
                    {previewTab === 'p3' && renderPreview(followUpSubject2, followUpBody2)}
                  </div>
                </div>
            </div>

            <div className="p-6 border-t border-border/10 text-center">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Real-time engagement simulation</p>
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* Mobile View Toggle (Floating) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex sm:hidden bg-background/80 backdrop-blur-xl border border-border rounded-full p-1 shadow-2xl">
        <Button 
          variant={viewMode === 'edit' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setViewMode('edit')} 
          className="rounded-full text-[10px] font-bold uppercase tracking-widest px-4 h-8"
        >
          Editor
        </Button>
        <Button 
          variant={viewMode === 'preview' ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => setViewMode('preview')} 
          className="rounded-full text-[10px] font-bold uppercase tracking-widest px-4 h-8"
        >
          Preview
        </Button>
      </div>
    </Dialog>
  );
}
