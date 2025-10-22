import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  ExternalLink,
  Mail,
} from "lucide-react";

const events = [
  {
    id: "event-1",
    title: "Demo Call - Sarah Miller",
    startTime: "2025-01-23T14:00:00Z",
    endTime: "2025-01-23T14:30:00Z",
    leadName: "Sarah Miller",
    provider: "google" as const,
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    isAiBooked: true,
  },
  {
    id: "event-2",
    title: "Follow-up - David Park",
    startTime: "2025-01-24T10:00:00Z",
    endTime: "2025-01-24T10:45:00Z",
    leadName: "David Park",
    provider: "outlook" as const,
    meetingUrl: "https://teams.microsoft.com/meet/xyz",
    isAiBooked: false,
  },
  {
    id: "event-3",
    title: "Discovery Call - Kevin Wu",
    startTime: "2025-01-25T15:00:00Z",
    endTime: "2025-01-25T16:00:00Z",
    leadName: "Kevin Wu",
    provider: "google" as const,
    meetingUrl: "https://meet.google.com/klm-nopq-rst",
    isAiBooked: true,
  },
];

export default function CalendarPage() {
  const formatTime = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startTime = startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const endTime = endDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${startTime} - ${endTime}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-calendar">
          Calendar
        </h1>
        <p className="text-muted-foreground mt-1">
          {events.length} upcoming meetings
        </p>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card data-testid="card-google-calendar">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Google Calendar</p>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
            </div>
            <Badge variant="secondary" data-testid="badge-google-connected">Connected</Badge>
          </CardContent>
        </Card>

        <Card data-testid="card-outlook-calendar">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Outlook Calendar</p>
                <p className="text-sm text-muted-foreground">Not connected</p>
              </div>
            </div>
            <Button size="sm" variant="outline" data-testid="button-connect-outlook">
              Connect
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Upcoming Meetings</h2>
        <div className="space-y-3">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover-elevate" data-testid={`card-event-${index}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold" data-testid={`text-event-title-${index}`}>
                          {event.title}
                        </h3>
                        {event.isAiBooked && (
                          <Badge variant="secondary" className="text-xs" data-testid={`badge-ai-booked-${index}`}>
                            AI Booked
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span data-testid={`text-event-date-${index}`}>{formatDate(event.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span data-testid={`text-event-time-${index}`}>
                            {formatTime(event.startTime, event.endTime)}
                          </span>
                        </div>
                        {event.meetingUrl && (
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            <a
                              href={event.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                              data-testid={`link-meeting-${index}`}
                            >
                              Join Meeting
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline" data-testid={`button-view-lead-${index}`}>
                        View Lead
                      </Button>
                      <Button size="sm" variant="ghost" data-testid={`button-reschedule-${index}`}>
                        Reschedule
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
