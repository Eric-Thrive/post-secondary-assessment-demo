import { useMemo } from "react";
import { useUnifiedAuth } from "./useUnifiedAuth";
import { RoleBasedAccessControl, ModuleAccessValidator } from "@/services/auth";
import { ModuleType, UserRole } from "@/types/unified-auth";

/**
 * Hook for role-based access control and permission checking
 */
export const useRoleBasedAccess = () => {
  const { user } = useUnifiedAuth();

  // Create permission checker functions
  const permissions = useMemo(() => {
    if (!user) {
      return {
        hasRole: () => false,
        hasAnyRole: () => false,
        hasModuleAccess: () => false,
        canPerformAction: () => ({
          allowed: false,
          reason: "Not authenticated",
        }),
        canPerformAdminActions: () => false,
        canManageUsers: () => false,
        canAccessSystemFeatures: () => false,
        hasOrganizationAccess: () => false,
        getAvailableActions: () => [],
        getModuleAccessSummary: () => ({}),
        validateDemoRestrictions: () => ({
          allowed: false,
          reason: "Not authenticated",
        }),
      };
    }

    return {
      // Role checking
      hasRole: (role: UserRole) => RoleBasedAccessControl.hasRole(user, role),
      hasAnyRole: (roles: UserRole[]) =>
        RoleBasedAccessControl.hasAnyRole(user, roles),

      // Module access
      hasModuleAccess: (moduleType: ModuleType) =>
        RoleBasedAccessControl.hasModuleAccess(user, moduleType),

      // Action validation
      canPerformAction: (
        moduleType: ModuleType,
        feature: string,
        action: string
      ) =>
        ModuleAccessValidator.canPerformAction(
          user,
          moduleType,
          feature,
          action
        ),

      // Admin capabilities
      canPerformAdminActions: () =>
        RoleBasedAccessControl.canPerformAdminActions(user),
      canManageUsers: () => RoleBasedAccessControl.canManageUsers(user),
      canAccessSystemFeatures: () =>
        RoleBasedAccessControl.canAccessSystemFeatures(user),

      // Organization access
      hasOrganizationAccess: (orgId?: string) =>
        RoleBasedAccessControl.hasOrganizationAccess(user, orgId),

      // Feature access
      getAvailableActions: (moduleType: ModuleType, feature: string) =>
        ModuleAccessValidator.getAvailableActions(user, moduleType, feature),

      // Access summaries
      getModuleAccessSummary: () =>
        ModuleAccessValidator.getModuleAccessSummary(user),

      // Demo restrictions
      validateDemoRestrictions: (
        moduleType: ModuleType,
        feature: string,
        action: string
      ) =>
        ModuleAccessValidator.validateDemoRestrictions(
          user,
          moduleType,
          feature,
          action
        ),
    };
  }, [user]);

  // User capabilities summary
  const capabilities = useMemo(() => {
    if (!user) return null;
    return RoleBasedAccessControl.getUserCapabilities(user);
  }, [user]);

  // Demo status
  const demoStatus = useMemo(() => {
    if (!user) return null;
    return RoleBasedAccessControl.validateDemoAccess(user);
  }, [user]);

  // Convenience flags
  const flags = useMemo(() => {
    if (!user) {
      return {
        isAdmin: false,
        isDeveloper: false,
        isSystemAdmin: false,
        isOrgAdmin: false,
        isCustomer: false,
        isDemo: false,
        hasMultipleModules: false,
        canAccessAllModules: false,
      };
    }

    const accessibleModules = user.moduleAccess.filter(
      (access) =>
        access.accessLevel === "full" || access.accessLevel === "restricted"
    );

    return {
      isAdmin: permissions.canPerformAdminActions(),
      isDeveloper: user.role === UserRole.DEVELOPER,
      isSystemAdmin: user.role === UserRole.SYSTEM_ADMIN,
      isOrgAdmin: user.role === UserRole.ORG_ADMIN,
      isCustomer: user.role === UserRole.CUSTOMER,
      isDemo: user.role === UserRole.DEMO,
      hasMultipleModules: accessibleModules.length > 1,
      canAccessAllModules: accessibleModules.length === 3, // All three modules
    };
  }, [user, permissions]);

  return {
    // Permission checking functions
    ...permissions,

    // User information
    user,
    capabilities,
    demoStatus,
    flags,

    // Convenience methods
    checkModuleAccess: (moduleType: ModuleType) => {
      return ModuleAccessValidator.canAccessModule(user!, moduleType);
    },

    checkOrganizationModuleAccess: (moduleType: ModuleType, orgId?: string) => {
      return ModuleAccessValidator.validateOrganizationModuleAccess(
        user!,
        moduleType,
        orgId
      );
    },

    // Permission checker factory
    createPermissionChecker: () => {
      return user ? RoleBasedAccessControl.createPermissionChecker(user) : null;
    },
  };
};
