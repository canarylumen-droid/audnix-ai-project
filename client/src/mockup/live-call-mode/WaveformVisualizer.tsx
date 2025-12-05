import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface WaveformVisualizerProps {
  isActive?: boolean;
  barCount?: number;
}

export function WaveformVisualizer({ isActive = true, barCount = 40 }: WaveformVisualizerProps) {
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    const initialBars = Array.from({ length: barCount }, () => Math.random() * 0.6 + 0.2);
    setBars(initialBars);

    if (isActive) {
      const interval = setInterval(() => {
        setBars(prev => prev.map(() => Math.random() * 0.8 + 0.2));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [barCount, isActive]);

  return (
    <div className="flex items-center justify-center gap-[2px] h-12">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-teal-500 to-teal-300"
          animate={{ 
            height: isActive ? `${height * 100}%` : "20%",
            opacity: isActive ? 1 : 0.3
          }}
          transition={{ 
            duration: 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

export function PulsingDot({ color = "teal" }: { color?: string }) {
  return (
    <span className="relative flex h-3 w-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${color}-400 opacity-75`} />
      <span className={`relative inline-flex rounded-full h-3 w-3 bg-${color}-500`} />
    </span>
  );
}
