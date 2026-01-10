import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ShieldCheck, X } from "lucide-react";

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("audnix_cookie_consent");
        const declined = sessionStorage.getItem("audnix_cookie_declined");
        if (!consent && !declined) {
            const timer = setTimeout(() => setIsVisible(true), 2500);
            return () => clearTimeout(timer);
        }
    }, []);

    const accept = () => {
        localStorage.setItem("audnix_cookie_consent", "true");
        setIsVisible(false);
    };

    const decline = () => {
        sessionStorage.setItem("audnix_cookie_declined", "true");
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, x: "-50%", opacity: 0 }}
                    animate={{ y: 0, x: "-50%", opacity: 1 }}
                    exit={{ y: 100, x: "-50%", opacity: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 200 }}
                    className="fixed bottom-10 left-1/2 z-[99999] w-full max-w-3xl px-6 pointer-events-none"
                >
                    <div className="glass-premium p-8 rounded-[2rem] border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group pointer-events-auto">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />

                        <div className="relative flex-shrink-0 w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm group-hover:border-primary/50 transition-colors duration-500">
                            <ShieldCheck className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                        </div>

                        <div className="relative flex-1 text-center md:text-left space-y-2">
                            <h4 className="text-white font-black uppercase tracking-[0.4em] text-[11px]">Privacy Protocol Active</h4>
                            <p className="text-white/50 text-xs font-medium leading-relaxed max-w-md">
                                We utilize secure behavioral cookies to optimize your revenue projection models and maintain session integrity.
                                <span className="text-white hover:text-primary transition-colors cursor-none ml-1 underline underline-offset-4 decoration-primary/40">Read Intelligence Disclosure</span>.
                            </p>
                        </div>

                        <div className="relative flex flex-col gap-3 min-w-[200px]">
                            <button
                                onClick={accept}
                                className="h-14 px-10 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-[0_10px_20px_rgba(0,0,0,0.2)] active:scale-95 cursor-none"
                            >
                                Accept & Synchronize
                            </button>
                            <button
                                onClick={decline}
                                className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-white transition-colors cursor-none h-8"
                            >
                                Decline Access
                            </button>
                        </div>

                        <button
                            onClick={decline}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 transition-colors cursor-none"
                        >
                            <X className="w-5 h-5 text-white/10" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
