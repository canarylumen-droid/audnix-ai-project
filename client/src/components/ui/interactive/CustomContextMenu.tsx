import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Scissors, Copy, ClipboardPaste, Link2, Download, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextMenuConfig {
    x: number;
    y: number;
    visible: boolean;
}

interface CustomContextMenuProps {
    targetId?: string; // Optional: ID of container to attach to. If null, global.
    onClose: () => void;
    config: ContextMenuConfig;
    onAction?: (action: string) => void;
}

export function CustomContextMenu({
    config,
    onClose,
    onAction
}: CustomContextMenuProps) {

    // Close on click outside
    useEffect(() => {
        const handleClick = () => onClose();
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [onClose]);

    if (!config.visible) return null;

    const menuItems = [
        { icon: Scissors, label: 'Cut', shortcut: '⌘X', id: 'cut' },
        { icon: Copy, label: 'Copy', shortcut: '⌘C', id: 'copy' },
        { icon: ClipboardPaste, label: 'Paste', shortcut: '⌘V', id: 'paste' },
        { type: 'divider' },
        { icon: Link2, label: 'Copy Link', id: 'copy_link' },
        { icon: Download, label: 'Save Media', id: 'save' },
        { type: 'divider' },
        { icon: Trash2, label: 'Delete', id: 'delete', variant: 'destructive' },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                style={{
                    top: config.y,
                    left: config.x
                }}
                className="fixed z-50 w-64 min-w-[200px] bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl p-1.5 overflow-hidden"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking menu itself
            >
                <div className="flex flex-col">
                    {menuItems.map((item, index) => {
                        if (item.type === 'divider') {
                            return <div key={`div-${index}`} className="h-px bg-border/50 my-1 mx-2" />;
                        }

                        const Icon = item.icon as React.ElementType;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onAction?.(item.id!);
                                    onClose();
                                }}
                                className={cn(
                                    "group flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer outline-none select-none",
                                    item.variant === 'destructive'
                                        ? "text-destructive hover:bg-destructive/10"
                                        : "text-foreground hover:bg-primary/10 hover:text-primary"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Icon className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                                    <span>{item.label}</span>
                                </div>
                                {item.shortcut && (
                                    <span className="text-xs text-muted-foreground group-hover:text-primary/70 font-mono">
                                        {item.shortcut}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Hook to use the context menu easily
export function useContextMenu() {
    const [contextConfig, setContextConfig] = React.useState<ContextMenuConfig>({
        x: 0,
        y: 0,
        visible: false
    });

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextConfig({
            x: e.clientX,
            y: e.clientY,
            visible: true
        });
    };

    const closeMenu = () => {
        setContextConfig(prev => ({ ...prev, visible: false }));
    };

    return {
        contextConfig,
        handleContextMenu,
        closeMenu
    };
}
