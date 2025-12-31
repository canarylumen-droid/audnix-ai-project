import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { User, Loader2, Upload, Mic, MicOff, FileText, Lock, Sparkles } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCanAccessVoiceNotes } from "@/hooks/use-access-gate";
import { Link } from "wouter";

interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
}

interface ExtractedBrand {
  companyName?: string;
  tagline?: string;
  website?: string;
  colors?: BrandColors;
}

interface UserMetadata {
  extracted_brand?: ExtractedBrand;
  brand_colors?: BrandColors;
  extraction_updated_at?: string;
  [key: string]: unknown;
}

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  name?: string;
  avatar?: string;
  company?: string;
  timezone?: string;
  plan?: string;
  role?: string;
  voiceNotesEnabled?: boolean;
  businessName?: string;
  voiceCloneId?: string;
  voiceMinutesUsed?: number;
  voiceMinutesTopup?: number;
  metadata?: UserMetadata;
  createdAt?: string;
  lastLogin?: string;
  defaultCtaLink?: string;
  defaultCtaText?: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [voiceNotesEnabled, setVoiceNotesEnabled] = useState(true);
  const [ctaLink, setCtaLink] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaSaving, setCtaSaving] = useState(false);
  
  const { canAccess: canAccessVoiceNotes, showUpgradePrompt } = useCanAccessVoiceNotes();
  
  // Local state for form fields
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    company: "",
    timezone: "America/New_York",
  });

  // Fetch real user profile
  const { data: user, isLoading, error } = useQuery<UserProfile | null>({
    queryKey: ["/api/user/profile"],
    retry: false,
  });

  // Update local state when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        company: user.company || "",
        timezone: user.timezone || "America/New_York",
      });
      setVoiceNotesEnabled(user.voiceNotesEnabled !== false);
      setCtaLink(user.defaultCtaLink || "");
      setCtaText(user.defaultCtaText || "");
    }
  }, [user]);

  // Save profile mutation with auto-save on field change
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("PUT", "/api/user/profile", data);
    },
    onSuccess: () => {
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-save with debounce
  useEffect(() => {
    if (hasChanges && user) {
      const timer = setTimeout(() => {
        saveMutation.mutate(formData);
      }, 1000); // Auto-save after 1 second of inactivity
      
      return () => clearTimeout(timer);
    }
  }, [formData, hasChanges, user]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // CTA settings save
  const saveCtaSettings = async () => {
    setCtaSaving(true);
    try {
      await apiRequest("PUT", "/api/user/profile", { defaultCtaLink: ctaLink, defaultCtaText: ctaText });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({ title: "CTA settings saved" });
    } catch {
      toast({ title: "Failed to save CTA settings", variant: "destructive" });
    } finally {
      setCtaSaving(false);
    }
  };

  // Avatar upload mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Immediately update the cache with new avatar
      queryClient.setQueryData(["/api/user/profile"], (old: any) => ({
        ...old,
        avatar: data.avatar
      }));
      toast({
        title: "Success",
        description: "Avatar updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    uploadAvatarMutation.mutate(file);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show message if no user data available
  if (error || !user) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Profile Data</h2>
          <p className="text-muted-foreground">
            Please sign in to view and edit your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-settings">
          Profile Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account information
        </p>
      </div>

      {/* Profile Card */}
      <Card data-testid="card-profile">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your account details - changes save automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="text-2xl">
                  {(user.name || user.email || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Export */}
      <Card data-testid="card-lead-export">
        <CardHeader>
          <CardTitle>Export Leads</CardTitle>
          <CardDescription>
            Export all leads as CSV with contact info
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={async () => {
              try {
                toast({ title: "Generating CSV...", description: "Preparing your leads export" });
                
                const response = await fetch('/api/leads/export');
                if (!response.ok) throw new Error('Export failed');
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                toast({ title: "✅ CSV Downloaded", description: "Check your downloads folder" });
              } catch (error) {
                toast({
                  title: "Export failed",
                  description: "Could not generate CSV. Try again.",
                  variant: "destructive"
                });
              }
            }}
            className="w-full"
          >
            <FileText className="h-4 w-4 mr-2" />
            Download All Leads as CSV
          </Button>
          <p className="text-xs text-muted-foreground">
            Exports: Name, Email, Phone, Company, Channel, Status, Score, Date
          </p>
        </CardContent>
      </Card>

      {/* Brand Knowledge Base */}
      <Card data-testid="card-brand-knowledge">
        <CardHeader>
          <CardTitle>Brand Knowledge</CardTitle>
          <CardDescription>
            Upload PDFs to teach AI about your brand
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium mb-2">Upload Brand PDF</p>
            <p className="text-xs text-muted-foreground mb-4">
              Include: Brand colors, products, pricing, contact info
            </p>
            <div className="space-y-3">
              {user?.metadata?.extracted_brand?.companyName && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                    ✅ Current Brand: {user.metadata.extracted_brand.companyName}
                  </p>
                  <div className="flex gap-2 text-xs text-green-700 dark:text-green-300">
                    {user.metadata.brand_colors?.primary && (
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-4 h-4 rounded border border-green-300"
                          style={{ backgroundColor: user.metadata.brand_colors.primary }}
                        />
                        <span>Primary</span>
                      </div>
                    )}
                    {user.metadata.brand_colors?.accent && (
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-4 h-4 rounded border border-green-300"
                          style={{ backgroundColor: user.metadata.brand_colors.accent }}
                        />
                        <span>Accent</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    📅 Last updated: {new Date(user.metadata.extraction_updated_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              <Input
                type="file"
                accept=".pdf"
                className="max-w-xs mx-auto"
                onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                if (file.size > 10 * 1024 * 1024) {
                  toast({
                    title: "File too large",
                    description: "Please upload a PDF smaller than 10MB",
                    variant: "destructive"
                  });
                  return;
                }
                
                const formData = new FormData();
                formData.append('pdf', file);
                
                try {
                  toast({ title: "Uploading PDF...", description: "AI is processing your document" });
                  
                  const response = await fetch('/api/pdf/upload', {
                    method: 'POST',
                    body: formData
                  });
                  
                  if (!response.ok) throw new Error('Upload failed');
                  
                  const result = await response.json();
                  
                  const brandExtracted = result.brandExtracted?.colors?.primary ? 
                    `Brand colors: ${result.brandExtracted.colors.primary}` : '';
                  const offerExtracted = result.offerExtracted?.productName || 'Product details';
                  
                  const isUpdate = user?.metadata?.extracted_brand?.companyName;
                  
                  toast({
                    title: isUpdate ? "✅ Brand Updated Successfully" : "✅ PDF Processed Successfully",
                    description: `${isUpdate ? 'Updated: ' : 'Extracted: '}${offerExtracted}${brandExtracted ? ` | ${brandExtracted}` : ''}`
                  });
                  
                  // Refresh user data
                  queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
                } catch (error) {
                  toast({
                    title: "Upload failed",
                    description: "Could not process PDF. Try again.",
                    variant: "destructive"
                  });
                }
              }}
              title="Upload PDF with product/service information for AI to learn"
            />
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
              💡 Emails will use YOUR brand colors automatically when sending to leads
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              ✨ AI personalizes every message with your product details & CTA
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ℹ️ Max 10MB • Supports: Brand guides, pitch decks, product sheets, sales PDFs
            </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shared CTA Settings */}
      <Card data-testid="card-cta-settings">
        <CardHeader>
          <CardTitle>Default CTA</CardTitle>
          <CardDescription>
            Used across Instagram DMs and Email automation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cta-link">CTA Link</Label>
              <Input
                id="cta-link"
                placeholder="https://yourbrand.com/book"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta-text">CTA Button Text</Label>
              <Input
                id="cta-text"
                placeholder="Book a call"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={saveCtaSettings} 
            disabled={ctaSaving}
            className="w-full"
          >
            {ctaSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save CTA Settings
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            AI uses this link in Instagram DMs and email follow-ups
          </p>
        </CardContent>
      </Card>

      {/* Voice Notes Settings */}
      <Card data-testid="card-voice-settings" className="relative">
        {!canAccessVoiceNotes && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="text-center p-6 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Voice Notes - Paid Feature</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  AI voice notes are available on Starter plan and above
                </p>
                <Link href="/dashboard/pricing">
                  <Button className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Upgrade to Unlock
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
        <CardHeader className={!canAccessVoiceNotes ? "opacity-50" : ""}>
          <CardTitle className="flex items-center gap-2">
            {voiceNotesEnabled && canAccessVoiceNotes ? (
              <Mic className="h-5 w-5 text-primary" />
            ) : (
              <MicOff className="h-5 w-5 text-muted-foreground" />
            )}
            Voice Notes Settings
          </CardTitle>
          <CardDescription>
            Control how AI voice notes are sent to leads on Instagram DMs
          </CardDescription>
        </CardHeader>
        <CardContent className={`space-y-6 ${!canAccessVoiceNotes ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="space-y-1">
              <Label htmlFor="voice-toggle" className="text-base font-medium">
                Enable AI Voice Notes
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, AI can send voice messages to warm leads on Instagram DMs
              </p>
            </div>
            <Switch
              id="voice-toggle"
              checked={voiceNotesEnabled && canAccessVoiceNotes}
              disabled={!canAccessVoiceNotes}
              onCheckedChange={async (checked) => {
                if (!canAccessVoiceNotes) return;
                setVoiceNotesEnabled(checked);
                try {
                  await apiRequest("PUT", "/api/user/voice-settings", { voiceNotesEnabled: checked });
                  queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
                  toast({
                    title: checked ? "Voice Notes Enabled" : "Voice Notes Disabled",
                    description: checked 
                      ? "AI can now send voice messages to your leads" 
                      : "Voice messages are paused for all channels",
                  });
                } catch (error) {
                  setVoiceNotesEnabled(!checked);
                  toast({
                    title: "Error",
                    description: "Failed to update voice settings",
                    variant: "destructive",
                  });
                }
              }}
              data-testid="switch-voice-notes"
            />
          </div>

          {!voiceNotesEnabled && canAccessVoiceNotes && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Voice notes paused. No voice messages will be sent.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Input Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your profile details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="Enter your full name"
                data-testid="input-name" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                value={formData.username}
                onChange={(e) => handleFieldChange("username", e.target.value)}
                placeholder="Choose a username"
                data-testid="input-username" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={user.email || ""}
                disabled
                className="bg-muted"
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input 
                id="company" 
                value={formData.company}
                onChange={(e) => handleFieldChange("company", e.target.value)}
                placeholder="Your company name"
                data-testid="input-company" 
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select 
                value={formData.timezone}
                onValueChange={(value) => handleFieldChange("timezone", value)}
              >
                <SelectTrigger id="timezone" data-testid="select-timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                  <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Save Status */}
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <div className="text-sm text-muted-foreground">
              {saveMutation.isPending && (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              )}
              {!saveMutation.isPending && !hasChanges && user && (
                <span className="text-green-600">Saved</span>
              )}
              {hasChanges && !saveMutation.isPending && (
                <span>Unsaved changes</span>
              )}
            </div>
            
            {hasChanges && (
              <Button 
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending}
                data-testid="button-save-profile"
              >
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}