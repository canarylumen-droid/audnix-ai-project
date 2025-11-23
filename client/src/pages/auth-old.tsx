
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SiGoogle } from "react-icons/si";
import { Check, Shield, Clock, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Lock, CheckCircle2 } from "lucide-react";
import { useReducedMotion } from "@/lib/animation-utils";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showSecurityNotice, setShowSecurityNotice] = useState(false);
  const [hasAcknowledgedSecurity, setHasAcknowledgedSecurity] = useState(false);
  const [loading, setLoading] = useState<'google' | 'email' | 'verify' | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (user && !hasAcknowledgedSecurity) {
      const acknowledged = localStorage.getItem("security_acknowledged");
      if (acknowledged) {
        setHasAcknowledgedSecurity(true);
        setLocation("/dashboard");
      } else {
        setShowSecurityNotice(true);
      }
    }
  }, [user, hasAcknowledgedSecurity, setLocation]);

  const handleSecurityAcknowledge = () => {
    localStorage.setItem("security_acknowledged", "true");
    setHasAcknowledgedSecurity(true);
    setShowSecurityNotice(false);
    setLocation("/dashboard");
  };

  if (user && hasAcknowledgedSecurity) {
    return null;
  }

  const handleGoogleLogin = async () => {
    setLoading('google');

    if (!supabase) {
      toast({
        title: "Authentication Error",
        description: "Unable to connect to authentication service. Please try again.",
        variant: "destructive",
      });
      setLoading(null);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        toast({
          title: "Google Sign-In Failed",
          description: error.message,
          variant: "destructive",
        });
        setLoading(null);
      }
    } catch (error) {
      console.error("Google OAuth error:", error);
      toast({
        title: "Error",
        description: "Failed to initiate Google sign-in",
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading('email');

    if (!supabase) {
      toast({
        title: "Authentication Error",
        description: "Unable to connect to authentication service. Please try again.",
        variant: "destructive",
      });
      setLoading(null);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        toast({
          title: "Failed to Send Code",
          description: error.message,
          variant: "destructive",
        });
        setLoading(null);
      } else {
        setShowOtpInput(true);
        setLoading(null);
        toast({
          title: "Check Your Email! 📧",
          description: "We sent you a 6-digit code. Enter it below to sign in.",
        });
      }
    } catch (error) {
      console.error("Email OTP error:", error);
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code from your email",
        variant: "destructive",
      });
      return;
    }

    setLoading('verify');

    if (!supabase) {
      toast({
        title: "Authentication Error",
        description: "Unable to verify code. Please try again.",
        variant: "destructive",
      });
      setLoading(null);
      return;
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: 'email',
      });

      if (error) {
        toast({
          title: "Invalid Code",
          description: error.message,
          variant: "destructive",
        });
        setLoading(null);
      } else {
        toast({
          title: "Success! 🎉",
          description: "You're signed in. Redirecting...",
        });
        // User will be redirected automatically
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast({
        title: "Error",
        description: "Failed to verify code",
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  const benefits = [
    {
      icon: Sparkles,
      text: "AI-powered follow-ups that convert",
    },
    {
      icon: Clock,
      text: "5-minute setup, no technical skills needed",
    },
    {
      icon: Shield,
      text: "Enterprise-grade security & privacy",
    },
  ];

  return (
    <>
      <Dialog open={showSecurityNotice} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Your Data is Secure</DialogTitle>
                <DialogDescription className="text-base mt-2">
                  End-to-End Encryption Protection
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
              <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">AES-256-GCM Encryption</p>
                <p className="text-muted-foreground mt-1">
                  All your credentials and chat sessions are encrypted end-to-end. Even we cannot access your data.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Your Privacy Matters</p>
                <p className="text-muted-foreground mt-1">
                  Instagram passwords, WhatsApp sessions, and all messages are encrypted before storage. Your data is completely private and secure.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Bank-Level Security</p>
                <p className="text-muted-foreground mt-1">
                  Even if our database is compromised, your credentials remain safe with military-grade encryption.
                </p>
              </div>
            </div>
          </div>
          <Button onClick={handleSecurityAcknowledge} className="w-full" size="lg">
            Got it! Start Automating →
          </Button>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gradient-to-b from-[#0a0f1f] to-[#020409] text-white flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/30 rounded-full blur-3xl"
            animate={prefersReducedMotion ? {} : {
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={prefersReducedMotion ? {} : {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl"
            animate={prefersReducedMotion ? {} : {
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={prefersReducedMotion ? {} : {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Benefits */}
            <motion.div
              className="space-y-8 lg:pr-12 hidden lg:block"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6 }}
            >
              <div>
                <motion.div
                  className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm text-white/90">Start your 3-day free trial</span>
                </motion.div>

                <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
                    Transform leads into customers
                  </span>
                </h1>
                <p className="text-xl text-white/90 leading-relaxed">
                  Join creators who close deals on autopilot with AI-powered follow-ups across Instagram, WhatsApp & Email.
                </p>
              </div>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-3 group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-primary/40 transition-all duration-300">
                      <benefit.icon className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="text-white/95 font-medium group-hover:text-white transition-colors">{benefit.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="glass-card p-6 rounded-2xl border-primary/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm italic">
                      "Audnix turned my Instagram DMs into a revenue machine. I'm closing deals while I sleep."
                    </p>
                    <p className="text-white/50 text-xs mt-2">— Sarah K., Content Creator</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right side - Auth Card */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.2 }}
            >
              <Card className="glass-card border-primary/20 shadow-2xl shadow-primary/10">
                <CardHeader className="text-center space-y-3 pb-6">
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <CardTitle className="text-3xl font-bold">
                      Welcome to <span className="text-primary">Audnix</span>
                    </CardTitle>
                  </motion.div>
                  <CardDescription className="text-white/90 text-base leading-relaxed">
                    Your AI sales rep that follows up + books meetings while you sleep.
                  </CardDescription>
                  <p className="text-xs text-white/60 pt-1">
                    (5 minutes. Zero setup. No credit card.)
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      className="w-full h-14 text-base font-semibold group relative overflow-hidden bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30 text-white"
                      variant="outline"
                      onClick={handleGoogleLogin}
                      disabled={loading !== null}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={false}
                      />
                      <SiGoogle className="w-5 h-5 mr-3 relative z-10 text-white" />
                      <span className="relative z-10 text-white">
                        {loading === 'google' ? 'Connecting...' : 'Sign in with Google'}
                      </span>
                    </Button>
                  </motion.div>

                  {/* Value props - You get: */}
                  <div className="pt-4 pb-2">
                    <p className="text-sm text-white/70 font-semibold mb-3">
                      You get:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-white/90">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Instant DM + email follow-ups</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/90">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Auto-booking to your calendar</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/90">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Smart lead scoring</span>
                      </div>
                    </div>
                    <p className="text-center text-white/90 font-bold mt-6 text-base">
                      Stop letting money rot in your inbox.
                    </p>
                  </div>

                  <motion.div
                    className="text-center text-sm text-white/50 pt-6 border-t border-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <p>
                      By continuing, you accept our{' '}
                      <a href="/terms-of-service" className="text-primary hover:underline">Terms</a>
                      {' '}+{' '}
                      <a href="/privacy-policy" className="text-primary hover:underline">Privacy</a>
                    </p>
                  </motion.div>
                </CardContent>
              </Card>

              <motion.div
                className="text-center mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <a href="/" className="text-white/60 hover:text-white transition-colors text-sm inline-flex items-center gap-2">
                  Rather keep losing leads?<br />Back to home →
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
