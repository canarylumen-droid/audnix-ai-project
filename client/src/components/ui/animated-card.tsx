import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Card } from "./card";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  glowColor?: string;
}

export function AnimatedCard({ 
  children, 
  className = "", 
  delay = 0,
  hover = true,
  glowColor = "rgba(16, 185, 129, 0.3)"
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={hover ? {
        y: -8,
        transition: { duration: 0.3, ease: "easeOut" }
      } : undefined}
      className="group relative"
    >
      {hover && (
        <div 
          className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"
          style={{ background: `radial-gradient(circle at center, ${glowColor}, transparent 70%)` }}
        />
      )}
      <Card className={`relative ${className} transition-all duration-300 ${hover ? 'group-hover:border-primary/50 group-hover:shadow-2xl group-hover:shadow-primary/20' : ''}`}>
        {children}
      </Card>
    </motion.div>
  );
}
