import { Request, Response, NextFunction } from "express";
import { rbacPermissionGate } from "../rbac-permission-gate";
import { ResourceType, ActionType, UserRole } from "../types";

/**
 * Admin Gate - Controls access to admin dashboard and system monitoring
 */
export class AdminGate {
  /**
   * Middleware to require admin dashboard access
   * @returns Express middleware function
   */
  public static requireAdminAccess() {
    return rbacPermissionGate.enforceAccess(
      ResourceType.ADMIN,
      ActionType.VIEW
    );
  }

  /**
   * Middleware to require system analytics access
   * @returns Express middleware function
   */
  public static requireAnalyticsAccess() {
    return rbacPermissionGate.enforceAccess(
      ResourceType.ADMIN,
      ActionType.MANAGE
    );
  }

  /**
   * Middleware to require developer-level access
   * @returns Express middleware function
   */
  public static requireDeveloperAccess() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          code: "AUTHENTICATION_REQUIRED",
        });
      }

      if (req.user.role !== UserRole.DEVELOPER) {
        return res.status(403).json({
          error: "Developer access required",
          code: "INSUFFICIENT_PERMISSIONS",
          requiredRole: UserRole.DEVELOPER,
          currentRole: req.user.role,
        });
      }

      next();
    };
  }

  /**
   * Middleware to require admin or developer access
   * @returns Express middleware function
   */
  public static requireAdminOrDeveloper() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          code: "AUTHENTICATION_REQUIRED",
        });
      }

      const allowedRoles = [UserRole.ADMIN, UserRole.DEVELOPER];
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: "Admin or Developer access required",
          code: "INSUFFICIENT_PERMISSIONS",
          requiredRole: "admin or developer",
          currentRole: req.user.role,
        });
      }

      next();
    };
  }

  /**
   * Check if user has admin dashboard access
   * @param user - The user to check
   * @returns Promise<boolean>
   */
  public static async hasAdminAccess(user: Express.User): Promise<boolean> {
    return rbacPermissionGate.checkAccess(
      user,
      ResourceType.ADMIN,
      ActionType.VIEW
    );
  }

  /**
   * Check if user has system analytics access
   * @param user - The user to check
   * @returns Promise<boolean>
   */
  public static async hasAnalyticsAccess(user: Express.User): Promise<boolean> {
    return rbacPermissionGate.checkAccess(
      user,
      ResourceType.ADMIN,
      ActionType.MANAGE
    );
  }

  /**
   * Check if user is a developer
   * @param user - The user to check
   * @returns boolean
   */
  public static isDeveloper(user: Express.User): boolean {
    return user.role === UserRole.DEVELOPER;
  }

  /**
   * Check if user is admin or developer
   * @param user - The user to check
   * @returns boolean
   */
  public static isAdminOrDeveloper(user: Express.User): boolean {
    return [UserRole.ADMIN, UserRole.DEVELOPER].includes(user.role);
  }

  /**
   * Middleware to add admin context to request
   * @returns Express middleware function
   */
  public static addAdminContext() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next();
      }

      const permissions = rbacPermissionGate.getUserPermissions(
        req.user.role,
        req.user.assignedModules,
        req.user.maxReports
      );

      req.adminContext = {
        canAccessDashboard: permissions.canAccessAdminDashboard,
        canViewAnalytics: permissions.canViewSystemAnalytics,
        canViewAllReports: permissions.canViewAllReports,
        canManageUsers: permissions.canManageUsers,
        canManageOrganizations: permissions.canManageOrganizations,
        canEditSystemConfig: permissions.canEditSystemConfig,
        canEditPrompts: permissions.canEditPrompts,
        canViewDatabaseTables: permissions.canViewDatabaseTables,
        canEditDatabaseTables: permissions.canEditDatabaseTables,
      };

      next();
    };
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      adminContext?: {
        canAccessDashboard: boolean;
        canViewAnalytics: boolean;
        canViewAllReports: boolean;
        canManageUsers: boolean;
        canManageOrganizations: boolean;
        canEditSystemConfig: boolean;
        canEditPrompts: boolean;
        canViewDatabaseTables: boolean;
        canEditDatabaseTables: boolean;
      };
    }
  }
}
