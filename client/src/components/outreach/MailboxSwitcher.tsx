import { useQuery } from "@tanstack/react-query";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Mail, Globe, CheckCircle2, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useMailbox } from "@/hooks/use-mailbox";

interface MailboxSwitcherProps {
    className?: string;
    value?: string;
    onValueChange?: (value: string | undefined) => void;
}

export function MailboxSwitcher({ className, value, onValueChange }: MailboxSwitcherProps) {
    const { selectedMailboxId, setSelectedMailboxId } = useMailbox();

    // Use controlled value if provided, otherwise fallback to hook state
    const currentMailboxId = value !== undefined ? value : selectedMailboxId;
    const handleMailboxChange = (val: string | undefined) => {
        if (onValueChange) {
            onValueChange(val);
        } else {
            setSelectedMailboxId(val);
        }
    };
    const [, setLocation] = useLocation();
    const { data: integrations, isLoading } = useQuery<any[]>({
        queryKey: ["/api/integrations"],
    });

    const mailboxes = integrations?.filter(i =>
        ['custom_email', 'gmail', 'outlook'].includes(i.provider) && i.connected
    ) || [];

    if (isLoading) return <div className="h-10 w-[200px] animate-pulse bg-muted rounded-2xl" />;

    // Always show if user has at least one connected mailbox, so they can see "All" vs specific
    if (mailboxes.length === 0) return null;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Select
                value={currentMailboxId || "all"}
                onValueChange={(val) => {
                    if (val === "add_new") {
                        setLocation("/dashboard/integrations");
                        return;
                    }
                    handleMailboxChange(val === "all" ? undefined : val);
                }}
            >
                <SelectTrigger className="w-[220px] h-10 rounded-2xl border-border/40 bg-card/40 backdrop-blur-md font-bold text-[10px] uppercase tracking-wider text-muted-foreground/80 hover:text-foreground transition-colors group">
                    <SelectValue placeholder="All Mailboxes" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl min-w-[240px]">
                    <SelectItem value="all" className="font-bold text-[10px] uppercase tracking-widest py-3 cursor-pointer">
                        <div className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 text-primary" />
                            All Mailboxes
                        </div>
                    </SelectItem>

                    {mailboxes.map((mailbox) => (
                        <SelectItem
                            key={mailbox.id}
                            value={mailbox.id}
                            className="font-bold text-[10px] uppercase tracking-widest py-3 cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-indigo-400" />
                                <span className="truncate max-w-[160px]">
                                    {mailbox.provider === 'custom_email'
                                        ? (mailbox.metadata?.from_name || (mailbox.email || '').split('@')[0])
                                        : (mailbox.email || mailbox.provider)}
                                </span>
                                {mailbox.connected && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
                            </div>
                        </SelectItem>
                    ))}

                    <div className="h-px bg-border/40 my-1" />

                    <SelectItem value="add_new" className="font-bold text-[10px] uppercase tracking-widest py-3 cursor-pointer text-primary bg-primary/5 hover:bg-primary/10">
                        <div className="flex items-center gap-2">
                            <PlusCircle className="h-3.5 w-3.5" />
                            Add Mailbox
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
