import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  glowColor?: "teal" | "purple" | "green" | "red" | "gold";
  animate?: boolean;
}

const glowColors = {
  teal: "shadow-[0_0_60px_rgba(45,212,191,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] border-teal-500/30",
  purple: "shadow-[0_0_60px_rgba(168,85,247,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] border-purple-500/30",
  green: "shadow-[0_0_60px_rgba(34,197,94,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] border-green-500/30",
  red: "shadow-[0_0_60px_rgba(239,68,68,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] border-red-500/30",
  gold: "shadow-[0_0_60px_rgba(251,191,36,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] border-amber-500/30"
};

export function GlassPanel({ children, className = "", glowColor = "teal", animate = true }: GlassPanelProps) {
  const Component = animate ? motion.div : "div";
  
  return (
    <Component
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={animate ? { duration: 0.6, ease: "easeOut" } : undefined}
      className={`
        relative overflow-hidden rounded-2xl border
        bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90
        backdrop-blur-xl backdrop-saturate-150
        ${glowColors[glowColor]}
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {children}
    </Component>
  );
}

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`
      relative overflow-hidden rounded-xl border border-white/10
      bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent
      backdrop-blur-md
      ${className}
    `}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      {children}
    </div>
  );
}
