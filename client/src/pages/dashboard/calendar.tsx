import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  ExternalLink,
  CalendarDays,
  Plus,
  Loader2,
  Settings,
  CheckCircle,
  XCircle,
  Link as LinkIcon,
  Bot,
  Target,
  Timer,
  Zap,
  Brain,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CalendarSettings {
  id: string;
  calendlyEnabled: boolean;
  calendlyUsername: string | null;
  googleCalendarEnabled: boolean;
  autoBookingEnabled: boolean;
  minIntentScore: number;
  minTimingScore: number;
  meetingDuration: number;
  titleTemplate: string;
  bufferBefore: number;
  bufferAfter: number;
  workingHoursStart: number;
  workingHoursEnd: number;
  timezone: string;
}

interface CalendarBooking {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  meetingUrl: string | null;
  attendeeEmail: string | null;
  attendeeName: string | null;
  status: string;
  isAiBooked: boolean;
  intentScoreAtBooking: number | null;
  provider: string;
}

interface AIActionLog {
  id: string;
  actionType: string;
  decision: string;
  intentScore: number | null;
  timingScore: number | null;
  confidence: number | null;
  reasoning: string | null;
  createdAt: string;
}

export default function CalendarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [calendlyToken, setCalendlyToken] = useState("");
  const [newEvent, setNewEvent] = useState({
    summary: "",
    description: "",
    startTime: "",
    endTime: "",
    attendeeEmail: "",
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery<{ settings: CalendarSettings }>({
    queryKey: ["/api/calendar/settings"],
    retry: false,
  });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery<{ bookings: CalendarBooking[] }>({
    queryKey: ["/api/calendar/bookings"],
    refetchInterval: 30000,
    retry: false,
  });

  const { data: aiLogsData } = useQuery<{ logs: AIActionLog[] }>({
    queryKey: ["/api/calendar/ai-logs"],
    retry: false,
  });

  const { data: eventsData } = useQuery({
    queryKey: ["/api/oauth/google-calendar/events"],
    refetchInterval: 30000,
    retry: false,
  });

  const settings = settingsData?.settings;
  const bookings = bookingsData?.bookings || [];
  const aiLogs = aiLogsData?.logs || [];
  const googleEvents = (eventsData as any)?.events || [];

  const allEvents = [
    ...bookings.map(b => ({
      id: b.id,
      title: b.title,
      startTime: b.startTime,
      endTime: b.endTime,
      meetingUrl: b.meetingUrl,
      isAiBooked: b.isAiBooked,
      leadName: b.attendeeName,
      provider: b.provider,
      status: b.status,
      intentScore: b.intentScoreAtBooking,
    })),
    ...googleEvents.map((e: any) => ({
      id: e.id,
      title: e.title || e.summary,
      startTime: e.startTime || e.start?.dateTime,
      endTime: e.endTime || e.end?.dateTime,
      meetingUrl: e.meetingUrl || e.hangoutLink,
      isAiBooked: e.isAiBooked || false,
      leadName: e.leadName,
      provider: 'google',
      status: 'scheduled',
    })),
  ].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const upcomingEvents = allEvents.filter(e => new Date(e.startTime) > new Date());
  const todayEvents = allEvents.filter(e => {
    const eventDate = new Date(e.startTime);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });
  const aiScheduledCount = allEvents.filter(e => e.isAiBooked).length;

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<CalendarSettings>) => {
      const response = await apiRequest("PATCH", "/api/calendar/settings", updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/settings"] });
      toast({ title: "Settings updated" });
    },
    onError: () => {
      toast({ title: "Failed to update settings", variant: "destructive" });
    },
  });

  const connectCalendlyMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", "/api/calendar/connect-calendly", { token });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/settings"] });
      setCalendlyToken("");
      toast({ title: "Calendly connected", description: `Connected as ${data.username}` });
    },
    onError: (error: any) => {
      toast({ title: "Failed to connect", description: error.message, variant: "destructive" });
    },
  });

  const disconnectCalendlyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/calendar/disconnect-calendly", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/settings"] });
      toast({ title: "Calendly disconnected" });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: typeof newEvent) => {
      const response = await fetch("/api/oauth/google-calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(eventData),
      });
      if (!response.ok) throw new Error("Failed to create event");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/oauth/google-calendar/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/bookings"] });
      setShowCreateDialog(false);
      setNewEvent({ summary: "", description: "", startTime: "", endTime: "", attendeeEmail: "" });
      toast({ title: "Event created" });
    },
    onError: () => {
      toast({ title: "Failed to create event", variant: "destructive" });
    },
  });

  const formatTime = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} - ${endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    if (diff > 0) return "soon";
    return "past";
  };

  const isLoading = settingsLoading || bookingsLoading;

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            {allEvents.length > 0 
              ? `${upcomingEvents.length} upcoming · ${todayEvents.length} today · ${aiScheduledCount} AI-booked`
              : "AI-powered calendar management and booking"}
          </p>
        </div>
        <div className="flex gap-2">
          {allEvents.length > 0 && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          )}
          <Sheet open={showSettingsSheet} onOpenChange={setShowSettingsSheet}>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Calendar Settings</SheetTitle>
                <SheetDescription>
                  Configure calendar connections and AI booking behavior
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 py-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Connections
                  </h3>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <CalendarIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Calendly</p>
                            <p className="text-sm text-muted-foreground">
                              {settings?.calendlyEnabled 
                                ? `@${settings.calendlyUsername}` 
                                : "Not connected"}
                            </p>
                          </div>
                        </div>
                        {settings?.calendlyEnabled ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => disconnectCalendlyMutation.mutate()}
                              disabled={disconnectCalendlyMutation.isPending}
                            >
                              Disconnect
                            </Button>
                          </div>
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      {!settings?.calendlyEnabled && (
                        <div className="mt-4 space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="calendly-token">Personal Access Token</Label>
                            <Input
                              id="calendly-token"
                              type="password"
                              placeholder="Enter your Calendly API token"
                              value={calendlyToken}
                              onChange={(e) => setCalendlyToken(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              Get from calendly.com/integrations/api_webhooks
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => connectCalendlyMutation.mutate(calendlyToken)}
                            disabled={!calendlyToken || connectCalendlyMutation.isPending}
                          >
                            {connectCalendlyMutation.isPending ? (
                              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Connecting...</>
                            ) : (
                              "Connect"
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <CalendarDays className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium">Google Calendar</p>
                            <p className="text-sm text-muted-foreground">
                              {settings?.googleCalendarEnabled ? "Connected" : "Not connected"}
                            </p>
                          </div>
                        </div>
                        {settings?.googleCalendarEnabled ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Button variant="outline" size="sm" asChild>
                            <a href="/api/oauth/google-calendar/connect">Connect</a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI Auto-Booking
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable AI Booking</p>
                      <p className="text-sm text-muted-foreground">
                        AI will automatically schedule calls with high-intent leads
                      </p>
                    </div>
                    <Switch
                      checked={settings?.autoBookingEnabled ?? false}
                      onCheckedChange={(checked) => 
                        updateSettingsMutation.mutate({ autoBookingEnabled: checked })
                      }
                    />
                  </div>

                  {settings?.autoBookingEnabled && (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-blue-500" />
                            Minimum Intent Score
                          </Label>
                          <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {settings.minIntentScore}%
                          </span>
                        </div>
                        <Slider
                          value={[settings.minIntentScore]}
                          onValueChange={([value]) => 
                            updateSettingsMutation.mutate({ minIntentScore: value })
                          }
                          min={50}
                          max={95}
                          step={5}
                        />
                        <p className="text-xs text-muted-foreground">
                          Only book when lead intent is above this threshold
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-orange-500" />
                            Minimum Timing Score
                          </Label>
                          <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {settings.minTimingScore}%
                          </span>
                        </div>
                        <Slider
                          value={[settings.minTimingScore]}
                          onValueChange={([value]) => 
                            updateSettingsMutation.mutate({ minTimingScore: value })
                          }
                          min={40}
                          max={90}
                          step={5}
                        />
                        <p className="text-xs text-muted-foreground">
                          Timing appropriateness for booking (recency, engagement)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Meeting Preferences
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Select
                        value={String(settings?.meetingDuration ?? 30)}
                        onValueChange={(value) => 
                          updateSettingsMutation.mutate({ meetingDuration: Number(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Buffer Before</Label>
                      <Select
                        value={String(settings?.bufferBefore ?? 10)}
                        onValueChange={(value) => 
                          updateSettingsMutation.mutate({ bufferBefore: Number(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">None</SelectItem>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Title Template</Label>
                    <Input
                      value={settings?.titleTemplate ?? "{{lead_name}} - Discovery Call"}
                      onChange={(e) => 
                        updateSettingsMutation.mutate({ titleTemplate: e.target.value })
                      }
                      placeholder="{{lead_name}} - Discovery Call"
                    />
                    <p className="text-xs text-muted-foreground">
                      Available: {"{{lead_name}}"}, {"{{lead_email}}"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Working Hours Start</Label>
                      <Select
                        value={String(settings?.workingHoursStart ?? 9)}
                        onValueChange={(value) => 
                          updateSettingsMutation.mutate({ workingHoursStart: Number(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 6).map(hour => (
                            <SelectItem key={hour} value={String(hour)}>
                              {hour}:00 {hour < 12 ? 'AM' : 'PM'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Working Hours End</Label>
                      <Select
                        value={String(settings?.workingHoursEnd ?? 17)}
                        onValueChange={(value) => 
                          updateSettingsMutation.mutate({ workingHoursEnd: Number(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 12).map(hour => (
                            <SelectItem key={hour} value={String(hour)}>
                              {hour > 12 ? hour - 12 : hour}:00 PM
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Calendar Event</DialogTitle>
            <DialogDescription>Schedule a new meeting or appointment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="summary">Event Title</Label>
              <Input
                id="summary"
                value={newEvent.summary}
                onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
                placeholder="Meeting with client"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Discuss project requirements..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="attendeeEmail">Attendee Email (Optional)</Label>
              <Input
                id="attendeeEmail"
                type="email"
                value={newEvent.attendeeEmail}
                onChange={(e) => setNewEvent({ ...newEvent, attendeeEmail: e.target.value })}
                placeholder="client@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => createEventMutation.mutate(newEvent)}
              disabled={!newEvent.summary || !newEvent.startTime || !newEvent.endTime || createEventMutation.isPending}
            >
              {createEventMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
              ) : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayEvents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingEvents.filter(e => {
                const eventDate = new Date(e.startTime);
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return eventDate <= weekFromNow;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiScheduledCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Auto-Booking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${settings?.autoBookingEnabled ? 'bg-green-500' : 'bg-muted'}`} />
              <span className="text-sm font-medium">
                {settings?.autoBookingEnabled ? "Active" : "Off"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {settings?.autoBookingEnabled && aiLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Booking Decisions
            </CardTitle>
            <CardDescription>Recent booking analysis and decisions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      log.decision === 'act' ? 'bg-green-100 text-green-600' :
                      log.decision === 'wait' ? 'bg-yellow-100 text-yellow-600' :
                      log.decision === 'skip' ? 'bg-gray-100 text-gray-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {log.decision === 'act' ? <CheckCircle className="h-4 w-4" /> :
                       log.decision === 'wait' ? <Clock className="h-4 w-4" /> :
                       log.decision === 'skip' ? <XCircle className="h-4 w-4" /> :
                       <Target className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{log.decision}</p>
                      <p className="text-xs text-muted-foreground">{log.reasoning}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-xs">
                      {log.intentScore && (
                        <Badge variant="outline">Intent: {log.intentScore}%</Badge>
                      )}
                      {log.timingScore && (
                        <Badge variant="outline">Timing: {log.timingScore}%</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {allEvents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No calendar events yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Connect your calendar to sync meetings. Once connected, 
              AI will automatically schedule appointments with your leads.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setShowSettingsSheet(true)}>
                Connect Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        {event.isAiBooked && (
                          <Badge variant="secondary" className="text-xs">
                            <Bot className="h-3 w-3 mr-1" />
                            AI Scheduled
                          </Badge>
                        )}
                        {event.intentScore && (
                          <Badge variant="outline" className="text-xs">
                            Intent: {event.intentScore}%
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs capitalize">
                          {event.provider}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{formatDate(event.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(event.startTime, event.endTime)}</span>
                        </div>
                      </div>

                      {event.leadName && (
                        <p className="text-sm mb-2">
                          Meeting with <span className="font-medium">{event.leadName}</span>
                        </p>
                      )}

                      {event.meetingUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer">
                            <Video className="h-4 w-4 mr-2" />
                            Join Meeting
                            <ExternalLink className="h-3 w-3 ml-2" />
                          </a>
                        </Button>
                      )}
                    </div>

                    <Badge variant="outline">
                      {getRelativeTime(event.startTime)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
