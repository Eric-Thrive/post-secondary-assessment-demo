import { describe, it, expect, beforeEach } from "vitest";
import { RoleBasedAccessControl } from "../roleBasedAccessControl";
import { AuthenticatedUser, ModuleType, UserRole } from "@/types/unified-auth";

describe("RoleBasedAccessControl", () => {
  let mockUser: AuthenticatedUser;

  beforeEach(() => {
    mockUser = {
      id: "test-user-1",
      email: "test@example.com",
      name: "Test User",
      username: "testuser",
      role: UserRole.CUSTOMER,
      organizationId: "org-1",
      moduleAccess: [
        {
          moduleType: ModuleType.K12,
          accessLevel: "full",
          permissions: [
            { action: "create", resource: "assessment", granted: true },
            { action: "read", resource: "assessment", granted: true },
            { action: "update", resource: "assessment", granted: true },
            { action: "delete", resource: "assessment", granted: false },
          ],
        },
      ],
      preferences: {
        dashboardLayout: "grid",
        theme: "auto",
        notifications: {
          email: true,
          browser: true,
          reportComplete: true,
          systemUpdates: false,
        },
      },
      lastLogin: new Date(),
    };
  });

  describe("hasRole", () => {
    it("should return true for exact role match", () => {
      expect(RoleBasedAccessControl.hasRole(mockUser, UserRole.CUSTOMER)).toBe(
        true
      );
    });

    it("should return false for role mismatch", () => {
      expect(
        RoleBasedAccessControl.hasRole(mockUser, UserRole.SYSTEM_ADMIN)
      ).toBe(false);
    });

    it("should return true for developer accessing lower roles", () => {
      mockUser.role = UserRole.DEVELOPER;
      expect(RoleBasedAccessControl.hasRole(mockUser, UserRole.CUSTOMER)).toBe(
        true
      );
      expect(RoleBasedAccessControl.hasRole(mockUser, UserRole.ORG_ADMIN)).toBe(
        true
      );
      expect(
        RoleBasedAccessControl.hasRole(mockUser, UserRole.SYSTEM_ADMIN)
      ).toBe(true);
    });

    it("should return true for system admin accessing lower roles", () => {
      mockUser.role = UserRole.SYSTEM_ADMIN;
      expect(RoleBasedAccessControl.hasRole(mockUser, UserRole.CUSTOMER)).toBe(
        true
      );
      expect(RoleBasedAccessControl.hasRole(mockUser, UserRole.ORG_ADMIN)).toBe(
        true
      );
      expect(RoleBasedAccessControl.hasRole(mockUser, UserRole.DEMO)).toBe(
        true
      );
    });
  });

  describe("hasAnyRole", () => {
    it("should return true if user has any of the specified roles", () => {
      expect(
        RoleBasedAccessControl.hasAnyRole(mockUser, [
          UserRole.CUSTOMER,
          UserRole.SYSTEM_ADMIN,
        ])
      ).toBe(true);
    });

    it("should return false if user has none of the specified roles", () => {
      expect(
        RoleBasedAccessControl.hasAnyRole(mockUser, [
          UserRole.DEVELOPER,
          UserRole.SYSTEM_ADMIN,
        ])
      ).toBe(false);
    });
  });

  describe("hasModuleAccess", () => {
    it("should return true for modules with full access", () => {
      expect(
        RoleBasedAccessControl.hasModuleAccess(mockUser, ModuleType.K12)
      ).toBe(true);
    });

    it("should return true for modules with restricted access", () => {
      mockUser.moduleAccess[0].accessLevel = "restricted";
      expect(
        RoleBasedAccessControl.hasModuleAccess(mockUser, ModuleType.K12)
      ).toBe(true);
    });

    it("should return false for modules without access", () => {
      expect(
        RoleBasedAccessControl.hasModuleAccess(mockUser, ModuleType.TUTORING)
      ).toBe(false);
    });
  });

  describe("getModuleAccessLevel", () => {
    it("should return correct access level for accessible modules", () => {
      expect(
        RoleBasedAccessControl.getModuleAccessLevel(mockUser, ModuleType.K12)
      ).toBe("full");
    });

    it("should return 'none' for inaccessible modules", () => {
      expect(
        RoleBasedAccessControl.getModuleAccessLevel(
          mockUser,
          ModuleType.TUTORING
        )
      ).toBe("none");
    });
  });

  describe("hasPermission", () => {
    it("should return true for developers (all permissions)", () => {
      mockUser.role = UserRole.DEVELOPER;
      expect(
        RoleBasedAccessControl.hasPermission(
          mockUser,
          "delete",
          "assessment",
          ModuleType.K12
        )
      ).toBe(true);
    });

    it("should return true for granted permissions", () => {
      expect(
        RoleBasedAccessControl.hasPermission(
          mockUser,
          "create",
          "assessment",
          ModuleType.K12
        )
      ).toBe(true);
    });

    it("should return false for denied permissions", () => {
      expect(
        RoleBasedAccessControl.hasPermission(
          mockUser,
          "delete",
          "assessment",
          ModuleType.K12
        )
      ).toBe(false);
    });

    it("should return false for permissions on inaccessible modules", () => {
      expect(
        RoleBasedAccessControl.hasPermission(
          mockUser,
          "create",
          "assessment",
          ModuleType.TUTORING
        )
      ).toBe(false);
    });
  });

  describe("hasOrganizationAccess", () => {
    it("should return true for developers (access to all organizations)", () => {
      mockUser.role = UserRole.DEVELOPER;
      expect(
        RoleBasedAccessControl.hasOrganizationAccess(mockUser, "other-org")
      ).toBe(true);
    });

    it("should return true for system admins (access to all organizations)", () => {
      mockUser.role = UserRole.SYSTEM_ADMIN;
      expect(
        RoleBasedAccessControl.hasOrganizationAccess(mockUser, "other-org")
      ).toBe(true);
    });

    it("should return true for same organization access", () => {
      expect(
        RoleBasedAccessControl.hasOrganizationAccess(mockUser, "org-1")
      ).toBe(true);
    });

    it("should return false for different organization access", () => {
      expect(
        RoleBasedAccessControl.hasOrganizationAccess(mockUser, "other-org")
      ).toBe(false);
    });

    it("should return true when no target organization is specified", () => {
      expect(RoleBasedAccessControl.hasOrganizationAccess(mockUser)).toBe(true);
    });
  });

  describe("canPerformAdminActions", () => {
    it("should return true for admin roles", () => {
      mockUser.role = UserRole.SYSTEM_ADMIN;
      expect(RoleBasedAccessControl.canPerformAdminActions(mockUser)).toBe(
        true
      );

      mockUser.role = UserRole.ORG_ADMIN;
      expect(RoleBasedAccessControl.canPerformAdminActions(mockUser)).toBe(
        true
      );

      mockUser.role = UserRole.DEVELOPER;
      expect(RoleBasedAccessControl.canPerformAdminActions(mockUser)).toBe(
        true
      );
    });

    it("should return false for non-admin roles", () => {
      mockUser.role = UserRole.CUSTOMER;
      expect(RoleBasedAccessControl.canPerformAdminActions(mockUser)).toBe(
        false
      );

      mockUser.role = UserRole.DEMO;
      expect(RoleBasedAccessControl.canPerformAdminActions(mockUser)).toBe(
        false
      );
    });
  });

  describe("validateDemoAccess", () => {
    it("should return non-demo status for regular users", () => {
      const validation = RoleBasedAccessControl.validateDemoAccess(mockUser);
      expect(validation.isDemo).toBe(false);
      expect(validation.isExpired).toBe(false);
      expect(validation.limitations).toHaveLength(0);
    });

    it("should return demo status for demo users", () => {
      mockUser.role = UserRole.DEMO;
      mockUser.demoExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const validation = RoleBasedAccessControl.validateDemoAccess(mockUser);
      expect(validation.isDemo).toBe(true);
      expect(validation.isExpired).toBe(false);
      expect(validation.daysRemaining).toBe(7);
      expect(validation.limitations.length).toBeGreaterThan(0);
    });

    it("should detect expired demo access", () => {
      mockUser.role = UserRole.DEMO;
      mockUser.demoExpiry = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

      const validation = RoleBasedAccessControl.validateDemoAccess(mockUser);
      expect(validation.isDemo).toBe(true);
      expect(validation.isExpired).toBe(true);
      expect(validation.daysRemaining).toBe(0);
    });
  });

  describe("getUserCapabilities", () => {
    it("should return comprehensive user capabilities", () => {
      const capabilities = RoleBasedAccessControl.getUserCapabilities(mockUser);

      expect(capabilities.role).toBe(UserRole.CUSTOMER);
      expect(capabilities.modules).toEqual([ModuleType.K12]);
      expect(capabilities.adminAccess).toBe(false);
      expect(capabilities.systemAccess).toBe(false);
      expect(capabilities.organizationId).toBe("org-1");
      expect(capabilities.demoStatus).toBeUndefined();
    });

    it("should include demo status for demo users", () => {
      mockUser.role = UserRole.DEMO;
      mockUser.demoExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const capabilities = RoleBasedAccessControl.getUserCapabilities(mockUser);

      expect(capabilities.demoStatus).toBeDefined();
      expect(capabilities.demoStatus?.isDemo).toBe(true);
      expect(capabilities.demoStatus?.isExpired).toBe(false);
      expect(capabilities.demoStatus?.daysRemaining).toBe(7);
    });
  });

  describe("createPermissionChecker", () => {
    it("should create a permission checker with all methods", () => {
      const checker = RoleBasedAccessControl.createPermissionChecker(mockUser);

      expect(typeof checker.hasRole).toBe("function");
      expect(typeof checker.hasAnyRole).toBe("function");
      expect(typeof checker.hasModuleAccess).toBe("function");
      expect(typeof checker.hasPermission).toBe("function");
      expect(typeof checker.canPerformAdminActions).toBe("function");
      expect(typeof checker.canManageUsers).toBe("function");
      expect(typeof checker.canAccessSystemFeatures).toBe("function");
      expect(typeof checker.hasOrganizationAccess).toBe("function");

      // Test that methods work correctly
      expect(checker.hasRole(UserRole.CUSTOMER)).toBe(true);
      expect(checker.hasModuleAccess(ModuleType.K12)).toBe(true);
      expect(checker.canPerformAdminActions()).toBe(false);
    });
  });
});
