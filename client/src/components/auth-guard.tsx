import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  role: "user" | "admin";
  plan?: string;
}

/**
 * AuthGuard: Enforces authentication and optional role-based access
 * - Regular users: redirects to /auth if not logged in
 * - Admin users: requires role === 'admin', redirects to /auth if not admin
 */
export function AuthGuard({ children, adminOnly = false }: AuthGuardProps) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/user/profile", {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.log("🔓 Not authenticated - redirecting to /auth");
            setLocation("/auth");
          } else {
            console.error(`Auth check failed: ${response.status}`);
            setLocation("/auth");
          }
          setIsChecking(false);
          return;
        }

        const user: AuthUser = await response.json();

        // If admin-only route, check role
        if (adminOnly) {
          if (user.role !== "admin") {
            console.warn(`⛔ User is not admin (role: ${user.role}), redirecting to /auth`);
            setLocation("/auth");
            setIsChecking(false);
            return;
          }
        }

        setIsAuthenticated(true);
        setIsChecking(false);
      } catch (error) {
        console.error("Auth check error:", error);
        setLocation("/auth");
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [setLocation, adminOnly]);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
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
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Fallback - this shouldn't happen but just in case
  return null;
}
