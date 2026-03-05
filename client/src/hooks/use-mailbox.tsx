import React, { createContext, useContext, useState, useEffect } from 'react';

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

    const setSelectedMailboxId = (id: string | undefined) => {
        setSelectedMailboxIdState(id);
        if (id) {
            localStorage.setItem('selected_mailbox_id', id);
        } else {
            localStorage.removeItem('selected_mailbox_id');
        }
    };

    return (
        <MailboxContext.Provider value={{ selectedMailboxId, setSelectedMailboxId, isLoading: false }}>
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
