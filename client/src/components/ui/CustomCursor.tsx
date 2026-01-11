import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

// ============================================
// MACBOOK-STYLE POINTER CURSOR (Dashboard/Onboarding)
// Clean, minimal Apple aesthetic - White Arrow
// ============================================
const HandCursorSVG = ({ isClicked }: { isClicked: boolean }) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
            filter: isClicked
                ? "drop-shadow(0 0 8px rgba(0, 210, 255, 0.6))"
                : "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
            transition: "filter 0.15s ease"
        }}
    >
        {/* MacBook-style pointer arrow */}
        <path
            d="M5.5 3L5.5 19L9.5 15L13 22L15 21L11.5 14L17.5 14L5.5 3Z"
            fill="white"
            stroke="#1e293b"
            strokeWidth="1.5"
            strokeLinejoin="round"
        />
    </svg>
);

// ============================================
// PREMIUM ROUNDED ARROW CURSOR (Landing/Auth)
// Ocean Blue (#00d2ff) gradient, high-end feel
// ============================================
const ArrowCursorSVG = ({ isClicked }: { isClicked: boolean }) => (
    <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
            filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.2))",
            transition: "transform 0.1s ease"
        }}
    >
        <defs>
            <linearGradient id="ocean-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#e0f9ff" />
            </linearGradient>
        </defs>
        <path
            d="M5.5 3.5L13 22.5L16.5 15.5L23.5 13L5.5 3.5Z"
            fill="url(#ocean-gradient)"
            stroke="#00d2ff"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
        />
    </svg>
);

export const CustomCursor = () => {
    const [location] = useLocation();
    const isDashboardOrOnboarding = location.startsWith("/dashboard") || location.startsWith("/onboarding");

    const [position, setPosition] = useState({ x: -100, y: -100 });
    const [isVisible, setIsVisible] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        setPosition({ x: e.clientX, y: e.clientY });
        if (!isVisible) setIsVisible(true);
    }, [isVisible]);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        setIsClicked(true);
        const rippleId = Date.now();
        setRipples(prev => [...prev, { id: rippleId, x: e.clientX, y: e.clientY }]);
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== rippleId));
        }, 600);
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsClicked(false);
    }, []);

    useEffect(() => {
        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);

        document.body.style.cursor = 'none';
        document.documentElement.style.cursor = 'none';

        const style = document.createElement('style');
        style.id = 'audnix-cursor-styles';
        style.textContent = `
            *, *::before, *::after { cursor: none !important; }
            html, body, a, button, input, textarea, select, [role="button"], label { cursor: none !important; }
        `;
        document.head.appendChild(style);

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        document.body.addEventListener("mouseleave", handleMouseLeave);
        document.body.addEventListener("mouseenter", handleMouseEnter);

        return () => {
            document.body.style.cursor = 'auto';
            document.documentElement.style.cursor = 'auto';
            const styleEl = document.getElementById('audnix-cursor-styles');
            if (styleEl) styleEl.remove();

            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            document.body.removeEventListener("mouseleave", handleMouseLeave);
            document.body.removeEventListener("mouseenter", handleMouseEnter);
        };
    }, [handleMouseMove, handleMouseDown, handleMouseUp]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[999999] hidden lg:block overflow-hidden">
            <AnimatePresence>
                {ripples.map((ripple) => (
                    <motion.div
                        key={ripple.id}
                        initial={{ scale: 0, opacity: 0.8 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        style={{
                            position: 'absolute',
                            left: ripple.x,
                            top: ripple.y,
                            transform: 'translate(-50%, -50%)',
                            boxShadow: "0 0 15px rgba(0,210,255,0.5)"
                        }}
                        className="w-8 h-8 rounded-full border border-[#00d2ff]"
                    />
                ))}
            </AnimatePresence>

            <motion.div
                style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y,
                    transform: isDashboardOrOnboarding
                        ? 'translate(-6px, -2px)'
                        : 'translate(-2px, -2px)',
                }}
                animate={{
                    scale: isClicked ? 0.7 : 1, // Stronger bounce
                    y: isClicked ? 8 : 0,       // Deeper press
                    rotate: isClicked ? -12 : 0 // Stronger tilt
                }}
                transition={{
                    type: "spring",
                    stiffness: 800,
                    damping: 15, // Less damping for more bounce
                    mass: 0.5
                }}
            >
                {isDashboardOrOnboarding ? (
                    <HandCursorSVG isClicked={isClicked} />
                ) : (
                    <ArrowCursorSVG isClicked={isClicked} />
                )}
            </motion.div>
        </div>
    );
};
