import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AuthGuardProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  role: "user" | "admin";
  plan?: string;
  [key: string]: any;
}

/**
 * AuthGuard: Enforces authentication and optional role-based access
 * - Regular users: redirects to /auth if not logged in
 * - Admin users: requires role === 'admin', redirects to /auth if not admin
 */
export function AuthGuard({ children, adminOnly = false }: AuthGuardProps) {
  const [, setLocation] = useLocation();

  const { data: user, isLoading, error } = useQuery<AuthUser>({
    queryKey: ["/api/user/profile"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes cache sharing
  });

  useEffect(() => {
    if (!isLoading) {
      if (error || !user) {
        console.log("🔓 Not authenticated - redirecting to /auth");
        setLocation("/auth");
        return;
      }

      if (adminOnly && user.role !== "admin") {
        console.warn(`⛔ User is not admin (role: ${user.role}), redirecting to /auth`);
        setLocation("/auth");
      }
    }
  }, [user, isLoading, error, adminOnly, setLocation]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={() => { }}>
        <DialogContent className="sm:max-w-md border-0">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-white/70">Verifying access...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If authenticated (and admin check passed if required), show content
  if (user && (!adminOnly || user.role === "admin")) {
    return <>{children}</>;
  }

  // Fallback
  return null;
}
