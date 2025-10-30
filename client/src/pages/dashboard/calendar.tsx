import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  ExternalLink,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function CalendarPage() {
  // Fetch real calendar events from backend
  const { data: eventsData, isLoading, error } = useQuery({
    queryKey: ["/api/calendar/events"],
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false,
  });

  const events = eventsData?.events || [];
  const upcomingEvents = events.filter((e: any) => new Date(e.startTime) > new Date());
  const todayEvents = events.filter((e: any) => {
    const eventDate = new Date(e.startTime);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

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
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
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

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to load calendar</h2>
          <p className="text-muted-foreground">
            Please check your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-calendar">
            Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            {events.length > 0 
              ? `${upcomingEvents.length} upcoming event${upcomingEvents.length !== 1 ? 's' : ''} · ${todayEvents.length} today`
              : "Manage your meetings and appointments"}
          </p>
        </div>
        <Button data-testid="button-connect-calendar">
          <CalendarIcon className="h-4 w-4 mr-2" />
          Connect Calendar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-stat-today">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-today-count">
              {todayEvents.length}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-upcoming">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-week-count">
              {upcomingEvents.filter((e: any) => {
                const eventDate = new Date(e.startTime);
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return eventDate <= weekFromNow;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-ai">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AI Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ai-count">
              {events.filter((e: any) => e.isAiBooked).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List or Empty State */}
      {events.length === 0 ? (
        <Card className="border-dashed" data-testid="card-empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">You don't have any activity yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Connect your Google Calendar or Outlook to sync meetings. Once connected, 
              AI will automatically schedule appointments with your leads and they'll appear here in real-time.
            </p>
            <Button data-testid="button-connect-account">
              Connect Calendar Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event: any, index: number) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card data-testid={`card-event-${index}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg" data-testid={`text-event-title-${index}`}>
                          {event.title}
                        </h3>
                        {event.isAiBooked && (
                          <Badge variant="secondary" className="text-xs" data-testid={`badge-ai-${index}`}>
                            AI Scheduled
                          </Badge>
                        )}
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
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            data-testid={`button-join-${index}`}
                          >
                            <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer">
                              <Video className="h-4 w-4 mr-2" />
                              Join Meeting
                              <ExternalLink className="h-3 w-3 ml-2" />
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <Badge variant="outline" data-testid={`badge-time-${index}`}>
                        {getRelativeTime(event.startTime)}
                      </Badge>
                    </div>
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