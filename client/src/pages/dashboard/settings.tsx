import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  User,
  Shield,
  Users,
  Webhook,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Trash2,
} from "lucide-react";

export default function SettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);

  // Mock user data
  const user = {
    name: "Alex Johnson",
    email: "alex@example.com",
    company: "Audnix Inc",
    timezone: "America/New_York",
    replyTone: "professional",
  };

  const teamMembers = [
    { id: "1", name: "Alex Johnson", email: "alex@example.com", role: "Admin" },
    { id: "2", name: "Sarah Chen", email: "sarah@example.com", role: "Member" },
  ];

  const webhooks = [
    { id: "1", url: "https://api.example.com/webhook", events: ["lead.created", "lead.converted"], isActive: true },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-settings">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList data-testid="tabs-settings">
          <TabsTrigger value="profile" data-testid="tab-profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="team" data-testid="tab-team">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="webhooks" data-testid="tab-webhooks">
            <Webhook className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card data-testid="card-profile">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" data-testid="button-change-avatar">Change Avatar</Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue={user.name} data-testid="input-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user.email} data-testid="input-email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" defaultValue={user.company} data-testid="input-company" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue={user.timezone}>
                    <SelectTrigger id="timezone" data-testid="select-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reply-tone">Default Reply Tone</Label>
                <Select defaultValue={user.replyTone}>
                  <SelectTrigger id="reply-tone" data-testid="select-reply-tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="short">Short & Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button data-testid="button-save-profile">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card data-testid="card-api-keys">
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage your API keys for integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value="sk_live_1234567890abcdefghijklmnopqrstuvwxyz"
                  readOnly
                  data-testid="input-api-key"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                  data-testid="button-toggle-api-key"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" data-testid="button-copy-api-key">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" data-testid="button-generate-key">
                Generate New Key
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="card-brand-assets">
            <CardHeader>
              <CardTitle>Brand Assets</CardTitle>
              <CardDescription>
                Upload your brand materials for AI personalization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Brand Guidelines PDF</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Drag and drop or click to upload
                  </p>
                  <Button variant="outline" className="mt-3" data-testid="button-upload-pdf">
                    Upload PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card data-testid="card-team-members">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Invite and manage team members
                  </CardDescription>
                </div>
                <Button data-testid="button-invite-member">
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMembers.map((member, index) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    data-testid={`team-member-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium" data-testid={`text-member-name-${index}`}>{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select defaultValue={member.role.toLowerCase()}>
                        <SelectTrigger className="w-32" data-testid={`select-role-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" data-testid={`button-remove-member-${index}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card data-testid="card-webhooks">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>
                    Configure webhooks for real-time events
                  </CardDescription>
                </div>
                <Button data-testid="button-create-webhook">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {webhooks.map((webhook, index) => (
                  <div
                    key={webhook.id}
                    className="flex items-start justify-between p-4 rounded-lg border"
                    data-testid={`webhook-${index}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium font-mono text-sm" data-testid={`text-webhook-url-${index}`}>
                        {webhook.url}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {webhook.events.map((event) => (
                          <code key={event} className="text-xs bg-muted px-2 py-1 rounded">
                            {event}
                          </code>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" data-testid={`button-delete-webhook-${index}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
