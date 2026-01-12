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
          className="fixed bottom-4 right-4 z-[100] bg-yellow-500/90 backdrop-blur-md text-black px-4 py-2 rounded-lg shadow-lg border border-yellow-600/20"
        >
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            <p className="text-xs font-medium">
              Offline mode active
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
          className="fixed bottom-4 right-4 z-[100] bg-emerald-500/90 backdrop-blur-md text-white px-4 py-2 rounded-lg shadow-lg border border-emerald-600/20"
        >
          <div className="flex items-center justify-center gap-2">
            <Wifi className="h-4 w-4" />
            <p className="text-xs font-medium">
              Back online
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
