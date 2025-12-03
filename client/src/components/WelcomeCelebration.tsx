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
    const centerX = 50;
    const spreadRadius = 30;
    return Array.from({ length: 35 }, (_, i) => ({
      id: i,
      left: centerX + (Math.random() - 0.5) * spreadRadius * 2,
      delay: Math.random() * 0.3,
      emoji: ["🎉", "✨", "🌟", "💫"][Math.floor(Math.random() * 4)],
      size: 18 + Math.random() * 12,
      duration: 3.5 + Math.random() * 1.5,
      xDrift: (Math.random() - 0.5) * 100,
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
            y: -50, 
            x: 0,
            opacity: 1, 
            rotate: 0, 
            scale: 0.5 
          }}
          animate={{ 
            y: windowHeight * 0.6, 
            x: piece.xDrift,
            opacity: [1, 1, 0.6, 0], 
            rotate: 180 + Math.random() * 180,
            scale: [0.5, 1, 0.7]
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ 
            left: `${piece.left}%`,
            fontSize: `${piece.size}px`,
          }}
          className="absolute pointer-events-none"
        >
          {piece.emoji}
        </motion.div>
      ))}
    </motion.div>
  );
}
