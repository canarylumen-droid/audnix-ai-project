
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Lock, Zap, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export function VoiceMinutesWidget() {
  const { data: voiceBalance, isLoading } = useQuery({
    queryKey: ["/api/voice/balance"],
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 sm:p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const balance = voiceBalance?.balance || 0;
  const total = voiceBalance?.total || 0;
  const used = voiceBalance?.used || 0;
  const percentage = voiceBalance?.percentage || 0;
  const isLocked = voiceBalance?.locked || false;

  return (
    <Card className="w-full border-primary/20 hover:border-primary/50 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span>Voice Minutes</span>
          </CardTitle>
          {isLocked && (
            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
              <Lock className="h-3 w-3" />
              <span className="text-xs">Out of Minutes</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2 text-xs sm:text-sm">
            <span className="font-medium">
              {Math.floor(balance)} / {total} min
            </span>
            <span className="text-muted-foreground">
              {percentage.toFixed(0)}% used
            </span>
          </div>
          <Progress 
            value={percentage} 
            className={`h-2 ${isLocked ? 'bg-red-500/20' : ''}`}
            data-testid="progress-voice-minutes"
          />
        </div>

        {isLocked ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 sm:p-4 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-red-500 mb-1 text-sm sm:text-base">
                  🔒 Voice minutes depleted
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                  Top up instantly to send AI voice notes
                </p>
                <Link href="/dashboard/pricing#topups">
                  <Button size="sm" className="w-full bg-red-500 hover:bg-red-600 text-xs sm:text-sm">
                    <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Buy More Minutes
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-500">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">{Math.floor(balance)} minutes left</span>
            </div>
            <Link href="/dashboard/pricing#topups">
              <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                + Add More
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
