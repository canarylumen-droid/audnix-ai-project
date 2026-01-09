import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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
  ShieldAlert,
  Terminal,
  Cpu,
  Activity,
  ZapOff
} from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { apiRequest } from "@/lib/queryClient";

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
    title: "OPERATOR IDENTITY",
    description: "Align neural tone and closing patterns with core brand parameters.",
    icon: <User className="w-5 h-5" />,
    buttonText: "Execute Protocol",
    href: "/dashboard/settings",
  },
  {
    id: "smtp",
    title: "COMMUNICATION LINK",
    description: "Initialize SMTP bridge for zero-latency lead recovery.",
    icon: <Mail className="w-5 h-5" />,
    buttonText: "Establish Link",
    href: "/dashboard/integrations",
  },
  {
    id: "leads",
    title: "PIPELINE INGESTION",
    description: "Securely vectorise intelligence data for prioritized scoring.",
    icon: <Upload className="w-5 h-5" />,
    buttonText: "Initialize Ingestion",
    href: "/dashboard/lead-import",
  },
  {
    id: "engine",
    title: "NEURAL ACTIVATION",
    description: "Authorize the engine to execute deterministic engagement sequences.",
    icon: <Zap className="w-5 h-5" />,
    buttonText: "Trigger Final Phase",
    href: "/dashboard/conversations",
  },
];

const STORAGE_KEY = "audnixActivation";

function getActivationState(): ActivationState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { }
  return { profile: false, smtp: false, leads: false, engine: false };
}

function setActivationState(state: ActivationState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const ProgressRing = ({ progress }: { progress: number }) => {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-14 h-14">
      <svg className="w-full h-full -rotate-90">
        <circle cx="28" cy="28" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
        <motion.circle
          cx="28"
          cy="28"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className="text-primary"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white italic">
        {Math.round(progress)}%
      </div>
    </div>
  );
};

export function ActivationChecklist({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [state, setState] = useState<ActivationState>(getActivationState);
  const [expanded, setExpanded] = useState(true);
  const hasTriggeredConfetti = useRef(false);

  const { data: user } = useQuery<any>({ queryKey: ["/api/user/profile"] });
  const { data: dashboardStats } = useQuery<any>({ queryKey: ["/api/dashboard/stats"] });

  useEffect(() => {
    if (user) {
      const newState: ActivationState = {
        profile: user.metadata?.onboardingCompleted || false,
        smtp: user.smtpConfigured || user.metadata?.smtpConnected || false,
        leads: (dashboardStats?.leads || 0) > 0 || (dashboardStats?.totalLeads || 0) > 0,
        engine: user.automationEnabled || false,
      };
      setState(newState);
      setActivationState(newState);
    }
  }, [user, dashboardStats]);

  const completedCount = Object.values(state).filter(Boolean).length;
  const progress = (completedCount / 4) * 100;

  useEffect(() => {
    if (progress === 100 && !hasTriggeredConfetti.current) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.8 }, colors: ['#00D9FF', '#ffffff'] });
      hasTriggeredConfetti.current = true;
    }
  }, [progress]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed right-8 bottom-8 z-[100] w-[450px] max-w-[calc(100vw-4rem)]"
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
      >
        <div className="glass-card rounded-[3rem] border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-3xl bg-black/80 flex flex-col premium-glow">
          <div className="p-10 border-b border-white/5">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl">
                  <Activity className="w-7 h-7 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tighter italic uppercase">NEURAL PROTOCOL</h3>
                  <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em] mt-1 italic">V4.0 Initialization</p>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all">
                <X className="w-4 h-4 text-white/30" />
              </button>
            </div>

            <div className="flex items-center justify-between p-6 rounded-[2rem] bg-white/[0.03] border border-white/5">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">System Integrity</span>
                <span className="text-3xl font-black text-white italic tracking-tighter">0{completedCount} / 04 UNITS</span>
              </div>
              <ProgressRing progress={progress} />
            </div>
          </div>

          <div className="p-10 space-y-4">
            {CHECKLIST_ITEMS.map((item, i) => {
              const active = state[item.id];
              const locked = i > 0 && !state[CHECKLIST_ITEMS[i - 1].id];
              return (
                <div key={item.id} className={`flex items-start gap-6 p-6 rounded-[2rem] border transition-all duration-700 ${active ? "bg-primary/[0.03] border-primary/20" : "bg-white/[0.01] border-white/5"} ${locked ? "opacity-20 pointer-events-none" : ""}`}>
                  <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 transition-all duration-1000 ${active ? "bg-primary shadow-[0_0_15px_rgba(34,211,238,0.8)]" : "border-2 border-white/10"}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`text-sm font-black uppercase tracking-widest italic ${active ? "text-primary" : "text-white/40"}`}>{item.title}</h4>
                      {locked && <Lock className="w-3 h-3 text-white/10" />}
                    </div>
                    <p className="text-[11px] font-bold text-white/20 italic leading-relaxed mb-6">{item.description}</p>
                    {!active && !locked && (
                      <Link href={item.href}>
                        <Button className="h-10 px-6 rounded-xl bg-white text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all">
                          Execute Protocol
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-10 pb-10">
            <div className="p-6 rounded-[2rem] border border-primary/20 bg-primary/5 flex items-center gap-4 group">
              <ShieldAlert className="w-5 h-5 text-primary group-hover:scale-125 transition-transform" />
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 italic leading-relaxed">
                Authorization pending. Verify all units to unlock <span className="text-white">Deterministic Autonomy.</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useActivationChecklist() {
  const [showChecklist, setShowChecklist] = useState(false);
  const [activationState, setActivationStateLocal] = useState<ActivationState>(getActivationState);
  const queryClient = useQueryClient();

  const { data: user } = useQuery<any>({ queryKey: ["/api/user/profile"] });
  const { data: dashboardStats } = useQuery<any>({ queryKey: ["/api/dashboard/stats"] });

  const updateMetadata = useMutation({
    mutationFn: (metadata: any) => apiRequest("POST", "/api/user/auth/metadata", { metadata }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] })
  });

  useEffect(() => {
    if (user) {
      const newState: ActivationState = {
        profile: user.metadata?.onboardingCompleted || false,
        smtp: user.smtpConfigured || user.metadata?.smtpConnected || false,
        leads: (dashboardStats?.leads || 0) > 0 || (dashboardStats?.totalLeads || 0) > 0,
        engine: user.automationEnabled || false,
      };
      setActivationStateLocal(newState);
      const allComplete = Object.values(newState).every(Boolean);
      const alreadyCompleteMarked = user.metadata?.activationChecklistComplete === true;

      const dismissed = localStorage.getItem("audnixChecklistDismissed") === "true";
      if (!allComplete && !dismissed && !alreadyCompleteMarked) {
        setShowChecklist(true);
      }

      if (allComplete && !alreadyCompleteMarked) {
        updateMetadata.mutate({ activationChecklistComplete: true });
        localStorage.setItem("audnixChecklistDismissed", "true");
        setTimeout(() => setShowChecklist(false), 3000);
      }
    }
  }, [user, dashboardStats]);

  return {
    showChecklist,
    activationState,
    closeChecklist: () => {
      setShowChecklist(false);
      localStorage.setItem("audnixChecklistDismissed", "true");
    },
    openChecklist: () => setShowChecklist(true),
    handleComplete: () => { }
  };
}
