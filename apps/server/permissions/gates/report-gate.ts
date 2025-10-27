import { Request, Response, NextFunction } from "express";
import { rbacPermissionGate } from "../rbac-permission-gate";
import { ResourceType, ActionType, UserRole } from "../types";

/**
 * Report Gate - Controls report creation, viewing, and editing permissions
 */
export class ReportGate {
  /**
   * Middleware to check if user can create reports
   * @returns Express middleware function
   */
  public static requireCreateAccess() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          code: "AUTHENTICATION_REQUIRED",
        });
      }

      // For demo users, check report limit
      if (req.user.role === UserRole.DEMO) {
        if (req.user.reportCount >= req.user.maxReports) {
          return res.status(403).json({
            error: "Demo report limit exceeded",
            code: "DEMO_LIMIT_EXCEEDED",
            currentCount: req.user.reportCount,
            maxReports: req.user.maxReports,
            upgradeUrl: "/upgrade",
          });
        }
      }

      return rbacPermissionGate.enforceAccess(
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: req.user.reportCount }
      )(req, res, next);
    };
  }

  /**
   * Middleware to check if user can view a specific report
   * @param options - Options for report access checking
   * @returns Express middleware function
   */
  public static requireViewAccess(options?: {
    checkOwnership?: boolean;
    checkOrganization?: boolean;
  }) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          code: "AUTHENTICATION_REQUIRED",
        });
      }

      const context: Record<string, any> = {};

      // Add ownership context if needed
      if (options?.checkOwnership) {
        const reportUserId = req.params.userId || req.body.createdByUserId;
        context.isOwnReport = reportUserId
          ? parseInt(reportUserId) === req.user.id
          : false;
      }

      // Add organization context if needed
      if (options?.checkOrganization) {
        const reportOrgId =
          req.params.organizationId || req.body.organizationId;
        context.isOrgReport = reportOrgId === req.user.organizationId;
      }

      return rbacPermissionGate.enforceAccess(
        ResourceType.REPORTS,
        ActionType.VIEW,
        context
      )(req, res, next);
    };
  }

  /**
   * Middleware to check if user can edit a specific report
   * @param options - Options for report edit checking
   * @returns Express middleware function
   */
  public static requireEditAccess(options?: {
    checkOwnership?: boolean;
    checkOrganization?: boolean;
  }) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          code: "AUTHENTICATION_REQUIRED",
        });
      }

      const context: Record<string, any> = {};

      // Add ownership context if needed
      if (options?.checkOwnership) {
        const reportUserId = req.params.userId || req.body.createdByUserId;
        context.isOwnReport = reportUserId
          ? parseInt(reportUserId) === req.user.id
          : false;
      }

      // Add organization context if needed
      if (options?.checkOrganization) {
        const reportOrgId =
          req.params.organizationId || req.body.organizationId;
        context.isOrgReport = reportOrgId === req.user.organizationId;
      }

      return rbacPermissionGate.enforceAccess(
        ResourceType.REPORTS,
        ActionType.EDIT,
        context
      )(req, res, next);
    };
  }

  /**
   * Middleware to check if user can share reports
   * @returns Express middleware function
   */
  public static requireShareAccess() {
    return rbacPermissionGate.enforceAccess(
      ResourceType.REPORTS,
      ActionType.SHARE
    );
  }

  /**
   * Check if user can create reports
   * @param user - The user to check
   * @returns Promise<boolean>
   */
  public static async canCreateReports(user: Express.User): Promise<boolean> {
    // Check demo limit
    if (user.role === UserRole.DEMO && user.reportCount >= user.maxReports) {
      return false;
    }

    return rbacPermissionGate.checkAccess(
      user,
      ResourceType.REPORTS,
      ActionType.CREATE,
      { currentReportCount: user.reportCount }
    );
  }

  /**
   * Check if user can view a specific report
   * @param user - The user to check
   * @param reportContext - Context about the report (ownership, organization)
   * @returns Promise<boolean>
   */
  public static async canViewReport(
    user: Express.User,
    reportContext: {
      isOwnReport?: boolean;
      isOrgReport?: boolean;
      organizationId?: string;
    }
  ): Promise<boolean> {
    return rbacPermissionGate.checkAccess(
      user,
      ResourceType.REPORTS,
      ActionType.VIEW,
      reportContext
    );
  }

  /**
   * Check if user can edit a specific report
   * @param user - The user to check
   * @param reportContext - Context about the report (ownership, organization)
   * @returns Promise<boolean>
   */
  public static async canEditReport(
    user: Express.User,
    reportContext: {
      isOwnReport?: boolean;
      isOrgReport?: boolean;
      organizationId?: string;
    }
  ): Promise<boolean> {
    return rbacPermissionGate.checkAccess(
      user,
      ResourceType.REPORTS,
      ActionType.EDIT,
      reportContext
    );
  }

  /**
   * Check if user can share reports
   * @param user - The user to check
   * @returns Promise<boolean>
   */
  public static async canShareReports(user: Express.User): Promise<boolean> {
    return rbacPermissionGate.checkAccess(
      user,
      ResourceType.REPORTS,
      ActionType.SHARE
    );
  }

  /**
   * Get report access summary for a user
   * @param user - The user to check
   * @returns Object with report access capabilities
   */
  public static getReportAccess(user: Express.User) {
    const permissions = rbacPermissionGate.getUserPermissions(
      user.role,
      user.assignedModules,
      user.maxReports
    );

    return {
      canCreate:
        permissions.canCreateReports &&
        (!permissions.isDemoUser ||
          (permissions.reportLimit !== undefined &&
            user.reportCount < permissions.reportLimit)),
      canViewOwn: permissions.canViewOwnReports,
      canViewOrg: permissions.canViewOrgReports,
      canViewAll: permissions.canViewAllReports,
      canEditOwn: permissions.canEditOwnReports,
      canEditOrg: permissions.canEditOrgReports,
      canShare: permissions.canShareReports,
      reportLimit: permissions.reportLimit,
      currentCount: user.reportCount,
      isDemoUser: permissions.isDemoUser,
      canUpgrade: permissions.canUpgradeAccount,
    };
  }

  /**
   * Middleware to add report context to request
   * @returns Express middleware function
   */
  public static addReportContext() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next();
      }

      req.reportContext = ReportGate.getReportAccess(req.user);
      next();
    };
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      reportContext?: {
        canCreate: boolean;
        canViewOwn: boolean;
        canViewOrg: boolean;
        canViewAll: boolean;
        canEditOwn: boolean;
        canEditOrg: boolean;
        canShare: boolean;
        reportLimit?: number;
        currentCount: number;
        isDemoUser: boolean;
        canUpgrade: boolean;
      };
    }
  }
}
