import React from "react";
import { motion } from "framer-motion";

export const Logo = ({ className = "h-10 w-10", textClassName = "text-2xl font-black" }: { className?: string; textClassName?: string }) => {
    return (
        <motion.div
            className="flex items-center gap-3 group cursor-pointer select-none relative"
            whileHover="hover"
            initial="idle"
        >
            {/* Icon Container */}
            <motion.div
                className={`relative ${className}`}
                variants={{
                    hover: { scale: 1.1, rotate: 5 },
                    idle: { scale: 1, rotate: 0 }
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
                <svg
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    role="img"
                    aria-label="Audnix AI Logo - Autonomous Sales Representative"
                >
                    <title>Audnix AI Logo</title>
                    <desc>Official logo of Audnix AI, representing autonomous sales intelligence.</desc>
                    <defs>
                        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                    </defs>

                    <path
                        d="M20 4L34 31H6L20 4Z"
                        stroke="url(#logo-gradient)"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        className="opacity-20"
                    />

                    <motion.path
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        d="M20 7L30 28H10L20 7Z"
                        stroke="url(#logo-gradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    <motion.circle
                        variants={{
                            hover: { scale: 1.5, opacity: 1 },
                            idle: { scale: 1.2, opacity: 0.8 }
                        }}
                        transition={{ duration: 0.3 }}
                        cx="20"
                        cy="19"
                        r="3"
                        fill="url(#logo-gradient)"
                    />

                    <path
                        d="M15 22H25"
                        stroke="url(#logo-gradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="opacity-40"
                    />
                </svg>
            </motion.div>

            {/* Text Container */}
            <div className="relative">
                <span className={`${textClassName} tracking-tighter text-white uppercase flex items-baseline gap-0.5 relative z-10 whitespace-nowrap`}>
                    Audnix
                    <motion.span
                        variants={{
                            hover: { y: -2, color: "#60a5fa" },
                            idle: { y: 0, color: "#3b82f6" }
                        }}
                        className="text-primary text-[10px] font-black"
                    >
                        .AI
                    </motion.span>
                </span>

                {/* Orbiting Satellite on Hover */}
                <motion.div
                    className="absolute -inset-2 rounded-full border border-primary/20 pointer-events-none"
                    variants={{
                        hover: { opacity: 1, scale: 1 },
                        idle: { opacity: 0, scale: 0.8 }
                    }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className="absolute top-1/2 -right-1 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,1)]"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        style={{ originX: "-50px" }} // Orbit center offset
                    />
                </motion.div>
            </div>
        </motion.div>
    );
};
