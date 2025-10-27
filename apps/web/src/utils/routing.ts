import {
  AuthenticatedUser,
  ModuleAccess,
  ModuleType,
  UserRole,
} from "@/types/unified-auth";
import { getModuleHomeRoute, AUTH_ROUTES } from "@/config/routes";

/**
 * Determines the appropriate route for a user after successful authentication
 */
export const getPostLoginRoute = (user: AuthenticatedUser): string => {
  // Check if user has access to multiple modules
  const accessibleModules = user.moduleAccess.filter(
    (access) =>
      access.accessLevel === "full" || access.accessLevel === "restricted"
  );

  // If user has access to only one module, redirect directly to that module
  if (accessibleModules.length === 1) {
    return getModuleHomeRoute(accessibleModules[0].moduleType);
  }

  // If user has access to multiple modules or no modules, show dashboard
  return AUTH_ROUTES.DASHBOARD;
};

/**
 * Checks if a user has access to a specific module
 */
export const hasModuleAccess = (
  user: AuthenticatedUser,
  moduleType: ModuleType
): boolean => {
  return user.moduleAccess.some(
    (access) =>
      access.moduleType === moduleType &&
      (access.accessLevel === "full" || access.accessLevel === "restricted")
  );
};

/**
 * Checks if a user has a specific role
 */
export const hasRole = (user: AuthenticatedUser, role: UserRole): boolean => {
  return user.role === role;
};

/**
 * Checks if a user has any of the specified roles
 */
export const hasAnyRole = (
  user: AuthenticatedUser,
  roles: UserRole[]
): boolean => {
  return roles.includes(user.role);
};

/**
 * Gets all accessible modules for a user
 */
export const getAccessibleModules = (
  user: AuthenticatedUser
): ModuleAccess[] => {
  return user.moduleAccess.filter(
    (access) =>
      access.accessLevel === "full" || access.accessLevel === "restricted"
  );
};

/**
 * Determines if a user should see the module dashboard
 */
export const shouldShowDashboard = (user: AuthenticatedUser): boolean => {
  const accessibleModules = getAccessibleModules(user);

  // Show dashboard for users with multiple modules or admin users
  return (
    accessibleModules.length > 1 ||
    hasAnyRole(user, [UserRole.DEVELOPER, UserRole.SYSTEM_ADMIN])
  );
};

/**
 * Gets the appropriate login redirect path based on current location
 */
export const getLoginRedirectPath = (): string => {
  const currentPath = window.location.pathname;

  // Don't redirect to login or auth-related paths
  if (
    currentPath.startsWith("/login") ||
    currentPath.startsWith("/reset-password") ||
    currentPath.startsWith("/shared/")
  ) {
    return AUTH_ROUTES.DASHBOARD;
  }

  return currentPath;
};
