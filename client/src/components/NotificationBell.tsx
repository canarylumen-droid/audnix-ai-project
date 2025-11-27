import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface NotificationResponse {
  unreadCount: number;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
  }>;
}

export function NotificationBell() {
  const [count, setCount] = useState<number>(0);
  const [newNotification, setNewNotification] = useState<boolean>(false);

  // Fetch notifications count
  const { data: notifications } = useQuery<NotificationResponse>({
    queryKey: ["/api/notifications"],
    refetchInterval: 5000, // Check every 5 seconds
  });

  // Play notification sound
  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {
      // Fallback: try web audio API for browser sound
      console.log('Notification received (audio failed, browser may be muted)');
    });
  };

  // Monitor for new notifications
  useEffect(() => {
    if (notifications && notifications.unreadCount) {
      if (notifications.unreadCount > count) {
        // New notification received
        setNewNotification(true);
        playNotificationSound();
        
        // Vibrate if available
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }

        // Reset animation after 1 second
        setTimeout(() => setNewNotification(false), 1000);
      }
      setCount(notifications.unreadCount);
    }
  }, [notifications, count]);

  return (
    <motion.button
      className="relative p-2 text-gray-400 hover:text-white transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Bell className="w-6 h-6" />
      
      {/* Notification Counter Badge */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {count > 99 ? '99+' : count}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse animation on new notification */}
      <AnimatePresence>
        {newNotification && (
          <motion.div
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{ scale: 1.3, opacity: 0 }}
            exit={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-red-500 rounded-full"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
