import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Sparkles, Navigation, Upload, MessageSquare, Brain, BarChart3, Check, Terminal, Cpu, Database, Activity } from "lucide-react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  icon?: React.ReactNode;
  position?: "left" | "right" | "top" | "bottom" | "center";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Audnix Core Systems",
    description: "System initialized. Welcome to the elite revenue recovery suite. Calibrating interface for autonomous operations.",
    icon: <Sparkles className="w-6 h-6 text-primary" />,
    position: "center",
  },
  {
    id: "sidebar",
    title: "Command Interface",
    description: "Sovereign control surface. Access neural engagement logs, economic analytics, and system scaling modules.",
    targetSelector: "[data-testid='sidebar-desktop'], [data-testid='nav-desktop']",
    icon: <Navigation className="w-6 h-6 text-primary" />,
    position: "right",
  },
  {
    id: "import-leads",
    title: "Data Ingestion Node",
    description: "Feed raw intelligence (CSV/PDF) into the neural engine for immediate lead scoring and prioritization.",
    targetSelector: "[data-testid='nav-item-import leads']",
    icon: <Upload className="w-6 h-6 text-primary" />,
    position: "right",
  },
  {
    id: "conversations",
    title: "Neural Engagement Log",
    description: "Audit every objection handled and deal closed by your autonomous Sales Engine in real-time.",
    targetSelector: "[data-testid='nav-item-conversations']",
    icon: <MessageSquare className="w-6 h-6 text-primary" />,
    position: "right",
  },
  {
    id: "sales-assistant",
    title: "Objection Matrix",
    description: "Deploy precision logic. Generate conversion-optimized handlers for any high-status prospect input.",
    targetSelector: "[data-testid='nav-item-objection handler']",
    icon: <Brain className="w-6 h-6 text-primary" />,
    position: "right",
  },
  {
    id: "analytics",
    title: "Yield Intelligence",
    description: "Visualize recovered revenue and engine performance. Track the ROI of your autonomous ecosystem.",
    targetSelector: "[data-testid='nav-item-analytics']",
    icon: <BarChart3 className="w-6 h-6 text-primary" />,
    position: "right",
  },
  {
    id: "done",
    title: "Calibration Complete",
    description: "Protocol finalized. You are authorized for full engine deployment. Initiate revenue recovery.",
    icon: <Check className="w-6 h-6 text-emerald-400" />,
    position: "center",
  },
];

interface GuidedTourProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function GuidedTour({ isOpen, onComplete, onSkip }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS[currentStep];

  const updateTargetRect = useCallback(() => {
    if (step.targetSelector) {
      const selectors = step.targetSelector.split(", ");
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          setTargetRect(element.getBoundingClientRect());
          return;
        }
      }
    }
    setTargetRect(null);
  }, [step.targetSelector]);

  useEffect(() => {
    if (isOpen) {
      updateTargetRect();
      const observer = new MutationObserver(updateTargetRect);
      observer.observe(document.body, { attributes: true, childList: true, subtree: true });
      window.addEventListener("resize", updateTargetRect);
      window.addEventListener("scroll", updateTargetRect);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", updateTargetRect);
        window.removeEventListener("scroll", updateTargetRect);
      };
    }
  }, [isOpen, currentStep, updateTargetRect]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
        {/* SVG Spotlight Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-auto bg-black/60 backdrop-blur-[8px]"
          style={{
            maskImage: targetRect && step.position !== "center"
              ? `radial-gradient(circle ${Math.max(targetRect.width, targetRect.height) / 2 + 30}px at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent 100%, black 100%)`
              : 'none',
            WebkitMaskImage: targetRect && step.position !== "center"
              ? `radial-gradient(circle ${Math.max(targetRect.width, targetRect.height) / 2 + 30}px at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent 100%, black 100%)`
              : 'none'
          }}
        />

        {/* Pulsating Border */}
        {targetRect && step.position !== "center" && (
          <motion.div
            layoutId="spotlight-border"
            className="fixed pointer-events-none z-[10000]"
            style={{
              top: targetRect.top - 10,
              left: targetRect.left - 10,
              width: targetRect.width + 20,
              height: targetRect.height + 20,
              borderRadius: '24px',
              border: '2px solid rgba(0, 217, 255, 0.5)',
              boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)'
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              boxShadow: ['0 0 20px rgba(0, 217, 255, 0.3)', '0 0 40px rgba(0, 217, 255, 0.5)', '0 0 20px rgba(0, 217, 255, 0.3)']
            }}
            transition={{
              boxShadow: { duration: 2, repeat: Infinity },
              layout: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
            }}
          />
        )}

        {/* Tour Modal */}
        <div className={`fixed z-[10001] pointer-events-auto flex items-center justify-center inset-0 ${step.position === 'center' ? '' : 'sm:inset-auto sm:right-12 sm:bottom-12'}`}>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-[400px] mx-4 glass-card rounded-[2.5rem] border-white/10 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.8)] p-8 bg-black/80"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  {step.icon}
                </div>
                <div>
                  <h4 className="font-bold text-white tracking-tight">{step.title}</h4>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none mt-1">
                    Node Calibration {currentStep + 1} / {TOUR_STEPS.length}
                  </p>
                </div>
              </div>
              <button onClick={onSkip} className="p-2 hover:bg-white/5 rounded-full transition-all group">
                <X className="w-4 h-4 text-white/20 group-hover:text-white" />
              </button>
            </div>

            <p className="text-white/60 text-sm font-medium leading-relaxed mb-10">
              {step.description}
            </p>

            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'w-6 bg-primary' : 'w-2 bg-white/10'}`}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="rounded-xl text-white/40 hover:text-white hover:bg-white/5"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="h-10 px-6 rounded-xl bg-white text-black font-black hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Execute' : 'Proceed'}
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

export function useTour(onboardingCompleted: boolean = false) {
  const [showTour, setShowTour] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery<any>({
    queryKey: ["/api/user/profile"],
    enabled: !!onboardingCompleted,
  });

  const updateMetadata = useMutation({
    mutationFn: async (metadata: any) => {
      return await apiRequest("POST", "/api/user/auth/metadata", { metadata });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    }
  });

  useEffect(() => {
    if (!onboardingCompleted) {
      setShowTour(false);
      return;
    }

    const tourCompleted = localStorage.getItem("audnixTourCompleted") === "true" || user?.metadata?.tourCompleted === true;

    if (!tourCompleted) {
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [onboardingCompleted, user]);

  const completeTour = useCallback(() => {
    localStorage.setItem("audnixTourCompleted", "true");
    updateMetadata.mutate({ tourCompleted: true });
    setShowTour(false);
  }, [updateMetadata]);

  const skipTour = useCallback(() => {
    localStorage.setItem("audnixTourCompleted", "true");
    updateMetadata.mutate({ tourCompleted: true });
    setShowTour(false);
  }, [updateMetadata]);

  const replayTour = useCallback(() => {
    localStorage.removeItem("audnixTourCompleted");
    setShowTour(true);
  }, []);

  return { showTour, completeTour, skipTour, replayTour };
}
