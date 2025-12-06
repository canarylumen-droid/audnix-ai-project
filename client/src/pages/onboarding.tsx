import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface UserProfile {
  id: string;
  email: string;
  metadata?: {
    onboardingCompleted?: boolean;
  };
}

export function OnboardingPage() {
  const [, setLocation] = useLocation();

  const { data: user, isLoading, error } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading) {
      if (error || !user) {
        setLocation("/auth");
        return;
      }
      setLocation("/dashboard");
    }
  }, [user, isLoading, error, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d1428] to-[#1a2744] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mx-auto mb-4"></div>
        <p className="text-white/70">Loading your experience...</p>
      </div>
    </div>
  );
}

export default OnboardingPage;
