import React from "react";

export const Logo = ({ className = "h-8 w-8", textClassName = "text-xl font-semibold" }: { className?: string; textClassName?: string }) => {
    return (
        <div className="flex items-center gap-3 group cursor-pointer">
            <div className={`relative ${className}`}>
                <svg
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                >
                    {/* Minimalist Geometric A - Thin Lines */}
                    <path
                        d="M20 6L32 34H28.5L20 12L11.5 34H8L20 6Z"
                        fill="currentColor"
                        className="text-foreground transition-colors"
                    />

                    {/* The Bridge - Thin & Precise */}
                    <path
                        d="M16 26H24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="square"
                        className="text-foreground transition-colors"
                    />

                    {/* Subtle Dot - representing the Singularity/AI */}
                    <circle
                        cx="20"
                        cy="18"
                        r="1.5"
                        fill="currentColor"
                        className="text-foreground/40"
                    />
                </svg>
            </div>
            <span className={`${textClassName} tracking-tight text-foreground transition-all group-hover:tracking-normal`}>
                Audnix
            </span>
        </div>
    );
};
