import {
  AuthenticatedUser,
  ModuleAccess,
  UserPreferences,
  ModuleType,
  UserRole,
} from "@/types/unified-auth";

// Existing User type from AuthContext
interface LegacyUser {
  id: number;
  username: string;
  customerId: string;
  customerName: string | null;
  role: string;
}

/**
 * Converts legacy User type to new AuthenticatedUser type
 * This is a temporary adapter during the migration to unified auth
 */
export const adaptLegacyUser = (legacyUser: LegacyUser): AuthenticatedUser => {
  // Map legacy role strings to UserRole enum
  const mapRole = (roleString: string): UserRole => {
    switch (roleString.toLowerCase()) {
      case "developer":
        return UserRole.DEVELOPER;
      case "system_admin":
        return UserRole.SYSTEM_ADMIN;
      case "org_admin":
        return UserRole.ORG_ADMIN;
      case "customer":
        return UserRole.CUSTOMER;
      case "demo":
        return UserRole.DEMO;
      default:
        return UserRole.CUSTOMER;
    }
  };

  // Determine module access based on legacy role
  const getModuleAccess = (role: UserRole): ModuleAccess[] => {
    switch (role) {
      case UserRole.DEVELOPER:
      case UserRole.SYSTEM_ADMIN:
        // Full access to all modules
        return [
          {
            moduleType: ModuleType.K12,
            accessLevel: "full",
            permissions: [
              { action: "read", resource: "reports", granted: true },
              { action: "write", resource: "reports", granted: true },
              { action: "delete", resource: "reports", granted: true },
            ],
          },
          {
            moduleType: ModuleType.POST_SECONDARY,
            accessLevel: "full",
            permissions: [
              { action: "read", resource: "reports", granted: true },
              { action: "write", resource: "reports", granted: true },
              { action: "delete", resource: "reports", granted: true },
            ],
          },
          {
            moduleType: ModuleType.TUTORING,
            accessLevel: "full",
            permissions: [
              { action: "read", resource: "reports", granted: true },
              { action: "write", resource: "reports", granted: true },
              { action: "delete", resource: "reports", granted: true },
            ],
          },
        ];
      case UserRole.ORG_ADMIN:
        // Access based on organization assignment (default to post-secondary for now)
        return [
          {
            moduleType: ModuleType.POST_SECONDARY,
            accessLevel: "full",
            permissions: [
              { action: "read", resource: "reports", granted: true },
              { action: "write", resource: "reports", granted: true },
              { action: "delete", resource: "reports", granted: true },
            ],
          },
        ];
      case UserRole.CUSTOMER:
        // Default customer access to post-secondary
        return [
          {
            moduleType: ModuleType.POST_SECONDARY,
            accessLevel: "full",
            permissions: [
              { action: "read", resource: "reports", granted: true },
              { action: "write", resource: "reports", granted: true },
            ],
          },
        ];
      case UserRole.DEMO:
        // Demo access to post-secondary with restrictions
        return [
          {
            moduleType: ModuleType.POST_SECONDARY,
            accessLevel: "restricted",
            permissions: [
              { action: "read", resource: "reports", granted: true },
              { action: "write", resource: "reports", granted: true },
            ],
          },
        ];
      default:
        return [];
    }
  };

  const role = mapRole(legacyUser.role);
  const moduleAccess = getModuleAccess(role);

  // Default user preferences
  const defaultPreferences: UserPreferences = {
    dashboardLayout: "grid",
    theme: "light",
    notifications: {
      email: true,
      browser: true,
      reportComplete: true,
      systemUpdates: false,
    },
  };

  return {
    id: legacyUser.id.toString(),
    email: `${legacyUser.username}@example.com`, // Placeholder email
    name: legacyUser.customerName || legacyUser.username,
    username: legacyUser.username,
    role,
    organizationId: legacyUser.customerId,
    moduleAccess,
    preferences: defaultPreferences,
    lastLogin: new Date(),
    demoExpiry:
      role === UserRole.DEMO
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : undefined,
  };
};

/**
 * Type guard to check if a user object is the legacy format
 */
export const isLegacyUser = (user: any): user is LegacyUser => {
  return (
    user &&
    typeof user.id === "number" &&
    typeof user.username === "string" &&
    typeof user.customerId === "string" &&
    typeof user.role === "string" &&
    !user.moduleAccess
  ); // New format has moduleAccess
};
