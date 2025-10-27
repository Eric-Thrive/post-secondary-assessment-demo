import { Request, Response, NextFunction } from "express";
import { rbacPermissionGate } from "../rbac-permission-gate";
import { ModuleType, ResourceType, ActionType } from "../types";

/**
 * Module Gate - Controls access to K-12, Post-Secondary, and Tutoring modules
 */
export class ModuleGate {
  /**
   * Middleware to check if user can access a specific module
   * @param moduleType - The module to check access for
   * @returns Express middleware function
   */
  public static requireModuleAccess(moduleType: ModuleType) {
    return rbacPermissionGate.enforceAccess(
      ResourceType.MODULES,
      ActionType.VIEW,
      { moduleType }
    );
  }

  /**
   * Middleware to check if user can switch between modules
   * @returns Express middleware function
   */
  public static requireModuleSwitching() {
    return rbacPermissionGate.enforceAccess(
      ResourceType.MODULES,
      ActionType.SWITCH
    );
  }

  /**
   * Check if user has access to a specific module
   * @param user - The user to check
   * @param moduleType - The module to check access for
   * @returns Promise<boolean>
   */
  public static async hasModuleAccess(
    user: Express.User,
    moduleType: ModuleType
  ): Promise<boolean> {
    return rbacPermissionGate.checkAccess(
      user,
      ResourceType.MODULES,
      ActionType.VIEW,
      { moduleType }
    );
  }

  /**
   * Check if user can switch modules
   * @param user - The user to check
   * @returns Promise<boolean>
   */
  public static async canSwitchModules(user: Express.User): Promise<boolean> {
    return rbacPermissionGate.checkAccess(
      user,
      ResourceType.MODULES,
      ActionType.SWITCH
    );
  }

  /**
   * Get all modules a user has access to
   * @param user - The user to check
   * @returns Promise<ModuleType[]>
   */
  public static async getAccessibleModules(
    user: Express.User
  ): Promise<ModuleType[]> {
    const permissions = rbacPermissionGate.getUserPermissions(
      user.role,
      user.assignedModules,
      user.maxReports
    );
    return permissions.moduleAccess;
  }

  /**
   * Middleware factory for module-specific routes
   * @param moduleType - The module this route belongs to
   * @returns Express middleware function
   */
  public static forModule(moduleType: ModuleType) {
    return (req: Request, res: Response, next: NextFunction) => {
      // Add module context to request
      req.currentModule = moduleType;

      // Check module access
      return ModuleGate.requireModuleAccess(moduleType)(req, res, next);
    };
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      currentModule?: ModuleType;
    }
  }
}
