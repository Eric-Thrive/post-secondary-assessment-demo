import { useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import { useUnifiedAuth } from "./useUnifiedAuth";
import { NavigationStateManager } from "@/services/navigation";
import { IntelligentRouter, RouteResolver } from "@/services/routing";
import { ModuleType, UserPreferences } from "@/types/unified-auth";

/**
 * Enhanced navigation hook that provides comprehensive navigation management
 * with state persistence, intelligent routing, and user preferences
 */
export const useEnhancedNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUnifiedAuth();
  const {
    navigationState,
    navigationHistory,
    setCurrentPath,
    setRedirectAfterLogin,
    setModuleContext,
    clearRedirect,
    addToHistory,
    getRecentPaths,
    canGoBack,
    getPreviousPath,
    saveUserPreferences,
    getUserPreferences,
    clearNavigationData,
  } = useNavigation();

  // Enhanced navigation with intelligent routing
  const navigateWithContext = useCallback(
    (
      path: string,
      options?: {
        replace?: boolean;
        preserveQuery?: boolean;
        moduleContext?: string;
        validateAccess?: boolean;
      }
    ) => {
      const {
        replace = false,
        preserveQuery = false,
        moduleContext,
        validateAccess = true,
      } = options || {};

      // Validate access if user is authenticated and validation is requested
      if (user && validateAccess) {
        const validation = RouteResolver.validateNavigation(
          user,
          location.pathname,
          path
        );

        if (!validation.allowed) {
          console.warn(`Navigation blocked: ${validation.reason}`);
          if (validation.alternativeRoute) {
            navigate(validation.alternativeRoute, { replace: true });
          }
          return false;
        }
      }

      // Preserve query parameters if requested
      const finalPath =
        preserveQuery && location.search ? `${path}${location.search}` : path;

      // Update navigation state
      setCurrentPath(finalPath);
      if (moduleContext) {
        setModuleContext(moduleContext);
      }

      // Navigate
      navigate(finalPath, { replace });
      return true;
    },
    [user, location, navigate, setCurrentPath, setModuleContext]
  );

  // Navigate to a specific module with validation
  const navigateToModule = useCallback(
    (moduleType: ModuleType) => {
      if (!user) return false;

      const moduleRoute = RouteResolver.resolveModuleRoute(user, moduleType);

      if (!moduleRoute.allowed) {
        console.warn(`Module access denied: ${moduleRoute.reason}`);
        return false;
      }

      // Save module context
      NavigationStateManager.setModuleContext(moduleType, {
        entryPoint: location.pathname,
        timestamp: new Date(),
      });

      return navigateWithContext(moduleRoute.route, {
        moduleContext: moduleType,
      });
    },
    [user, location.pathname, navigateWithContext]
  );

  // Navigate to dashboard with intelligent routing
  const navigateToDashboard = useCallback(() => {
    if (!user) return false;

    if (IntelligentRouter.shouldShowDashboard(user)) {
      return navigateWithContext("/dashboard");
    } else {
      // User should go directly to their primary module
      const primaryModule = IntelligentRouter.getPrimaryModule(user);
      if (primaryModule) {
        return navigateToModule(primaryModule);
      }
    }

    return false;
  }, [user, navigateWithContext, navigateToModule]);

  // Handle post-login navigation with context restoration
  const handlePostLoginNavigation = useCallback(() => {
    if (!user) return;

    // Check for redirect context
    const redirectContext = NavigationStateManager.getAndClearRedirectContext();

    if (
      redirectContext &&
      NavigationStateManager.isRedirectValid(redirectContext)
    ) {
      navigateWithContext(redirectContext.intendedPath, {
        replace: true,
        preserveQuery: redirectContext.preserveQuery,
        moduleContext: redirectContext.moduleType,
      });
      return;
    }

    // Use intelligent routing for default behavior
    const postAuthRoute = RouteResolver.resolvePostAuthRoute(
      user,
      navigationState
    );
    navigateWithContext(postAuthRoute.route, {
      replace: postAuthRoute.replace,
      preserveQuery: postAuthRoute.preserveQuery,
    });
  }, [user, navigationState, navigateWithContext]);

  // Set redirect with enhanced context
  const setEnhancedRedirect = useCallback(
    (path: string, moduleType?: ModuleType, preserveQuery: boolean = false) => {
      setRedirectAfterLogin(path);

      NavigationStateManager.setRedirectContext({
        intendedPath: path,
        moduleType,
        preserveQuery,
        timestamp: new Date(),
      });
    },
    [setRedirectAfterLogin]
  );

  // Enhanced user preferences management
  const updateUserPreferences = useCallback(
    (preferences: Partial<UserPreferences>) => {
      saveUserPreferences(preferences);
      NavigationStateManager.saveUserPreferences(preferences, user?.id);
    },
    [saveUserPreferences, user?.id]
  );

  // Get breadcrumb navigation
  const breadcrumbs = useMemo(() => {
    if (!user) return [];
    return NavigationStateManager.createBreadcrumbTrail(
      location.pathname,
      user
    );
  }, [user, location.pathname]);

  // Navigation analytics
  const navigationAnalytics = useMemo(() => {
    return NavigationStateManager.getNavigationAnalytics();
  }, [navigationHistory]);

  // Check if navigation requires confirmation
  const checkNavigationConfirmation = useCallback(
    (targetPath: string) => {
      if (!user) return { required: false };

      return RouteResolver.requiresConfirmation(
        location.pathname,
        targetPath,
        user
      );
    },
    [user, location.pathname]
  );

  // Go back with validation
  const goBack = useCallback(() => {
    if (!canGoBack()) return false;

    const previousPath = getPreviousPath();
    if (!previousPath) return false;

    return navigateWithContext(previousPath, { replace: true });
  }, [canGoBack, getPreviousPath, navigateWithContext]);

  // Clear all navigation data (useful for logout)
  const clearAllNavigationData = useCallback(() => {
    clearNavigationData();
    NavigationStateManager.clearAllNavigationData();
  }, [clearNavigationData]);

  return {
    // Enhanced navigation methods
    navigateWithContext,
    navigateToModule,
    navigateToDashboard,
    handlePostLoginNavigation,
    setEnhancedRedirect,
    goBack,

    // State management
    navigationState,
    navigationHistory,
    breadcrumbs,
    navigationAnalytics,

    // User preferences
    updateUserPreferences,
    userPreferences: getUserPreferences(),

    // Utility methods
    checkNavigationConfirmation,
    getRecentPaths,
    canGoBack,
    getPreviousPath,

    // Context management
    setModuleContext,
    clearRedirect,
    clearAllNavigationData,

    // Current location info
    currentPath: location.pathname,
    currentSearch: location.search,
    currentHash: location.hash,

    // Validation helpers
    validateNavigation: (targetPath: string) => {
      if (!user) return { allowed: false, reason: "Not authenticated" };
      return RouteResolver.validateNavigation(
        user,
        location.pathname,
        targetPath
      );
    },

    // Module context helpers
    getModuleContext: (moduleType: ModuleType) =>
      NavigationStateManager.getModuleContext(moduleType),

    setModuleContextData: (moduleType: ModuleType, data: any) =>
      NavigationStateManager.setModuleContext(moduleType, data),

    clearModuleContext: (moduleType: ModuleType) =>
      NavigationStateManager.clearModuleContext(moduleType),
  };
};
