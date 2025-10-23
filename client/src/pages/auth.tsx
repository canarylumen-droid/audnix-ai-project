import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiGoogle, SiApple } from "react-icons/si";
import { useState } from "react";
import { useLocation } from "wouter";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setLoading('google');

    if (!isSupabaseConfigured() || !supabase) {
      toast({
        title: "Demo Mode",
        description: "Supabase is not configured. Redirecting to dashboard...",
        variant: "default",
      });
      
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1500);
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
        title: "Demo Mode",
        description: "Supabase is not configured. Redirecting to dashboard...",
        variant: "default",
      });
      
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1500);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f1f] to-[#020409] text-white flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="glass-card">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold">Welcome to Audnix</CardTitle>
            <CardDescription className="text-white/70 text-base">
              No card required. Start your 3-day free trial.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full h-12 text-base"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={loading !== null}
              data-testid="button-google-login"
            >
              <SiGoogle className="w-5 h-5 mr-2" />
              {loading === 'google' ? 'Connecting...' : 'Continue with Google'}
            </Button>

            <Button
              className="w-full h-12 text-base"
              variant="outline"
              onClick={handleAppleLogin}
              disabled={loading !== null}
              data-testid="button-apple-login"
            >
              <SiApple className="w-5 h-5 mr-2" />
              {loading === 'apple' ? 'Connecting...' : 'Continue with Apple'}
            </Button>

            <div className="text-center text-sm text-white/50 pt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <a href="/" className="text-white/60 hover:text-white transition-colors text-sm">
            ← Back to home
          </a>
        </div>
      </motion.div>
    </div>
  );
}
