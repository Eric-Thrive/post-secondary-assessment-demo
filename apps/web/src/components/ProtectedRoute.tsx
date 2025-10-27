import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm, { type LoginVariant } from "./LoginForm";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Default to post-secondary login variant since we no longer have environment-based routing
  const loginVariant: LoginVariant = "post-secondary";

  // Always require authentication in the simplified RBAC system
  const requiresAuth = true;

  // Show loading spinner while checking auth status
  if (requiresAuth && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, show login form
  if (requiresAuth && !isAuthenticated) {
    return <LoginForm variant={loginVariant} />;
  }

  // Otherwise, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
