import { Request, Response, NextFunction } from "express";
import { rbacPermissionGate } from "../rbac-permission-gate";
import { ResourceType, ActionType, UserRole } from "../types";

/**
 * System Config Gate - Controls access to prompts, AI config, and lookup table access
 */
export class SystemConfigGate {
  /**
   * Middleware to check if user can view system configuration
   * @returns Express middleware function
   */
  public static requireConfigView() {
    return rbacPermissionGate.enforceAccess(
      ResourceType.SYSTEM_CONFIG,
      ActionType.VIEW
    );
  }

  /**
   * Middleware to check if user can edit system configuration
   * @returns Express middleware function
   */
  public static requireConfigEdit() {
    return rbacPermissionGate.enforceAccess(
      ResourceType.SYSTEM_CONFIG,
      ActionType.EDIT
    );
  }

  /**
   * Middleware to check if user can view prompts
   * @returns Express middleware function
   */
  public static requirePromptView() {
    return rbacPermissionGate.enforceAccess(
      ResourceType.PROMPTS,
      ActionType.VIEW
    );
  }

  /**
   * Middleware to check if user can edit prompts
   * @returns Express middleware function
   */
  public static requirePromptEdit() {
    return rbacPermissionGate.enforceAccess(
      ResourceType.PROMPTS,
      ActionType.EDIT
    );
  }

  /**
   * Middleware to check if user can view database tables
   * @returns Express middleware function
   */
  public static requireDatabaseView() {
    return rbacPermissionGate.enforceAccess(
      ResourceType.DATABASE,
      ActionType.VIEW
    );
  }

  /**
   * Middleware to check if user can edit database tables
   * @returns Express middleware function
   */
  public static requireDatabaseEdit() {
    return rbacPermissionGate.enforceAccess(
      ResourceType.DATABASE,
      ActionType.EDIT
    );
  }

  /**
   * Middleware to require developer-only access (for sensitive operations)
   * @returns Express middleware function
   */
  public static requireDeveloperOnly() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          code: "AUTHENTICATION_REQUIRED",
        });
      }

      if (req.user.role !== UserRole.DEVELOPER) {
        return res.status(403).json({
          error: "Developer access required for this operation",
          code: "INSUFFICIENT_PERMISSIONS",
          requiredRole: UserRole.DEVELOPER,
          currentRole: req.user.role,
        });
      }

      next();
    };
  }

  /**
   * Check if user can view system configuration
   * @param user - The user to check
   * @returns Promise<boolean>
   */
  public static async canViewConfig(user: Express.User): Promise<boolean> {
    return rbacPermissionGate.checkAccess(
      user,
      ResourceType.SYSTEM_CONFIG,
      ActionType.VIEW
    );
  }

  /**
   * Check if user can edit system configuration
   * @param user - The user to check
   * @returns Promise<boolean>
   */
  public static async canEditConfig(user: Express.User): Promise<boolean> {
    return rbacPermissionGate.checkAccess(
      user,
      ResourceType.SYSTEM_CONFIG,
      ActionType.EDIT
    );
  }

  /**
   * Check if user can view prompts
   * @param user - The user to check
   * @returns Promise<boolean>
   */
  public static async canViewPrompts(user: Express.User): Promise<boolean> {
    return rbacPermissionGate.checkAccess(
      user,
      ResourceType.PROMPTS,
      ActionType.VIEW
    );
  }

  /**
   * Check if user can edit prompts
   * @param user - The user to check
   * @returns Promise<boolean>
   */
  public static async canEditPrompts(user: Express.User): Promise<boolean> {
    return rbacPermissionGate.checkAccess(
      user,
      ResourceType.PROMPTS,
      ActionType.EDIT
    );
  }

  /**
   * Check if user can view database tables
   * @param user - The user to check
   * @returns Promise<boolean>
   */
  public static async canViewDatabase(user: Express.User): Promise<boolean> {
    return rbacPermissionGate.checkAccess(
      user,
      ResourceType.DATABASE,
      ActionType.VIEW
    );
  }

  /**
   * Check if user can edit database tables
   * @param user - The user to check
   * @returns Promise<boolean>
   */
  public static async canEditDatabase(user: Express.User): Promise<boolean> {
    return rbacPermissionGate.checkAccess(
      user,
      ResourceType.DATABASE,
      ActionType.EDIT
    );
  }

  /**
   * Get system configuration access summary for a user
   * @param user - The user to check
   * @returns Object with system config access capabilities
   */
  public static getSystemConfigAccess(user: Express.User) {
    const permissions = rbacPermissionGate.getUserPermissions(
      user.role,
      user.assignedModules,
      user.maxReports
    );

    return {
      canViewConfig:
        permissions.canEditSystemConfig || permissions.canViewDatabaseTables,
      canEditConfig: permissions.canEditSystemConfig,
      canViewPrompts:
        permissions.canEditPrompts || permissions.canEditSystemConfig,
      canEditPrompts: permissions.canEditPrompts,
      canViewDatabase: permissions.canViewDatabaseTables,
      canEditDatabase: permissions.canEditDatabaseTables,
      isDeveloper: user.role === UserRole.DEVELOPER,
      isAdmin: user.role === UserRole.ADMIN,
      accessLevel:
        user.role === UserRole.DEVELOPER
          ? ("full" as const)
          : user.role === UserRole.ADMIN
          ? ("limited" as const)
          : ("none" as const),
    };
  }

  /**
   * Middleware to add system config context to request
   * @returns Express middleware function
   */
  public static addSystemConfigContext() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next();
      }

      req.systemConfigContext = SystemConfigGate.getSystemConfigAccess(
        req.user
      );
      next();
    };
  }

  /**
   * Middleware for AI configuration access
   * @param action - The action being performed (view, edit)
   * @returns Express middleware function
   */
  public static requireAIConfigAccess(action: "view" | "edit") {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          code: "AUTHENTICATION_REQUIRED",
        });
      }

      const permissions = rbacPermissionGate.getUserPermissions(
        req.user.role,
        req.user.assignedModules,
        req.user.maxReports
      );

      const hasAccess =
        action === "view"
          ? permissions.canEditSystemConfig || permissions.canViewDatabaseTables
          : permissions.canEditSystemConfig;

      if (!hasAccess) {
        return res.status(403).json({
          error: `Insufficient permissions to ${action} AI configuration`,
          code: "INSUFFICIENT_PERMISSIONS",
          requiredPermission: `${action}_ai_config`,
          currentRole: req.user.role,
        });
      }

      next();
    };
  }

  /**
   * Middleware for lookup table access
   * @param action - The action being performed (view, edit)
   * @returns Express middleware function
   */
  public static requireLookupTableAccess(action: "view" | "edit") {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          code: "AUTHENTICATION_REQUIRED",
        });
      }

      const permissions = rbacPermissionGate.getUserPermissions(
        req.user.role,
        req.user.assignedModules,
        req.user.maxReports
      );

      const hasAccess =
        action === "view"
          ? permissions.canEditSystemConfig || permissions.canViewDatabaseTables
          : permissions.canEditDatabaseTables;

      if (!hasAccess) {
        return res.status(403).json({
          error: `Insufficient permissions to ${action} lookup tables`,
          code: "INSUFFICIENT_PERMISSIONS",
          requiredPermission: `${action}_lookup_tables`,
          currentRole: req.user.role,
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
      systemConfigContext?: {
        canViewConfig: boolean;
        canEditConfig: boolean;
        canViewPrompts: boolean;
        canEditPrompts: boolean;
        canViewDatabase: boolean;
        canEditDatabase: boolean;
        isDeveloper: boolean;
        isAdmin: boolean;
        accessLevel: "full" | "limited" | "none";
      };
    }
  }
}
