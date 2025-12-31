import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Mail,
  Upload,
  Zap,
  Check,
  ChevronDown,
  ChevronUp,
  Lock,
  X,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

export interface ActivationState {
  profile: boolean;
  smtp: boolean;
  leads: boolean;
  engine: boolean;
}

interface ChecklistItem {
  id: keyof ActivationState;
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonText: string;
  href: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "profile",
    title: "Complete your onboarding profile",
    description: "Tell the AI who you are so it adapts its tone, industry and closing patterns.",
    icon: <User className="w-5 h-5" />,
    buttonText: "Complete Profile",
    href: "/dashboard/settings",
  },
  {
    id: "smtp",
    title: "Connect your email (SMTP)",
    description: "This allows your AI to send follow-ups, recover leads, and close deals automatically.",
    icon: <Mail className="w-5 h-5" />,
    buttonText: "Connect Email",
    href: "/dashboard/integrations",
  },
  {
    id: "leads",
    title: "Import your first leads",
    description: "Upload your CSV or PDF so the AI can analyze, prioritize, and score your pipeline.",
    icon: <Upload className="w-5 h-5" />,
    buttonText: "Import Leads",
    href: "/dashboard/lead-import",
  },
  {
    id: "engine",
    title: "Activate your Sales Engine",
    description: "Turn on the AI to start sending sequences, re-engaging cold leads, and handling objections.",
    icon: <Zap className="w-5 h-5" />,
    buttonText: "Activate Engine",
    href: "/dashboard/conversations",
  },
];

const STORAGE_KEY = "audnixActivation";

function getActivationState(): ActivationState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
  }
  return { profile: false, smtp: false, leads: false, engine: false };
}

function setActivationState(state: ActivationState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

interface ActivationChecklistProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function ActivationChecklist({ isOpen, onClose, onComplete }: ActivationChecklistProps) {
  const [state, setState] = useState<ActivationState>(getActivationState);
  const [expanded, setExpanded] = useState(true);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/user/profile"],
    retry: false,
  });

  const { data: dashboardStats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  useEffect(() => {
    if (user) {
      const hasCompletedOnboarding = user.metadata?.onboardingCompleted || false;
      const hasEmailConnected = user.smtpConfigured || user.metadata?.smtpConnected || false;
      const hasLeads = (dashboardStats?.leads || 0) > 0 || (dashboardStats?.totalLeads || 0) > 0;
      const hasEngineActive = user.automationEnabled || hasLeads;

      const newState: ActivationState = {
        profile: hasCompletedOnboarding,
        smtp: hasEmailConnected,
        leads: hasLeads,
        engine: hasEngineActive,
      };

      setState(newState);
      setActivationState(newState);
    }
  }, [user, dashboardStats]);

  const completedCount = Object.values(state).filter(Boolean).length;
  const progress = (completedCount / 4) * 100;
  const isComplete = completedCount === 4;

  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  const markComplete = useCallback((id: keyof ActivationState) => {
    setState((prev) => {
      const newState = { ...prev, [id]: true };
      setActivationState(newState);
      return newState;
    });
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed right-4 top-20 z-50 w-[380px] max-w-[calc(100vw-2rem)]"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="bg-gradient-to-b from-[#1a2744] to-[#0d1428] rounded-2xl border border-cyan-500/30 shadow-2xl overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white">Activation Checklist</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  {expanded ? (
                    <ChevronUp className="w-4 h-4 text-white/60" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/60" />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Progress</span>
                <span className="text-cyan-400 font-medium">{completedCount} of 4 complete</span>
              </div>
              <Progress value={progress} className="h-2 bg-white/10" />
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  {CHECKLIST_ITEMS.map((item, index) => {
                    const isCompleted = state[item.id];
                    const isLocked = index > 0 && !state[CHECKLIST_ITEMS[index - 1].id];

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-xl border transition-all ${
                          isCompleted
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : isLocked
                            ? "bg-white/5 border-white/10 opacity-60"
                            : "bg-white/5 border-white/20 hover:border-cyan-500/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg flex-shrink-0 ${
                              isCompleted
                                ? "bg-emerald-500/20 text-emerald-400"
                                : isLocked
                                ? "bg-white/10 text-white/40"
                                : "bg-cyan-500/20 text-cyan-400"
                            }`}
                          >
                            {isCompleted ? <Check className="w-5 h-5" /> : isLocked ? <Lock className="w-5 h-5" /> : item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`font-medium text-sm ${
                                isCompleted ? "text-emerald-300 line-through" : "text-white"
                              }`}
                            >
                              {item.title}
                            </h4>
                            <p className="text-xs text-white/60 mt-1 line-clamp-2">{item.description}</p>
                            {!isCompleted && !isLocked && (
                              <Link href={item.href}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="mt-2 h-7 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 p-0"
                                  onClick={() => markComplete(item.id)}
                                >
                                  {item.buttonText} →
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 pt-0"
                  >
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                        <Check className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h4 className="font-semibold text-white mb-1">All set!</h4>
                      <p className="text-sm text-white/70">Your AI sales engine is fully activated.</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useActivationChecklist() {
  const [showChecklist, setShowChecklist] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [activationState, setActivationStateLocal] = useState<ActivationState>(getActivationState);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/user/profile"],
    retry: false,
    staleTime: 30000,
  });

  const { data: dashboardStats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
    staleTime: 30000,
  });

  useEffect(() => {
    // Check if checklist was already permanently completed/dismissed
    const permanentlyComplete = localStorage.getItem("audnixActivationComplete");
    if (permanentlyComplete === "true") {
      setIsComplete(true);
      setShowChecklist(false);
      return;
    }

    if (user) {
      const hasCompletedOnboarding = user.metadata?.onboardingCompleted || false;
      const hasEmailConnected = user.smtpConfigured || user.metadata?.smtpConnected || false;
      const hasLeads = (dashboardStats?.leads || 0) > 0 || (dashboardStats?.totalLeads || 0) > 0;
      const hasEngineActive = user.automationEnabled || hasLeads;

      const newState: ActivationState = {
        profile: hasCompletedOnboarding,
        smtp: hasEmailConnected,
        leads: hasLeads,
        engine: hasEngineActive,
      };

      setActivationStateLocal(newState);
      setActivationState(newState);

      const completedCount = Object.values(newState).filter(Boolean).length;
      const allComplete = completedCount === 4;
      setIsComplete(allComplete);

      if (allComplete) {
        // Permanently mark as complete
        localStorage.setItem("audnixActivationComplete", "true");
        localStorage.setItem("audnixChecklistDismissed", "true");
        setShowChecklist(false);
        return;
      }

      // Don't auto-show checklist - user must click to open
      // const checklistDismissed = localStorage.getItem("audnixChecklistDismissed");
      // if (!checklistDismissed) {
      //   const timer = setTimeout(() => {
      //     setShowChecklist(true);
      //   }, 2000);
      //   return () => clearTimeout(timer);
      // }
    } else {
      const state = getActivationState();
      setActivationStateLocal(state);
      const completedCount = Object.values(state).filter(Boolean).length;
      const allComplete = completedCount === 4;
      setIsComplete(allComplete);
      
      if (allComplete) {
        localStorage.setItem("audnixActivationComplete", "true");
        localStorage.setItem("audnixChecklistDismissed", "true");
        setShowChecklist(false);
        return;
      }
      
      const checklistDismissed = localStorage.getItem("audnixChecklistDismissed");
      if (checklistDismissed) {
        setShowChecklist(false);
        return;
      }
    }
  }, [user, dashboardStats]);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = getActivationState();
      setActivationStateLocal(state);
      const completedCount = Object.values(state).filter(Boolean).length;
      const allComplete = completedCount === 4;
      setIsComplete(allComplete);
      if (allComplete) {
        setShowChecklist(false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const closeChecklist = useCallback(() => {
    setShowChecklist(false);
    // Permanently dismiss when all complete
    if (isComplete) {
      localStorage.setItem("audnixChecklistDismissed", "true");
    }
  }, [isComplete]);

  const openChecklist = useCallback(() => {
    setShowChecklist(true);
  }, []);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
    // Permanently dismiss checklist when completed
    localStorage.setItem("audnixChecklistDismissed", "true");
    localStorage.setItem("audnixActivationComplete", "true");
    setTimeout(() => {
      setShowChecklist(false);
    }, 2000);
  }, []);

  return {
    showChecklist,
    isComplete,
    activationState,
    closeChecklist,
    openChecklist,
    handleComplete,
  };
}
