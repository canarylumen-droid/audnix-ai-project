
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, Maximize2, Minimize2, ZoomIn, ZoomOut, Mail, Apple, Smartphone as AndroidIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    const [skin, setSkin] = useState<'ios' | 'android'>('ios');

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 md:p-10"
                >
                    {/* Close Button */}
                    <div className="absolute top-8 right-8 flex items-center gap-4">
                        <Tabs value={skin} onValueChange={(v) => setSkin(v as any)} className="bg-white/5 p-1 rounded-xl border border-white/10">
                            <TabsList className="bg-transparent h-8 p-0 gap-1">
                                <TabsTrigger value="ios" className="data-[state=active]:bg-primary h-6 rounded-lg text-[10px] font-black uppercase px-4 flex items-center gap-2">
                                    <Apple className="h-3 w-3" /> iOS
                                </TabsTrigger>
                                <TabsTrigger value="android" className="data-[state=active]:bg-primary h-6 rounded-lg text-[10px] font-black uppercase px-4 flex items-center gap-2">
                                    <AndroidIcon className="h-3 w-3" /> Android
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 rounded-xl"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="relative w-full h-full flex flex-col items-center justify-center gap-6">
                        {/* Header / Controls */}
                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-xl mb-4">
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
                                width: isFullScreen ? "100%" : "360px",
                                height: isFullScreen ? "100%" : "740px"
                            }}
                            className={cn(
                                "bg-[#0a0a0a] border-[#1a1a1a] shadow-[0_0_120px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all duration-500",
                                skin === 'ios' ? "rounded-[3.5rem] border-[12px]" : "rounded-[2.5rem] border-[10px]",
                                isFullScreen ? "max-w-5xl rounded-3xl" : "max-w-full"
                            )}
                        >
                            {/* Device Notch / Punch */}
                            {skin === 'ios' ? (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#1a1a1a] rounded-b-3xl z-50 flex items-center justify-center">
                                    <div className="w-12 h-1 rounded-full bg-white/5" />
                                </div>
                            ) : (
                                <div className="absolute top-4 left-6 w-4 h-4 bg-black rounded-full z-50 shadow-inner border border-white/5" />
                            )}

                            {/* Status Bar */}
                            <div className={cn(
                                "h-12 flex items-center justify-between px-10 pt-4 bg-white",
                                skin === 'ios' ? "font-sans" : "font-roboto"
                            )}>
                                <div className="text-[11px] font-bold text-black">9:41</div>
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-3.5 h-3.5 flex items-center justify-center">
                                        <div className="w-4 h-2 bg-black/10 rounded-sm" />
                                    </div>
                                    <div className="w-4 h-4 text-black/40" />
                                    <div className="w-5 h-2.5 rounded-sm border border-black/20 relative">
                                        <div className="absolute left-0 top-0 h-full w-3/4 bg-black" />
                                    </div>
                                </div>
                            </div>

                            {/* Email Client Content */}
                            <div className="flex flex-col h-full bg-white overflow-y-auto">
                                <div className={cn(
                                    "p-6 border-b border-zinc-100 bg-white sticky top-0 z-10",
                                    skin === 'ios' ? "pt-12" : "pt-12"
                                )}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className={cn(
                                            "w-10 h-10 flex items-center justify-center text-white font-black text-xs",
                                            skin === 'ios' ? "rounded-full bg-zinc-900" : "rounded-xl bg-primary shadow-lg"
                                        )}>A</div>
                                        <div>
                                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Campaign Outreach</div>
                                            <div className="text-sm font-bold text-zinc-900">Expert Sales Agent</div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h1 className="text-lg font-black text-zinc-900 leading-tight">{subject || "No Subject Generated"}</h1>
                                        <div className="text-[10px] text-zinc-400">To: target_prospect@lead.io</div>
                                    </div>
                                </div>

                                <div className="p-8 text-black leading-relaxed whitespace-pre-wrap pb-32">
                                    <div
                                        dangerouslySetInnerHTML={{ __html: body }}
                                        className={cn(
                                            "prose prose-sm max-w-none prose-headings:font-black prose-p:font-medium prose-p:text-zinc-800",
                                            skin === 'ios' ? "font-serif italic" : "font-sans"
                                        )}
                                    />

                                    {/* Action Footnote */}
                                    <div className="mt-12 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 italic text-[11px] text-zinc-500">
                                        Aiming for curiosity gap. Goal: Reply to first email.
                                    </div>
                                </div>
                            </div>

                            {/* Home Indicator */}
                            <div className={cn(
                                "absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full",
                                skin === 'ios' ? "bg-zinc-900/20" : "bg-black/5 w-12"
                            )} />
                        </motion.div>

                        <div className="text-center space-y-2 mt-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                                <Smartphone className="w-3.5 h-3.5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Target: Day-1 Reply Hook</span>
                            </div>
                            <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest italic">High-velocity mobile rendering</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
