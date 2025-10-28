import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

export function InternetConnectionBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-red-500 to-orange-600 text-white px-4 py-3 shadow-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-5 w-5 animate-pulse" />
            <p className="text-sm font-medium">
              No Internet Connection - Please check your network
            </p>
          </div>
        </motion.div>
      )}
      
      {showReconnected && isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-3 shadow-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <Wifi className="h-5 w-5" />
            <p className="text-sm font-medium">
              Connection Restored
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
