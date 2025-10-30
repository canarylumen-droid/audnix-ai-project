import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { isDevMode } from "@/lib/supabase";

interface TrialExpiredOverlayProps {
  daysLeft: number;
  plan: string;
}

export function TrialExpiredOverlay({ daysLeft, plan }: TrialExpiredOverlayProps) {
  // Skip in developer mode (when API keys not configured)
  if (isDevMode()) {
    return null;
  }

  if (plan !== "trial" || daysLeft > 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blur backdrop */}
      <motion.div
        className="absolute inset-0 backdrop-blur-md bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Upgrade card */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="border-2 border-primary shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <motion.div
              className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Lock className="w-8 h-8 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">
              Your Free Trial Has Ended
            </CardTitle>
            <CardDescription className="text-base">
              Upgrade to a paid plan to access more features and continue growing your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>More lead capacity</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>AI-powered voice messages</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Advanced automation features</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Priority support</span>
              </div>
            </div>

            <Link href="/dashboard/pricing">
              <Button className="w-full glow" size="lg">
                Upgrade Plan
              </Button>
            </Link>

            <p className="text-xs text-center text-muted-foreground">
              Choose from our flexible plans starting at just $49.99/month
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
