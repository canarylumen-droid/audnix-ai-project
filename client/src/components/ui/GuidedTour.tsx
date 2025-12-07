import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Sparkles, Navigation, Upload, MessageSquare, Brain, BarChart3, Check } from "lucide-react";
import { createPortal } from "react-dom";

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  icon?: React.ReactNode;
  position?: "center" | "left" | "right" | "top" | "bottom";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Audnix AI",
    description: "This quick 1-minute tour will show you exactly how your AI closes deals, sends follow-ups, and handles your leads.",
    icon: <Sparkles className="w-8 h-8 text-cyan-400" />,
    position: "center",
  },
  {
    id: "sidebar",
    title: "Your command center",
    description: "This is where you'll access leads, automation, insights, and all your activation tools.",
    targetSelector: "[data-testid='sidebar-desktop'], [data-testid='nav-desktop']",
    icon: <Navigation className="w-8 h-8 text-cyan-400" />,
    position: "right",
  },
  {
    id: "import-leads",
    title: "Start here: Import your leads",
    description: "Upload your CSV or PDF to let your AI begin analyzing, warming up, and reconnecting your prospects.",
    targetSelector: "[data-testid='nav-item-import leads']",
    icon: <Upload className="w-8 h-8 text-cyan-400" />,
    position: "right",
  },
  {
    id: "conversations",
    title: "Your AI inbox",
    description: "Every reply, follow-up, recovery, and objection handling shows up here. This is where you watch the AI work.",
    targetSelector: "[data-testid='nav-item-conversations']",
    icon: <MessageSquare className="w-8 h-8 text-cyan-400" />,
    position: "right",
  },
  {
    id: "sales-assistant",
    title: "Your Intelligent Closer",
    description: "Paste what your prospect said, and get instant AI-powered responses to handle objections, adapt tone, and close the deal.",
    targetSelector: "[data-testid='nav-item-objection handler']",
    icon: <Brain className="w-8 h-8 text-cyan-400" />,
    position: "right",
  },
  {
    id: "analytics",
    title: "Performance analytics",
    description: "Track conversions, recovery rate, response timing, and everything your AI is doing behind the scenes.",
    targetSelector: "[data-testid='nav-item-analytics']",
    icon: <BarChart3 className="w-8 h-8 text-cyan-400" />,
    position: "right",
  },
  {
    id: "done",
    title: "You're good to go",
    description: "You now understand every key part of Audnix AI. Let's activate your first leads.",
    icon: <Check className="w-8 h-8 text-emerald-400" />,
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
      window.addEventListener("resize", updateTargetRect);
      window.addEventListener("scroll", updateTargetRect);
      return () => {
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

  const handleSkip = () => {
    onSkip();
  };

  if (!isOpen) return null;

  const getModalPosition = () => {
    if (!targetRect || step.position === "center") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const padding = 20;
    const modalWidth = 400;
    const modalHeight = 250;

    switch (step.position) {
      case "right":
        return {
          top: `${Math.max(padding, Math.min(targetRect.top, window.innerHeight - modalHeight - padding))}px`,
          left: `${targetRect.right + padding}px`,
        };
      case "left":
        return {
          top: `${Math.max(padding, Math.min(targetRect.top, window.innerHeight - modalHeight - padding))}px`,
          left: `${targetRect.left - modalWidth - padding}px`,
        };
      case "bottom":
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left}px`,
        };
      case "top":
        return {
          top: `${targetRect.top - modalHeight - padding}px`,
          left: `${targetRect.left}px`,
        };
      default:
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        };
    }
  };

  const modalStyle = getModalPosition();

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          />

          {targetRect && step.position !== "center" && (
            <motion.div
              className="fixed z-[9999] pointer-events-none"
              style={{
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                boxShadow: "0 0 0 4000px rgba(0, 0, 0, 0.7), 0 0 20px 4px rgba(0, 200, 255, 0.5)",
                borderRadius: "12px",
                border: "2px solid rgba(0, 200, 255, 0.6)",
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            />
          )}

          <motion.div
            className="fixed z-[10000] w-[400px] max-w-[calc(100vw-32px)] md:max-w-[90vw] bg-gradient-to-b from-[#1a2744] to-[#0d1428] rounded-2xl border border-cyan-500/30 shadow-2xl left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 bottom-4 md:bottom-auto"
            style={{
              ...modalStyle,
              ...(typeof window !== 'undefined' && window.innerWidth < 768 ? {
                top: 'auto',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
              } : {})
            }}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden md:block">
              <div className="px-4 py-1.5 bg-cyan-500/20 rounded-full border border-cyan-500/30 text-xs text-cyan-300 font-medium">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </div>
            </div>

            <button
              onClick={handleSkip}
              className="absolute top-3 right-3 md:top-4 md:right-4 text-white/50 hover:text-white transition-colors text-xs md:text-sm"
            >
              Skip Tour
            </button>

            <div className="p-4 md:p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 md:mb-6 border border-cyan-500/20">
                  {step.icon}
                </div>
                <div className="md:hidden mb-2">
                  <span className="px-3 py-1 bg-cyan-500/20 rounded-full border border-cyan-500/30 text-xs text-cyan-300 font-medium">
                    {currentStep + 1} / {TOUR_STEPS.length}
                  </span>
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-white mb-2 md:mb-3">{step.title}</h3>
                <p className="text-white/70 text-sm md:text-base leading-relaxed">{step.description}</p>
              </div>

              <div className="flex items-center justify-between mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/10">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="text-white/70 hover:text-white disabled:opacity-30 text-sm px-2 md:px-4"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>

                <div className="hidden md:flex gap-1.5">
                  {TOUR_STEPS.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentStep
                          ? "bg-cyan-400"
                          : index < currentStep
                          ? "bg-cyan-400/50"
                          : "bg-white/20"
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm px-3 md:px-4"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? (
                    <>
                      Finish
                      <Check className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function useTour(onboardingCompleted: boolean = false) {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (!onboardingCompleted) {
      setShowTour(false);
      return;
    }
    
    const tourCompleted = localStorage.getItem("audnixTourCompleted");
    if (!tourCompleted) {
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [onboardingCompleted]);

  const completeTour = useCallback(() => {
    localStorage.setItem("audnixTourCompleted", "true");
    setShowTour(false);
  }, []);

  const skipTour = useCallback(() => {
    localStorage.setItem("audnixTourCompleted", "true");
    setShowTour(false);
  }, []);

  const replayTour = useCallback(() => {
    localStorage.removeItem("audnixTourCompleted");
    setShowTour(true);
  }, []);

  return { showTour, completeTour, skipTour, replayTour };
}
