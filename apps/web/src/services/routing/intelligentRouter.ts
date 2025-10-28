import {
  AuthenticatedUser,
  ModuleAccess,
  ModuleType,
  UserRole,
} from "@/types/unified-auth";
import { getModuleHomeRoute, AUTH_ROUTES } from "@/config/routes";

/**
 * Intelligent routing service that determines the appropriate route
 * for users based on their role and module access
 */
export class IntelligentRouter {
  /**
   * Determines the post-login route for a user
   */
  static getPostLoginRoute(user: AuthenticatedUser): string {
    const accessibleModules = this.getAccessibleModules(user);

    // Single module access - direct redirect
    if (accessibleModules.length === 1) {
      return getModuleHomeRoute(accessibleModules[0].moduleType);
    }

    // Multiple modules or admin users - show dashboard
    if (
      accessibleModules.length > 1 ||
      this.isAdminUser(user) ||
      this.isDeveloperUser(user)
    ) {
      return AUTH_ROUTES.DASHBOARD;
    }

    // No module access - default to dashboard for error handling
    return AUTH_ROUTES.DASHBOARD;
  }

  /**
   * Determines if user should see the module dashboard
   */
  static shouldShowDashboard(user: AuthenticatedUser): boolean {
    const accessibleModules = this.getAccessibleModules(user);

    return (
      accessibleModules.length > 1 ||
      this.isAdminUser(user) ||
      this.isDeveloperUser(user)
    );
  }

  /**
   * Gets all accessible modules for a user
   */
  static getAccessibleModules(user: AuthenticatedUser): ModuleAccess[] {
    return user.moduleAccess.filter(
      (access) =>
        access.accessLevel === "full" || access.accessLevel === "restricted"
    );
  }

  /**
   * Checks if user has access to a specific module
   */
  static hasModuleAccess(
    user: AuthenticatedUser,
    moduleType: ModuleType
  ): boolean {
    return user.moduleAccess.some(
      (access) =>
        access.moduleType === moduleType &&
        (access.accessLevel === "full" || access.accessLevel === "restricted")
    );
  }

  /**
   * Gets the primary module for single-access users
   */
  static getPrimaryModule(user: AuthenticatedUser): ModuleType | null {
    const accessibleModules = this.getAccessibleModules(user);

    if (accessibleModules.length === 1) {
      return accessibleModules[0].moduleType;
    }

    // For multi-module users, check user preferences
    if (user.preferences?.defaultModule) {
      const preferredModule = accessibleModules.find(
        (access) => access.moduleType === user.preferences.defaultModule
      );
      if (preferredModule) {
        return preferredModule.moduleType;
      }
    }

    return null;
  }

  /**
   * Determines routing strategy based on user type
   */
  static getRoutingStrategy(user: AuthenticatedUser): {
    strategy: "direct" | "dashboard" | "restricted";
    targetRoute: string;
    reason: string;
  } {
    const accessibleModules = this.getAccessibleModules(user);

    // No access
    if (accessibleModules.length === 0) {
      return {
        strategy: "restricted",
        targetRoute: AUTH_ROUTES.DASHBOARD,
        reason: "No module access",
      };
    }

    // Single module access
    if (accessibleModules.length === 1) {
      return {
        strategy: "direct",
        targetRoute: getModuleHomeRoute(accessibleModules[0].moduleType),
        reason: "Single module access",
      };
    }

    // Multiple modules or admin
    return {
      strategy: "dashboard",
      targetRoute: AUTH_ROUTES.DASHBOARD,
      reason: "Multiple modules or admin access",
    };
  }

  /**
   * Validates if a route is accessible for a user
   */
  static validateRouteAccess(
    user: AuthenticatedUser,
    targetRoute: string,
    requiredRoles?: UserRole[],
    requiredModules?: ModuleType[]
  ): {
    allowed: boolean;
    redirectRoute?: string;
    reason?: string;
  } {
    // Check role requirements
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      return {
        allowed: false,
        redirectRoute: AUTH_ROUTES.DASHBOARD,
        reason: "Insufficient role permissions",
      };
    }

    // Check module requirements
    if (requiredModules) {
      const hasRequiredModule = requiredModules.some((module) =>
        this.hasModuleAccess(user, module)
      );

      if (!hasRequiredModule) {
        return {
          allowed: false,
          redirectRoute: AUTH_ROUTES.DASHBOARD,
          reason: "No access to required module",
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Gets appropriate fallback route for unauthorized access
   */
  static getFallbackRoute(user: AuthenticatedUser): string {
    if (this.shouldShowDashboard(user)) {
      return AUTH_ROUTES.DASHBOARD;
    }

    const primaryModule = this.getPrimaryModule(user);
    if (primaryModule) {
      return getModuleHomeRoute(primaryModule);
    }

    return AUTH_ROUTES.DASHBOARD;
  }

  // Helper methods for user role checking
  private static isAdminUser(user: AuthenticatedUser): boolean {
    return [UserRole.SYSTEM_ADMIN, UserRole.ORG_ADMIN].includes(user.role);
  }

  private static isDeveloperUser(user: AuthenticatedUser): boolean {
    return user.role === UserRole.DEVELOPER;
  }

  private static isDemoUser(user: AuthenticatedUser): boolean {
    return user.role === UserRole.DEMO;
  }

  private static isCustomerUser(user: AuthenticatedUser): boolean {
    return user.role === UserRole.CUSTOMER;
  }
}
