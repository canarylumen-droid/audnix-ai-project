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
            setIsPointer(window.getComputedStyle(target).cursor === 'pointer');

            if (!isVisible) setIsVisible(true);
        };

        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);
        const handleMouseDown = () => setIsHovered(true);
        const handleMouseUp = () => setIsHovered(false);

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        document.body.addEventListener("mouseleave", handleMouseLeave);
        document.body.addEventListener("mouseenter", handleMouseEnter);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
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
                    // Dashboard Cursor: Apple/Mac style clean pointer
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{
                            scale: isHovered ? 0.8 : 1,
                            opacity: 1,
                            rotate: isPointer ? 10 : 0
                        }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="text-white drop-shadow-lg"
                    >
                        <CursorIcon className="w-6 h-6 fill-black stroke-white stroke-[1.5px]" />
                        {isPointer && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]"
                            />
                        )}
                    </motion.div>
                ) : (
                    // Landing Page Cursor: Modern Glow Circle
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: isPointer ? 2.5 : 1,
                            opacity: 0.8,
                            backgroundColor: isPointer ? "rgba(var(--primary), 0.15)" : "transparent"
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="relative flex items-center justify-center transition-colors duration-300"
                    >
                        <div className={`w-8 h-8 rounded-full border border-primary/40 flex items-center justify-center ${isPointer ? 'backdrop-blur-sm' : ''}`}>
                            <div className="w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]" />
                        </div>

                        {/* Interactive Aura */}
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.1, 0.2, 0.1]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-primary rounded-full blur-xl -z-10"
                        />
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
