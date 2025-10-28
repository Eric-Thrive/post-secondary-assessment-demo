import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { useRoleBasedAccess } from "../useRoleBasedAccess";
import { AuthenticatedUser, ModuleType, UserRole } from "@/types/unified-auth";

// Mock the unified auth hook
const mockUser: AuthenticatedUser = {
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

vi.mock("../useUnifiedAuth", () => ({
  useUnifiedAuth: () => ({
    user: mockUser,
    isLoading: false,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    getUserModules: vi.fn(),
    isAdmin: vi.fn(),
    isDemoUser: vi.fn(),
    getDefaultModule: vi.fn(),
  }),
}));

describe("useRoleBasedAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("role checking", () => {
    it("should correctly identify user roles", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      expect(result.current.hasRole(UserRole.CUSTOMER)).toBe(true);
      expect(result.current.hasRole(UserRole.SYSTEM_ADMIN)).toBe(false);
      expect(
        result.current.hasAnyRole([UserRole.CUSTOMER, UserRole.DEMO])
      ).toBe(true);
      expect(
        result.current.hasAnyRole([UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER])
      ).toBe(false);
    });

    it("should provide correct user flags", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      expect(result.current.flags.isCustomer).toBe(true);
      expect(result.current.flags.isAdmin).toBe(false);
      expect(result.current.flags.isDeveloper).toBe(false);
      expect(result.current.flags.isSystemAdmin).toBe(false);
      expect(result.current.flags.isOrgAdmin).toBe(false);
      expect(result.current.flags.isDemo).toBe(false);
      expect(result.current.flags.hasMultipleModules).toBe(false);
      expect(result.current.flags.canAccessAllModules).toBe(false);
    });
  });

  describe("module access", () => {
    it("should correctly identify module access", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      expect(result.current.hasModuleAccess(ModuleType.K12)).toBe(true);
      expect(result.current.hasModuleAccess(ModuleType.POST_SECONDARY)).toBe(
        false
      );
      expect(result.current.hasModuleAccess(ModuleType.TUTORING)).toBe(false);
    });

    it("should validate module access with detailed response", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      const k12Access = result.current.checkModuleAccess(ModuleType.K12);
      expect(k12Access.allowed).toBe(true);
      expect(k12Access.accessLevel).toBe("full");

      const tutoringAccess = result.current.checkModuleAccess(
        ModuleType.TUTORING
      );
      expect(tutoringAccess.allowed).toBe(false);
      expect(tutoringAccess.accessLevel).toBe("none");
    });
  });

  describe("action validation", () => {
    it("should validate allowed actions", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      const createResult = result.current.canPerformAction(
        ModuleType.K12,
        "assessment",
        "create"
      );
      expect(createResult.allowed).toBe(true);

      const readResult = result.current.canPerformAction(
        ModuleType.K12,
        "assessment",
        "read"
      );
      expect(readResult.allowed).toBe(true);
    });

    it("should deny restricted actions", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      const deleteResult = result.current.canPerformAction(
        ModuleType.K12,
        "assessment",
        "delete"
      );
      expect(deleteResult.allowed).toBe(false);
    });

    it("should deny actions on inaccessible modules", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      const tutoringResult = result.current.canPerformAction(
        ModuleType.TUTORING,
        "assessment",
        "create"
      );
      expect(tutoringResult.allowed).toBe(false);
      expect(tutoringResult.reason).toContain("No module access");
    });
  });

  describe("available actions", () => {
    it("should return available actions for accessible modules", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      const actions = result.current.getAvailableActions(
        ModuleType.K12,
        "assessment"
      );
      expect(actions).toContain("create");
      expect(actions).toContain("read");
      expect(actions).toContain("update");
      expect(actions).not.toContain("delete"); // Not granted
    });

    it("should return empty array for inaccessible modules", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      const actions = result.current.getAvailableActions(
        ModuleType.TUTORING,
        "assessment"
      );
      expect(actions).toHaveLength(0);
    });
  });

  describe("admin capabilities", () => {
    it("should correctly identify non-admin users", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      expect(result.current.canPerformAdminActions()).toBe(false);
      expect(result.current.canManageUsers()).toBe(false);
      expect(result.current.canAccessSystemFeatures()).toBe(false);
    });
  });

  describe("organization access", () => {
    it("should allow access to same organization", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      expect(result.current.hasOrganizationAccess("org-1")).toBe(true);
      expect(result.current.hasOrganizationAccess()).toBe(true); // No org specified
    });

    it("should deny access to different organization", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      expect(result.current.hasOrganizationAccess("other-org")).toBe(false);
    });

    it("should validate organization module access", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      const sameOrgAccess = result.current.checkOrganizationModuleAccess(
        ModuleType.K12,
        "org-1"
      );
      expect(sameOrgAccess.allowed).toBe(true);

      const differentOrgAccess = result.current.checkOrganizationModuleAccess(
        ModuleType.K12,
        "other-org"
      );
      expect(differentOrgAccess.allowed).toBe(false);
    });
  });

  describe("user capabilities", () => {
    it("should provide comprehensive user capabilities", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      expect(result.current.capabilities).toBeDefined();
      expect(result.current.capabilities?.role).toBe(UserRole.CUSTOMER);
      expect(result.current.capabilities?.modules).toEqual([ModuleType.K12]);
      expect(result.current.capabilities?.adminAccess).toBe(false);
      expect(result.current.capabilities?.systemAccess).toBe(false);
      expect(result.current.capabilities?.organizationId).toBe("org-1");
    });
  });

  describe("demo restrictions", () => {
    it("should not apply demo restrictions to regular users", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      const demoResult = result.current.validateDemoRestrictions(
        ModuleType.K12,
        "assessment",
        "create"
      );
      expect(demoResult.allowed).toBe(true);
      expect(demoResult.upgradeRequired).toBeUndefined();
    });

    it("should provide null demo status for non-demo users", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      expect(result.current.demoStatus).toBeNull();
    });
  });

  describe("permission checker factory", () => {
    it("should create a permission checker with all methods", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      const checker = result.current.createPermissionChecker();
      expect(checker).toBeDefined();
      expect(typeof checker?.hasRole).toBe("function");
      expect(typeof checker?.hasModuleAccess).toBe("function");
      expect(typeof checker?.canPerformAdminActions).toBe("function");
    });
  });

  describe("module access summary", () => {
    it("should provide comprehensive module access summary", () => {
      const { result } = renderHook(() => useRoleBasedAccess());

      const summary = result.current.getModuleAccessSummary();

      expect(summary[ModuleType.K12]).toBeDefined();
      expect(summary[ModuleType.K12].hasAccess).toBe(true);
      expect(summary[ModuleType.K12].accessLevel).toBe("full");
      expect(summary[ModuleType.K12].availableFeatures).toBeDefined();

      expect(summary[ModuleType.TUTORING]).toBeDefined();
      expect(summary[ModuleType.TUTORING].hasAccess).toBe(false);
      expect(summary[ModuleType.TUTORING].accessLevel).toBe("none");
    });
  });

  describe("unauthenticated state", () => {
    it("should handle unauthenticated users gracefully", () => {
      // Mock unauthenticated state
      vi.mocked(vi.importActual("../useUnifiedAuth")).useUnifiedAuth = () => ({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        getUserModules: vi.fn(),
        isAdmin: vi.fn(),
        isDemoUser: vi.fn(),
        getDefaultModule: vi.fn(),
      });

      const { result } = renderHook(() => useRoleBasedAccess());

      expect(result.current.hasRole(UserRole.CUSTOMER)).toBe(false);
      expect(result.current.hasModuleAccess(ModuleType.K12)).toBe(false);
      expect(result.current.canPerformAdminActions()).toBe(false);
      expect(result.current.capabilities).toBeNull();
      expect(result.current.createPermissionChecker()).toBeNull();
    });
  });
});
