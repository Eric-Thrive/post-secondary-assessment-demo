import React, { useEffect } from "react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useUnifiedRouting } from "@/hooks/useUnifiedRouting";
import {
  UserRole,
  ModuleType,
  RouteProtectionConfig,
} from "@/types/unified-auth";
import { Loader2, Shield, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import UnifiedLoginPage from "./UnifiedLoginPage";

interface AuthenticationGuardProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  allowedRoles?: UserRole[];
  allowedModules?: ModuleType[];
  redirectOnUnauthorized?: string;
  fallbackComponent?: React.ComponentType;
}

const AuthenticationGuard: React.FC<AuthenticationGuardProps> = ({
  children,
  requiresAuth = true,
  allowedRoles,
  allowedModules,
  redirectOnUnauthorized,
  fallbackComponent: FallbackComponent,
}) => {
  const {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isDemoUser,
    getUserModules,
  } = useUnifiedAuth();

  const { handleUnauthorizedAccess, isRouteAccessible, canAccessModule } =
    useUnifiedRouting();

  // Handle unauthorized access on mount and when auth state changes
  useEffect(() => {
    if (!isLoading && requiresAuth && !isAuthenticated) {
      handleUnauthorizedAccess(redirectOnUnauthorized);
    }
  }, [
    isLoading,
    requiresAuth,
    isAuthenticated,
    handleUnauthorizedAccess,
    redirectOnUnauthorized,
  ]);

  // Show loading spinner while checking auth status
  if (requiresAuth && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, show login form
  if (requiresAuth && !isAuthenticated) {
    return <UnifiedLoginPage />;
  }

  // If user is authenticated, check role and module permissions
  if (isAuthenticated && user) {
    // Check role-based access
    if (allowedRoles && allowedRoles.length > 0) {
      const hasRequiredRole = allowedRoles.includes(user.role);

      if (!hasRequiredRole) {
        return (
          <UnauthorizedAccess
            reason="insufficient_role"
            userRole={user.role}
            requiredRoles={allowedRoles}
            isAdmin={isAdmin()}
            isDemoUser={isDemoUser()}
            onContactSupport={() => {
              // Handle contact support action
              window.location.href = "mailto:support@thrive.com";
            }}
            onUpgrade={() => {
              // Handle upgrade action for demo users
              if (isDemoUser()) {
                window.location.href = "/upgrade";
              }
            }}
          />
        );
      }
    }

    // Check module-based access
    if (allowedModules && allowedModules.length > 0) {
      const hasModuleAccess = allowedModules.some((module) =>
        canAccessModule(module)
      );

      if (!hasModuleAccess) {
        return (
          <UnauthorizedAccess
            reason="insufficient_module_access"
            userRole={user.role}
            requiredModules={allowedModules}
            userModules={getUserModules().map((m) => m.moduleType)}
            isAdmin={isAdmin()}
            isDemoUser={isDemoUser()}
            onContactSupport={() => {
              window.location.href = "mailto:support@thrive.com";
            }}
            onUpgrade={() => {
              if (isDemoUser()) {
                window.location.href = "/upgrade";
              }
            }}
          />
        );
      }
    }

    // Check if route is accessible using the routing utility
    const routeAccessible = isRouteAccessible(
      allowedRoles?.map((role) => role.toString()),
      allowedModules
    );

    if (!routeAccessible) {
      return (
        <UnauthorizedAccess
          reason="route_not_accessible"
          userRole={user.role}
          requiredRoles={allowedRoles}
          requiredModules={allowedModules}
          isAdmin={isAdmin()}
          isDemoUser={isDemoUser()}
          onContactSupport={() => {
            window.location.href = "mailto:support@thrive.com";
          }}
          onUpgrade={() => {
            if (isDemoUser()) {
              window.location.href = "/upgrade";
            }
          }}
        />
      );
    }
  }

  // If all checks pass, render the protected content
  return <>{children}</>;
};

// Unauthorized Access Component
interface UnauthorizedAccessProps {
  reason:
    | "insufficient_role"
    | "insufficient_module_access"
    | "route_not_accessible";
  userRole: UserRole;
  requiredRoles?: UserRole[];
  requiredModules?: ModuleType[];
  userModules?: ModuleType[];
  isAdmin: boolean;
  isDemoUser: boolean;
  onContactSupport: () => void;
  onUpgrade: () => void;
}

const UnauthorizedAccess: React.FC<UnauthorizedAccessProps> = ({
  reason,
  userRole,
  requiredRoles,
  requiredModules,
  userModules,
  isAdmin,
  isDemoUser,
  onContactSupport,
  onUpgrade,
}) => {
  const getErrorMessage = () => {
    switch (reason) {
      case "insufficient_role":
        return {
          title: "Access Denied - Insufficient Permissions",
          description: `Your current role (${userRole}) does not have permission to access this area. Required roles: ${requiredRoles?.join(
            ", "
          )}.`,
        };
      case "insufficient_module_access":
        return {
          title: "Access Denied - Module Access Required",
          description: `You don't have access to the required modules. Required: ${requiredModules?.join(
            ", "
          )}. Your access: ${userModules?.join(", ") || "None"}.`,
        };
      case "route_not_accessible":
        return {
          title: "Access Denied - Route Not Accessible",
          description:
            "You do not have permission to access this page with your current role and module assignments.",
        };
      default:
        return {
          title: "Access Denied",
          description: "You do not have permission to access this area.",
        };
    }
  };

  const { title, description } = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {isDemoUser
              ? "Demo accounts have limited access. Upgrade to a full account for complete access."
              : "If you believe this is an error, please contact your administrator or support team."}
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {isDemoUser && (
            <Button
              onClick={onUpgrade}
              className="w-full"
              data-testid="button-upgrade-account"
            >
              Upgrade Account
            </Button>
          )}

          <Button
            onClick={onContactSupport}
            variant="outline"
            className="w-full"
            data-testid="button-contact-support"
          >
            Contact Support
          </Button>

          <Button
            onClick={() => window.history.back()}
            variant="ghost"
            className="w-full"
            data-testid="button-go-back"
          >
            Go Back
          </Button>
        </div>

        {/* Debug information for admins */}
        {isAdmin && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Debug Information
            </h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div>User Role: {userRole}</div>
              {requiredRoles && (
                <div>Required Roles: {requiredRoles.join(", ")}</div>
              )}
              {requiredModules && (
                <div>Required Modules: {requiredModules.join(", ")}</div>
              )}
              {userModules && <div>User Modules: {userModules.join(", ")}</div>}
              <div>Reason: {reason}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Higher-order component version for easier usage
export const withAuthenticationGuard = (
  WrappedComponent: React.ComponentType<any>,
  config: RouteProtectionConfig
) => {
  const GuardedComponent: React.FC<any> = (props) => (
    <AuthenticationGuard
      requiresAuth={config.requiresAuth}
      allowedRoles={config.allowedRoles}
      allowedModules={config.allowedModules}
      redirectOnUnauthorized={config.redirectOnUnauthorized}
    >
      <WrappedComponent {...props} />
    </AuthenticationGuard>
  );

  GuardedComponent.displayName = `withAuthenticationGuard(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return GuardedComponent;
};

export default AuthenticationGuard;
