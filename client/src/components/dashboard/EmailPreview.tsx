
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, Maximize2, Minimize2, ZoomIn, ZoomOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface EmailPreviewProps {
    subject: string;
    body: string;
    brandColor?: string;
    isOpen: boolean;
    onClose: () => void;
}

export function EmailPreview({ subject, body, brandColor, isOpen, onClose }: EmailPreviewProps) {
    const [zoom, setZoom] = useState(1);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 md:p-10"
                >
                    {/* Close Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="absolute top-6 right-6 text-white/40 hover:text-white hover:bg-white/10 rounded-2xl z-[110]"
                    >
                        <X className="h-6 w-6" />
                    </Button>

                    <div className="relative w-full h-full flex flex-col items-center justify-center gap-8">
                        {/* Header / Controls */}
                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-xl">
                            <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-10 w-10 text-white/60 hover:text-white">
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">{Math.round(zoom * 100)}%</div>
                            <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-10 w-10 text-white/60 hover:text-white">
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            <div className="w-px h-4 bg-white/10 mx-1" />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsFullScreen(!isFullScreen)}
                                className="h-10 w-10 text-white/60 hover:text-white"
                            >
                                {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </Button>
                        </div>

                        {/* Mobile Device Mockup */}
                        <motion.div
                            layout
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{
                                scale: zoom,
                                y: 0,
                                width: isFullScreen ? "100%" : "380px",
                                height: isFullScreen ? "100%" : "780px"
                            }}
                            className={cn(
                                "bg-[#0a0a0a] rounded-[3.5rem] border-[12px] border-[#1a1a1a] shadow-[0_0_100px_rgba(0,210,255,0.15)] relative overflow-hidden transition-all duration-500",
                                isFullScreen ? "max-w-5xl rounded-3xl" : "max-w-full"
                            )}
                        >
                            {/* Phone Status Bar */}
                            <div className="h-12 flex items-center justify-between px-10 pt-4">
                                <div className="text-xs font-bold text-white/80">9:41</div>
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-4 h-4 rounded-full bg-white/20" />
                                    <div className="w-4 h-4 rounded-full bg-white/20" />
                                    <div className="w-6 h-3 rounded-sm border border-white/40" />
                                </div>
                            </div>

                            {/* Email Client Content */}
                            <div className="flex flex-col h-full bg-white overflow-y-auto">
                                <div className="p-6 border-b border-zinc-100 bg-white sticky top-0 z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white font-black text-xs">A</div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Audnix Neural Node</div>
                                            <div className="text-sm font-bold text-zinc-900">Outreach Intelligence</div>
                                        </div>
                                    </div>
                                    <h1 className="text-xl font-bold text-zinc-900 leading-tight mb-2">{subject || "No Subject Generated"}</h1>
                                    <div className="text-[10px] text-zinc-400">To: prospective_lead@target.com</div>
                                </div>

                                <div
                                    className="p-8 text-black font-medium leading-relaxed whitespace-pre-wrap pb-32"
                                    style={{ color: brandColor ? '#000' : '#333' }}
                                >
                                    <div
                                        dangerouslySetInnerHTML={{ __html: body }}
                                        className="prose prose-sm max-w-none"
                                    />
                                </div>
                            </div>

                            {/* Home Indicator */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-zinc-900/10 rounded-full" />
                        </motion.div>

                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                                <Smartphone className="w-3.5 h-3.5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">High-Fidelity Preview</span>
                            </div>
                            <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest italic">Zoom and swipe to inspect lead experience</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
