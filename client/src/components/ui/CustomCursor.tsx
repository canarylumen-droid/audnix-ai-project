import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

// ============================================
// MACBOOK-STYLE HAND POINTER SVG (Dashboard/Onboarding)
// Clean, minimal Apple aesthetic
// ============================================
const HandCursorSVG = ({ isClicked }: { isClicked: boolean }) => (
    <svg
        width="26"
        height="28"
        viewBox="0 0 225 225"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
            filter: isClicked
                ? "drop-shadow(0 0 10px rgba(0, 210, 255, 0.7))"
                : "drop-shadow(0 2px 3px rgba(0,0,0,0.25))",
            transition: "filter 0.1s ease"
        }}
    >
        <g transform="translate(0, 225) scale(0.1, -0.1)">
            <path
                d="M843 1678 c-17 -4 -42 -21 -53 -36 -20 -24 -22 -35 -17 -112 4 -69 39 -233 74 -345 4 -15 -5 -10 -36 18 -47 43 -78 57 -123 57 -70 0 -125 -68 -115 -141 4 -27 20 -57 57 -101 29 -35 73 -98 98 -140 30 -52 57 -85 81 -100 20 -12 57 -42 84 -67 43 -40 47 -47 47 -91 0 -47 0 -47 38 -54 66 -11 191 -6 226 8 18 7 43 30 56 50 l22 37 18 -28 c9 -15 27 -36 38 -47 26 -22 101 -32 130 -17 19 10 21 17 16 55 -10 70 2 108 60 184 76 100 89 147 90 313 1 147 -7 178 -51 198 -33 15 -58 14 -93 -4 -28 -15 -30 -14 -30 4 0 36 -47 79 -94 86 -43 7 -99 -12 -119 -39 -6 -8 -10 -8 -13 1 -3 7 -21 22 -40 34 -28 17 -44 20 -79 14 -25 -3 -52 -13 -60 -21 -18 -18 -17 -20 -35 76 -15 83 -44 151 -78 182 -33 31 -57 37 -99 26z m82 -81 c25 -38 43 -102 65 -224 31 -178 29 -173 51 -173 21 0 23 7 19 63 -3 56 16 95 51 102 56 12 99 -36 99 -109 0 -37 24 -66 41 -49 5 5 14 36 19 68 10 60 17 70 59 82 46 12 74 -16 91 -87 19 -78 41 -90 67 -35 22 47 59 57 86 24 18 -22 19 -35 14 -152 -5 -117 -8 -134 -36 -190 -17 -34 -46 -81 -66 -105 -38 -47 -55 -96 -55 -159 0 -39 -2 -43 -24 -43 -15 0 -34 12 -50 33 -64 82 -81 86 -122 30 -45 -61 -50 -63 -151 -63 l-93 0 0 35 c0 29 -9 46 -46 85 -26 27 -66 62 -89 76 -29 19 -55 49 -84 99 -23 39 -67 102 -97 140 -60 75 -67 105 -32 142 43 46 102 23 179 -70 58 -69 64 -74 83 -58 15 13 1 96 -50 292 -16 65 -27 134 -28 184 -1 74 0 80 23 91 29 15 53 5 76 -29z"
                fill="white"
                stroke="#1e293b"
                strokeWidth="12"
            />
            <path d="M1075 1048 c-3 -8 -4 -72 -3 -144 3 -121 4 -129 23 -129 19 0 20 7 20 140 0 125 -2 140 -18 143 -9 2 -19 -3 -22 -10z" fill="#e2e8f0" />
            <path d="M1215 1051 c-6 -6 -8 -65 -5 -143 5 -125 6 -133 25 -133 19 0 20 8 23 129 2 86 -1 133 -9 142 -13 16 -22 17 -34 5z" fill="#e2e8f0" />
            <path d="M1355 1048 c-3 -8 -4 -72 -3 -144 3 -121 4 -129 23 -129 19 0 20 7 20 140 0 125 -2 140 -18 143 -9 2 -19 -3 -22 -10z" fill="#e2e8f0" />
        </g>
    </svg>
);

// ============================================
// PREMIUM ROUNDED ARROW CURSOR (Landing/Auth)
// Ocean Blue (#00d2ff) gradient, high-end feel
// ============================================
const ArrowCursorSVG = ({ isClicked }: { isClicked: boolean }) => (
    <svg
        width="24"
        height="28"
        viewBox="0 0 24 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
            filter: isClicked
                ? "drop-shadow(0 0 15px rgba(0, 210, 255, 0.9))"
                : "drop-shadow(0 3px 6px rgba(0,0,0,0.3))",
            transition: "filter 0.1s ease"
        }}
    >
        <defs>
            <linearGradient id="ocean-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#80efff" />
                <stop offset="50%" stopColor="#00d2ff" />
                <stop offset="100%" stopColor="#00a8cc" />
            </linearGradient>
            <linearGradient id="glass-effect" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
        </defs>
        <path
            d="M3 2L21 12.5L12 14.5L16 26L12 24.5L8.5 14.5L3 18.5V2Z"
            fill="url(#ocean-gradient)"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
        />
        <path
            d="M4.5 4.5L17 11.5L11 13L13 22L11 21L8.5 13.5L4.5 16.5V4.5Z"
            fill="url(#glass-effect)"
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
        }, 500);
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
                        initial={{ scale: 0, opacity: 0.6 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                        style={{
                            position: 'absolute',
                            left: ripple.x,
                            top: ripple.y,
                            transform: 'translate(-50%, -50%)',
                        }}
                        className="w-6 h-6 rounded-full border-2 border-[#00d2ff]/70 bg-[#00d2ff]/15"
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
                        : 'translate(-2px, -1px)',
                }}
                animate={{
                    scale: isClicked ? 0.88 : 1,
                    y: isClicked ? 1 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 600,
                    damping: 25,
                    mass: 0.3
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
