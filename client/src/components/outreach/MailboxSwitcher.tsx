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

    // Auto-select first mailbox if none is selected and mailboxes exist
    useEffect(() => {
        if (!currentMailboxId && mailboxes.length > 0) {
            handleMailboxChange(mailboxes[0].id);
        }
    }, [currentMailboxId, mailboxes]);

    if (isLoading) return <div className="h-10 w-[200px] animate-pulse bg-muted rounded-2xl" />;

    // Always show if user has at least one connected mailbox, so they can see "All" vs specific
    if (mailboxes.length === 0) return null;

    const selectedMailbox = mailboxes.find(m => m.id === currentMailboxId) || mailboxes[0];

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Select
                value={currentMailboxId || (mailboxes[0]?.id)}
                onValueChange={(val) => {
                    if (val === "add_new") {
                        setLocation("/dashboard/integrations");
                        return;
                    }
                    handleMailboxChange(val);
                }}
            >
                <SelectTrigger className="w-[240px] h-10 rounded-2xl border-border/40 bg-card/40 backdrop-blur-md font-bold text-[10px] uppercase tracking-wider text-muted-foreground/80 hover:text-foreground transition-colors group">
                    <div className="flex items-center gap-2 truncate">
                        <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                        <SelectValue>
                            {selectedMailbox?.email || selectedMailbox?.provider || "My Mailbox"}
                        </SelectValue>
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl min-w-[260px]">
                    {mailboxes.map((mailbox) => (
                        <SelectItem
                            key={mailbox.id}
                            value={mailbox.id}
                            className="font-bold text-[10px] uppercase tracking-widest py-3 cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                <span className="truncate max-w-[180px]">
                                    {mailbox.email || mailbox.provider}
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
