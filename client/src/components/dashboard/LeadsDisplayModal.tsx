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
        
        <ScrollArea className="flex-1 p-8 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
            {leads.map((lead, idx) => (
              <div 
                key={idx}
                className="group p-5 rounded-2xl bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-background border border-border/50 text-primary group-hover:scale-110 transition-transform">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="font-bold text-base tracking-tight leading-tight">{lead.name}</h4>
                      {lead.title && (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mt-0.5">{lead.title}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Mail className="h-3.5 w-3.5 opacity-60" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                      
                      {lead.company && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                          <Building2 className="h-3.5 w-3.5 opacity-60" />
                          <span>{lead.company}</span>
                        </div>
                      )}

                      {lead.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                          <Phone className="h-3.5 w-3.5 opacity-60" />
                          <span>{lead.phone}</span>
                        </div>
                      )}

                      {lead.website && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium hover:text-primary transition-colors cursor-pointer">
                          <Globe className="h-3.5 w-3.5 opacity-60" />
                          <span className="truncate underline underline-offset-2">{lead.website}</span>
                        </div>
                      )}

                      {lead.linkedin && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium hover:text-blue-400 transition-colors cursor-pointer">
                          <Linkedin className="h-3.5 w-3.5 opacity-60" />
                          <span className="truncate">LinkedIn Profile</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-4">
                        {lead.industry && (
                          <Badge variant="secondary" className="text-[9px] px-2 py-0 h-5 bg-background border-border/50 font-bold uppercase tracking-widest">
                            {lead.industry}
                          </Badge>
                        )}
                        {lead.location && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-background/50 border border-border/30 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                            <MapPin className="h-2.5 w-2.5" />
                            {lead.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

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
