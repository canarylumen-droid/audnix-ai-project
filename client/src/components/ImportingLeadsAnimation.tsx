import { motion } from "framer-motion";
import { Instagram, Mail, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";

interface ImportingLeadsAnimationProps {
  channel: "instagram" | "email";
  onComplete?: () => void;
  isImporting: boolean;
}

const channelConfig = {
  instagram: {
    icon: Instagram,
    name: "Instagram",
    color: "from-pink-500 to-purple-600",
    bgColor: "bg-gradient-to-r from-pink-500/10 to-purple-600/10",
  },
  email: {
    icon: Mail,
    name: "Email",
    color: "from-blue-500 to-cyan-600",
    bgColor: "bg-gradient-to-r from-blue-500/10 to-cyan-600/10",
  },
};

export function ImportingLeadsAnimation({
  channel,
  onComplete,
  isImporting,
}: ImportingLeadsAnimationProps) {
  const config = channelConfig[channel];
  const ChannelIcon = config.icon;
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"importing" | "processing" | "complete">("importing");

  useEffect(() => {
    if (!isImporting) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStage("complete");
          setTimeout(() => {
            onComplete?.();
          }, 2000);
          return 100;
        }
        if (prev >= 60) {
          setStage("processing");
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isImporting, onComplete]);

  if (!isImporting) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <Card className="w-full max-w-md mx-4 border-2 border-primary/20 shadow-2xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {stage !== "complete" ? (
              <>
                <motion.div
                  className={`w-20 h-20 rounded-full ${config.bgColor} flex items-center justify-center relative`}
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <ChannelIcon className={`h-10 w-10 text-${channel === 'instagram' ? 'pink' : 'blue'}-500`} />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-primary"
                    animate={{
                      opacity: [0.5, 0, 0.5],
                      scale: [1, 1.5, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold">
                    {stage === "importing" 
                      ? `Importing your leads from ${config.name}` 
                      : `Processing ${config.name} conversations`}
                  </h3>
                  <p className="text-muted-foreground">
                    {stage === "importing"
                      ? "Fetching your conversations and contacts..."
                      : "Analyzing engagement patterns with AI..."}
                  </p>
                </div>

                <div className="w-full space-y-2">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${config.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{progress}% complete</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Please don't close this window</span>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
                className="space-y-6"
              >
                <motion.div
                  className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center"
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 0.6,
                    ease: "easeInOut",
                  }}
                >
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </motion.div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
                    All Set!
                  </h3>
                  <p className="text-lg font-medium">
                    AI will start working on your {config.name} leads
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Intelligent follow-ups and engagement analysis are now active
                  </p>
                </div>

                <motion.div
                  className="flex items-center gap-2 text-primary"
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm font-medium">Powered by AI</span>
                </motion.div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
