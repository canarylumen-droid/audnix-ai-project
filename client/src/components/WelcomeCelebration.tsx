import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface WelcomeCelebrationProps {
  username: string;
  onComplete?: () => void;
}

export function WelcomeCelebration({ username, onComplete }: WelcomeCelebrationProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number }>>([]);

  const fullText = `Welcome @${username}!`;

  // Animated typing effect
  useEffect(() => {
    if (displayedText.length < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
      
      // Generate confetti after typing completes
      const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
      }));
      setConfetti(confettiPieces);

      // Auto-complete after 3 seconds
      const completeTimer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(completeTimer);
    }
  }, [displayedText, fullText, onComplete]);

  const confettiEmojis = ["🎉", "🎊", "✨", "🌟", "💫", "🚀"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
        className="text-center pointer-events-auto"
      >
        <div className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 min-h-16 flex items-center justify-center">
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
            transition={{ delay: 0.5 }}
            className="text-xl text-white/80"
          >
            Your AI sales rep is ready to go! 🚀
          </motion.p>
        )}
      </motion.div>

      {/* Falling Confetti */}
      {confetti.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ y: -100, opacity: 1, rotate: 0 }}
          animate={{ y: window.innerHeight + 100, opacity: 0, rotate: 360 }}
          transition={{
            duration: 2 + Math.random(),
            delay: piece.delay,
            ease: "easeIn",
          }}
          style={{ left: `${piece.left}%` }}
          className="absolute text-4xl pointer-events-none"
        >
          {confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)]}
        </motion.div>
      ))}
    </motion.div>
  );
}
