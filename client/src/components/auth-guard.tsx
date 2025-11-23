import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * ProtectedRoute: Checks if user is authenticated before rendering dashboard
 * Redirects to /auth if not logged in
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to fetch user profile - if it fails, user is not authenticated
        const response = await fetch("/api/user/profile", {
          credentials: "include",
        });

        if (response.ok) {
          // User is authenticated
          setIsAuthenticated(true);
          setIsChecking(false);
        } else if (response.status === 401) {
          // Not authenticated - redirect to auth
          console.log("❌ Not authenticated - redirecting to /auth");
          setLocation("/auth");
        } else {
          // Other error - still block access
          console.error("Auth check failed with status:", response.status);
          setLocation("/auth");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setLocation("/auth");
      }
    };

    checkAuth();
  }, [setLocation]);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <Dialog open={true}>
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

  // If authenticated, show the protected content
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // This shouldn't happen - but just in case
  return null;
}
