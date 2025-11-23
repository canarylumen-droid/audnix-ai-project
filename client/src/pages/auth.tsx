import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiGoogle } from "react-icons/si";
import { Check, Shield, Clock, Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { useReducedMotion } from "@/lib/animation-utils";
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";

const options = {
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  translations: zxcvbnEnPackage.translations,
};
zxcvbnOptions.setOptions(options);

type AuthMode = 'social' | 'email-password' | 'email-otp';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const [authMode, setAuthMode] = useState<AuthMode>('email-otp');
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecurityNotice, setShowSecurityNotice] = useState(false);
  const [hasAcknowledgedSecurity, setHasAcknowledgedSecurity] = useState(false);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [loading, setLoading] = useState<'google' | 'email' | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const passwordStrength = password ? zxcvbn(password) : null;

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

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

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
        description: "Unable to connect to authentication service.",
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



  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading('email');
    console.log(`📧 Sending OTP to ${email}...`);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      const data = await response.json();
      console.log(`📍 Send OTP response:`, { status: response.status, data });

      if (!response.ok) {
        toast({
          title: "Failed to Send OTP",
          description: data.error || "Something went wrong",
          variant: "destructive",
        });
        setLoading(null);
        return;
      }

      toast({
        title: "Check Your Email! 📧",
        description: "We sent you a 6-digit code. Check your inbox (and spam folder).",
      });
      setSignupEmail(email);
      setOtpSent(true);
      setResendCountdown(60);
      setLoading(null);
    } catch (error) {
      console.error("❌ OTP send error:", error);
      toast({
        title: "Error",
        description: "Failed to send OTP code",
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  const handleVerifyOTP = async () => {
    if (!email || !otpCode) {
      toast({
        title: "Missing Information",
        description: "Please enter email and OTP code",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d{6}$/.test(otpCode)) {
      toast({
        title: "Invalid Code",
        description: "OTP code must be 6 digits",
        variant: "destructive",
      });
      return;
    }

    setLoading('email');
    console.log(`✅ Verifying OTP...`);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode }),
        credentials: 'include',
      });

      const data = await response.json();
      console.log(`📍 Verify OTP response:`, { status: response.status, data });

      if (!response.ok) {
        toast({
          title: "Verification Failed",
          description: data.error || "Invalid or expired code",
          variant: "destructive",
        });
        setLoading(null);
        return;
      }

      // Show username selection modal
      const suggestedUsername = signupEmail.split('@')[0];
      setUsername(suggestedUsername);
      setShowUsernameModal(true);
      setLoading(null);
    } catch (error) {
      console.error("❌ OTP verify error:", error);
      toast({
        title: "Error",
        description: "Failed to verify OTP",
        variant: "destructive",
      });
      setLoading(null);
    }
  };


  const handleCheckUsername = async (value: string) => {
    setUsername(value);
    setUsernameError("");

    if (!value.trim()) {
      setUsernameError("Username is required");
      return;
    }

    if (value.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      setUsernameError("Username can only contain letters, numbers, hyphens, and underscores");
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: value }),
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) {
        setUsernameError(data.error || "Username not available");
      } else {
        setUsernameError("");
      }
    } catch (error) {
      console.error("Username check error:", error);
      setUsernameError("Failed to check username availability");
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSetUsername = async () => {
    if (!username.trim() || usernameError) {
      toast({
        title: "Invalid Username",
        description: usernameError || "Please choose a valid username",
        variant: "destructive",
      });
      return;
    }

    setLoading('email');
    try {
      const response = await fetch('/api/auth/set-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to set username",
          variant: "destructive",
        });
        setLoading(null);
        return;
      }

      // Show success modal then redirect
      setShowUsernameModal(false);
      setShowSignupSuccess(true);

      setTimeout(() => {
        window.location.href = '/dashboard/onboarding';
      }, 2000);
    } catch (error) {
      console.error("Set username error:", error);
      toast({
        title: "Error",
        description: "Failed to set username",
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  const getPasswordStrengthColor = () => {
    if (!passwordStrength) return 'bg-gray-200';
    const score = passwordStrength.score;
    if (score === 0) return 'bg-red-500';
    if (score === 1) return 'bg-orange-500';
    if (score === 2) return 'bg-yellow-500';
    if (score === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (!passwordStrength) return '';
    const score = passwordStrength.score;
    if (score === 0) return 'Very Weak';
    if (score === 1) return 'Weak';
    if (score === 2) return 'Fair';
    if (score === 3) return 'Good';
    return 'Strong';
  };

  const handleResendOTP = async () => {
    if (resendCountdown > 0) return;
    setResendCountdown(60);
    await handleSendOTP();
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
      {/* Username Selection Modal */}
      <Dialog open={showUsernameModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Create Your Username</h2>
              <p className="text-white/70">Choose a unique username for your Audnix profile</p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="username" className="text-white/90">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username..."
                value={username}
                onChange={(e) => handleCheckUsername(e.target.value)}
                disabled={checkingUsername || loading !== null}
                className={`bg-white/5 border-white/10 text-white placeholder:text-white/40 ${
                  usernameError ? 'border-red-500/50' : ''
                }`}
              />
              {usernameError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400"
                >
                  {usernameError}
                </motion.p>
              )}
              {!usernameError && username && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-xs text-emerald-400"
                >
                  <Check className="h-4 w-4" />
                  Username available!
                </motion.div>
              )}
              <p className="text-xs text-white/50">
                Letters, numbers, hyphens and underscores only. 3+ characters.
              </p>
            </div>

            <Button
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
              onClick={handleSetUsername}
              disabled={!username || usernameError.length > 0 || checkingUsername || loading !== null}
            >
              {loading === 'email' ? 'Setting up...' : 'Continue to Dashboard'}
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Signup Success Modal */}
      <Dialog open={showSignupSuccess} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md border-0">
          <div className="flex flex-col items-center justify-center space-y-6 py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <Check className="h-10 w-10 text-emerald-400" />
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center space-y-2"
            >
              <h2 className="text-2xl font-bold text-white">Welcome to Audnix! 🎉</h2>
              <p className="text-white/70">Your account is all set up and ready to go.</p>
              <p className="text-sm text-white/50">Let's get your AI sales rep working...</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "100%" }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
            />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-xs text-white/50"
            >
              Redirecting to onboarding...
            </motion.p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Security Notice Modal */}
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
                  Instagram passwords, WhatsApp sessions, and all messages are encrypted before storage.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Bank-Level Security</p>
                <p className="text-muted-foreground mt-1">
                  Military-grade encryption keeps your credentials safe.
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
                  Join creators who close deals on autopilot with AI-powered follow-ups.
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
                  {(
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white/90">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                          disabled={loading !== null || (authMode === 'email-otp' && otpSent)}
                        />
                      </div>

                      {authMode === 'email-otp' && otpSent && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="otp-code" className="text-white/90">Verification Code</Label>
                            <Input
                              id="otp-code"
                              type="text"
                              placeholder="000000"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              maxLength={6}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 text-center text-lg tracking-widest font-mono"
                              disabled={loading !== null}
                              autoComplete="one-time-code"
                            />
                            <p className="text-xs text-white/60 text-center">Check your email for the 6-digit code</p>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                            <span className="text-xs text-white/70">Didn't receive the code?</span>
                            <button
                              onClick={handleResendOTP}
                              disabled={resendCountdown > 0 || loading !== null}
                              className="text-xs font-semibold text-primary hover:text-primary/80 disabled:text-white/40 disabled:cursor-not-allowed"
                            >
                              {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
                            </button>
                          </div>
                        </div>
                      )}

                      {authMode === 'email-password' && (
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-white/90">Password</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 pr-10"
                              disabled={loading !== null}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>

                          {isSignUp && password && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-white/60">Password strength</span>
                                <span className={`font-medium ${
                                  passwordStrength && passwordStrength.score >= 3 ? 'text-green-400' : 'text-yellow-400'
                                }`}>
                                  {getPasswordStrengthText()}
                                </span>
                              </div>
                              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                                  style={{ width: `${passwordStrength ? (passwordStrength.score + 1) * 20 : 0}%` }}
                                />
                              </div>
                              {passwordStrength && passwordStrength.feedback.warning && (
                                <div className="flex items-start gap-2 text-xs text-yellow-400/80 mt-2">
                                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                  <span>{passwordStrength.feedback.warning}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <Button
                        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                        onClick={() => {
                          if (otpSent) {
                            handleVerifyOTP();
                          } else {
                            handleSendOTP();
                          }
                        }}
                        disabled={loading !== null}
                      >
                        {loading === 'email' ? 'Processing...' : otpSent ? 'Verify Code' : 'Send OTP'}
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-card text-white/50">Or continue with</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full h-12 text-base font-semibold border-white/20 text-white hover:bg-white/5"
                        onClick={handleGoogleLogin}
                        disabled={loading !== null}
                      >
                        <SiGoogle className="w-5 h-5 mr-2" />
                        {loading === 'google' ? 'Connecting...' : 'Google'}
                      </Button>

                      <div className="text-center">
                        <button
                          onClick={() => setIsSignUp(!isSignUp)}
                          className="text-sm text-white/70 hover:text-white/90 underline"
                        >
                          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Value props */}
                  {(
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
                  )}

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