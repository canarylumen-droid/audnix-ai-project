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
import { User, Loader2, Upload, Mic, MicOff } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [voiceNotesEnabled, setVoiceNotesEnabled] = useState(true);
  
  // Local state for form fields
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    company: "",
    timezone: "America/New_York",
  });

  // Fetch real user profile
  const { data: user, isLoading, error } = useQuery({
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
    }
  }, [user]);

  // Save profile mutation with auto-save on field change
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
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
            Download all your leads with contact info (email, phone) as CSV spreadsheet
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
            📊 Exports: Name, Email, Phone, Company, Channel, Status, Score, Created Date
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500">
            💡 Use for CRM imports, email campaigns, or offline analysis
          </p>
        </CardContent>
      </Card>

      {/* Brand Knowledge Base */}
      <Card data-testid="card-brand-knowledge">
        <CardHeader>
          <CardTitle>Brand Knowledge Base</CardTitle>
          <CardDescription>
            Upload PDFs about your offers, products, or services - AI will use this to answer lead questions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">Upload Brand & Product PDFs</p>
            <p className="text-xs text-muted-foreground mb-4">
              📄 AI extracts EVERYTHING: Brand colors, product details, pricing, CTAs, contact info
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4 text-left">
              <p className="text-xs font-semibold mb-2 text-primary">📋 What to Include in Your Brand PDF:</p>
              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-semibold mb-1 text-foreground">🎨 Brand Colors (CRITICAL for Email Templates)</p>
                  <ul className="space-y-1 text-muted-foreground ml-3">
                    <li>• Primary color: <code className="bg-muted px-1 rounded">#FF5733</code> or "Coral Red"</li>
                    <li>• Secondary color: <code className="bg-muted px-1 rounded">#2563EB</code> or "Navy Blue"</li>
                    <li>• Accent color: <code className="bg-muted px-1 rounded">#10B981</code> or "Emerald Green"</li>
                    <li>• Label them as "Primary Brand Color:", "Secondary:", "Accent:"</li>
                    <li>• Include RGB values if available: <code className="bg-muted px-1 rounded">rgb(255, 87, 51)</code></li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold mb-1 text-foreground">📦 Product/Service Details</p>
                  <ul className="space-y-1 text-muted-foreground ml-3">
                    <li>• Product name and one-sentence description</li>
                    <li>• Key features as bullet points (AI will use in emails)</li>
                    <li>• Benefits - how it solves customer pain points</li>
                    <li>• Use cases or customer success stories</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold mb-1 text-foreground">💰 Pricing & CTAs</p>
                  <ul className="space-y-1 text-muted-foreground ml-3">
                    <li>• Pricing plans: Starter $49, Pro $99, Enterprise $199</li>
                    <li>• Call-to-action text: "Get Started", "Book a Demo", "Try Free"</li>
                    <li>• Links: Website, booking page, product page URLs</li>
                    <li>• Discount codes or special offers (if any)</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold mb-1 text-foreground">📧 Contact & Support</p>
                  <ul className="space-y-1 text-muted-foreground ml-3">
                    <li>• Support email: support@yourbrand.com</li>
                    <li>• Sales contact: sales@yourbrand.com</li>
                    <li>• Company address (for email footers)</li>
                    <li>• Social media handles (optional)</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold mb-1 text-foreground">🚀 Automatic Lead Outreach Settings</p>
                  <ul className="space-y-1 text-muted-foreground ml-3">
                    <li>• AI will use these details to personalize every email</li>
                    <li>• Email templates will match YOUR brand colors automatically</li>
                    <li>• Imported leads get branded emails with your CTA & links</li>
                    <li>• Voice notes will mention your product features naturally</li>
                  </ul>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded p-2 mt-2">
                  <p className="font-semibold text-amber-800 dark:text-amber-400">💡 Pro Tip:</p>
                  <p className="text-amber-700 dark:text-amber-300">
                    Upload your brand guide, pitch deck, or product sheet PDF. 
                    AI extracts colors, features, pricing - everything needed for professional outreach.
                    Update anytime to refresh your brand voice!
                  </p>
                </div>
              </div>
            </div>
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

      {/* Voice Notes Settings */}
      <Card data-testid="card-voice-settings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {voiceNotesEnabled ? (
              <Mic className="h-5 w-5 text-primary" />
            ) : (
              <MicOff className="h-5 w-5 text-muted-foreground" />
            )}
            Voice Notes Settings
          </CardTitle>
          <CardDescription>
            Control how AI voice notes are sent to leads on Instagram and WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="space-y-1">
              <Label htmlFor="voice-toggle" className="text-base font-medium">
                Enable AI Voice Notes
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, AI can send voice messages to warm leads on Instagram and WhatsApp
              </p>
            </div>
            <Switch
              id="voice-toggle"
              checked={voiceNotesEnabled}
              onCheckedChange={async (checked) => {
                setVoiceNotesEnabled(checked);
                try {
                  await apiRequest("/api/user/voice-settings", {
                    method: "PUT",
                    body: JSON.stringify({ voiceNotesEnabled: checked }),
                  });
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

          {!voiceNotesEnabled && (
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Voice notes are currently paused. No voice messages will be sent to leads on any channel.
              </p>
            </div>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">How voice notes work:</p>
            <ul className="space-y-1 ml-4">
              <li>• AI detects warm, engaged leads automatically</li>
              <li>• Voice notes are sent on Instagram DMs and WhatsApp only</li>
              <li>• Each note is 15 seconds max for professional brevity</li>
              <li>• Uses your cloned voice (upload in Integrations)</li>
              <li>• Voice minutes are deducted from your plan balance</li>
            </ul>
          </div>
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
              <p className="text-xs text-muted-foreground">
                👤 Your full name as it appears on your account
              </p>
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
              <p className="text-xs text-muted-foreground">
                🔑 Unique identifier for your account (used in URLs and mentions)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={user.email || ""}
                disabled
                className="bg-muted"
                data-testid="input-email"
              />
              <p className="text-xs text-muted-foreground">
                📧 Used for login and notifications (cannot be changed)
              </p>
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
              <p className="text-xs text-muted-foreground">
                🏢 Business or organization name (shown in invoices and reports)
              </p>
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
              <p className="text-xs text-muted-foreground">
                🌍 Sets your local time for scheduling follow-ups and analytics
              </p>
            </div>
          </div>

          {/* Save Status */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {saveMutation.isPending && (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving changes...
                </span>
              )}
              {!saveMutation.isPending && !hasChanges && user && (
                <span className="text-green-600">All changes saved</span>
              )}
              {hasChanges && !saveMutation.isPending && (
                <span>Unsaved changes</span>
              )}
            </div>
            
            {hasChanges && (
              <div className="flex flex-col items-end gap-1">
                <Button 
                  onClick={() => saveMutation.mutate(formData)}
                  disabled={saveMutation.isPending}
                  data-testid="button-save-profile"
                  title="Save profile changes immediately"
                >
                  {saveMutation.isPending ? "Saving..." : "Save Now"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  💾 Saves all changes immediately • Or wait 1 second for auto-save
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}