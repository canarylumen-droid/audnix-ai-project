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
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
    >
      {/* Subtle backdrop - not blocking */}
      <motion.div
        className="fixed inset-0 bg-black/20 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
        className="text-center pointer-events-auto relative z-10"
      >
        {/* Clean text - no gradient */}
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
            transition={{ delay: 0.5 }}
            className="text-lg text-white/70"
          >
            Your AI sales rep is ready to go! 🚀
          </motion.p>
        )}
      </motion.div>

      {/* Calm confetti - professional spacing */}
      {confetti.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ y: -80, opacity: 0.8, rotate: 0 }}
          animate={{ y: window.innerHeight + 50, opacity: 0, rotate: 180 }}
          transition={{
            duration: 2.5 + Math.random() * 0.5,
            delay: piece.delay,
            ease: "easeOut",
          }}
          style={{ left: `${piece.left}%` }}
          className="absolute text-3xl pointer-events-none"
        >
          {confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)]}
        </motion.div>
      ))}
    </motion.div>
  );
}
