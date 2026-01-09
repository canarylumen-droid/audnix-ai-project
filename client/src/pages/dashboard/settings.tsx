import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Loader2, Upload, Mic, MicOff, FileText, Lock, Sparkles, Building2, Globe, Palette, Save, ShieldCheck, Activity, Brain } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCanAccessVoiceNotes } from "@/hooks/use-access-gate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  name?: string;
  avatar?: string;
  company?: string;
  timezone?: string;
  plan?: string;
  voiceNotesEnabled?: boolean;
  defaultCtaLink?: string;
  defaultCtaText?: string;
  metadata?: any;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [hasChanges, setHasChanges] = useState(false);

  const { canAccess: canAccessVoiceNotes } = useCanAccessVoiceNotes();
  const { data: user, isLoading } = useQuery<UserProfile | null>({ queryKey: ["/api/user/profile"] });

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    company: "",
    timezone: "America/New_York",
    ctaLink: "",
    ctaText: "",
    voiceNotesEnabled: true
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        company: user.company || "",
        timezone: user.timezone || "America/New_York",
        ctaLink: user.defaultCtaLink || "",
        ctaText: user.defaultCtaText || "",
        voiceNotesEnabled: user.voiceNotesEnabled ?? true
      });
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("PUT", "/api/user/profile", data),
    onSuccess: () => {
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({ title: "Protocol Updated", description: "Identity parameters synchronized." });
    },
    onError: () => toast({ title: "Sync Failed", variant: "destructive" })
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/api/user/avatar', { method: 'POST', body: formData });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user/profile"], (old: any) => ({ ...old, avatar: data.avatar }));
      toast({ title: "Visual ID Updated" });
    }
  });

  const uploadPDFMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('pdf', file);
      const res = await fetch('/api/pdf/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Neural Memory Injected", description: "Analyzing brand vector space..." });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    }
  });

  const handleFieldChange = (key: string, val: any) => {
    setFormData(prev => ({ ...prev, [key]: val }));
    setHasChanges(true);
  };

  if (isLoading || !user) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">System Configuration</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase italic">
            OPERATOR <span className="text-primary not-italic">SETTINGS.</span>
          </h1>
        </div>
        {hasChanges && (
          <Button
            onClick={() => saveMutation.mutate(formData)}
            className="h-16 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)]"
          >
            {saveMutation.isPending ? <Loader2 className="animate-spin mr-3 h-4 w-4" /> : <Save className="mr-3 h-4 w-4" />}
            Sync Protocol
          </Button>
        )}
      </div>

      <Tabs defaultValue="profile" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-white/[0.02] border border-white/5 p-1 rounded-2xl md:w-fit mb-12">
          {["profile", "brand", "ai"].map(tab => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-xl px-10 py-3 data-[state=active]:bg-white data-[state=active]:text-black text-white/40 font-black uppercase text-[10px] tracking-widest transition-all"
            >
              {tab === 'ai' ? 'Neural Engine' : tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-8">
              <Card className="bg-white/[0.02] border-white/5 shadow-2xl overflow-hidden rounded-[2.5rem] premium-glow">
                <CardHeader className="text-center pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4 block italic">Digital Avatar</span>
                </CardHeader>
                <CardContent className="flex flex-col items-center p-10 pt-0">
                  <div className="relative group mb-8">
                    <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Avatar className="h-40 w-40 border-4 border-white/10 shadow-2xl relative z-10">
                      <AvatarImage src={user.avatar} className="object-cover" />
                      <AvatarFallback className="text-5xl bg-primary/10 text-primary font-black italic">
                        {user.name?.[0]?.toUpperCase() || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 h-12 w-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20"
                    >
                      <Upload className="h-5 w-5" />
                    </button>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadAvatarMutation.mutate(e.target.files[0])} />
                  </div>
                  <div className="text-center space-y-2 mb-8">
                    <h3 className="text-2xl font-black text-white italic tracking-tight">{user.name || 'Anonymous Operator'}</h3>
                    <p className="text-sm text-white/40 font-bold">{user.email}</p>
                  </div>
                  <div className="px-6 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest italic">
                    {user.plan || 'Free Trial'}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] p-8">
                <div className="flex items-center gap-4 text-white/20 text-[10px] font-black uppercase tracking-widest italic">
                  <ShieldCheck className="w-4 h-4" />
                  Security Protocol
                </div>
                <div className="mt-6 space-y-4">
                  <Button variant="outline" className="w-full h-12 rounded-xl border-white/5 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 font-black uppercase text-[10px] tracking-widest">
                    Request Password Reset
                  </Button>
                </div>
              </Card>
            </div>

            <Card className="lg:col-span-8 bg-white/[0.02] border-white/5 shadow-2xl rounded-[3rem] overflow-hidden">
              <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
                <CardTitle className="text-2xl font-black text-white uppercase italic tracking-tight">Identity Parameters</CardTitle>
                <CardDescription className="text-white/40 font-medium pt-2">Define how you appear within the ecosystem.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 italic">Operator Name</Label>
                    <Input
                      value={formData.name}
                      onChange={e => handleFieldChange('name', e.target.value)}
                      className="h-14 bg-white/[0.03] border-white/10 focus:border-primary/50 rounded-2xl font-bold px-6"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 italic">System Handle</Label>
                    <Input
                      value={formData.username}
                      onChange={e => handleFieldChange('username', e.target.value)}
                      className="h-14 bg-white/[0.03] border-white/10 focus:border-primary/50 rounded-2xl font-bold px-6"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 italic">Venture / Company</Label>
                    <Input
                      value={formData.company}
                      onChange={e => handleFieldChange('company', e.target.value)}
                      className="h-14 bg-white/[0.03] border-white/10 focus:border-primary/50 rounded-2xl font-bold px-6"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 italic">Temporal Zone</Label>
                    <Select value={formData.timezone} onValueChange={v => handleFieldChange('timezone', v)}>
                      <SelectTrigger className="h-14 bg-white/[0.03] border-white/10 focus:border-primary/50 rounded-2xl font-bold px-6">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Standard (NYC)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Standard (LA)</SelectItem>
                        <SelectItem value="Europe/London">Greenwich (London)</SelectItem>
                        <SelectItem value="Asia/Dubai">Gulf Standard (Dubai)</SelectItem>
                        <SelectItem value="Asia/Singapore">Singapore Standard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-6">
                  <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/20 flex items-center gap-6">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <Brain className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase italic tracking-tight">Active Neural Node</p>
                      <p className="text-[10px] text-primary font-bold uppercase tracking-widest opacity-60">Connected to Global Intelligence Network v4.2</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* BRAND TAB */}
        <TabsContent value="brand" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-white/[0.02] border-white/5 shadow-2xl rounded-[3rem] overflow-hidden flex flex-col">
              <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
                <CardTitle className="flex items-center gap-3 text-2xl font-black text-white uppercase italic tracking-tight">
                  <Palette className="h-6 w-6 text-primary" />
                  Neural Memory
                </CardTitle>
                <CardDescription className="text-white/40 font-medium pt-2">Inject brand intelligence via documentation.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8 flex-1">
                <div
                  className="group bg-white/[0.02] border-2 border-dashed border-white/10 hover:border-primary/50 transition-all rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden h-full"
                  onClick={() => pdfInputRef.current?.click()}
                >
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="h-20 w-20 rounded-[2rem] bg-white text-black shadow-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-700">
                    <Upload className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase italic">UPLOAD BRAND PDF</h3>
                  <p className="text-sm text-white/40 font-bold max-w-xs mt-4">
                    Product guides, sales scripts, or brand decks. AI will vectorize this knowledge.
                  </p>
                  <input ref={pdfInputRef} type="file" className="hidden" accept=".pdf" onChange={e => e.target.files?.[0] && uploadPDFMutation.mutate(e.target.files[0])} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-white/5 shadow-2xl rounded-[3rem] overflow-hidden">
              <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
                <CardTitle className="flex items-center gap-3 text-2xl font-black text-white uppercase italic tracking-tight">
                  <Globe className="h-6 w-6 text-primary" />
                  Conversion Lead
                </CardTitle>
                <CardDescription className="text-white/40 font-medium pt-2">Define the primary destination for your prospects.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 italic">Protocol Destination (Link)</Label>
                  <Input
                    placeholder="https://cal.com/book-demo"
                    value={formData.ctaLink}
                    onChange={e => handleFieldChange('ctaLink', e.target.value)}
                    className="h-14 bg-white/[0.03] border-white/10 focus:border-primary/50 rounded-2xl font-bold px-6"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 italic">Action Command (Text)</Label>
                  <Input
                    placeholder="Lock in Strategy Call"
                    value={formData.ctaText}
                    onChange={e => handleFieldChange('ctaText', e.target.value)}
                    className="h-14 bg-white/[0.03] border-white/10 focus:border-primary/50 rounded-2xl font-bold px-6"
                  />
                </div>

                <div className="p-8 rounded-[2rem] bg-primary/[0.03] border border-primary/10 mt-10">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary italic mb-4">Live Preview</h4>
                  <Button className="h-16 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs">
                    {formData.ctaText || "Default Action"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {user.metadata?.extracted_brand?.companyName && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-10 rounded-[3rem] bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-black text-white uppercase italic">Active Semantic Profile</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <p className="text-[10px] font-black uppercase text-white/20 mb-1">Company</p>
                  <p className="font-bold text-white italic">{user.metadata.extracted_brand.companyName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white/20 mb-1">Neural Tone</p>
                  <p className="font-bold text-white italic">{user.metadata.extracted_brand.tone || 'High Status'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white/20 mb-1">Confidence</p>
                  <p className="font-bold text-emerald-500 italic">98.4% Match</p>
                </div>
              </div>
            </motion.div>
          )}
        </TabsContent>

        {/* AI BEHAVIOR TAB */}
        <TabsContent value="ai" className="space-y-8">
          <Card className="bg-white/[0.02] border-white/5 shadow-2xl rounded-[3rem] overflow-hidden">
            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.01]">
              <CardTitle className="flex items-center gap-3 text-2xl font-black text-white uppercase italic tracking-tight">
                <Sparkles className="h-6 w-6 text-primary" />
                Autonomous Permissions
              </CardTitle>
              <CardDescription className="text-white/40 font-medium pt-2">Calibrate how much control the system has over outreach.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <div className={`flex flex-col md:flex-row items-center justify-between p-8 rounded-[2.5rem] border transition-all duration-700 ${formData.voiceNotesEnabled && canAccessVoiceNotes ? 'bg-primary/[0.03] border-primary/30 shadow-lg' : 'bg-white/[0.01] border-white/5'}`}>
                <div className="space-y-2 mb-6 md:mb-0 max-w-xl text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Mic className="h-4 w-4" />
                    </div>
                    <Label className="text-xl font-black text-white uppercase italic tracking-tight flex items-center gap-3">
                      Neural Voice Cloning
                      {canAccessVoiceNotes ? <Badge className="bg-primary text-black border-0 font-black text-[10px] px-2 h-6 tracking-widest">LIVE</Badge> : <Lock className="h-4 w-4 text-white/20" />}
                    </Label>
                  </div>
                  <p className="text-sm text-white/40 font-bold leading-relaxed">
                    Allow AI to generate and send hyper-realistic voice messages to high-intent leads on Instagram & WhatsApp.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <Switch
                    checked={formData.voiceNotesEnabled && canAccessVoiceNotes}
                    onCheckedChange={c => canAccessVoiceNotes && handleFieldChange('voiceNotesEnabled', c)}
                    disabled={!canAccessVoiceNotes}
                    className="data-[state=checked]:bg-primary"
                  />
                  {!canAccessVoiceNotes && (
                    <span className="text-[10px] font-black uppercase text-primary/40 italic">Upgrade Required</span>
                  )}
                </div>
              </div>

              {!canAccessVoiceNotes && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 text-sm text-primary bg-primary/5 p-8 rounded-[2.5rem] border border-primary/20"
                >
                  <Lock className="h-6 w-6 flex-shrink-0" />
                  <p className="font-black uppercase text-xs tracking-widest italic">
                    Neural Voice Protocol is locked. <Link href="/dashboard/pricing" className="underline cursor-pointer hover:text-white transition-colors">Upgrade to Pro</Link> to initialize cloning sequences.
                  </p>
                </motion.div>
              )}

              <div className="mt-12 p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.01]">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-8 italic">Audit Trail & Controls</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-sm font-black text-white italic">Confidence Threshold</p>
                    <p className="text-xs text-white/40 font-bold">Minimum prediction accuracy before system executes autonomous reply.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-2 flex-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[85%]" />
                    </div>
                    <span className="text-sm font-black text-primary">85%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}