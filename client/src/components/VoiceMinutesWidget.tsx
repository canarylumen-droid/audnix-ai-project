
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
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
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
    <Card className="border-primary/20 hover:border-primary/50 transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Voice Minutes
          </CardTitle>
          {isLocked && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Locked
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {balance} / {total} minutes
            </span>
            <span className="text-sm text-muted-foreground">
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
            className="p-4 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-500 mb-1">
                  🔒 All voice minutes used
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Please top up to continue sending voice notes
                </p>
                <Link href="/dashboard/pricing#topups">
                  <Button size="sm" className="w-full bg-red-500 hover:bg-red-600">
                    <Zap className="h-4 w-4 mr-2" />
                    Top Up Now
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-emerald-500">
              <TrendingUp className="h-4 w-4" />
              <span>{balance} minutes remaining</span>
            </div>
            <Link href="/dashboard/pricing#topups">
              <Button variant="outline" size="sm" className="w-full">
                Add More Minutes
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
