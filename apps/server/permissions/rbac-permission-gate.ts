import { Request, Response, NextFunction } from "express";
import {
  PermissionGate,
  UserPermissions,
  UserRole,
  ModuleType,
  PermissionError,
  ModuleAccessError,
  DemoLimitError,
  OrganizationAccessError,
  PermissionContext,
  ResourceType,
  ActionType,
} from "./types";

/**
 * Role-based access control permission gate implementation
 */
export class RBACPermissionGate implements PermissionGate {
  /**
   * Get user permissions based on their role
   * @param role - The user's role
   * @param assignedModules - The modules assigned to the user
   * @param maxReports - The user's report limit (-1 for unlimited)
   * @returns UserPermissions object with all permission flags
   */
  public getUserPermissions(
    role: UserRole,
    assignedModules: ModuleType[] = [],
    maxReports: number = -1
  ): UserPermissions {
    const basePermissions: UserPermissions = {
      canSwitchModules: false,
      moduleAccess: assignedModules,
      canAccessAdminDashboard: false,
      canViewSystemAnalytics: false,
      canViewAllReports: false,
      canEditPrompts: false,
      canEditSystemConfig: false,
      canViewDatabaseTables: false,
      canEditDatabaseTables: false,
      canManageUsers: false,
      canManageOrganizations: false,
      canViewOrgUsers: false,
      canEditOrgUsers: false,
      canCreateReports: true,
      canViewOwnReports: true,
      canViewOrgReports: false,
      canEditOwnReports: true,
      canEditOrgReports: false,
      canShareReports: true,
      reportLimit: maxReports === -1 ? undefined : maxReports,
      isDemoUser: false,
      canUpgradeAccount: false,
    };

    switch (role) {
      case UserRole.DEVELOPER:
        return {
          ...basePermissions,
          canSwitchModules: true,
          moduleAccess: [
            ModuleType.K12,
            ModuleType.POST_SECONDARY,
            ModuleType.TUTORING,
          ],
          canAccessAdminDashboard: true,
          canViewSystemAnalytics: true,
          canViewAllReports: true,
          canEditPrompts: true,
          canEditSystemConfig: true,
          canViewDatabaseTables: true,
          canEditDatabaseTables: true,
          canManageUsers: true,
          canManageOrganizations: true,
          canViewOrgUsers: true,
          canEditOrgUsers: true,
          canViewOrgReports: true,
          canEditOrgReports: true,
          reportLimit: undefined, // Unlimited
        };

      case UserRole.ADMIN:
        return {
          ...basePermissions,
          canSwitchModules: true,
          moduleAccess: [
            ModuleType.K12,
            ModuleType.POST_SECONDARY,
            ModuleType.TUTORING,
          ],
          canAccessAdminDashboard: true,
          canViewSystemAnalytics: true,
          canViewAllReports: true,
          canManageUsers: true,
          canManageOrganizations: true,
          canViewOrgUsers: true,
          canEditOrgUsers: true,
          canViewOrgReports: true,
          canEditOrgReports: true,
          reportLimit: undefined, // Unlimited
        };

      case UserRole.ORG_ADMIN:
        return {
          ...basePermissions,
          canViewOrgUsers: true,
          canEditOrgUsers: true,
          canManageUsers: true, // Within their organization only
          canViewOrgReports: true,
          canEditOrgReports: true,
          reportLimit: undefined, // Unlimited
        };

      case UserRole.CUSTOMER:
        return {
          ...basePermissions,
          reportLimit: undefined, // Unlimited
        };

      case UserRole.DEMO:
        return {
          ...basePermissions,
          reportLimit: 5, // Demo users limited to 5 reports
          isDemoUser: true,
          canUpgradeAccount: true,
        };

      default:
        return basePermissions;
    }
  }

  /**
   * Evaluate if a user has permission to perform an action on a resource
   * @param permissions - The user's permissions
   * @param resource - The resource being accessed
   * @param action - The action being performed
   * @param context - Additional context for permission checking
   * @returns boolean indicating if permission is granted
   */
  public evaluatePermission(
    permissions: UserPermissions,
    resource: string,
    action: string,
    context?: PermissionContext
  ): boolean {
    switch (resource) {
      case ResourceType.MODULES:
        return this.evaluateModulePermission(permissions, action, context);

      case ResourceType.REPORTS:
        return this.evaluateReportPermission(permissions, action, context);

      case ResourceType.ADMIN:
        return this.evaluateAdminPermission(permissions, action, context);

      case ResourceType.USERS:
        return this.evaluateUserPermission(permissions, action, context);

      case ResourceType.ORGANIZATIONS:
        return this.evaluateOrganizationPermission(
          permissions,
          action,
          context
        );

      case ResourceType.SYSTEM_CONFIG:
        return this.evaluateSystemConfigPermission(
          permissions,
          action,
          context
        );

      case ResourceType.PROMPTS:
        return this.evaluatePromptPermission(permissions, action, context);

      case ResourceType.DATABASE:
        return this.evaluateDatabasePermission(permissions, action, context);

      default:
        return false;
    }
  }

  /**
   * Check if a user has access to perform a specific action on a resource
   */
  public async checkAccess(
    user: Express.User,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    if (!user || !user.isActive) {
      return false;
    }

    const permissions = this.getUserPermissions(
      user.role,
      user.assignedModules,
      user.maxReports
    );

    return this.evaluatePermission(permissions, resource, action, context);
  }

  /**
   * Express middleware function that enforces access control
   */
  public enforceAccess(
    resource: string,
    action: string,
    context?: Record<string, any>
  ) {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({
            error: "Authentication required",
            code: "AUTHENTICATION_REQUIRED",
          });
          return;
        }

        const hasAccess = await this.checkAccess(
          req.user,
          resource,
          action,
          context
        );

        if (!hasAccess) {
          const error = this.createPermissionError(
            req.user,
            resource,
            action,
            context
          );
          res.status(403).json(error);
          return;
        }

        next();
      } catch (error) {
        console.error("Permission enforcement error:", error);
        res.status(500).json({
          error: "Permission check failed",
          code: "PERMISSION_CHECK_ERROR",
        });
      }
    };
  }

  /**
   * Create appropriate permission error based on the context
   */
  private createPermissionError(
    user: Express.User,
    resource: string,
    action: string,
    context?: Record<string, any>
  ):
    | PermissionError
    | ModuleAccessError
    | DemoLimitError
    | OrganizationAccessError {
    const baseError = {
      currentRole: user.role,
      context,
    };

    if (resource === ResourceType.MODULES && context?.moduleType) {
      return {
        ...baseError,
        code: "MODULE_ACCESS_DENIED" as const,
        message: `Access denied to ${context.moduleType} module`,
        requestedModule: context.moduleType,
        assignedModules: user.assignedModules,
      };
    }

    if (
      resource === ResourceType.REPORTS &&
      action === ActionType.CREATE &&
      user.role === UserRole.DEMO
    ) {
      return {
        ...baseError,
        code: "DEMO_LIMIT_EXCEEDED" as const,
        message: "Demo user report limit exceeded",
        currentCount: user.reportCount,
        maxReports: user.maxReports,
        upgradeUrl: "/upgrade",
      };
    }

    if (
      context?.organizationId &&
      user.organizationId !== context.organizationId
    ) {
      return {
        ...baseError,
        code: "ORGANIZATION_ACCESS_DENIED" as const,
        message: "Access denied to resources outside your organization",
        requestedOrganization: context.organizationId,
        userOrganization: user.organizationId,
      };
    }

    return {
      ...baseError,
      code: "INSUFFICIENT_PERMISSIONS" as const,
      message: `Insufficient permissions to ${action} ${resource}`,
      requiredPermission: `${action}_${resource}`,
    };
  }

  // Private helper methods for specific permission evaluations

  private evaluateModulePermission(
    permissions: UserPermissions,
    action: string,
    context?: PermissionContext
  ): boolean {
    switch (action) {
      case ActionType.SWITCH:
        return permissions.canSwitchModules;
      case ActionType.READ:
      case ActionType.VIEW:
        if (context?.moduleType) {
          return permissions.moduleAccess.includes(context.moduleType);
        }
        return permissions.moduleAccess.length > 0;
      default:
        return false;
    }
  }

  private evaluateReportPermission(
    permissions: UserPermissions,
    action: string,
    context?: PermissionContext
  ): boolean {
    switch (action) {
      case ActionType.CREATE:
        if (permissions.isDemoUser && permissions.reportLimit !== undefined) {
          // Demo limit checking would need current report count from context
          return (context?.currentReportCount || 0) < permissions.reportLimit;
        }
        return permissions.canCreateReports;
      case ActionType.READ:
      case ActionType.VIEW:
        if (context?.isOwnReport) return permissions.canViewOwnReports;
        if (context?.isOrgReport) return permissions.canViewOrgReports;
        return permissions.canViewAllReports;
      case ActionType.UPDATE:
      case ActionType.EDIT:
        if (context?.isOwnReport) return permissions.canEditOwnReports;
        if (context?.isOrgReport) return permissions.canEditOrgReports;
        return permissions.canViewAllReports;
      case ActionType.SHARE:
        return permissions.canShareReports;
      default:
        return false;
    }
  }

  private evaluateAdminPermission(
    permissions: UserPermissions,
    action: string,
    context?: PermissionContext
  ): boolean {
    switch (action) {
      case ActionType.VIEW:
      case ActionType.READ:
        return permissions.canAccessAdminDashboard;
      case ActionType.MANAGE:
        return permissions.canViewSystemAnalytics;
      default:
        return false;
    }
  }

  private evaluateUserPermission(
    permissions: UserPermissions,
    action: string,
    context?: PermissionContext
  ): boolean {
    switch (action) {
      case ActionType.VIEW:
        if (context?.isOrgUser) return permissions.canViewOrgUsers;
        return permissions.canManageUsers;
      case ActionType.MANAGE:
      case ActionType.CREATE:
      case ActionType.UPDATE:
      case ActionType.DELETE:
        if (context?.isOrgUser) return permissions.canEditOrgUsers;
        return permissions.canManageUsers;
      default:
        return false;
    }
  }

  private evaluateOrganizationPermission(
    permissions: UserPermissions,
    action: string,
    context?: PermissionContext
  ): boolean {
    switch (action) {
      case ActionType.VIEW:
      case ActionType.READ:
      case ActionType.MANAGE:
      case ActionType.CREATE:
      case ActionType.UPDATE:
      case ActionType.DELETE:
        return permissions.canManageOrganizations;
      default:
        return false;
    }
  }

  private evaluateSystemConfigPermission(
    permissions: UserPermissions,
    action: string,
    context?: PermissionContext
  ): boolean {
    switch (action) {
      case ActionType.VIEW:
      case ActionType.READ:
        return (
          permissions.canEditSystemConfig || permissions.canViewDatabaseTables
        );
      case ActionType.EDIT:
      case ActionType.UPDATE:
        return permissions.canEditSystemConfig;
      default:
        return false;
    }
  }

  private evaluatePromptPermission(
    permissions: UserPermissions,
    action: string,
    context?: PermissionContext
  ): boolean {
    switch (action) {
      case ActionType.VIEW:
      case ActionType.READ:
        return permissions.canEditPrompts || permissions.canEditSystemConfig;
      case ActionType.EDIT:
      case ActionType.UPDATE:
        return permissions.canEditPrompts;
      default:
        return false;
    }
  }

  private evaluateDatabasePermission(
    permissions: UserPermissions,
    action: string,
    context?: PermissionContext
  ): boolean {
    switch (action) {
      case ActionType.VIEW:
      case ActionType.READ:
        return permissions.canViewDatabaseTables;
      case ActionType.EDIT:
      case ActionType.UPDATE:
      case ActionType.CREATE:
      case ActionType.DELETE:
        return permissions.canEditDatabaseTables;
      default:
        return false;
    }
  }
}

// Export singleton instance
export const rbacPermissionGate = new RBACPermissionGate();
