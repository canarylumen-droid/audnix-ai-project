import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Shield, Lock, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useToast } from "@/hooks/use-toast";
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

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();

  // Signup flow: 1 = Email+Password, 2 = OTP/Skip, 3 = Username, 4 = Success
  const [signupStep, setSignupStep] = useState(1);
  const [isLogin, setIsLogin] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [showRedirectPopup, setShowRedirectPopup] = useState(false);

  const passwordStrength = password ? zxcvbn(password) : null;

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

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

  // LOGIN
  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    let loginSuccess = false;

    try {
      const response = await fetch('/api/user/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      // Handle network errors
      if (!response) {
        throw new Error("No response from server");
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast({
          title: "Login Failed",
          description: data.error || "Invalid credentials",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      loginSuccess = true;

      // Verify session with retry logic
      let sessionVerified = false;
      let retries = 0;
      const maxRetries = 3;

      while (!sessionVerified && retries < maxRetries) {
        try {
          // Add small delay between retries
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 500 * retries));
          }

          const verifyResponse = await fetch('/api/user', {
            credentials: 'include',
          });

          if (verifyResponse.ok) {
            const userData = await verifyResponse.json();
            
            // Additional validation: ensure we got valid user data
            if (userData && userData.id) {
              sessionVerified = true;
              
              toast({
                title: "Welcome back!",
                description: "Redirecting to dashboard...",
              });

              // Brief delay to let toast show, then hard redirect
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 800);
              
              break;
            }
          }

          retries++;
        } catch (verifyError) {
          console.error(`Session verification attempt ${retries + 1} failed:`, verifyError);
          retries++;
        }
      }

      // If all retries failed but login was successful
      if (!sessionVerified && loginSuccess) {
        toast({
          title: "Almost there!",
          description: "Please refresh the page to continue",
        });
        setLoading(false);
        
        // Auto-refresh after 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // If login succeeded but verification failed, still allow manual refresh
      if (loginSuccess) {
        toast({
          title: "Login Successful",
          description: "Refresh the page to continue",
        });
      } else {
        toast({
          title: "Connection Error",
          description: "Please check your internet and try again",
          variant: "destructive",
        });
      }
      setLoading(false);
    }
  };

  // SIGNUP STEP 1: Email + Password
  const handleSignupStep1 = async () => {
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    let retryCount = 0;
    const maxRetries = 2;

    const attemptSendOTP = async (): Promise<boolean> => {
      try {
        console.log('📧 Sending OTP request to:', '/api/user/auth/signup/request-otp');
        const response = await fetch('/api/user/auth/signup/request-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        });

        if (!response) {
          throw new Error("No response from server");
        }

        console.log('✅ OTP Response Status:', response.status);
        const data = await response.json().catch(() => ({}));
        console.log('📨 OTP Response Data:', data);

        if (!response.ok) {
          console.error('❌ OTP Request Failed:', data);
          
          // Don't retry on validation errors
          if (response.status === 400 || response.status === 409) {
            toast({
              title: "Failed",
              description: data.error || data.reason || data.details || 'Could not send verification email',
              variant: "destructive",
            });
            return false;
          }
          
          throw new Error(data.error || 'Server error');
        }

        // OTP sent successfully
        setSignupStep(2);
        setResendCountdown(60);
        
        toast({
          title: "Check Your Email!",
          description: `OTP sent to ${email}`,
        });
        
        return true;
      } catch (error: any) {
        console.error('🚨 OTP Network Error:', error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          return attemptSendOTP();
        }
        
        throw error;
      }
    };

    try {
      await attemptSendOTP();
      setLoading(false);
    } catch (error: any) {
      console.error('Error message:', error.message);
      toast({
        title: "Connection Error",
        description: "Please check your internet and try again",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // SIGNUP STEP 2: Verify OTP
  const handleSignupStep2 = async () => {
    if (!otp || !/^\d{6}$/.test(otp)) {
      toast({
        title: "Invalid Code",
        description: "Please enter 6-digit OTP code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/auth/signup/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Verification Failed",
          description: data.error,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Move to username creation step
      setSignupStep(3);
      setLoading(false);
    } catch (error: any) {
      console.error("Signup step 2 error:", error);
      toast({
        title: "Error",
        description: "Failed to verify OTP",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // SIGNUP STEP 3: Set Username
  const handleSignupStep3 = async () => {
    if (!username || username.length < 3) {
      toast({
        title: "Invalid Username",
        description: "Username must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      toast({
        title: "Invalid Username",
        description: "Only letters, numbers, hyphens and underscores allowed",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    let accountCreated = false;

    try {
      const response = await fetch('/api/auth/set-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
        credentials: 'include',
      });

      if (!response) {
        throw new Error("No response from server");
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast({
          title: "Failed",
          description: data.error || 'Username already taken',
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      accountCreated = true;

      // Verify user session with retry logic
      let sessionVerified = false;
      let retries = 0;
      const maxRetries = 3;

      while (!sessionVerified && retries < maxRetries) {
        try {
          // Add small delay between retries
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 500 * retries));
          }

          const verifyResponse = await fetch('/api/user', {
            credentials: 'include',
          });

          if (verifyResponse.ok) {
            const userData = await verifyResponse.json();
            
            // Additional validation: ensure we got valid user data with username
            if (userData && userData.id && userData.username) {
              sessionVerified = true;
              
              const capitalizedName = username.charAt(0).toUpperCase() + username.slice(1);
              toast({
                title: "Welcome! 🎉",
                description: `Welcome ${capitalizedName}!`,
              });

              // Show success state briefly before redirect
              setSignupStep(4);
              
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 1500);
              
              break;
            }
          }

          retries++;
        } catch (verifyError) {
          console.error(`Session verification attempt ${retries + 1} failed:`, verifyError);
          retries++;
        }
      }

      // If all retries failed but account was created
      if (!sessionVerified && accountCreated) {
        setSignupStep(4);
        toast({
          title: "Account Created! 🎉",
          description: "Refresh the page to get started",
        });
        setLoading(false);
        
        // Auto-refresh after 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error: any) {
      console.error("Signup step 3 error:", error);
      
      // If account was created but verification failed, still guide user
      if (accountCreated) {
        setSignupStep(4);
        toast({
          title: "Account Created! 🎉",
          description: "Refresh the page to continue",
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        toast({
          title: "Connection Error",
          description: "Please check your internet and try again",
          variant: "destructive",
        });
      }
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCountdown > 0) return;
    setResendCountdown(60);
    await handleSignupStep1();
  };

  return (
    <>
      {/* Redirect Popup */}
      <Dialog open={showRedirectPopup} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md border-0" aria-describedby={undefined}>
          <VisuallyHidden>
            <DialogTitle>Setting up your account</DialogTitle>
          </VisuallyHidden>
          <motion.div
            className="flex flex-col items-center justify-center space-y-6 py-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary"
            />
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-white">Almost there...</h2>
              <p className="text-white/70">Setting up your account</p>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Success Popup */}
      <Dialog open={signupStep === 4} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md border-0" aria-describedby={undefined}>
          <VisuallyHidden>
            <DialogTitle>Account created successfully</DialogTitle>
          </VisuallyHidden>
          <motion.div
            className="flex flex-col items-center justify-center space-y-6 py-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="h-10 w-10 text-emerald-400" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Welcome! 🎉</h2>
              <p className="text-white/70">Your account is ready</p>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gradient-to-b from-[#0a0f1f] to-[#020409] text-white flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/30 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* LEFT SIDE: Sales Copy (Hidden on Mobile) */}
          <motion.div
            className="hidden lg:flex flex-col justify-center space-y-8"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Close Your First Deal
                </span>
              </h1>
              <p className="text-xl text-white/70 leading-relaxed">
                Join creators, coaches, and founders who are closing their first $1,000 deals in Week 1 with Audnix AI.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-1">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Smart Lead Follow-ups</h3>
                  <p className="text-white/60 text-sm">AI-powered messaging across Instagram, Email & more</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-1">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Zero Setup Required</h3>
                  <p className="text-white/60 text-sm">Connect your own email, Instagram & Calendly instantly</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-1">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">24/7 Sales Agent</h3>
                  <p className="text-white/60 text-sm">Never miss a lead again with personalized campaigns</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-1">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Privacy-First</h3>
                  <p className="text-white/60 text-sm">Your data stays in your control. No data selling.</p>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-sm text-white/50 mb-3">Trusted by:</p>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
                  Creators
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
                  Coaches
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
                  Agencies
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
                  Founders
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT SIDE: Auth Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardContent className="p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* HEADER */}
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold">
                    {isLogin ? 'Welcome Back' : 'Join Audnix'}
                  </h1>
                  <p className="text-white/70">
                    {isLogin 
                      ? 'Sign in to your account' 
                      : signupStep === 1 
                        ? 'Create your account'
                        : signupStep === 2
                          ? 'Enter verification code'
                          : 'Choose your username'
                    }
                  </p>
                </div>

                {/* STEP 1 or LOGIN */}
                {(signupStep === 1 || isLogin) && (
                  <div className="space-y-4">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/90">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white/90">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Password Strength (signup only) */}
                      {!isLogin && password && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-white/70">Strength:</span>
                            <span className={`${getPasswordStrengthColor()} bg-clip-text text-transparent`}>
                              {getPasswordStrengthText()}
                            </span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${getPasswordStrengthColor()}`}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${((passwordStrength?.score || 0) + 1) * 25}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Toggle Login/Signup */}
                    <div className="text-center text-sm text-white/70">
                      {isLogin ? (
                        <>
                          Don't have an account?{' '}
                          <button
                            onClick={() => {
                              setIsLogin(false);
                              setSignupStep(1);
                              setEmail("");
                              setPassword("");
                              setOtp("");
                              setUsername("");
                            }}
                            className="text-primary hover:text-primary/80 font-semibold"
                          >
                            Sign up
                          </button>
                        </>
                      ) : (
                        <>
                          Already have an account?{' '}
                          <button
                            onClick={() => {
                              setIsLogin(true);
                              setSignupStep(1);
                              setEmail("");
                              setPassword("");
                              setOtp("");
                              setUsername("");
                            }}
                            className="text-primary hover:text-primary/80 font-semibold"
                          >
                            Login
                          </button>
                        </>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={isLogin ? handleLogin : handleSignupStep1}
                      disabled={loading || !email || !password}
                      className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                    >
                      {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Continue'}
                    </Button>
                  </div>
                )}

                {/* STEP 2: OTP */}
                {signupStep === 2 && (
                  <div className="space-y-4">
                    {/* OTP Input */}
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-white/90">
                        6-Digit Code
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        disabled={loading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 text-center text-2xl tracking-widest"
                      />
                      <p className="text-xs text-white/50">
                        Check email: {email}
                      </p>
                    </div>

                    {/* Verify Button */}
                    <Button
                      onClick={handleSignupStep2}
                      disabled={loading || otp.length !== 6}
                      className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                    >
                      {loading ? 'Verifying...' : 'Verify Code'}
                    </Button>

                    {/* Resend */}
                    <div className="text-center">
                      <button
                        onClick={handleResendOTP}
                        disabled={resendCountdown > 0 || loading}
                        className="text-sm text-white/70 hover:text-white/90 disabled:text-white/40"
                      >
                        {resendCountdown > 0 
                          ? `Resend in ${resendCountdown}s`
                          : 'Resend Code'
                        }
                      </button>
                    </div>

                    {/* Back Button */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSignupStep(1);
                        setOtp("");
                      }}
                      className="w-full"
                      disabled={loading}
                    >
                      Back
                    </Button>
                  </div>
                )}

                {/* STEP 3: Username */}
                {signupStep === 3 && (
                  <div className="space-y-4">
                    {/* Username */}
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-white/90">
                        Username
                      </Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="your_username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      />
                      <p className="text-xs text-white/50">
                        Letters, numbers, hyphens and underscores. 3+ characters.
                      </p>
                    </div>

                    {/* Create Button */}
                    <Button
                      onClick={handleSignupStep3}
                      disabled={loading || !username || username.length < 3}
                      className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                    >
                      {loading ? 'Creating...' : 'Create Account'}
                    </Button>

                    {/* Back Button */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSignupStep(1);
                        setUsername("");
                      }}
                      className="w-full"
                      disabled={loading}
                    >
                      Back
                    </Button>
                  </div>
                )}
              </motion.div>
            </CardContent>
          </Card>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-white/50">
              <p>🔒 Your data is encrypted and secure</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
