import {
  AuthenticatedUser,
  ModuleAccess,
  ModuleType,
  UserRole,
} from "@/types/unified-auth";
import { RoleBasedAccessControl } from "./roleBasedAccessControl";

/**
 * Module access validation service for determining user permissions
 * across different modules and features
 */
export class ModuleAccessValidator {
  /**
   * Module feature permissions mapping
   */
  private static readonly MODULE_FEATURES: Record<
    ModuleType,
    Record<string, string[]>
  > = {
    [ModuleType.K12]: {
      assessment: ["create", "read", "update", "delete"],
      reports: ["create", "read", "update", "delete", "share"],
      prompts: ["read", "update"],
      admin: ["read", "update"],
    },
    [ModuleType.POST_SECONDARY]: {
      assessment: ["create", "read", "update", "delete"],
      reports: ["create", "read", "update", "delete", "share"],
      prompts: ["read", "update"],
      admin: ["read", "update"],
    },
    [ModuleType.TUTORING]: {
      assessment: ["create", "read", "update", "delete"],
      reports: ["create", "read", "update", "delete", "share"],
      prompts: ["read", "update"],
      admin: ["read", "update"],
    },
  };

  /**
   * Role-based feature restrictions
   */
  private static readonly ROLE_RESTRICTIONS: Record<
    UserRole,
    Record<string, string[]>
  > = {
    [UserRole.DEVELOPER]: {}, // No restrictions
    [UserRole.SYSTEM_ADMIN]: {}, // No restrictions
    [UserRole.ORG_ADMIN]: {
      admin: ["delete"], // Cannot delete system-level items
    },
    [UserRole.CUSTOMER]: {
      prompts: ["update"], // Cannot modify prompts
      admin: ["read", "update", "delete"], // No admin access
    },
    [UserRole.DEMO]: {
      assessment: ["delete"], // Cannot delete assessments
      reports: ["delete", "share"], // Cannot delete or share reports
      prompts: ["update"], // Cannot modify prompts
      admin: ["read", "update", "delete"], // No admin access
    },
  };

  /**
   * Validates if user can access a specific module
   */
  static canAccessModule(
    user: AuthenticatedUser,
    moduleType: ModuleType
  ): {
    allowed: boolean;
    accessLevel: "full" | "restricted" | "none";
    reason?: string;
  } {
    const hasAccess = RoleBasedAccessControl.hasModuleAccess(user, moduleType);

    if (!hasAccess) {
      return {
        allowed: false,
        accessLevel: "none",
        reason: "No module access assigned",
      };
    }

    const accessLevel = RoleBasedAccessControl.getModuleAccessLevel(
      user,
      moduleType
    );

    return {
      allowed: true,
      accessLevel: accessLevel as "full" | "restricted",
    };
  }

  /**
   * Validates if user can perform a specific action in a module
   */
  static canPerformAction(
    user: AuthenticatedUser,
    moduleType: ModuleType,
    feature: string,
    action: string
  ): {
    allowed: boolean;
    reason?: string;
  } {
    // Check basic module access
    const moduleAccess = this.canAccessModule(user, moduleType);
    if (!moduleAccess.allowed) {
      return {
        allowed: false,
        reason: moduleAccess.reason,
      };
    }

    // Check if feature exists for module
    const moduleFeatures = this.MODULE_FEATURES[moduleType];
    if (!moduleFeatures || !moduleFeatures[feature]) {
      return {
        allowed: false,
        reason: `Feature '${feature}' not available in ${moduleType} module`,
      };
    }

    // Check if action is supported for feature
    const supportedActions = moduleFeatures[feature];
    if (!supportedActions.includes(action)) {
      return {
        allowed: false,
        reason: `Action '${action}' not supported for feature '${feature}'`,
      };
    }

    // Check role-based restrictions
    const roleRestrictions = this.ROLE_RESTRICTIONS[user.role];
    if (roleRestrictions && roleRestrictions[feature]) {
      const restrictedActions = roleRestrictions[feature];
      if (restrictedActions.includes(action)) {
        return {
          allowed: false,
          reason: `Action '${action}' restricted for role '${user.role}'`,
        };
      }
    }

    // Check specific permission
    const hasPermission = RoleBasedAccessControl.hasPermission(
      user,
      action,
      feature,
      moduleType
    );

    if (!hasPermission) {
      return {
        allowed: false,
        reason: "Insufficient permissions for this action",
      };
    }

    return { allowed: true };
  }

  /**
   * Gets all available actions for a user in a module feature
   */
  static getAvailableActions(
    user: AuthenticatedUser,
    moduleType: ModuleType,
    feature: string
  ): string[] {
    const moduleAccess = this.canAccessModule(user, moduleType);
    if (!moduleAccess.allowed) {
      return [];
    }

    const moduleFeatures = this.MODULE_FEATURES[moduleType];
    if (!moduleFeatures || !moduleFeatures[feature]) {
      return [];
    }

    const allActions = moduleFeatures[feature];
    const roleRestrictions = this.ROLE_RESTRICTIONS[user.role];
    const restrictedActions = roleRestrictions?.[feature] || [];

    return allActions.filter((action) => {
      // Filter out role-restricted actions
      if (restrictedActions.includes(action)) {
        return false;
      }

      // Check specific permission
      return RoleBasedAccessControl.hasPermission(
        user,
        action,
        feature,
        moduleType
      );
    });
  }

  /**
   * Validates organization-based module access
   */
  static validateOrganizationModuleAccess(
    user: AuthenticatedUser,
    moduleType: ModuleType,
    targetOrganizationId?: string
  ): {
    allowed: boolean;
    reason?: string;
  } {
    // Check basic module access first
    const moduleAccess = this.canAccessModule(user, moduleType);
    if (!moduleAccess.allowed) {
      return moduleAccess;
    }

    // Check organization access
    const hasOrgAccess = RoleBasedAccessControl.hasOrganizationAccess(
      user,
      targetOrganizationId
    );

    if (!hasOrgAccess) {
      return {
        allowed: false,
        reason: "No access to target organization",
      };
    }

    return { allowed: true };
  }

  /**
   * Gets module access summary for a user
   */
  static getModuleAccessSummary(user: AuthenticatedUser): Record<
    ModuleType,
    {
      hasAccess: boolean;
      accessLevel: "full" | "restricted" | "none";
      availableFeatures: Record<string, string[]>;
      restrictions: string[];
    }
  > {
    const summary = {} as Record<ModuleType, any>;

    Object.values(ModuleType).forEach((moduleType) => {
      const access = this.canAccessModule(user, moduleType);
      const features = this.MODULE_FEATURES[moduleType] || {};
      const availableFeatures: Record<string, string[]> = {};
      const restrictions: string[] = [];

      // Get available features and actions
      Object.keys(features).forEach((feature) => {
        const actions = this.getAvailableActions(user, moduleType, feature);
        if (actions.length > 0) {
          availableFeatures[feature] = actions;
        }

        // Collect restrictions
        const roleRestrictions = this.ROLE_RESTRICTIONS[user.role];
        if (roleRestrictions && roleRestrictions[feature]) {
          const restrictedActions = roleRestrictions[feature];
          restrictedActions.forEach((action) => {
            restrictions.push(`Cannot ${action} ${feature}`);
          });
        }
      });

      summary[moduleType] = {
        hasAccess: access.allowed,
        accessLevel: access.accessLevel,
        availableFeatures,
        restrictions: [...new Set(restrictions)], // Remove duplicates
      };
    });

    return summary;
  }

  /**
   * Validates demo user specific restrictions
   */
  static validateDemoRestrictions(
    user: AuthenticatedUser,
    moduleType: ModuleType,
    feature: string,
    action: string
  ): {
    allowed: boolean;
    reason?: string;
    upgradeRequired?: boolean;
  } {
    if (user.role !== UserRole.DEMO) {
      return { allowed: true };
    }

    const demoValidation = RoleBasedAccessControl.validateDemoAccess(user);

    if (demoValidation.isExpired) {
      return {
        allowed: false,
        reason: "Demo access has expired",
        upgradeRequired: true,
      };
    }

    // Check demo-specific restrictions
    const demoRestrictions = this.ROLE_RESTRICTIONS[UserRole.DEMO];
    if (demoRestrictions && demoRestrictions[feature]) {
      const restrictedActions = demoRestrictions[feature];
      if (restrictedActions.includes(action)) {
        return {
          allowed: false,
          reason: `Demo users cannot ${action} ${feature}`,
          upgradeRequired: true,
        };
      }
    }

    return { allowed: true };
  }
}
