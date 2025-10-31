import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

/**
 * ProtectedRoute - Navigation guard for authenticated routes
 * Ensures users are logged in and optionally have verified their email
 * Requirements: 8.1, 8.2
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireEmailVerification = true,
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check email verification if required
  if (requireEmailVerification) {
    const userWithEmail = user as any;

    // If emailVerified field exists and is false, redirect to verification pending
    if (userWithEmail.emailVerified === false) {
      return (
        <Navigate
          to="/verify-email-pending"
          state={{ email: userWithEmail.email }}
          replace
        />
      );
    }
  }

  // User is authenticated and verified (if required), render children
  return <>{children}</>;
};
