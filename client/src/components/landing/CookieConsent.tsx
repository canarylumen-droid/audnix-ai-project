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
                    <div className="glass-premium p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h4 className="text-foreground font-bold uppercase tracking-[0.2em] text-[10px] mb-2">Respecting Your Privacy</h4>
                            <p className="text-muted-foreground text-xs font-medium leading-relaxed">
                                We use essential cookies to maintain your session security and optimize your engagement analytics.
                                By continuing, you agree to our <span className="text-foreground underline cursor-pointer hover:text-primary transition-colors">Data Processing Agreement</span>.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 min-w-[160px]">
                            <button
                                onClick={accept}
                                className="h-11 px-8 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all duration-300 shadow-lg active:scale-95"
                            >
                                Accept & Continue
                            </button>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-foreground transition-colors"
                            >
                                Decline
                            </button>
                        </div>

                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors"
                        >
                            <X className="w-4 h-4 text-muted-foreground/20" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
