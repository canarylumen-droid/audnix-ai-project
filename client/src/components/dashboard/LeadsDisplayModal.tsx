import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Building2, Phone, MapPin, Globe, Linkedin } from "lucide-react";

interface Lead {
  name: string;
  email: string;
  company?: string;
  title?: string;
  phone?: string;
  location?: string;
  industry?: string;
  website?: string;
  linkedin?: string;
}

interface LeadsDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  onConfirm?: () => void;
  isImporting?: boolean;
  canConfirm?: boolean;
}

export function LeadsDisplayModal({
  isOpen,
  onClose,
  leads,
  onConfirm,
  isImporting,
  canConfirm = true
}: LeadsDisplayModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden border-border/40 bg-card/95 backdrop-blur-xl rounded-[2rem]">
        <DialogHeader className="p-8 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight">Imported Neural Profiles</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">
                {leads.length} high-intent targets synchronized
              </DialogDescription>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px] px-3 py-1">
              Neural Core Sync
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto border-t border-border/40">
          <div className="min-w-[800px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-background/95 backdrop-blur-xl z-20 border-b border-border/40">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Lead Details</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Contact info</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Firmographics</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Social</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {leads.map((lead, idx) => (
                  <tr key={idx} className="group hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm tracking-tight">{lead.name}</div>
                          {lead.title && <div className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{lead.title}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <Mail className="h-3 w-3 opacity-60" />
                          {lead.email}
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Phone className="h-3 w-3 opacity-60" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        {lead.company && (
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Building2 className="h-3 w-3 opacity-60" />
                            {lead.company}
                          </div>
                        )}
                        {lead.location && (
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <MapPin className="h-3 w-3 opacity-60" />
                            {lead.location}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {lead.linkedin && (
                          <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 cursor-pointer transition-colors">
                            <Linkedin className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {lead.website && (
                          <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 cursor-pointer transition-colors">
                            <Globe className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {!lead.linkedin && !lead.website && (
                          <span className="text-[10px] font-bold text-muted-foreground/40 italic">Incomplete</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {onConfirm && (
          <div className="p-6 border-t border-border/40 bg-muted/20 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isImporting} className="font-bold">
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isImporting || !canConfirm}
              className="bg-primary hover:bg-primary/90 font-bold uppercase tracking-wider"
            >
              {isImporting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Importing...
                </>
              ) : (
                'Finalize Import'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
