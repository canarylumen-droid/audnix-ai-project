import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";

// ============================================
// ZERO-LAG CUSTOM CURSOR
// Uses direct DOM manipulation for instant response
// No React state = No re-renders = Zero lag
// ============================================

export const CustomCursor = () => {
    const [location] = useLocation();
    const isDashboardOrOnboarding = location.startsWith("/dashboard") || location.startsWith("/onboarding");

    const cursorRef = useRef<HTMLDivElement>(null);
    const rippleContainerRef = useRef<HTMLDivElement>(null);
    const positionRef = useRef({ x: -100, y: -100 });
    const isClickedRef = useRef(false);
    const rafRef = useRef<number>(0);

    // Direct DOM update - bypasses React for instant response
    const updateCursorPosition = useCallback(() => {
        if (cursorRef.current) {
            const offset = isDashboardOrOnboarding ? 'translate(-6px, -2px)' : 'translate(-2px, -2px)';
            cursorRef.current.style.transform = `translate3d(${positionRef.current.x}px, ${positionRef.current.y}px, 0) ${offset}`;
        }
    }, [isDashboardOrOnboarding]);

    useEffect(() => {
        // Hide default cursor
        const style = document.createElement('style');
        style.id = 'audnix-cursor-styles';
        style.textContent = `
            *, *::before, *::after { cursor: none !important; }
            html, body, a, button, input, textarea, select, [role="button"], label { cursor: none !important; }
            ::-webkit-scrollbar { cursor: none !important; }
            ::-webkit-scrollbar-thumb { cursor: none !important; }
        `;
        document.head.appendChild(style);

        const handleMouseMove = (e: MouseEvent) => {
            positionRef.current = { x: e.clientX, y: e.clientY };

            // Use requestAnimationFrame for smooth 60fps updates
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(updateCursorPosition);

            // Show cursor
            if (cursorRef.current) {
                cursorRef.current.style.opacity = '1';
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            isClickedRef.current = true;
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) scale(0.8)`;
            }

            // Create ripple directly in DOM
            if (rippleContainerRef.current) {
                const ripple = document.createElement('div');
                ripple.className = 'cursor-ripple';
                ripple.style.cssText = `
                    position: absolute;
                    left: ${e.clientX}px;
                    top: ${e.clientY}px;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 1px solid #00d2ff;
                    transform: translate(-50%, -50%) scale(0);
                    opacity: 0.8;
                    box-shadow: 0 0 15px rgba(0,210,255,0.5);
                    pointer-events: none;
                    animation: ripple-expand 0.5s ease-out forwards;
                `;
                rippleContainerRef.current.appendChild(ripple);
                setTimeout(() => ripple.remove(), 500);
            }
        };

        const handleMouseUp = () => {
            isClickedRef.current = false;
            updateCursorPosition();
        };

        const handleMouseLeave = () => {
            if (cursorRef.current) cursorRef.current.style.opacity = '0';
        };

        const handleMouseEnter = () => {
            if (cursorRef.current) cursorRef.current.style.opacity = '1';
        };

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        window.addEventListener("mousedown", handleMouseDown, { passive: true });
        window.addEventListener("mouseup", handleMouseUp, { passive: true });
        document.body.addEventListener("mouseleave", handleMouseLeave);
        document.body.addEventListener("mouseenter", handleMouseEnter);

        return () => {
            const styleEl = document.getElementById('audnix-cursor-styles');
            if (styleEl) styleEl.remove();
            if (rafRef.current) cancelAnimationFrame(rafRef.current);

            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            document.body.removeEventListener("mouseleave", handleMouseLeave);
            document.body.removeEventListener("mouseenter", handleMouseEnter);
        };
    }, [updateCursorPosition]);

    return (
        <>
            {/* Inline keyframes for ripple animation */}
            <style>{`
                @keyframes ripple-expand {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
                    100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
                }
            `}</style>

            {/* Ripple container */}
            <div
                ref={rippleContainerRef}
                className="fixed inset-0 pointer-events-none z-[999998] hidden lg:block overflow-hidden"
            />

            {/* Main cursor - uses will-change for GPU acceleration */}
            <div
                ref={cursorRef}
                className="fixed top-0 left-0 pointer-events-none z-[999999] hidden lg:block"
                style={{
                    opacity: 0,
                    willChange: 'transform',
                    transition: 'opacity 0.15s ease',
                }}
            >
                {isDashboardOrOnboarding ? (
                    // MacBook-style white arrow for Dashboard
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M5.5 3L5.5 19L9.5 15L13 22L15 21L11.5 14L17.5 14L5.5 3Z"
                            fill="white"
                            stroke="#1e293b"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                        />
                    </svg>
                ) : (
                    // Premium ocean arrow for Landing
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                            style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.2))' }}
                        />
                    </svg>
                )}
            </div>
        </>
    );
};
