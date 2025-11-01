import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Loader2, Upload } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
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
            <p className="text-sm font-medium mb-1">Upload Product/Service PDFs</p>
            <p className="text-xs text-muted-foreground mb-4">
              📄 AI extracts product details, pricing, features - uses them in DM conversations
            </p>
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
                  
                  toast({
                    title: "✅ PDF Processed",
                    description: `AI learned about your offer: ${result.offerExtracted?.productName || 'Product details extracted'}`
                  });
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
              💡 Upload pricing sheets, product catalogs, FAQs - AI extracts everything automatically
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ℹ️ Max 10MB • AI will reference this when responding to leads
            </p>
          </div>
        </CardContent>
      </Card>

                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="font-medium text-lg">
                {user.name || user.username || "User"}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.plan && (
                <p className="text-sm text-muted-foreground capitalize">
                  {user.plan} Plan
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                📸 Click the upload icon to change avatar (max 5MB, JPG/PNG)
              </p>
            </div>
          </div>

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