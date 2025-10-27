import { Request, Response, NextFunction } from "express";
import { UserRole, ModuleType } from "@shared/schema";

// Re-export enums for convenience
export { UserRole, ModuleType };

/**
 * Interface defining all possible permissions a user can have
 */
export interface UserPermissions {
  // Module access permissions
  canSwitchModules: boolean;
  moduleAccess: ModuleType[];

  // Admin dashboard permissions
  canAccessAdminDashboard: boolean;
  canViewSystemAnalytics: boolean;
  canViewAllReports: boolean;

  // System configuration permissions
  canEditPrompts: boolean;
  canEditSystemConfig: boolean;
  canViewDatabaseTables: boolean;
  canEditDatabaseTables: boolean;

  // User management permissions
  canManageUsers: boolean;
  canManageOrganizations: boolean;
  canViewOrgUsers: boolean;
  canEditOrgUsers: boolean;

  // Report permissions
  canCreateReports: boolean;
  canViewOwnReports: boolean;
  canViewOrgReports: boolean;
  canEditOwnReports: boolean;
  canEditOrgReports: boolean;
  canShareReports: boolean;

  // Demo-specific permissions
  reportLimit?: number; // undefined = unlimited, number = specific limit
  isDemoUser: boolean;
  canUpgradeAccount: boolean;
}

/**
 * Core permission gate interface for checking and enforcing access control
 */
export interface PermissionGate {
  /**
   * Check if a user has access to perform a specific action on a resource
   * @param user - The user to check permissions for
   * @param resource - The resource being accessed (e.g., 'reports', 'admin', 'modules')
   * @param action - The action being performed (e.g., 'create', 'read', 'update', 'delete')
   * @param context - Additional context for permission checking (e.g., organizationId, moduleType)
   * @returns Promise<boolean> - true if access is granted, false otherwise
   */
  checkAccess(
    user: Express.User,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<boolean>;

  /**
   * Express middleware function that enforces access control
   * Throws 401/403 errors if access is denied
   * @param resource - The resource being accessed
   * @param action - The action being performed
   * @param context - Additional context for permission checking
   */
  enforceAccess(
    resource: string,
    action: string,
    context?: Record<string, any>
  ): (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

/**
 * Permission error types for consistent error handling
 */
export interface PermissionError {
  code:
    | "INSUFFICIENT_PERMISSIONS"
    | "MODULE_ACCESS_DENIED"
    | "DEMO_LIMIT_EXCEEDED"
    | "ORGANIZATION_ACCESS_DENIED";
  message: string;
  requiredRole?: UserRole;
  requiredPermission?: string;
  currentRole?: UserRole;
  context?: Record<string, any>;
}

/**
 * Module-specific access error
 */
export interface ModuleAccessError extends PermissionError {
  code: "MODULE_ACCESS_DENIED";
  requestedModule: ModuleType;
  assignedModules: ModuleType[];
}

/**
 * Demo limit error
 */
export interface DemoLimitError extends PermissionError {
  code: "DEMO_LIMIT_EXCEEDED";
  currentCount: number;
  maxReports: number;
  upgradeUrl?: string;
}

/**
 * Organization access error
 */
export interface OrganizationAccessError extends PermissionError {
  code: "ORGANIZATION_ACCESS_DENIED";
  requestedOrganization: string;
  userOrganization?: string;
}

// Note: Express.User interface is defined in auth.ts to avoid circular dependencies

/**
 * Permission context for specific operations
 */
export interface PermissionContext {
  organizationId?: string;
  moduleType?: ModuleType;
  resourceId?: string;
  targetUserId?: number;
  reportId?: string;
  [key: string]: any;
}

/**
 * Resource types for permission checking
 */
export enum ResourceType {
  MODULES = "modules",
  REPORTS = "reports",
  ADMIN = "admin",
  USERS = "users",
  ORGANIZATIONS = "organizations",
  SYSTEM_CONFIG = "system_config",
  PROMPTS = "prompts",
  DATABASE = "database",
}

/**
 * Action types for permission checking
 */
export enum ActionType {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  SWITCH = "switch",
  MANAGE = "manage",
  VIEW = "view",
  EDIT = "edit",
  SHARE = "share",
}
