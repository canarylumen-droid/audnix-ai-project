
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
import { User, Loader2, Upload, Mic, MicOff, FileText, Lock, Sparkles, Building2, Globe, Palette, Save } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCanAccessVoiceNotes } from "@/hooks/use-access-gate";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

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
      toast({ title: "Settings Saved", description: "Your changes have been updated." });
    },
    onError: () => toast({ title: "Save Failed", variant: "destructive" })
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
      toast({ title: "Avatar Updated" });
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
      toast({ title: "Brand Knowledge Updated", description: "AI is analyzing your document." });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    }
  });

  const handleFieldChange = (key: string, val: any) => {
    setFormData(prev => ({ ...prev, [key]: val }));
    setHasChanges(true);
  };

  if (isLoading || !user) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-lg mt-1">Manage your account and AI preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b w-full justify-start h-auto p-0 rounded-none gap-8">
          {["profile", "brand", "ai"].map(tab => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 capitalize text-sm font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              {tab === 'ai' ? 'AI Behavior' : tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="mt-8 space-y-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar Section */}
            <Card className="w-full md:w-80 h-fit">
              <CardHeader>
                <CardTitle>Public Profile</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center space-y-4">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-4xl bg-primary/5">{user.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6" />
                  </div>
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadAvatarMutation.mutate(e.target.files[0])} />
                </div>
                <div>
                  <p className="font-semibold text-lg">{user.name || 'User'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant="secondary" className="uppercase tracking-widest text-[10px]">{user.plan || 'Free Plan'}</Badge>
              </CardContent>
            </Card>

            {/* Main Form */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>Your contact info and preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={formData.name} onChange={e => handleFieldChange('name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={formData.username} onChange={e => handleFieldChange('username', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="bg-muted" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input value={formData.company} onChange={e => handleFieldChange('company', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={formData.timezone} onValueChange={v => handleFieldChange('timezone', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        {/* Add more as needed */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t pt-6 bg-muted/20">
                {hasChanges && (
                  <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* BRAND TAB */}
        <TabsContent value="brand" className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-purple-500" /> Brand Intelligence</CardTitle>
                <CardDescription>AI learns your brand from these assets.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div
                  className="bg-muted/30 border-2 border-dashed border-border hover:border-primary/50 transition-all rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer"
                  onClick={() => pdfInputRef.current?.click()}
                >
                  <div className="h-12 w-12 rounded-full bg-background shadow-sm flex items-center justify-center mb-4">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">Upload Brand PDF</h3>
                  <p className="text-sm text-muted-foreground max-w-[200px] mt-1">
                    Pitch decks, brand guidelines, or product sheets (PDF).
                  </p>
                  <input ref={pdfInputRef} type="file" className="hidden" accept=".pdf" onChange={e => e.target.files?.[0] && uploadPDFMutation.mutate(e.target.files[0])} />
                </div>

                {user.metadata?.extracted_brand?.companyName && (
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm">
                    <p className="font-semibold text-emerald-600 mb-2">Analyzed Brand Data</p>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <span>Name: <span className="text-foreground">{user.metadata.extracted_brand.companyName}</span></span>
                      <span>Colors: <span className="text-foreground">{user.metadata.extracted_brand.colors?.primary || 'N/A'}</span></span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-blue-500" /> Default CTA</CardTitle>
                <CardDescription>Where should AI drive your leads?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>CTA Link</Label>
                  <Input placeholder="https://cal.com/book" value={formData.ctaLink} onChange={e => handleFieldChange('ctaLink', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Button Text</Label>
                  <Input placeholder="Book a Call" value={formData.ctaText} onChange={e => handleFieldChange('ctaText', e.target.value)} />
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t pt-6 bg-muted/20">
                {hasChanges && <Button onClick={() => saveMutation.mutate(formData)}>Save CTA</Button>}
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* AI BEHAVIOR TAB */}
        <TabsContent value="ai" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-indigo-500" /> AI Features</CardTitle>
              <CardDescription>Control autonomous capabilities.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <div className="space-y-1">
                  <Label className="text-base font-medium flex items-center gap-2">
                    Voice Notes {canAccessVoiceNotes ? <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0 h-5 px-1.5 text-[10px]">BETA</Badge> : <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Allow AI to send cloned voice replies to warm Instagram leads.
                  </p>
                </div>
                <Switch
                  checked={formData.voiceNotesEnabled && canAccessVoiceNotes}
                  onCheckedChange={c => canAccessVoiceNotes && handleFieldChange('voiceNotesEnabled', c)}
                  disabled={!canAccessVoiceNotes}
                />
              </div>
              {!canAccessVoiceNotes && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 p-3 rounded-lg">
                  <Lock className="h-4 w-4" />
                  Upgrade to Pro to unlock Voice Notes.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}