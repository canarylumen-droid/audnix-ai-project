import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";

interface MailboxContextType {
    selectedMailboxId: string | undefined;
    setSelectedMailboxId: (id: string | undefined) => void;
    isLoading: boolean;
}

const MailboxContext = createContext<MailboxContextType | undefined>(undefined);

export function MailboxProvider({ children }: { children: React.ReactNode }) {
    const [selectedMailboxId, setSelectedMailboxIdState] = useState<string | undefined>(() => {
        return localStorage.getItem('selected_mailbox_id') || undefined;
    });

    // Phase 12: Add self-healing validation for stale mailbox IDs
    const { data: status, isLoading } = useQuery<{
        integrations: Array<{ id: string; connected: boolean }>;
    }>({
        queryKey: ["/api/custom-email/status"],
        refetchOnWindowFocus: false,
        staleTime: 60000, // 1 minute
    });

    useEffect(() => {
        // If we have a selected ID but it's not in the current integrations list, reset it.
        // This ensures unassigned leads (Inventory) become visible in All Chats.
        if (status?.integrations && selectedMailboxId) {
            const exists = status.integrations.some((i: any) => i.id === selectedMailboxId);
            if (!exists) {
                console.log(`[MailboxProvider] 🔄 Resetting stale mailbox ID: ${selectedMailboxId} (not found in integrations)`);
                setSelectedMailboxId(undefined);
            }
        }
    }, [status, selectedMailboxId]);

    const setSelectedMailboxId = (id: string | undefined) => {
        setSelectedMailboxIdState(id);
        if (id) {
            localStorage.setItem('selected_mailbox_id', id);
        } else {
            localStorage.removeItem('selected_mailbox_id');
        }
    };

    return (
        <MailboxContext.Provider value={{ selectedMailboxId, setSelectedMailboxId, isLoading }}>
            {children}
        </MailboxContext.Provider>
    );
}

export function useMailbox() {
    const context = useContext(MailboxContext);
    if (context === undefined) {
        throw new Error('useMailbox must be used within a MailboxProvider');
    }
    return context;
}
