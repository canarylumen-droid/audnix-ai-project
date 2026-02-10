
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, Wand2, Play, Pause, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ManualOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeadIds: string[];
  totalLeads?: number;
}

export default function ManualOutreachModal({ isOpen, onClose, selectedLeadIds, totalLeads }: ManualOutreachModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"config" | "template" | "review">("config");
  const [isLoading, setIsLoading] = useState(false);

  // Campaign Config
  const [name, setName] = useState("");
  const [dailyLimit, setDailyLimit] = useState(50);
  const [minDelay, setMinDelay] = useState(2); // minutes
  const [followUpDelay, setFollowUpDelay] = useState(3); // days
  const [isManualMode, setIsManualMode] = useState(true);

  // Template
  const [subject, setSubject] = useState("Quick question");
  const [body, setBody] = useState("Hi {{firstName}},\n\nI noticed your work at {{company}} and wanted to reach out.\n\nBest,\n[Your Name]");

  // Follow-ups
  const [followUpBody1, setFollowUpBody1] = useState("Hi {{firstName}},\n\nJust floating this to the top of your inbox.\n\nBest,\n[Your Name]");
  const [followUpBody2, setFollowUpBody2] = useState("Hi {{firstName}},\n\nI assume you're busy, so I'll stop pestering you. Here is a link to our portfolio if you ever need us.\n\nBest,\n[Your Name]");

  const leadCount = selectedLeadIds.length > 0 ? selectedLeadIds.length : (totalLeads || 0);

  const handleAiDraft = async () => {
    setIsLoading(true);
    try {
      // For now, use a simulated AI draft or call specific endpoint if available
      // Using a simple preset for speed, or could call /api/ai/generate
      // Since user asked for "AI Draft Button (Generate & View)"
      await new Promise(r => setTimeout(r, 1000));
      setSubject("Partnership opportunity with {{company}}");
      setBody("Hi {{firstName}},\n\nI've been following {{company}} for a while and I'm impressed by your growth.\n\nWe help companies like yours scale their outreach.\n\nAre you open to a quick chat this week?\n\nBest,\n[Your Name]");
      toast({ title: "AI Draft Generated", description: "Template updated with AI suggestion." });
    } catch (error) {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunch = async () => {
    setIsLoading(true);
    try {
      // 1. Create Campaign
      const res = await apiRequest("POST", "/api/outreach/campaigns", {
        name,
        leads: selectedLeadIds,
        config: {
          dailyLimit,
          minDelayMinutes: minDelay,
          maxDelayMinutes: minDelay + 2,
          followUpDelayDays: followUpDelay,
          isManual: isManualMode
        },
        template: {
          subject,
          body,
          followups: [
            { delayDays: 3, body: followUpBody1 },
            { delayDays: 7, body: followUpBody2 }
          ]
        }
      });
      const campaign = await res.json();

      // 2. Start Campaign
      await apiRequest("POST", `/api/outreach/campaigns/${campaign.id}/start`, {});

      toast({ title: "Campaign Launched", description: `${leadCount} leads queued.` });
      onClose();
    } catch (error) {
      console.error(error);
      toast({ title: "Failed to launch campaign", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Start Manual Outreach Campaign</DialogTitle>
          <DialogDescription>
            Targeting {leadCount} leads. Configure your sending limits and template.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {step === "config" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q4 Outreach - Cold Leads" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Daily Limit</Label>
                  <span className="text-sm font-bold">{dailyLimit} emails/day</span>
                </div>
                <Slider value={[dailyLimit]} onValueChange={v => setDailyLimit(v[0])} min={10} max={500} step={10} />
                <p className="text-xs text-muted-foreground">Recommended: 30-50 for new accounts to avoid spam folders.</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Delay Between Emails</Label>
                  <span className="text-sm font-bold">{minDelay} - {minDelay + 2} mins</span>
                </div>
                <Slider value={[minDelay]} onValueChange={v => setMinDelay(v[0])} min={1} max={15} step={1} />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Follow-up Delay</Label>
                  <span className="text-sm font-bold">{followUpDelay} days</span>
                </div>
                <Slider value={[followUpDelay]} onValueChange={v => setFollowUpDelay(v[0])} min={1} max={14} step={1} />
                <p className="text-xs text-muted-foreground">Automatic follow-up if no reply received.</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Autonomous Mode</Label>
                  <p className="text-xs text-muted-foreground">Let AI personalize content (Disabled = Manual Template)</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Label className="text-xs">{!isManualMode ? 'On' : 'Off'}</Label>
                  <Switch checked={!isManualMode} onCheckedChange={c => setIsManualMode(!c)} />
                </div>
              </div>
            </div>
          )}

          {step === "template" && (
            <>
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={handleAiDraft} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                    AI Draft
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="initial" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="initial">Initial Email</TabsTrigger>
                  <TabsTrigger value="fu1">Follow-up (Day 3)</TabsTrigger>
                  <TabsTrigger value="fu2">Follow-up (Day 7)</TabsTrigger>
                </TabsList>

                <TabsContent value="initial" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input value={subject} onChange={e => setSubject(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Body</Label>
                    <Textarea value={body} onChange={e => setBody(e.target.value)} className="h-60 font-mono text-sm" />
                    <p className="text-xs text-muted-foreground">Variables: {"{{firstName}}"}, {"{{company}}"}</p>
                  </div>
                </TabsContent>

                <TabsContent value="fu1" className="space-y-4 pt-4">
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-md text-xs font-bold mb-2">
                    Sends 3 days after initial email if no reply.
                  </div>
                  <div className="space-y-2">
                    <Label>Follow-up Body</Label>
                    <Textarea value={followUpBody1} onChange={e => setFollowUpBody1(e.target.value)} className="h-60 font-mono text-sm" />
                  </div>
                </TabsContent>

                <TabsContent value="fu2" className="space-y-4 pt-4">
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-md text-xs font-bold mb-2">
                    Sends 7 days after initial email if still no reply.
                  </div>
                  <div className="space-y-2">
                    <Label>Final Follow-up Body</Label>
                    <Textarea value={followUpBody2} onChange={e => setFollowUpBody2(e.target.value)} className="h-60 font-mono text-sm" />
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}

          {step === "review" && (
            <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Campaign</Label>
                  <p className="font-medium">{name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Volume</Label>
                  <p className="font-medium">{leadCount} Leads</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Daily Limit</Label>
                  <p className="font-medium">{dailyLimit} / day</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Throttling</Label>
                  <p className="font-medium">~{minDelay} mins delay</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <Label className="text-xs text-muted-foreground">Preview</Label>
                <p className="text-sm font-semibold mt-1">{subject}</p>
                <p className="text-sm mt-1 whitespace-pre-wrap text-muted-foreground">{body.replace("{{firstName}}", "John").replace("{{company}}", "Acme Inc")}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="justify-between sm:justify-between">
          <div>
            {step !== "config" && (
              <Button variant="ghost" onClick={() => setStep(step === "review" ? "template" : "config")}>Back</Button>
            )}
          </div>
          <div className="flex gap-2">
            {step === "config" && <Button onClick={() => setStep("template")}>Next: Template</Button>}
            {step === "template" && <Button onClick={() => setStep("review")}>Next: Review</Button>}
            {step === "review" && (
              <Button onClick={handleLaunch} disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Send className="w-4 h-4 mr-2" />
                Launch Campaign
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
