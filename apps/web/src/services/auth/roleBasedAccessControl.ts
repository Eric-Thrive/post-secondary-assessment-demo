import {
  AuthenticatedUser,
  ModuleAccess,
  ModuleType,
  UserRole,
  Permission,
} from "@/types/unified-auth";

/**
 * Role-based access control service for managing user permissions
 * and module access validation
 */
export class RoleBasedAccessControl {
  /**
   * Role hierarchy for permission inheritance
   */
  private static readonly ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
    [UserRole.DEVELOPER]: [
      UserRole.DEVELOPER,
      UserRole.SYSTEM_ADMIN,
      UserRole.ORG_ADMIN,
      UserRole.CUSTOMER,
      UserRole.DEMO,
    ],
    [UserRole.SYSTEM_ADMIN]: [
      UserRole.SYSTEM_ADMIN,
      UserRole.ORG_ADMIN,
      UserRole.CUSTOMER,
      UserRole.DEMO,
    ],
    [UserRole.ORG_ADMIN]: [
      UserRole.ORG_ADMIN,
      UserRole.CUSTOMER,
      UserRole.DEMO,
    ],
    [UserRole.CUSTOMER]: [UserRole.CUSTOMER],
    [UserRole.DEMO]: [UserRole.DEMO],
  };

  /**
   * Default module access by role
   */
  private static readonly DEFAULT_MODULE_ACCESS: Record<
    UserRole,
    ModuleType[]
  > = {
    [UserRole.DEVELOPER]: [
      ModuleType.K12,
      ModuleType.POST_SECONDARY,
      ModuleType.TUTORING,
    ],
    [UserRole.SYSTEM_ADMIN]: [
      ModuleType.K12,
      ModuleType.POST_SECONDARY,
      ModuleType.TUTORING,
    ],
    [UserRole.ORG_ADMIN]: [], // Determined by organization assignments
    [UserRole.CUSTOMER]: [], // Determined by subscription/assignments
    [UserRole.DEMO]: [], // Determined by demo configuration
  };

  /**
   * Validates if a user has a specific role or higher
   */
  static hasRole(user: AuthenticatedUser, requiredRole: UserRole): boolean {
    const userHierarchy = this.ROLE_HIERARCHY[user.role] || [];
    return userHierarchy.includes(requiredRole);
  }

  /**
   * Validates if a user has any of the specified roles
   */
  static hasAnyRole(user: AuthenticatedUser, roles: UserRole[]): boolean {
    return roles.some((role) => this.hasRole(user, role));
  }

  /**
   * Validates module access for a user
   */
  static hasModuleAccess(
    user: AuthenticatedUser,
    moduleType: ModuleType
  ): boolean {
    return user.moduleAccess.some(
      (access) =>
        access.moduleType === moduleType &&
        (access.accessLevel === "full" || access.accessLevel === "restricted")
    );
  }

  /**
   * Gets the access level for a specific module
   */
  static getModuleAccessLevel(
    user: AuthenticatedUser,
    moduleType: ModuleType
  ): "full" | "restricted" | "none" {
    const access = user.moduleAccess.find(
      (access) => access.moduleType === moduleType
    );

    return access?.accessLevel || "none";
  }

  /**
   * Validates specific permission for a user
   */
  static hasPermission(
    user: AuthenticatedUser,
    action: string,
    resource: string,
    moduleType?: ModuleType
  ): boolean {
    // Developers have all permissions
    if (user.role === UserRole.DEVELOPER) {
      return true;
    }

    // Check module-specific permissions
    if (moduleType) {
      const moduleAccess = user.moduleAccess.find(
        (access) => access.moduleType === moduleType
      );

      if (!moduleAccess) return false;

      return moduleAccess.permissions.some(
        (permission) =>
          permission.action === action &&
          permission.resource === resource &&
          permission.granted
      );
    }

    // Check global permissions across all modules
    return user.moduleAccess.some((moduleAccess) =>
      moduleAccess.permissions.some(
        (permission) =>
          permission.action === action &&
          permission.resource === resource &&
          permission.granted
      )
    );
  }

  /**
   * Gets all permissions for a user in a specific module
   */
  static getModulePermissions(
    user: AuthenticatedUser,
    moduleType: ModuleType
  ): Permission[] {
    const moduleAccess = user.moduleAccess.find(
      (access) => access.moduleType === moduleType
    );

    return moduleAccess?.permissions || [];
  }

  /**
   * Validates organization-based access restrictions
   */
  static hasOrganizationAccess(
    user: AuthenticatedUser,
    targetOrganizationId?: string
  ): boolean {
    // Developers and System Admins have access to all organizations
    if (this.hasAnyRole(user, [UserRole.DEVELOPER, UserRole.SYSTEM_ADMIN])) {
      return true;
    }

    // Org Admins can only access their own organization
    if (user.role === UserRole.ORG_ADMIN) {
      return (
        !targetOrganizationId || user.organizationId === targetOrganizationId
      );
    }

    // Customers and Demo users can only access their own organization
    return (
      !targetOrganizationId || user.organizationId === targetOrganizationId
    );
  }

  /**
   * Checks if user can perform admin actions
   */
  static canPerformAdminActions(user: AuthenticatedUser): boolean {
    return this.hasAnyRole(user, [
      UserRole.DEVELOPER,
      UserRole.SYSTEM_ADMIN,
      UserRole.ORG_ADMIN,
    ]);
  }

  /**
   * Checks if user can manage other users
   */
  static canManageUsers(user: AuthenticatedUser): boolean {
    return this.hasAnyRole(user, [
      UserRole.DEVELOPER,
      UserRole.SYSTEM_ADMIN,
      UserRole.ORG_ADMIN,
    ]);
  }

  /**
   * Checks if user can access system-level features
   */
  static canAccessSystemFeatures(user: AuthenticatedUser): boolean {
    return this.hasAnyRole(user, [UserRole.DEVELOPER, UserRole.SYSTEM_ADMIN]);
  }

  /**
   * Validates demo user limitations
   */
  static validateDemoAccess(user: AuthenticatedUser): {
    isDemo: boolean;
    isExpired: boolean;
    daysRemaining?: number;
    limitations: string[];
  } {
    const isDemo = user.role === UserRole.DEMO;

    if (!isDemo) {
      return {
        isDemo: false,
        isExpired: false,
        limitations: [],
      };
    }

    const now = new Date();
    const isExpired = user.demoExpiry ? user.demoExpiry < now : false;
    const daysRemaining = user.demoExpiry
      ? Math.max(
          0,
          Math.ceil(
            (user.demoExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      : undefined;

    const limitations = [
      "Limited to demo data only",
      "Cannot save reports permanently",
      "Limited assessment processing",
      "No access to advanced features",
    ];

    return {
      isDemo: true,
      isExpired,
      daysRemaining,
      limitations,
    };
  }

  /**
   * Gets user capabilities summary
   */
  static getUserCapabilities(user: AuthenticatedUser): {
    role: UserRole;
    modules: ModuleType[];
    adminAccess: boolean;
    systemAccess: boolean;
    organizationId?: string;
    demoStatus?: {
      isDemo: boolean;
      isExpired: boolean;
      daysRemaining?: number;
    };
  } {
    const accessibleModules = user.moduleAccess
      .filter(
        (access) =>
          access.accessLevel === "full" || access.accessLevel === "restricted"
      )
      .map((access) => access.moduleType);

    const demoValidation = this.validateDemoAccess(user);

    return {
      role: user.role,
      modules: accessibleModules,
      adminAccess: this.canPerformAdminActions(user),
      systemAccess: this.canAccessSystemFeatures(user),
      organizationId: user.organizationId,
      demoStatus: demoValidation.isDemo
        ? {
            isDemo: demoValidation.isDemo,
            isExpired: demoValidation.isExpired,
            daysRemaining: demoValidation.daysRemaining,
          }
        : undefined,
    };
  }

  /**
   * Creates a permission checker function for a specific user
   */
  static createPermissionChecker(user: AuthenticatedUser) {
    return {
      hasRole: (role: UserRole) => this.hasRole(user, role),
      hasAnyRole: (roles: UserRole[]) => this.hasAnyRole(user, roles),
      hasModuleAccess: (moduleType: ModuleType) =>
        this.hasModuleAccess(user, moduleType),
      hasPermission: (
        action: string,
        resource: string,
        moduleType?: ModuleType
      ) => this.hasPermission(user, action, resource, moduleType),
      canPerformAdminActions: () => this.canPerformAdminActions(user),
      canManageUsers: () => this.canManageUsers(user),
      canAccessSystemFeatures: () => this.canAccessSystemFeatures(user),
      hasOrganizationAccess: (orgId?: string) =>
        this.hasOrganizationAccess(user, orgId),
    };
  }
}
