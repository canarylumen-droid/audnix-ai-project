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
  const [isWiggling, setIsWiggling] = useState<boolean>(false);

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

  return (
    <motion.button
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
  );
}
