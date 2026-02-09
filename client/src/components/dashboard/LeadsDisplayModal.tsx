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

        <ScrollArea className="flex-1 border-t border-border/40 max-h-[60vh]">
          <div className="w-full">
            <table className="w-full text-left border-collapse table-auto">
              <thead className="sticky top-0 bg-background/95 backdrop-blur-xl z-20 border-b border-border/40">
                <tr>
                  <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 whitespace-nowrap">Lead Details</th>
                  <th className="hidden md:table-cell px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 whitespace-nowrap">Contact info</th>
                  <th className="hidden sm:table-cell px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 whitespace-nowrap">Firmographics</th>
                  <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 whitespace-nowrap">Social</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {leads.map((lead, idx) => (
                  <tr key={idx} className="group hover:bg-primary/5 transition-colors">
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm tracking-tight truncate">{lead.name}</div>
                          <div className="md:hidden text-xs text-muted-foreground truncate">{lead.email}</div>
                          {lead.title && <div className="text-[10px] font-bold text-primary/60 uppercase tracking-widest truncate">{lead.title}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground truncate">
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
                    <td className="hidden sm:table-cell px-4 md:px-6 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground truncate">
                          <Building2 className="h-3 w-3 opacity-60" />
                          {lead.company || "N/A"}
                        </div>
                        {lead.location && (
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground truncate">
                            <MapPin className="h-3 w-3 opacity-60" />
                            {lead.location}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
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
                          <span className="text-[10px] font-bold text-muted-foreground/40 italic">N/A</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>

        {onConfirm && (
          <div className="p-6 border-t border-border/40 bg-muted/20 flex flex-col-reverse sm:flex-row justify-end gap-3 px-8">
            <Button variant="outline" onClick={onClose} disabled={isImporting} className="font-bold rounded-xl border-border/50 h-11">
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isImporting || !canConfirm}
              className="bg-primary hover:bg-primary/90 font-bold uppercase tracking-wider rounded-xl h-11 px-8 shadow-lg shadow-primary/20"
            >
              {isImporting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </>
              ) : (
                'Confirm Neural Sync'
              )}
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
