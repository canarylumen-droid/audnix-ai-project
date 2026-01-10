import React, { useEffect, useState } from "react";
import { CursorIcon } from "./CustomIcons";
import { motion, useSpring, useMotionValue, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

export const CustomCursor = () => {
    const [location] = useLocation();
    const isDashboard = location.startsWith("/dashboard");

    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    const springConfig = { damping: 30, stiffness: 800, mass: 0.5 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);

    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isPointer, setIsPointer] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);

            const target = e.target as HTMLElement;
            const computedCursor = window.getComputedStyle(target).cursor;
            setIsPointer(computedCursor === 'pointer');

            if (!isVisible) setIsVisible(true);
        };

        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);
        const handleMouseDown = () => setIsHovered(true);
        const handleMouseUp = () => setIsHovered(false);

        // Standard Apple/PC behavior: hide default cursor via body style
        document.body.style.cursor = 'none';

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        document.body.addEventListener("mouseleave", handleMouseLeave);
        document.body.addEventListener("mouseenter", handleMouseEnter);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.body.style.cursor = 'auto'; // Restore on cleanup
            window.removeEventListener("mousemove", handleMouseMove);
            document.body.removeEventListener("mouseleave", handleMouseLeave);
            document.body.removeEventListener("mouseenter", handleMouseEnter);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [mouseX, mouseY, isVisible]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[99999] hidden lg:block"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
            >
                {isDashboard ? (
                    // Dashboard Cursor: Apple Clean Pointer
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{
                            scale: isHovered ? 0.8 : 1,
                            opacity: 1,
                        }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="text-white drop-shadow-xl"
                    >
                        {/* A clean, sharp pointer like macOS */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-md">
                            <path d="M5.65376 4.41503C3.9584 3.73689 2.5 4.5 2.5 6.5V18.5C2.5 20.5 3.5 21.5 5.5 20.5L10.5 17.5L14.5 22.5C15.5 23.5 17 23.5 18 22.5L20.5 20C21.5 19 21.5 17.5 20.5 16.5L16.5 11.5L20.5 9.5C22.5 8.5 22.5 7 20.5 6L5.65376 4.41503Z" fill="white" stroke="black" strokeWidth="1.5" />
                        </svg>

                        {isPointer && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute top-2 left-2 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]"
                            />
                        )}
                    </motion.div>
                ) : (
                    // Landing Page Cursor: Premium Blue Glow Circle
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: isPointer ? 2.5 : 1,
                            opacity: 0.8,
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="relative flex items-center justify-center"
                    >
                        <div className={`w-8 h-8 rounded-full border border-primary/40 flex items-center justify-center ${isPointer ? 'bg-primary/10 backdrop-blur-sm' : ''}`}>
                            <div className="w-1 h-1 bg-primary rounded-full shadow-[0_0_12px_var(--primary)]" />
                        </div>

                        {/* Interactive Aura */}
                        <motion.div
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.1, 0.3, 0.1]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-primary rounded-full blur-2xl -z-10"
                        />
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
