import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

interface WelcomeCelebrationProps {
  username: string;
  onComplete?: () => void;
}

export function WelcomeCelebration({ username, onComplete }: WelcomeCelebrationProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowHeight, setWindowHeight] = useState(800);
  const [windowWidth, setWindowWidth] = useState(400);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowHeight(window.innerHeight);
      setWindowWidth(window.innerWidth);
    }
  }, []);

  const capitalizedUsername = username 
    ? username.charAt(0).toUpperCase() + username.slice(1).toLowerCase() 
    : 'there';
  const fullText = `Hey ${capitalizedUsername}!`;

  const confetti = useMemo(() => {
    const goldColors = ["#FFD700", "#FFC107", "#F7C948", "#F9A825", "#FFEB3B", "#FFE082"];
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      color: goldColors[Math.floor(Math.random() * goldColors.length)],
      size: 8 + Math.random() * 8,
      duration: 2.5 + Math.random() * 2,
      xDrift: (Math.random() - 0.5) * 150,
      rotation: Math.random() * 360,
      shape: Math.random() > 0.5 ? 'circle' : 'square',
    }));
  }, []);

  useEffect(() => {
    if (displayedText.length < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 60);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
      setShowConfetti(true);

      const completeTimer = setTimeout(() => {
        onComplete?.();
      }, 5000);

      return () => clearTimeout(completeTimer);
    }
  }, [displayedText, fullText, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
    >
      <motion.div
        className="fixed inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/20 pointer-events-none backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />

      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.35, type: "spring", stiffness: 250, damping: 20 }}
        className="text-center pointer-events-auto relative z-10 px-4"
      >
        <div className="text-5xl md:text-6xl font-bold text-white mb-4 min-h-16 flex items-center justify-center tracking-tight drop-shadow-lg">
          {displayedText}
          {isTyping && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="ml-1 text-cyan-400"
            >
              |
            </motion.span>
          )}
        </div>

        {!isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="space-y-2"
          >
            <p className="text-lg text-white/80 font-medium">
              Your AI sales engine is ready to go!
            </p>
            <p className="text-sm text-white/50">
              Complete your activation checklist to get started
            </p>
          </motion.div>
        )}
      </motion.div>

      {showConfetti && confetti.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ 
            y: -20, 
            x: 0,
            opacity: 1, 
            rotate: piece.rotation, 
            scale: 0 
          }}
          animate={{ 
            y: windowHeight + 50, 
            x: piece.xDrift,
            opacity: [0, 1, 1, 0.8, 0], 
            rotate: piece.rotation + 720,
            scale: [0, 1, 1, 0.8]
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: [0.12, 0, 0.39, 0],
          }}
          style={{ 
            left: `${piece.left}%`,
            width: `${piece.size}px`,
            height: piece.shape === 'circle' ? `${piece.size}px` : `${piece.size * 1.5}px`,
            backgroundColor: piece.color,
            borderRadius: piece.shape === 'circle' ? '50%' : '2px',
            boxShadow: `0 0 ${piece.size / 2}px ${piece.color}`,
          }}
          className="absolute pointer-events-none"
        />
      ))}
    </motion.div>
  );
}
