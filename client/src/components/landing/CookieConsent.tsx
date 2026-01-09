import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ShieldCheck, X } from "lucide-react";

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("audnix_cookie_consent");
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const accept = () => {
        localStorage.setItem("audnix_cookie_consent", "true");
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] w-full max-w-2xl px-6"
                >
                    <div className="glass p-8 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-2 italic">Neural Integrity Protocol</h4>
                            <p className="text-white/40 text-sm font-bold italic leading-relaxed">
                                We utilize minimal tracking telemetry to maintain session persistence, prevent latency spikes, and optimize your neural interface experience.
                                <span className="text-white ml-2 underline cursor-pointer hover:text-primary">Review Privacy Ops</span>.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 min-w-[140px]">
                            <button
                                onClick={accept}
                                className="h-12 px-6 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-500 shadow-xl active:scale-95"
                            >
                                Accept Terms
                            </button>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors italic"
                            >
                                Dismiss Protocol
                            </button>
                        </div>

                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors"
                        >
                            <X className="w-4 h-4 text-white/20" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
