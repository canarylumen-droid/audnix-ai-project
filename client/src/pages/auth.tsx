import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiGoogle, SiApple } from "react-icons/si";
import { Check, Shield, Clock, Zap, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useReducedMotion } from "@/lib/animation-utils";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();

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

  const handleAppleLogin = async () => {
    setLoading('apple');

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
        provider: 'apple',
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
      console.error("Apple OAuth error:", error);
      toast({
        title: "Error",
        description: "Failed to initiate Apple sign-in",
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    className="w-full h-14 text-base font-semibold group relative overflow-hidden bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30 text-white"
                    variant="outline"
                    onClick={handleAppleLogin}
                    disabled={loading !== null}
                    data-testid="button-apple-login"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={false}
                    />
                    <SiApple className="w-5 h-5 mr-3 relative z-10 text-white" />
                    <span className="relative z-10 text-white">
                      {loading === 'apple' ? 'Connecting...' : 'Continue with Apple'}
                    </span>
                  </Button>
                </motion.div>

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
  );
}
