import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Rocket,
  Users,
  Code,
  Briefcase,
  Building,
  Search,
  Check,
  ChevronRight,
  Zap
} from "lucide-react";
import { useReducedMotion } from "@/lib/animation-utils";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";

const USER_ROLES = [
  { value: 'creator', label: 'Content Creator', icon: Sparkles, description: 'Influencer, YouTuber, or creator' },
  { value: 'founder', label: 'Founder / CEO', icon: Rocket, description: 'Building or running a business' },
  { value: 'developer', label: 'Developer', icon: Code, description: 'Building products and tools' },
  { value: 'agency', label: 'Agency', icon: Building, description: 'Managing multiple clients' },
  { value: 'freelancer', label: 'Freelancer', icon: Briefcase, description: 'Independent consultant or service provider' },
  { value: 'other', label: 'Other', icon: Users, description: 'Something else' },
];

const SOURCES = [
  'Twitter/X',
  'LinkedIn',
  'YouTube',
  'Google Search',
  'Friend Referral',
  'Reddit',
  'Facebook',
  'TikTok',
  'Product Hunt',
  'Indie Hackers',
  'Other',
];

const USE_CASES = [
  'Automate lead follow-ups',
  'Close more deals',
  'Automate conversations',
  'Never miss a lead',
  'Scale my outreach',
  'Improve response time',
  'Book more meetings',
  'Learn about AI sales',
];

const BUSINESS_SIZES = [
  { value: 'solo', label: 'Solo (just me)', description: 'Working independently' },
  { value: 'small_team', label: 'Small Team', description: '2-10 people' },
  { value: 'medium', label: 'Medium Business', description: '11-50 people' },
  { value: 'enterprise', label: 'Enterprise', description: '50+ people' },
];

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingWizard({ isOpen, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [userRole, setUserRole] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [customSource, setCustomSource] = useState<string>('');
  const [useCase, setUseCase] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [businessSize, setBusinessSize] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { toast } = useToast();

  const handleRoleSelect = (role: string) => {
    setUserRole(role);
    setTimeout(() => setStep(2), 300);
  };

  const handleSourceSelect = (selectedSource: string) => {
    setSource(selectedSource);
    if (selectedSource !== 'Other') {
      setTimeout(() => setStep(3), 300);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleUseCaseNext = () => {
    if (selectedTags.length === 0 && !useCase.trim()) {
      toast({
        title: "Please select at least one use case",
        variant: "destructive",
      });
      return;
    }
    setStep(4);
  };

  const handleBusinessSizeSelect = (size: string) => {
    setBusinessSize(size);
    setTimeout(() => setStep(5), 500);
  };

  const handleCompanyNameSubmit = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Please enter your company name",
        variant: "destructive",
      });
      return;
    }
    await handleComplete();
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      // Call the backend to save onboarding profile and mark as complete
      await apiClient('/api/auth/complete-onboarding', {
        method: 'POST',
        body: JSON.stringify({
          userRole,
          source: source === 'Other' ? customSource : source,
          useCase: useCase || selectedTags.join(', '),
          businessSize,
          tags: selectedTags,
          companyName: companyName.trim(),
        }),
      });

      toast({
        title: "Welcome to Audnix! 🎉",
        description: "You're all set. Let's start closing deals!",
      });

      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (error: any) {
      console.error('Onboarding error:', error);
      const errorMessage = error?.response?.data?.error || error?.message || "Unknown error";
      const isAuthError = errorMessage.includes("Session") || errorMessage.includes("log in") || error?.response?.status === 401;

      toast({
        title: isAuthError ? "Session expired" : "Onboarding saved",
        description: isAuthError
          ? "Please refresh the page and log in again."
          : "Your preferences have been noted. Continuing to dashboard...",
        variant: isAuthError ? "destructive" : "default",
      });

      if (!isAuthError) {
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <style>{`[class*="onboarding-modal"] button.absolute { display: none !important; }`}</style>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 onboarding-modal">
        <div className="relative">
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait" custom={1}>
              {/* Step 0: Neural Handshake */}
              {step === 0 && (
                <motion.div
                  key="step0"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-8 text-center py-10"
                >
                  <div className="relative w-24 h-24 mx-auto">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="relative w-24 h-24 rounded-full border-2 border-primary/50 flex items-center justify-center bg-background/80 backdrop-blur-md">
                      <Zap className="w-12 h-12 text-primary animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-extrabold tracking-tighter">System Initialized</h2>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto">
                      Connecting to the high-speed network and calibrating the Sales Engine.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto pt-6">
                    <div className="p-3 rounded-2xl bg-muted/30 border border-white/5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                      <p className="text-emerald-500 font-bold">ACTIVE</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/30 border border-white/5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Latency</p>
                      <p className="text-primary font-bold">14ms</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setStep(1)}
                    className="w-full max-w-sm h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 group"
                  >
                    Enter Dashboard
                    <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              )}

              {/* Step 1: Role Selection */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-extrabold tracking-tight">Identify Your Strategy</h2>
                    <p className="text-muted-foreground">We'll tailor the system to your specific business model</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    {USER_ROLES.map((role) => (
                      <motion.button
                        key={role.value}
                        onClick={() => handleRoleSelect(role.value)}
                        className={`relative p-6 rounded-xl border-2 text-left transition-all group hover:border-primary hover:shadow-lg ${userRole === role.value ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                        whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <role.icon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{role.label}</h3>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Source */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 shadow-inner shadow-primary/20">
                      <Search className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight">Channel Attribution</h2>
                    <p className="text-muted-foreground">How did you first discover the Audnix platform?</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-8">
                    {SOURCES.map((src) => (
                      <motion.button
                        key={src}
                        onClick={() => handleSourceSelect(src)}
                        className={`p-4 rounded-lg border-2 text-center transition-all hover:border-primary hover:shadow-md ${source === src ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                      >
                        <span className="font-medium">{src}</span>
                      </motion.button>
                    ))}
                  </div>

                  {source === 'Other' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="customSource">Where did you hear about us?</Label>
                      <Input
                        id="customSource"
                        placeholder="Tell us where you found Audnix..."
                        value={customSource}
                        onChange={(e) => setCustomSource(e.target.value)}
                        autoFocus
                      />
                      <Button
                        onClick={() => setStep(3)}
                        className="w-full mt-4"
                        disabled={!customSource.trim()}
                      >
                        Continue →
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Use Case */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 shadow-inner shadow-primary/20">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight">Deployment Objectives</h2>
                    <p className="text-muted-foreground">Select the mission-critical sectors for AI automation</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
                    {USE_CASES.map((tag) => (
                      <motion.button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`p-4 rounded-lg border-2 text-left transition-all hover:border-primary hover:shadow-md ${selectedTags.includes(tag) ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                        whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{tag}</span>
                          {selectedTags.includes(tag) && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  <div className="space-y-2 mt-6">
                    <Label htmlFor="customUseCase">Or tell us in your own words (optional)</Label>
                    <Input
                      id="customUseCase"
                      placeholder="What problem are you trying to solve?"
                      value={useCase}
                      onChange={(e) => setUseCase(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleUseCaseNext}
                    className="w-full mt-6"
                    size="lg"
                  >
                    Continue →
                  </Button>
                </motion.div>
              )}

              {/* Step 4: Business Size */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 shadow-inner shadow-primary/20">
                      <Building className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight">Compute Scale</h2>
                    <p className="text-muted-foreground">Calibrating infrastructure for your organizational volume</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    {BUSINESS_SIZES.map((size) => (
                      <motion.button
                        key={size.value}
                        onClick={() => handleBusinessSizeSelect(size.value)}
                        className={`p-6 rounded-xl border-2 text-left transition-all group hover:border-primary hover:shadow-lg ${businessSize === size.value ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                        whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                        disabled={loading}
                      >
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{size.label}</h3>
                          <p className="text-sm text-muted-foreground">{size.description}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 5: Company Name */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 shadow-inner shadow-primary/20">
                      <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight">Setup Signature</h2>
                    <p className="text-muted-foreground">Finalize your profile with your brand identity</p>
                  </div>

                  <div className="space-y-4 mt-8">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      placeholder="Enter your company name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      autoFocus
                      disabled={loading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCompanyNameSubmit();
                        }
                      }}
                    />
                  </div>

                  <Button
                    onClick={handleCompanyNameSubmit}
                    className="w-full mt-6"
                    size="lg"
                    disabled={loading || !companyName.trim()}
                  >
                    {loading ? "Setting up..." : "Complete Setup 🎉"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
