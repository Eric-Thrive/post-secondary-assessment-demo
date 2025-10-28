import {
  AuthenticatedUser,
  ModuleType,
  UserRole,
  NavigationState,
} from "@/types/unified-auth";
import { IntelligentRouter } from "./intelligentRouter";
import { AUTH_ROUTES, getModuleHomeRoute } from "@/config/routes";

/**
 * Route resolver service that handles complex routing decisions
 * and maintains navigation state
 */
export class RouteResolver {
  /**
   * Resolves the appropriate route after authentication
   */
  static resolvePostAuthRoute(
    user: AuthenticatedUser,
    navigationState?: NavigationState
  ): {
    route: string;
    replace: boolean;
    preserveQuery?: boolean;
  } {
    // Check for pending redirect
    if (navigationState?.redirectAfterLogin) {
      const redirectRoute = navigationState.redirectAfterLogin;

      // Validate the redirect route is accessible
      const validation = IntelligentRouter.validateRouteAccess(
        user,
        redirectRoute
      );

      if (validation.allowed) {
        return {
          route: redirectRoute,
          replace: true,
          preserveQuery: true,
        };
      }
    }

    // Use intelligent routing for default behavior
    const defaultRoute = IntelligentRouter.getPostLoginRoute(user);

    return {
      route: defaultRoute,
      replace: true,
    };
  }

  /**
   * Resolves module selection routing
   */
  static resolveModuleRoute(
    user: AuthenticatedUser,
    selectedModule: ModuleType
  ): {
    route: string;
    allowed: boolean;
    reason?: string;
  } {
    // Validate module access
    if (!IntelligentRouter.hasModuleAccess(user, selectedModule)) {
      return {
        route: AUTH_ROUTES.DASHBOARD,
        allowed: false,
        reason: "No access to selected module",
      };
    }

    return {
      route: getModuleHomeRoute(selectedModule),
      allowed: true,
    };
  }

  /**
   * Resolves route conflicts and provides alternatives
   */
  static resolveRouteConflict(
    user: AuthenticatedUser,
    attemptedRoute: string,
    error: string
  ): {
    alternativeRoute: string;
    shouldRedirect: boolean;
    message?: string;
  } {
    // Get user's accessible modules
    const accessibleModules = IntelligentRouter.getAccessibleModules(user);

    // If no modules accessible, redirect to dashboard with message
    if (accessibleModules.length === 0) {
      return {
        alternativeRoute: AUTH_ROUTES.DASHBOARD,
        shouldRedirect: true,
        message:
          "No module access available. Please contact your administrator.",
      };
    }

    // If single module, redirect there
    if (accessibleModules.length === 1) {
      return {
        alternativeRoute: getModuleHomeRoute(accessibleModules[0].moduleType),
        shouldRedirect: true,
        message: "Redirected to your available module.",
      };
    }

    // Multiple modules - show dashboard
    return {
      alternativeRoute: AUTH_ROUTES.DASHBOARD,
      shouldRedirect: true,
      message: "Please select a module from the dashboard.",
    };
  }

  /**
   * Determines if a route change requires confirmation
   */
  static requiresConfirmation(
    currentRoute: string,
    targetRoute: string,
    user: AuthenticatedUser
  ): {
    required: boolean;
    message?: string;
    confirmText?: string;
    cancelText?: string;
  } {
    // Check if leaving a module with unsaved work
    const isLeavingModule =
      this.isModuleRoute(currentRoute) && !this.isModuleRoute(targetRoute);

    if (isLeavingModule) {
      return {
        required: true,
        message:
          "You may have unsaved work. Are you sure you want to leave this module?",
        confirmText: "Leave Module",
        cancelText: "Stay Here",
      };
    }

    return { required: false };
  }

  /**
   * Gets breadcrumb navigation for current route
   */
  static getBreadcrumbs(
    currentRoute: string,
    user: AuthenticatedUser
  ): Array<{
    label: string;
    route?: string;
    active: boolean;
  }> {
    const breadcrumbs = [];

    // Always start with dashboard if user has multiple modules
    if (IntelligentRouter.shouldShowDashboard(user)) {
      breadcrumbs.push({
        label: "Dashboard",
        route: AUTH_ROUTES.DASHBOARD,
        active: currentRoute === AUTH_ROUTES.DASHBOARD,
      });
    }

    // Add module-specific breadcrumbs
    if (this.isModuleRoute(currentRoute)) {
      const moduleType = this.extractModuleFromRoute(currentRoute);
      if (moduleType) {
        breadcrumbs.push({
          label: this.getModuleDisplayName(moduleType),
          route: getModuleHomeRoute(moduleType),
          active: currentRoute === getModuleHomeRoute(moduleType),
        });

        // Add sub-route if applicable
        const subRoute = this.getSubRouteLabel(currentRoute, moduleType);
        if (subRoute) {
          breadcrumbs.push({
            label: subRoute,
            active: true,
          });
        }
      }
    }

    return breadcrumbs;
  }

  /**
   * Validates navigation permissions
   */
  static validateNavigation(
    user: AuthenticatedUser,
    fromRoute: string,
    toRoute: string
  ): {
    allowed: boolean;
    reason?: string;
    alternativeRoute?: string;
  } {
    // Check if target route requires specific permissions
    const moduleType = this.extractModuleFromRoute(toRoute);

    if (moduleType && !IntelligentRouter.hasModuleAccess(user, moduleType)) {
      return {
        allowed: false,
        reason: "No access to target module",
        alternativeRoute: IntelligentRouter.getFallbackRoute(user),
      };
    }

    // Check admin routes
    if (this.isAdminRoute(toRoute) && !this.hasAdminAccess(user)) {
      return {
        allowed: false,
        reason: "Admin access required",
        alternativeRoute: IntelligentRouter.getFallbackRoute(user),
      };
    }

    return { allowed: true };
  }

  // Helper methods
  private static isModuleRoute(route: string): boolean {
    return (
      route.includes("/k12") ||
      route.includes("/post-secondary") ||
      route.includes("/tutoring")
    );
  }

  private static isAdminRoute(route: string): boolean {
    return route.startsWith("/admin") || route.includes("/prompts");
  }

  private static hasAdminAccess(user: AuthenticatedUser): boolean {
    return [
      UserRole.DEVELOPER,
      UserRole.SYSTEM_ADMIN,
      UserRole.ORG_ADMIN,
    ].includes(user.role);
  }

  private static extractModuleFromRoute(route: string): ModuleType | null {
    if (route.includes("/k12")) return ModuleType.K12;
    if (route.includes("/post-secondary")) return ModuleType.POST_SECONDARY;
    if (route.includes("/tutoring")) return ModuleType.TUTORING;
    return null;
  }

  private static getModuleDisplayName(moduleType: ModuleType): string {
    switch (moduleType) {
      case ModuleType.K12:
        return "K-12 Module";
      case ModuleType.POST_SECONDARY:
        return "Post-Secondary Module";
      case ModuleType.TUTORING:
        return "Tutoring Module";
      default:
        return "Module";
    }
  }

  private static getSubRouteLabel(
    route: string,
    moduleType: ModuleType
  ): string | null {
    if (route.includes("/assessment")) return "New Assessment";
    if (route.includes("/reports")) return "Reports";
    if (route.includes("/review-edit")) return "Review & Edit";
    return null;
  }
}
