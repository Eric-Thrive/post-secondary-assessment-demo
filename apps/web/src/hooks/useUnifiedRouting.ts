import { useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@/contexts/NavigationContext";
import { unifiedRoutingService } from "@/services/routing/unified-routing-service";
import { ModuleType, AuthenticatedUser } from "@/types/unified-auth";
import { AUTH_ROUTES } from "@/config/routes";
import { adaptLegacyUser, isLegacyUser } from "@/utils/auth-adapter";

export const useUnifiedRouting = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: legacyUser, isAuthenticated } = useAuth();
  const { setRedirectAfterLogin, clearRedirect, navigationState } =
    useNavigation();

  // Convert legacy user to AuthenticatedUser format
  const user = useMemo((): AuthenticatedUser | null => {
    if (!legacyUser) return null;
    if (isLegacyUser(legacyUser)) {
      return adaptLegacyUser(legacyUser);
    }
    return legacyUser as AuthenticatedUser;
  }, [legacyUser]);

  // Navigate to appropriate route after successful login
  const handlePostLoginNavigation = useCallback(() => {
    if (!user) return;

    const redirectPath = navigationState.redirectAfterLogin;
    clearRedirect();

    if (redirectPath) {
      navigate(redirectPath, { replace: true });
    } else {
      const defaultRoute =
        unifiedRoutingService.handlePostLoginNavigation(user);
      navigate(defaultRoute, { replace: true });
    }
  }, [user, navigate, navigationState.redirectAfterLogin, clearRedirect]);

  // Navigate to a specific module
  const navigateToModule = useCallback(
    (moduleType: ModuleType) => {
      if (!user) {
        console.warn("User not authenticated");
        return;
      }

      try {
        const moduleRoute = unifiedRoutingService.navigateToModule(
          moduleType,
          user
        );
        navigate(moduleRoute);
      } catch (error) {
        console.warn(`User does not have access to module: ${moduleType}`);
      }
    },
    [user, navigate]
  );

  // Navigate to dashboard
  const navigateToDashboard = useCallback(() => {
    if (!user) return;

    const accessibleModules = user.moduleAccess.map(
      (access) => access.moduleType
    );

    if (accessibleModules.length > 1) {
      navigate(AUTH_ROUTES.DASHBOARD);
    } else {
      // If user has only one module, redirect to that module
      const defaultRoute =
        unifiedRoutingService.handlePostLoginNavigation(user);
      navigate(defaultRoute);
    }
  }, [user, navigate]);

  // Handle unauthorized access
  const handleUnauthorizedAccess = useCallback(
    (intendedPath?: string) => {
      if (!isAuthenticated) {
        const redirectPath = intendedPath || location.pathname;
        setRedirectAfterLogin(redirectPath);
        const loginRoute = unifiedRoutingService.getUnauthorizedRedirect(
          user,
          redirectPath
        );
        navigate(loginRoute, { replace: true });
      }
    },
    [isAuthenticated, navigate, setRedirectAfterLogin, location.pathname, user]
  );

  // Check if current route is accessible
  const isRouteAccessible = useCallback(
    (requiredRoles?: string[], requiredModules?: ModuleType[]): boolean => {
      if (!user) return false;

      return unifiedRoutingService.hasRouteAccess(
        user,
        location.pathname,
        requiredRoles as any,
        requiredModules
      );
    },
    [user, location.pathname]
  );

  // Get breadcrumbs for current route
  const getBreadcrumbs = useCallback(() => {
    if (!user) return [];
    return unifiedRoutingService.getBreadcrumbs(location.pathname, user);
  }, [user, location.pathname]);

  // Check if user can access a specific module
  const canAccessModule = useCallback(
    (moduleType: ModuleType): boolean => {
      if (!user) return false;
      return user.moduleAccess.some(
        (access) => access.moduleType === moduleType
      );
    },
    [user]
  );

  // Check if user should see dashboard
  const shouldShowDashboard = useCallback((): boolean => {
    if (!user) return false;
    return user.moduleAccess.length > 1;
  }, [user]);

  return {
    handlePostLoginNavigation,
    navigateToModule,
    navigateToDashboard,
    handleUnauthorizedAccess,
    isRouteAccessible,
    getBreadcrumbs,
    canAccessModule,
    shouldShowDashboard: shouldShowDashboard(),
    isLegacyRoute: (path: string) => unifiedRoutingService.isLegacyRoute(path),
    getLogoutRedirect: () => unifiedRoutingService.getLogoutRedirect(user),
  };
};
