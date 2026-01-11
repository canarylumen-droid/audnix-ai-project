import React from "react";
import { motion } from "framer-motion";

export const Logo = ({ className = "h-10 w-10", textClassName = "text-2xl font-black" }: { className?: string; textClassName?: string }) => {
    return (
        <div className="flex items-center gap-3 group cursor-none select-none">
            <div className={`relative ${className}`}>
                <svg
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                >
                    <defs>
                        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                    </defs>

                    {/* The Outer Sigil */}
                    <path
                        d="M20 4L34 31H6L20 4Z"
                        stroke="url(#logo-gradient)"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        className="opacity-20"
                    />

                    {/* The Neural Path - Dynamic & Sharp */}
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

                    {/* The Strategic Core */}
                    <motion.circle
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.6, 1, 0.6]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        cx="20"
                        cy="19"
                        r="3"
                        fill="url(#logo-gradient)"
                    />

                    {/* Precision Line */}
                    <path
                        d="M15 22H25"
                        stroke="url(#logo-gradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="opacity-40"
                    />
                </svg>
            </div>
            <span className={`${textClassName} tracking-tighter text-white uppercase flex items-baseline gap-0.5`}>
                Audnix
                <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-primary text-[8px] font-black"
                >
                    .AI
                </motion.span>
            </span>
        </div>
    );
};
