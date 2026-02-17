import { Bell, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NotificationResponse {
  unreadCount: number;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string | Date;
  }>;
}

const SafeTimeAgo = ({ date }: { date: string | Date }) => {
  try {
    return <>{formatDistanceToNow(new Date(date), { addSuffix: true })}</>;
  } catch (e) {
    return <>Just now</>;
  }
};

export function NotificationBell() {
  const [count, setCount] = useState<number>(0);
  const [isWiggling, setIsWiggling] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch notifications count
  const { data: notifications } = useQuery<NotificationResponse>({
    queryKey: ["/api/notifications"],
    refetchInterval: 5000,
  });

  // Play notification sound
  const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.6;
    audio.play().catch((e) => {
      console.log('Audio play failed:', e);
      // Browser might block auto-play
    });
  };

  // Monitor for changes
  useEffect(() => {
    if (notifications && notifications.unreadCount) {
      if (notifications.unreadCount > count) {
        // New notification came in
        setIsWiggling(true);
        playNotificationSound();

        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }

        setTimeout(() => setIsWiggling(false), 1000); // Stop wiggle after 1s
      }
      setCount(notifications.unreadCount);
    }
  }, [notifications, count]);

  // Handle clear all
  const handleClearAll = async () => {
    try {
      await apiRequest("POST", "/api/notifications/clear-all");
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setShowDropdown(false);
      toast({ title: "Notifications cleared" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to clear notifications", variant: "destructive" });
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors outline-none"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={isWiggling ? { rotate: [0, -20, 20, -10, 10, 0] } : { rotate: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Bell className="w-6 h-6" />
        </motion.div>

        {/* Numeric Badge */}
        <AnimatePresence>
          {count > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border border-background shadow-sm"
            >
              {count > 99 ? '99+' : count}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                <h3 className="font-bold text-sm">Notifications</h3>
                {notifications?.notifications?.length ? (
                   <button 
                    onClick={() => {
                      if (confirm("Clear all notifications?")) handleClearAll();
                    }}
                    className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                  >
                    Clear All
                  </button>
                ) : null}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications?.notifications?.length ? (
                  notifications.notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={cn(
                        "p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer relative",
                        !n.read && "bg-primary/5"
                      )}
                      onClick={async () => {
                        if (!n.read) {
                          // Optimistically update local count to feel faster
                          setCount(prev => Math.max(0, prev - 1));
                          await apiRequest("PATCH", `/api/notifications/${n.id}/read`, { read: true });
                          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
                        }
                      }}
                    >
                      {!n.read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full" />}
                      <div className="space-y-1 ml-2">
                        <p className={cn("text-xs leading-none", !n.read ? "font-black text-foreground" : "font-medium text-muted-foreground")}>{n.title}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{n.message}</p>
                        <p className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-wider">
                          <SafeTimeAgo date={n.createdAt} />
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-xs font-medium">
                    No notifications yet
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
