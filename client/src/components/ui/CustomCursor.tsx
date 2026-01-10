import React, { useEffect, useState, useCallback } from "react";
import { motion, useSpring, useMotionValue, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

export const CustomCursor = () => {
    const [location] = useLocation();
    // Use the Hand SVG cursor only for dashboard routes
    const isDashboard = location.startsWith("/dashboard");

    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    const springConfig = { damping: 40, stiffness: 1000, mass: 0.1 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);

    const [isVisible, setIsVisible] = useState(false);
    const [isPointer, setIsPointer] = useState(false);
    const [isClicked, setIsClicked] = useState(false);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);

        const target = e.target as HTMLElement;
        if (target) {
            const computedCursor = window.getComputedStyle(target).cursor;
            setIsPointer(computedCursor === 'pointer');
        }

        if (!isVisible) setIsVisible(true);
    }, [isVisible, mouseX, mouseY]);

    useEffect(() => {
        const handleMouseDown = () => setIsClicked(true);
        const handleMouseUp = () => setIsClicked(false);
        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);

        // Hide default cursor
        document.body.style.cursor = 'none';

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        document.body.addEventListener("mouseleave", handleMouseLeave);
        document.body.addEventListener("mouseenter", handleMouseEnter);

        return () => {
            document.body.style.cursor = 'auto';
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            document.body.removeEventListener("mouseleave", handleMouseLeave);
            document.body.removeEventListener("mouseenter", handleMouseEnter);
        };
    }, [handleMouseMove]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[99999] hidden lg:block"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: isDashboard ? "-35%" : "-20%", // Slightly different offset for hand vs pointer
                    translateY: isDashboard ? "-15%" : "-10%",
                }}
            >
                {/* 1. Dashboard Cursor: The Hand SVG with Bounce */}
                {isDashboard ? (
                    <motion.div
                        initial={{ scale: 1, opacity: 0 }}
                        animate={{
                            scale: isClicked ? 0.9 : 1, // Slight shrink on click for tactile feel
                            opacity: 1,
                            y: isClicked ? [0, -4, 0] : 0, // Bounce effect on click
                        }}
                        transition={{
                            y: { duration: 0.2, ease: "easeOut" },
                            scale: { duration: 0.1 }
                        }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="relative"
                    >
                        <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g>
                                <path fill="#FFFFFF" d="M11.3,20.4c-0.3-0.4-0.6-1.1-1.2-2c-0.3-0.5-1.2-1.5-1.5-1.9
                                    c-0.2-0.4-0.2-0.6-0.1-1c0.1-0.6,0.7-1.1,1.4-1.1c0.5,0,1,0.4,1.4,0.7c0.2,0.2,0.5,0.6,0.7,0.8c0.2,0.2,0.2,0.3,0.4,0.5
                                    c0.2,0.3,0.3,0.5,0.2,0.1c-0.1-0.5-0.2-1.3-0.4-2.1c-0.1-0.6-0.2-0.7-0.3-1.1c-0.1-0.5-0.2-0.8-0.3-1.3c-0.1-0.3-0.2-1.1-0.3-1.5
                                    c-0.1-0.5-0.1-1.4,0.3-1.8c0.3-0.3,0.9-0.4,1.3-0.2c0.5,0.3,0.8,1,0.9,1.3c0.2,0.5,0.4,1.2,0.5,2c0.2,1,0.5,2.5,0.5,2.8
                                    c0-0.4-0.1-1.1,0-1.5c0.1-0.3,0.3-0.7,0.7-0.8c0.3-0.1,0.6-0.1,0.9-0.1c0.3,0.1,0.6,0.3,0.8,0.5c0.4,0.6,0.4,1.9,0.4,1.8
                                    c0.1-0.4,0.1-1.2,0.3-1.6c0.1-0.2,0.5-0.4,0.7-0.5c0.3-0.1,0.7-0.1,1,0c0.2,0,0.6,0.3,0.7,0.5c0.2,0.3,0.3,1.3,0.4,1.7
                                    c0,0.1,0.1-0.4,0.3-0.7c0.4-0.6,1.8-0.8,1.9,0.6c0,0.7,0,0.6,0,1.1c0,0.5,0,0.8,0,1.2c0,0.4-0.1,1.3-0.2,1.7
                                    c-0.1,0.3-0.4,1-0.7,1.4c0,0-1.1,1.2-1.2,1.8c-0.1,0.6-0.1,0.6-0.1,1c0,0.4,0.1,0.9,0.1,0.9s-0.8,0.1-1.2,0c-0.4-0.1-0.9-0.8-1-1.1
                                    c-0.2-0.3-0.5-0.3-0.7,0c-0.2,0.4-0.7,1.1-1.1,1.1c-0.7,0.1-2.1,0-3.1,0c0,0,0.2-1-0.2-1.4c-0.3-0.3-0.8-0.8-1.1-1.1L11.3,20.4z"/>
                                <path stroke="#000000" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" d="
                                    M11.3,20.4c-0.3-0.4-0.6-1.1-1.2-2c-0.3-0.5-1.2-1.5-1.5-1.9c-0.2-0.4-0.2-0.6-0.1-1c0.1-0.6,0.7-1.1,1.4-1.1c0.5,0,1,0.4,1.4,0.7
                                    c0.2,0.2,0.5,0.6,0.7,0.8c0.2,0.2,0.2,0.3,0.4,0.5c0.2,0.3,0.3,0.5,0.2,0.1c-0.1-0.5-0.2-1.3-0.4-2.1c-0.1-0.6-0.2-0.7-0.3-1.1
                                    c-0.1-0.5-0.2-0.8-0.3-1.3c-0.1-0.3-0.2-1.1-0.3-1.5c-0.1-0.5-0.1-1.4,0.3-1.8c0.3-0.3,0.9-0.4,1.3-0.2c0.5,0.3,0.8,1,0.9,1.3
                                    c0.2,0.5,0.4,1.2,0.5,2c0.2,1,0.5,2.5,0.5,2.8c0-0.4-0.1-1.1,0-1.5c0.1-0.3,0.3-0.7,0.7-0.8c0.3-0.1,0.6-0.1,0.9-0.1
                                    c0.3,0.1,0.6,0.3,0.8,0.5c0.4,0.6,0.4,1.9,0.4,1.8c0.1-0.4,0.1-1.2,0.3-1.6c0.1-0.2,0.5-0.4,0.7-0.5c0.3-0.1,0.7-0.1,1,0
                                    c0.2,0,0.6,0.3,0.7,0.5c0.2,0.3,0.3,1.3,0.4,1.7c0,0.1,0.1-0.4,0.3-0.7c0.4-0.6,1.8-0.8,1.9,0.6c0,0.7,0,0.6,0,1.1
                                    c0,0.5,0,0.8,0,1.2c0,0.4-0.1,1.3-0.2,1.7c-0.1,0.3-0.4,1-0.7,1.4c0,0-1.1,1.2-1.2,1.8c-0.1,0.6-0.1,0.6-0.1,1
                                    c0,0.4,0.1,0.9,0.1,0.9s-0.8,0.1-1.2,0c-0.4-0.1-0.9-0.8-1-1.1c-0.2-0.3-0.5-0.3-0.7,0c-0.2,0.4-0.7,1.1-1.1,1.1
                                    c-0.7,0.1-2.1,0-3.1,0c0,0,0.2-1-0.2-1.4c-0.3-0.3-0.8-0.8-1.1-1.1L11.3,20.4z"/>
                                <line stroke="#000000" strokeWidth="0.75" strokeLinecap="round" x1="19.6" y1="20.7" x2="19.6" y2="17.3" />
                                <line stroke="#000000" strokeWidth="0.75" strokeLinecap="round" x1="17.6" y1="20.7" x2="17.5" y2="17.3" />
                                <line stroke="#000000" strokeWidth="0.75" strokeLinecap="round" x1="15.6" y1="17.3" x2="15.6" y2="20.7" />
                            </g>
                        </svg>

                        {/* Dash Click Visual Layer (Ripple) */}
                        <AnimatePresence>
                            {isClicked && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0.5 }}
                                    animate={{ scale: 2, opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute top-1 left-2 w-4 h-4 rounded-full border border-black/20"
                                />
                            )}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    /* 2. All Other Pages (Landing, Auth, etc.): Premium Blue Pointer with Pulse */
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                            scale: isClicked ? 0.9 : (isPointer ? 1.2 : 1),
                            opacity: 1,
                        }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="relative"
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M5.65376 4.41503C3.9584 3.73689 2.5 4.5 2.5 6.5V18.5C2.5 20.5 3.5 21.5 5.5 20.5L10.5 17.5L14.5 22.5C15.5 23.5 17 23.5 18 22.5L20.5 20C21.5 19 21.5 17.5 20.5 16.5L16.5 11.5L20.5 9.5C22.5 8.5 22.5 7 20.5 6L5.65376 4.41503Z"
                                fill="#3b82f6"
                                className="filter drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                            />
                        </svg>

                        {/* Blue Pulse Wave for Landing/Auth */}
                        <AnimatePresence>
                            {isClicked && (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0.8 }}
                                    animate={{ scale: 3, opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute top-1 left-1 w-6 h-6 rounded-full bg-blue-400/30 blur-sm"
                                />
                            )}
                        </AnimatePresence>

                        {/* Dynamic Aura on Links/Buttons */}
                        {isPointer && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 0.2, scale: 2.5 }}
                                className="absolute -inset-4 bg-blue-500 rounded-full blur-2xl -z-10"
                            />
                        )}
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
