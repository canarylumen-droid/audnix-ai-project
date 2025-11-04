import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiGoogle, SiGithub } from "react-icons/si";
import { Check, Shield, Clock, Zap, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import { useReducedMotion } from "@/lib/animation-utils";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
  const [showSecurityNotice, setShowSecurityNotice] = useState(false);
  const [hasAcknowledgedSecurity, setHasAcknowledgedSecurity] = useState(false);
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const prefersReducedMotion = useReducedMotion();


  // Check if user has acknowledged security notice
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

  // Redirect if already logged in and acknowledged
  if (user && hasAcknowledgedSecurity) {
    return null;
  }

  const handleGoogleLogin = async () => {
    setLoading('google');

    if (!isSupabaseConfigured() || !supabase) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue. Authentication service is not available in demo mode.",
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
          title: "Authentication Error",
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

  // Apple OAuth removed - using Google and GitHub only

  const handleEmailLogin = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading('email' as any);

    if (!isSupabaseConfigured() || !supabase) {
      toast({
        title: "Authentication Required",
        description: "Please configure Supabase to enable authentication.",
        variant: "destructive",
      });
      setLoading(null);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
        setLoading(null);
      } else {
        toast({
          title: "Check Your Email! 📧",
          description: "We sent you a magic link. Click it to sign in instantly.",
        });
        setLoading(null);
      }
    } catch (error) {
      console.error("Email OTP error:", error);
      toast({
        title: "Error",
        description: "Failed to send magic link",
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  const handleWhatsAppLogin = async () => {
    if (!email) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number (e.g., +1234567890)",
        variant: "destructive",
      });
      return;
    }

    setLoading('whatsapp' as any);

    if (!isSupabaseConfigured() || !supabase) {
      toast({
        title: "Authentication Required",
        description: "Please configure Supabase to enable authentication.",
        variant: "destructive",
      });
      setLoading(null);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: email, // Using email field for phone input
        options: {
          channel: 'whatsapp',
        },
      });

      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
        setLoading(null);
      } else {
        toast({
          title: "Check WhatsApp! 💬",
          description: "We sent you a code via WhatsApp. Enter it to sign in.",
        });
        setLoading(null);
      }
    } catch (error) {
      console.error("WhatsApp OTP error:", error);
      toast({
        title: "Error",
        description: "Failed to send WhatsApp code",
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
                  <Zap className="w-4 h-4 text-primary" />
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
                  <CardDescription className="text-white/70 text-base">
                    Sign up in seconds. <span className="text-primary font-semibold">No credit card required.</span>
                  </CardDescription>
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
                      data-testid="button-google-login"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={false}
                      />
                      <SiGoogle className="w-5 h-5 mr-3 relative z-10 text-white" />
                      <span className="relative z-10 text-white">
                        {loading === 'google' ? 'Connecting...' : 'Continue with Google'}
                      </span>
                    </Button>
                  </motion.div>

                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="relative">
                      <input
                        type={isSignUp ? "email" : "text"}
                        placeholder={isSignUp ? "Enter your email" : "Email or +1234567890"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-primary"
                      />
                    </div>
                    
                    <Button
                      className="w-full h-14 text-base font-semibold group relative overflow-hidden bg-primary hover:bg-primary/90 text-white"
                      onClick={handleEmailLogin}
                      disabled={loading !== null || !email}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={false}
                      />
                      <span className="relative z-10">
                        {loading === 'email' ? 'Sending...' : '✨ Get Magic Link via Email'}
                      </span>
                    </Button>

                    <Button
                      className="w-full h-14 text-base font-semibold group relative overflow-hidden bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleWhatsAppLogin}
                      disabled={loading !== null || !email}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={false}
                      />
                      <span className="relative z-10">
                        {loading === 'whatsapp' ? 'Sending...' : '💬 Get Code via WhatsApp'}
                      </span>
                    </Button>
                  </motion.div>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#0a0f1f] px-2 text-white/50">Or continue with</span>
                    </div>
                  </div>

                  {/* Mobile benefits */}
                  <div className="lg:hidden pt-6 space-y-3">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-white/70">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{benefit.text}</span>
                      </div>
                    ))}
                  </div>

                  <motion.div
                    className="text-center text-sm text-white/50 pt-6 border-t border-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <p>
                      By continuing, you agree to our{' '}
                      <a href="#" className="text-primary hover:underline">Terms</a>
                      {' '}and{' '}
                      <a href="#" className="text-primary hover:underline">Privacy Policy</a>
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
                  ← Back to home
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}