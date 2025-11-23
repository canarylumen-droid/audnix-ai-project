import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Shield, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

  // Signup flow: 1 = Email+Password, 2 = OTP, 3 = Success
  const [signupStep, setSignupStep] = useState(1);
  const [isLogin, setIsLogin] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

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
    try {
      const response = await fetch('/api/user/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Login Failed",
          description: data.error,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Welcome back!",
        description: "Redirecting to dashboard...",
      });

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "Failed to login",
        variant: "destructive",
      });
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
    try {
      const response = await fetch('/api/user/auth/signup/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Failed",
          description: data.error,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Check Your Email! 📧",
        description: "We sent you a 6-digit OTP code",
      });

      setSignupStep(2);
      setResendCountdown(60);
      setLoading(false);
    } catch (error: any) {
      console.error("Signup step 1 error:", error);
      toast({
        title: "Error",
        description: "Failed to send OTP",
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

      toast({
        title: "Account Created! 🎉",
        description: "Welcome to Audnix AI",
      });

      setSignupStep(3);
      setTimeout(() => {
        window.location.href = '/dashboard/onboarding';
      }, 2000);
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

  const handleResendOTP = async () => {
    if (resendCountdown > 0) return;
    setResendCountdown(60);
    await handleSignupStep1();
  };

  return (
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

      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <CardContent className="p-8">
            {/* SIGNUP SUCCESS */}
            {signupStep === 3 ? (
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
            ) : (
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
                        : 'Enter verification code'
                    }
                  </p>
                </div>

                {/* SIGNUP STEP 1 or LOGIN */}
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
                      {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Send OTP'}
                    </Button>
                  </div>
                )}

                {/* SIGNUP STEP 2: OTP */}
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
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-white/50">
          <p>🔒 Your data is encrypted and secure</p>
        </div>
      </div>
    </div>
  );
}
