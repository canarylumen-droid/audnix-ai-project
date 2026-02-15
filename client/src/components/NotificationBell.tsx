import { Bell, Check, Trash2, X, Filter, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow, isAfter, subMinutes } from "date-fns";
import { io, Socket } from "socket.io-client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotificationResponse {
  unreadCount: number;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string | Date;
    type?: string;
  }>;
}

// Socket instance (singleton-ish behavior for this component)
let socket: Socket | null = null;

export function NotificationBell() {
  const [count, setCount] = useState<number>(0);
  const [isWiggling, setIsWiggling] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch notifications with date filter if applied
  const { data: notificationsData } = useQuery<NotificationResponse>({
    queryKey: ["/api/notifications", dateFilter?.toISOString()],
    // Reduce polling since we have sockets
    refetchInterval: 60000,
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ description: "All notifications marked as read" });
      setCount(0); // Optimistic update
    },
  });

  // Clear all mutation
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/clear-all", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ description: "All notifications cleared" });
      setCount(0);
    },
  });

  // Mark single as read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Initialize Socket.IO
  useEffect(() => {
    const socketUrl = window.location.origin;
    const userProfile = queryClient.getQueryData<{id: string}>(["/api/user/profile"]);
    const userId = userProfile?.id;

    if (userId && !socket) {
      console.log("Connecting socket for notifications...", userId);
      socket = io(socketUrl, {
        path: '/socket.io',
        query: { userId },
        transports: ['websocket', 'polling']
      });

      socket.on('notification', (data: any) => {
        console.log("Real-time notification received:", data);
        playNotificationSound();
        setIsWiggling(true);
        setTimeout(() => setIsWiggling(false), 1000);
        
        // Immediate refetch
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        
        // Show toast
        toast({
          title: data.title || "New Notification",
          description: data.message,
        });

        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      });
    }

    return () => {
      if (socket) {
        socket.off('notification');
      }
    };
  }, [queryClient, toast]);

  // Sync internal count state
  useEffect(() => {
    if (notificationsData) {
      // Wiggle if count increased
      if (notificationsData.unreadCount > count) {
        setIsWiggling(true);
        setTimeout(() => setIsWiggling(false), 1000);
      }
      setCount(notificationsData.unreadCount);
    }
  }, [notificationsData, count]);

  const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio play failed (user interaction needed)', e));
  };

  // Check if a notification is "New" (less than 5 minutes old) and unread
  const isNew = (dateString: string | Date, isRead: boolean) => {
    if (isRead) return false;
    const date = new Date(dateString);
    const fiveMinutesAgo = subMinutes(new Date(), 5);
    return isAfter(date, fiveMinutesAgo);
  };

  // Filter notifications logic
  const filteredNotifications = useMemo(() => {
    let list = notificationsData?.notifications || [];
    
    if (dateFilter) {
      list = list.filter(n => {
        const nDate = new Date(n.createdAt);
        return nDate.toDateString() === dateFilter.toDateString();
      });
    }
    
    return list;
  }, [notificationsData, dateFilter]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.button
          className="relative p-2 text-muted-foreground hover:text-foreground transition-colors outline-none rounded-full hover:bg-muted/50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
        >
          <motion.div
            animate={isWiggling ? { rotate: [0, -20, 20, -10, 10, 0] } : { rotate: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Bell className="w-5 h-5" />
          </motion.div>

          <AnimatePresence>
            {count > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 border-2 border-background shadow-sm"
              >
                {count > 99 ? '99+' : count}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0 mr-4 shadow-xl border-border/60" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-muted/5">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">Notifications</h4>
            {count > 0 && <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{count} Unread</Badge>}
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-full", dateFilter && "text-primary bg-primary/10")}>
                  <Filter className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-0">
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                  className="rounded-md border shadow-sm"
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                />
                {dateFilter && (
                  <div className="p-2 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-xs h-7"
                      onClick={() => setDateFilter(undefined)}
                    >
                      Clear Filter
                    </Button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {count > 0 && (
              <Button 
                variant="ghost" 
                size="icon"
                title="Mark all as read"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <Check className="w-3.5 h-3.5" />
              </Button>
            )}
            {filteredNotifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="icon"
                title="Clear all"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive"
                onClick={() => clearAllMutation.mutate()}
                disabled={clearAllMutation.isPending}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[450px]">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y divide-border/30">
              {filteredNotifications.map((notification) => {
                const isUnread = notification.isRead === false;
                const showNewBadge = isNew(notification.createdAt, !isUnread);

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 transition-all hover:bg-muted/30 flex gap-3 text-sm group relative",
                      isUnread ? "bg-primary/5" : "bg-background"
                    )}
                    onClick={() => isUnread && markReadMutation.mutate(notification.id)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {isUnread ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          <p className={cn("font-medium leading-tight", isUnread ? "text-foreground" : "text-muted-foreground")}>
                            {notification.title}
                          </p>
                          {showNewBadge && (
                             <Badge variant="default" className="w-fit text-[9px] h-4 px-1.5 bg-blue-500 hover:bg-blue-600 border-none animate-in fade-in zoom-in duration-300">
                               NEW
                             </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1 bg-muted/30 px-1.5 py-0.5 rounded-md">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">
                        {notification.message}
                      </p>
                      
                      {/* Timestamp Table/Detail View requested by user */}
                      <div className="text-[9px] text-muted-foreground/40 pt-1 font-mono hidden group-hover:block transition-all">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-center p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                <Bell className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">No notifications</p>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                  {dateFilter 
                    ? "No notifications found for the selected date." 
                    : "You're all caught up! Check back later for new activity."}
                </p>
              </div>
              {dateFilter && (
                <Button variant="outline" size="sm" onClick={() => setDateFilter(undefined)} className="h-8 text-xs mt-2">
                  Clear Filter
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

