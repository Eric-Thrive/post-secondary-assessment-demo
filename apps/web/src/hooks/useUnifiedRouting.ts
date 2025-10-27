import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@/contexts/NavigationContext";
import {
  getPostLoginRoute,
  hasModuleAccess,
  shouldShowDashboard,
  getLoginRedirectPath,
} from "@/utils/routing";
import { ModuleType } from "@/types/unified-auth";
import { getModuleHomeRoute, AUTH_ROUTES } from "@/config/routes";
import { adaptLegacyUser, isLegacyUser } from "@/utils/auth-adapter";

export const useUnifiedRouting = () => {
  const navigate = useNavigate();
  const { user: legacyUser, isAuthenticated } = useAuth();
  const { setRedirectAfterLogin, clearRedirect, navigationState } =
    useNavigation();

  // Convert legacy user to AuthenticatedUser format
  const user = useMemo(() => {
    if (!legacyUser) return null;
    if (isLegacyUser(legacyUser)) {
      return adaptLegacyUser(legacyUser);
    }
    return legacyUser;
  }, [legacyUser]);

  // Navigate to appropriate route after successful login
  const handlePostLoginNavigation = useCallback(() => {
    if (!user) return;

    const redirectPath = navigationState.redirectAfterLogin;
    clearRedirect();

    if (redirectPath) {
      navigate(redirectPath, { replace: true });
    } else {
      const defaultRoute = getPostLoginRoute(user);
      navigate(defaultRoute, { replace: true });
    }
  }, [user, navigate, navigationState.redirectAfterLogin, clearRedirect]);

  // Navigate to a specific module
  const navigateToModule = useCallback(
    (moduleType: ModuleType) => {
      if (!user || !hasModuleAccess(user, moduleType)) {
        console.warn(`User does not have access to module: ${moduleType}`);
        return;
      }

      const moduleRoute = getModuleHomeRoute(moduleType);
      navigate(moduleRoute);
    },
    [user, navigate]
  );

  // Navigate to dashboard
  const navigateToDashboard = useCallback(() => {
    if (!user) return;

    if (shouldShowDashboard(user)) {
      navigate(AUTH_ROUTES.DASHBOARD);
    } else {
      // If user shouldn't see dashboard, redirect to their default module
      const defaultRoute = getPostLoginRoute(user);
      navigate(defaultRoute);
    }
  }, [user, navigate]);

  // Handle unauthorized access
  const handleUnauthorizedAccess = useCallback(
    (intendedPath?: string) => {
      if (!isAuthenticated) {
        const redirectPath = intendedPath || getLoginRedirectPath();
        setRedirectAfterLogin(redirectPath);
        navigate(AUTH_ROUTES.LOGIN, { replace: true });
      }
    },
    [isAuthenticated, navigate, setRedirectAfterLogin]
  );

  // Check if current route is accessible
  const isRouteAccessible = useCallback(
    (requiredRoles?: string[], requiredModules?: ModuleType[]): boolean => {
      if (!user) return false;

      // Check role requirements
      if (requiredRoles && !requiredRoles.includes(user.role)) {
        return false;
      }

      // Check module requirements
      if (
        requiredModules &&
        !requiredModules.some((module) => hasModuleAccess(user, module))
      ) {
        return false;
      }

      return true;
    },
    [user]
  );

  return {
    handlePostLoginNavigation,
    navigateToModule,
    navigateToDashboard,
    handleUnauthorizedAccess,
    isRouteAccessible,
    canAccessModule: (moduleType: ModuleType) =>
      user ? hasModuleAccess(user, moduleType) : false,
    shouldShowDashboard: user ? shouldShowDashboard(user) : false,
  };
};
