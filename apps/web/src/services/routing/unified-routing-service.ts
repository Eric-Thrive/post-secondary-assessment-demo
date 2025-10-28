import { AuthenticatedUser, ModuleType, UserRole } from "@/types/unified-auth";
import {
  AUTH_ROUTES,
  MODULE_ROUTES,
  getModuleHomeRoute,
} from "@/config/routes";
import { sessionManagement } from "@/services/auth/session-management";

/**
 * Unified routing service that handles intelligent routing based on user permissions
 * and provides backward compatibility during the transition period
 */
export class UnifiedRoutingService {
  private static instance: UnifiedRoutingService;

  private constructor() {}

  public static getInstance(): UnifiedRoutingService {
    if (!UnifiedRoutingService.instance) {
      UnifiedRoutingService.instance = new UnifiedRoutingService();
    }
    return UnifiedRoutingService.instance;
  }

  /**
   * Handle post-login navigation based on user permissions and preferences
   */
  handlePostLoginNavigation(user: AuthenticatedUser): string {
    // Check for stored navigation state (redirect after login)
    const navState = sessionManagement.getAndClearNavigationState();
    if (navState?.redirectAfterLogin) {
      return navState.redirectAfterLogin;
    }

    // Get user's accessible modules
    const accessibleModules = user.moduleAccess.map(
      (access) => access.moduleType
    );

    // If user has access to multiple modules, show dashboard
    if (accessibleModules.length > 1) {
      return AUTH_ROUTES.DASHBOARD;
    }

    // If user has access to only one module, redirect directly to that module
    if (accessibleModules.length === 1) {
      const moduleType = accessibleModules[0];
      return getModuleHomeRoute(moduleType);
    }

    // Fallback to dashboard if no module access (shouldn't happen)
    return AUTH_ROUTES.DASHBOARD;
  }

  /**
   * Get the appropriate login route (unified login replaces module-specific logins)
   */
  getLoginRoute(): string {
    return AUTH_ROUTES.LOGIN;
  }

  /**
   * Handle legacy route redirects during transition period
   */
  handleLegacyRouteRedirect(currentPath: string): string | null {
    const legacyRouteMap: Record<string, string> = {
      // Legacy module-specific login routes -> unified login
      "/login/post-secondary": AUTH_ROUTES.LOGIN,
      "/login/k12": AUTH_ROUTES.LOGIN,
      "/login/tutor": AUTH_ROUTES.LOGIN,
      "/post-secondary-demo-login": AUTH_ROUTES.LOGIN,
      "/k12-demo-login": AUTH_ROUTES.LOGIN,
      "/tutoring-demo-login": AUTH_ROUTES.LOGIN,

      // Legacy home routes -> module-specific routes
      "/": this.getDefaultHomeRoute(),
    };

    return legacyRouteMap[currentPath] || null;
  }

  /**
   * Check if user has access to a specific route
   */
  hasRouteAccess(
    user: AuthenticatedUser,
    path: string,
    requiredRoles?: UserRole[],
    requiredModules?: ModuleType[]
  ): boolean {
    // Check role-based access
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      return false;
    }

    // Check module-based access
    if (requiredModules) {
      const userModules = user.moduleAccess.map((access) => access.moduleType);
      const hasModuleAccess = requiredModules.some((module) =>
        userModules.includes(module)
      );
      if (!hasModuleAccess) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get redirect URL for unauthorized access
   */
  getUnauthorizedRedirect(
    user: AuthenticatedUser | null,
    attemptedPath: string
  ): string {
    if (!user) {
      // Store attempted path for post-login redirect
      sessionManagement.storeNavigationState({
        redirectAfterLogin: attemptedPath,
      });
      return AUTH_ROUTES.LOGIN;
    }

    // User is authenticated but doesn't have access to this route
    // Redirect to their default accessible route
    return this.handlePostLoginNavigation(user);
  }

  /**
   * Get default home route based on current context
   */
  private getDefaultHomeRoute(): string {
    // During transition, check if user is authenticated
    // If not, redirect to login
    return AUTH_ROUTES.LOGIN;
  }

  /**
   * Handle module switching navigation
   */
  navigateToModule(moduleType: ModuleType, user: AuthenticatedUser): string {
    // Check if user has access to the requested module
    const hasAccess = user.moduleAccess.some(
      (access) => access.moduleType === moduleType
    );

    if (!hasAccess) {
      throw new Error(`User does not have access to ${moduleType} module`);
    }

    return getModuleHomeRoute(moduleType);
  }

  /**
   * Get breadcrumb navigation for current route
   */
  getBreadcrumbs(
    currentPath: string,
    user: AuthenticatedUser
  ): Array<{
    label: string;
    path: string;
    isActive: boolean;
  }> {
    const breadcrumbs: Array<{
      label: string;
      path: string;
      isActive: boolean;
    }> = [];

    // Always start with dashboard if user has multiple modules
    const accessibleModules = user.moduleAccess.map(
      (access) => access.moduleType
    );
    if (accessibleModules.length > 1) {
      breadcrumbs.push({
        label: "Dashboard",
        path: AUTH_ROUTES.DASHBOARD,
        isActive: currentPath === AUTH_ROUTES.DASHBOARD,
      });
    }

    // Add module-specific breadcrumbs based on current path
    if (currentPath.startsWith("/k12")) {
      breadcrumbs.push({
        label: "K-12 Module",
        path: MODULE_ROUTES.K12.HOME,
        isActive: currentPath === MODULE_ROUTES.K12.HOME,
      });
    } else if (currentPath.startsWith("/post-secondary")) {
      breadcrumbs.push({
        label: "Post-Secondary Module",
        path: MODULE_ROUTES.POST_SECONDARY.HOME,
        isActive: currentPath === MODULE_ROUTES.POST_SECONDARY.HOME,
      });
    } else if (currentPath.startsWith("/tutoring")) {
      breadcrumbs.push({
        label: "Tutoring Module",
        path: MODULE_ROUTES.TUTORING.HOME,
        isActive: currentPath === MODULE_ROUTES.TUTORING.HOME,
      });
    }

    return breadcrumbs;
  }

  /**
   * Check if current route is a legacy route that needs migration
   */
  isLegacyRoute(path: string): boolean {
    const legacyRoutes = [
      "/login/post-secondary",
      "/login/k12",
      "/login/tutor",
      "/post-secondary-demo-login",
      "/k12-demo-login",
      "/tutoring-demo-login",
    ];

    return legacyRoutes.includes(path);
  }

  /**
   * Get appropriate logout redirect based on user context
   */
  getLogoutRedirect(user: AuthenticatedUser | null): string {
    if (!user) return AUTH_ROUTES.LOGIN;

    // For demo users, redirect to appropriate demo landing page
    if (user.role === UserRole.DEMO) {
      const userModules = user.moduleAccess.map((access) => access.moduleType);

      if (userModules.includes(ModuleType.K12)) {
        return "/k12-demo-login";
      } else if (userModules.includes(ModuleType.TUTORING)) {
        return "/tutoring-demo-login";
      } else {
        return "/post-secondary-demo-login";
      }
    }

    // For regular users, redirect to unified login
    return AUTH_ROUTES.LOGIN;
  }

  /**
   * Handle deep linking with authentication check
   */
  handleDeepLink(targetPath: string, user: AuthenticatedUser | null): string {
    if (!user) {
      // Store target path for post-login redirect
      sessionManagement.storeNavigationState({
        redirectAfterLogin: targetPath,
      });
      return AUTH_ROUTES.LOGIN;
    }

    // User is authenticated, check if they have access to the target path
    // This would need to be expanded based on specific route requirements
    return targetPath;
  }
}

// Export singleton instance
export const unifiedRoutingService = UnifiedRoutingService.getInstance();
