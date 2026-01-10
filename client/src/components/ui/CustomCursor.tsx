import React, { useEffect, useState, useCallback } from "react";
import { motion, useSpring, useMotionValue, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

export const CustomCursor = () => {
    const [location] = useLocation();
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
                    translateX: "-20%", // Offset to make pointer tip align with actual cursor
                    translateY: "-10%",
                }}
            >
                {/* 1. Dashboard Cursor: Surgical Mac/Apple Pointer */}
                {isDashboard ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                            scale: isClicked ? 0.85 : 1,
                            opacity: 1,
                        }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="relative"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-md">
                            <path d="M5.65376 4.41503C3.9584 3.73689 2.5 4.5 2.5 6.5V18.5C2.5 20.5 3.5 21.5 5.5 20.5L10.5 17.5L14.5 22.5C15.5 23.5 17 23.5 18 22.5L20.5 20C21.5 19 21.5 17.5 20.5 16.5L16.5 11.5L20.5 9.5C22.5 8.5 22.5 7 20.5 6L5.65376 4.41503Z"
                                fill="white"
                                stroke="black"
                                strokeWidth="1.5"
                            />
                        </svg>

                        {/* Click Ripple for Dashboard */}
                        <AnimatePresence>
                            {isClicked && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0.5 }}
                                    animate={{ scale: 2, opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute top-1 left-1 w-4 h-4 rounded-full border border-white/40"
                                />
                            )}
                        </AnimatePresence>

                        {isPointer && (
                            <motion.div
                                layoutId="pointer-dot"
                                className="absolute top-1.5 left-1.5 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]"
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                            />
                        )}
                    </motion.div>
                ) : (
                    /* 2. Landing Page Cursor: Premium Blue Pointer (Enterprise Style) */
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                            scale: isClicked ? 0.9 : (isPointer ? 1.2 : 1),
                            opacity: 1,
                        }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="relative"
                    >
                        {/* Custom Blue Rounded Pointer from Attachment */}
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M5.65376 4.41503C3.9584 3.73689 2.5 4.5 2.5 6.5V18.5C2.5 20.5 3.5 21.5 5.5 20.5L10.5 17.5L14.5 22.5C15.5 23.5 17 23.5 18 22.5L20.5 20C21.5 19 21.5 17.5 20.5 16.5L16.5 11.5L20.5 9.5C22.5 8.5 22.5 7 20.5 6L5.65376 4.41503Z"
                                fill="#3b82f6"
                                className="filter drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                            />
                        </svg>

                        {/* Click Effect for Landing: Blue Pulse Wave */}
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

                        {/* Dynamic Aura when hovering over buttons/links */}
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
