import { useState } from "react";
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
  const [visibleCount, setVisibleCount] = useState(50);
  const visibleLeads = leads.slice(0, visibleCount);
  const hasMore = leads.length > visibleCount;

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 50);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] sm:max-w-[90vw] md:max-w-7xl h-auto max-h-[90vh] p-0 flex flex-col overflow-hidden border-border/20 bg-card/98 backdrop-blur-2xl rounded-[1rem] sm:rounded-[2rem] shadow-2xl focus:outline-none">
        <DialogHeader className="p-6 md:p-8 pb-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight">Imported Lead Profiles</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">
                {leads.length} leads ready to import
              </DialogDescription>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px] px-3 py-1 self-start sm:self-auto">
              Ready
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <ScrollArea className="flex-1 w-full">
            <div className="w-full overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse table-fixed md:table-auto min-w-[800px]">
                <thead className="sticky top-0 bg-background/95 backdrop-blur-xl z-20 border-b border-border/40">
                  <tr>
                    <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 whitespace-nowrap">Lead Details</th>
                    <th className="hidden md:table-cell px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 whitespace-nowrap">Contact info</th>
                    <th className="hidden sm:table-cell px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 whitespace-nowrap">Firmographics</th>
                    <th className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 whitespace-nowrap">Social</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {visibleLeads.map((lead, idx) => (
                    <tr key={idx} className="group hover:bg-primary/5 transition-colors">
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 max-w-[120px] md:max-w-none">
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
              {hasMore && (
                <div className="p-8 text-center border-t border-border/20 bg-muted/5 pb-12">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShowMore}
                    className="text-[10px] font-black tracking-widest uppercase text-primary hover:bg-primary/10 h-10 px-8 rounded-xl border border-primary/10"
                  >
                    Load More (+{Math.min(50, leads.length - visibleCount)} of {leads.length - visibleCount})
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {onConfirm && (
          <div className="p-4 md:p-6 border-t border-border/10 bg-card/80 backdrop-blur-lg flex flex-col sm:flex-row justify-end gap-3 shrink-0 z-50">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isImporting}
              className="font-bold rounded-2xl border-border/40 hover:bg-muted/50 h-12 w-full sm:w-auto text-[11px] uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isImporting || !canConfirm}
              className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.15em] rounded-2xl h-12 px-10 shadow-2xl shadow-primary/40 w-full sm:w-auto text-[11px] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isImporting ? (
                <>
                  <div className="h-4 w-4 mr-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  INITIALIZING...
                </>
              ) : (
                'Confirm & Import Data'
              )}
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
