
import { useQuery } from "@tanstack/react-query";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Mail, Globe, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MailboxSwitcherProps {
    value?: string;
    onValueChange: (value: string | undefined) => void;
    className?: string;
}

export function MailboxSwitcher({ value, onValueChange, className }: MailboxSwitcherProps) {
    const { data: integrations, isLoading } = useQuery<any[]>({
        queryKey: ["/api/integrations"],
    });

    const mailboxes = integrations?.filter(i =>
        ['custom_email', 'gmail', 'outlook'].includes(i.provider) && i.connected
    ) || [];

    if (isLoading || mailboxes.length <= 1) return null;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Select
                value={value || "all"}
                onValueChange={(val) => onValueChange(val === "all" ? undefined : val)}
            >
                <SelectTrigger className="w-[200px] h-10 rounded-2xl border-border/40 bg-card/40 backdrop-blur-md font-bold text-xs uppercase tracking-wider">
                    <SelectValue placeholder="All Mailboxes" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 bg-card/90 backdrop-blur-xl">
                    <SelectItem value="all" className="font-bold text-[10px] uppercase tracking-widest py-3">
                        <div className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 text-primary" />
                            All Mailboxes
                        </div>
                    </SelectItem>
                    <SelectItem
                        key={mailbox.id}
                        value={mailbox.id}
                        className="font-bold text-[10px] uppercase tracking-widest py-3"
                    >
                        <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-indigo-400" />
                            <span className="truncate max-w-[150px]">
                                {mailbox.accountType || mailbox.provider.charAt(0).toUpperCase() + mailbox.provider.slice(1)}
                                {mailbox.encryptedMeta && " • "}
                                {mailbox.userId === mailbox.accountType ? "" : (mailbox.accountType || "")}
                            </span>
                            {mailbox.connected && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
