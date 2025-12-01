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

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowHeight(window.innerHeight);
    }
  }, []);

  const capitalizedUsername = username 
    ? username.charAt(0).toUpperCase() + username.slice(1).toLowerCase() 
    : 'there';
  const fullText = `Hey ${capitalizedUsername}!`;

  const confetti = useMemo(() => 
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      emoji: ["🎉", "🎊", "✨", "🌟", "💫", "🚀"][Math.floor(Math.random() * 6)],
    })), []);

  useEffect(() => {
    if (displayedText.length < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 50);
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
      transition={{ duration: 0.5 }}
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
    >
      <motion.div
        className="fixed inset-0 bg-black/30 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 4.5 }}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
        className="text-center pointer-events-auto relative z-10"
      >
        <div className="text-6xl font-bold text-white mb-4 min-h-16 flex items-center justify-center tracking-tight">
          {displayedText}
          {isTyping && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="ml-2"
            >
              |
            </motion.span>
          )}
        </div>

        {!isTyping && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-white/70"
          >
            Your AI sales rep is ready to go!
          </motion.p>
        )}
      </motion.div>

      {showConfetti && confetti.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ y: -100, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ 
            y: windowHeight + 100, 
            opacity: [1, 1, 0.8, 0], 
            rotate: 360,
            scale: [1, 1.2, 0.8]
          }}
          transition={{
            duration: 4 + Math.random() * 1,
            delay: piece.delay,
            ease: "easeOut",
          }}
          style={{ left: `${piece.left}%` }}
          className="absolute text-3xl pointer-events-none"
        >
          {piece.emoji}
        </motion.div>
      ))}
    </motion.div>
  );
}
