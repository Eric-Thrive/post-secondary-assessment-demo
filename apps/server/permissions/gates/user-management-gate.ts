import { Request, Response, NextFunction } from "express";
import { rbacPermissionGate } from "../rbac-permission-gate";
import { ResourceType, ActionType, UserRole } from "../types";

/**
 * User Management Gate - Controls user creation and organization management
 */
export class UserManagementGate {
  /**
   * Middleware to check if user can manage users
   * @param options - Options for user management checking
   * @returns Express middleware function
   */
  public static requireUserManagement(options?: {
    organizationScope?: boolean;
  }) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          code: "AUTHENTICATION_REQUIRED",
        });
      }

      const context: Record<string, any> = {};

      // Check if this is organization-scoped user management
      if (options?.organizationScope) {
        const targetOrgId =
          req.params.organizationId || req.body.organizationId;

        // Org admins can only manage users in their own organization
        if (req.user.role === UserRole.ORG_ADMIN) {
          if (targetOrgId && targetOrgId !== req.user.organizationId) {
            return res.status(403).json({
              error: "Cannot manage users outside your organization",
              code: "ORGANIZATION_ACCESS_DENIED",
              requestedOrganization: targetOrgId,
              userOrganization: req.user.organizationId,
            });
          }
          context.isOrgUser = true;
        }
      }

      return rbacPermissionGate.enforceAccess(
        ResourceType.USERS,
        ActionType.MANAGE,
        context
      )(req, res, next);
    };
  }

  /**
   * Middleware to check if user can view users
   * @param options - Options for user viewing
   * @returns Express middleware function
   */
  public static requireUserView(options?: { organizationScope?: boolean }) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          code: "AUTHENTICATION_REQUIRED",
        });
      }

      const context: Record<string, any> = {};

      // Check if this is organization-scoped user viewing
      if (options?.organizationScope) {
        const targetOrgId =
          req.params.organizationId || req.body.organizationId;

        // Org admins can only view users in their own organization
        if (req.user.role === UserRole.ORG_ADMIN) {
          if (targetOrgId && targetOrgId !== req.user.organizationId) {
            return res.status(403).json({
              error: "Cannot view users outside your organization",
              code: "ORGANIZATION_ACCESS_DENIED",
              requestedOrganization: targetOrgId,
              userOrganization: req.user.organizationId,
            });
          }
          context.isOrgUser = true;
        }
      }

      return rbacPermissionGate.enforceAccess(
        ResourceType.USERS,
        ActionType.VIEW,
        context
      )(req, res, next);
    };
  }

  /**
   * Middleware to check if user can create new users
   * @returns Express middleware function
   */
  public static requireUserCreation() {
    return rbacPermissionGate.enforceAccess(
      ResourceType.USERS,
      ActionType.CREATE
    );
  }

  /**
   * Middleware to check if user can update user information
   * @param options - Options for user update checking
   * @returns Express middleware function
   */
  public static requireUserUpdate(options?: { organizationScope?: boolean }) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          code: "AUTHENTICATION_REQUIRED",
        });
      }

      const context: Record<string, any> = {};

      // Check if this is organization-scoped user update
      if (options?.organizationScope) {
        const targetUserId = req.params.userId || req.body.userId;
        const targetOrgId =
          req.params.organizationId || req.body.organizationId;

        // Org admins can only update users in their own organization
        if (req.user.role === UserRole.ORG_ADMIN) {
          if (targetOrgId && targetOrgId !== req.user.organizationId) {
            return res.status(403).json({
              error: "Cannot update users outside your organization",
              code: "ORGANIZATION_ACCESS_DENIED",
              requestedOrganization: targetOrgId,
              userOrganization: req.user.organizationId,
            });
          }
          context.isOrgUser = true;
        }
      }

      return rbacPermissionGate.enforceAccess(
        ResourceType.USERS,
        ActionType.UPDATE,
        context
      )(req, res, next);
    };
  }

  /**
   * Middleware to check if user can delete users
   * @param options - Options for user deletion checking
   * @returns Express middleware function
   */
  public static requireUserDeletion(options?: { organizationScope?: boolean }) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          code: "AUTHENTICATION_REQUIRED",
        });
      }

      const context: Record<string, any> = {};

      // Check if this is organization-scoped user deletion
      if (options?.organizationScope) {
        const targetOrgId =
          req.params.organizationId || req.body.organizationId;

        // Org admins can only delete users in their own organization
        if (req.user.role === UserRole.ORG_ADMIN) {
          if (targetOrgId && targetOrgId !== req.user.organizationId) {
            return res.status(403).json({
              error: "Cannot delete users outside your organization",
              code: "ORGANIZATION_ACCESS_DENIED",
              requestedOrganization: targetOrgId,
              userOrganization: req.user.organizationId,
            });
          }
          context.isOrgUser = true;
        }
      }

      return rbacPermissionGate.enforceAccess(
        ResourceType.USERS,
        ActionType.DELETE,
        context
      )(req, res, next);
    };
  }

  /**
   * Check if user can manage users
   * @param user - The user to check
   * @param organizationScope - Whether this is organization-scoped
   * @returns Promise<boolean>
   */
  public static async canManageUsers(
    user: Express.User,
    organizationScope: boolean = false
  ): Promise<boolean> {
    const context = organizationScope ? { isOrgUser: true } : {};
    return rbacPermissionGate.checkAccess(
      user,
      ResourceType.USERS,
      ActionType.MANAGE,
      context
    );
  }

  /**
   * Check if user can view users
   * @param user - The user to check
   * @param organizationScope - Whether this is organization-scoped
   * @returns Promise<boolean>
   */
  public static async canViewUsers(
    user: Express.User,
    organizationScope: boolean = false
  ): Promise<boolean> {
    const context = organizationScope ? { isOrgUser: true } : {};
    return rbacPermissionGate.checkAccess(
      user,
      ResourceType.USERS,
      ActionType.VIEW,
      context
    );
  }

  /**
   * Check if user can create new users
   * @param user - The user to check
   * @returns Promise<boolean>
   */
  public static async canCreateUsers(user: Express.User): Promise<boolean> {
    return rbacPermissionGate.checkAccess(
      user,
      ResourceType.USERS,
      ActionType.CREATE
    );
  }

  /**
   * Get user management capabilities for a user
   * @param user - The user to check
   * @returns Object with user management capabilities
   */
  public static getUserManagementAccess(user: Express.User) {
    const permissions = rbacPermissionGate.getUserPermissions(
      user.role,
      user.assignedModules,
      user.maxReports
    );

    return {
      canManageUsers: permissions.canManageUsers,
      canViewOrgUsers: permissions.canViewOrgUsers,
      canEditOrgUsers: permissions.canEditOrgUsers,
      canManageOrganizations: permissions.canManageOrganizations,
      isOrgAdmin: user.role === UserRole.ORG_ADMIN,
      organizationId: user.organizationId,
      scope:
        user.role === UserRole.ORG_ADMIN
          ? ("organization" as const)
          : ("system" as const),
    };
  }

  /**
   * Middleware to add user management context to request
   * @returns Express middleware function
   */
  public static addUserManagementContext() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next();
      }

      req.userManagementContext = UserManagementGate.getUserManagementAccess(
        req.user
      );
      next();
    };
  }

  /**
   * Middleware to enforce organization boundaries for org admins
   * @returns Express middleware function
   */
  public static enforceOrganizationBoundary() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          code: "AUTHENTICATION_REQUIRED",
        });
      }

      // Only enforce boundaries for org admins
      if (req.user.role !== UserRole.ORG_ADMIN) {
        return next();
      }

      const targetOrgId =
        req.params.organizationId ||
        req.body.organizationId ||
        req.query.organizationId;

      if (targetOrgId && targetOrgId !== req.user.organizationId) {
        return res.status(403).json({
          error: "Access denied to resources outside your organization",
          code: "ORGANIZATION_ACCESS_DENIED",
          requestedOrganization: targetOrgId,
          userOrganization: req.user.organizationId,
        });
      }

      next();
    };
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userManagementContext?: {
        canManageUsers: boolean;
        canViewOrgUsers: boolean;
        canEditOrgUsers: boolean;
        canManageOrganizations: boolean;
        isOrgAdmin: boolean;
        organizationId?: string;
        scope: "organization" | "system";
      };
    }
  }
}
