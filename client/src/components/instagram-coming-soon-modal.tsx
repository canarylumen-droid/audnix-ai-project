import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, MessageCircle } from 'lucide-react';

interface InstagramComingSoonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstagramComingSoonModal({
  open,
  onOpenChange,
}: InstagramComingSoonModalProps) {
  const [claimed, setClaimed] = useState(false);

  const handleGetEarlyAccess = () => {
    setClaimed(true);
    // Optional: Could store this in localStorage or send to backend
    localStorage.setItem('instagram_early_access_claimed', 'true');
    setTimeout(() => {
      setClaimed(false);
      onOpenChange(false);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/10 to-red-500/10">
                <Sparkles className="h-5 w-5 text-pink-500" />
              </div>
              <DialogTitle>Instagram Coming Soon</DialogTitle>
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30">
              In Development
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main Message */}
          <div className="space-y-2">
            <DialogDescription className="text-base font-medium text-foreground">
              We're crafting something exceptional for your Instagram leads.
            </DialogDescription>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our team is currently working with Meta to complete the verification process. 
              We're building the most powerful Instagram integration for lead automation and real-time engagement.
            </p>
          </div>

          {/* Features Coming */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">What's coming:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                <Zap className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Instant DM Sync</p>
                  <p className="text-xs text-muted-foreground">Automatically import and organize Instagram messages</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <MessageCircle className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Smart Auto-Replies</p>
                  <p className="text-xs text-muted-foreground">AI-powered responses that sound like you</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <Sparkles className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Lead Intelligence</p>
                  <p className="text-xs text-muted-foreground">Automatic lead scoring and intent detection</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-muted/50 border border-muted-foreground/20 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expected Timeline</p>
            <p className="text-sm text-foreground">
              Beta access: <span className="font-semibold">Q4 2025</span> • Full rollout: <span className="font-semibold">Early 2026</span>
            </p>
          </div>

          {/* Call to Action */}
          <div className="pt-2">
            {!claimed ? (
              <Button
                onClick={handleGetEarlyAccess}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Be Among First to Try It
              </Button>
            ) : (
              <Button disabled className="w-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                ✓ You're on the list! We'll notify you.
              </Button>
            )}
          </div>

          {/* Footer */}
          <p className="text-xs text-muted-foreground text-center pt-2">
            In the meantime, <a href="/dashboard/lead-import" className="text-cyan-500 hover:underline">import your Instagram CSV</a> to get started immediately.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
