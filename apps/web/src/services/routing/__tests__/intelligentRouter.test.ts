import { describe, it, expect, beforeEach } from "vitest";
import { IntelligentRouter } from "../intelligentRouter";
import { AuthenticatedUser, ModuleType, UserRole } from "@/types/unified-auth";
import { AUTH_ROUTES } from "@/config/routes";

describe("IntelligentRouter", () => {
  let mockUser: AuthenticatedUser;

  beforeEach(() => {
    mockUser = {
      id: "test-user-1",
      email: "test@example.com",
      name: "Test User",
      username: "testuser",
      role: UserRole.CUSTOMER,
      organizationId: "org-1",
      moduleAccess: [],
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

  describe("getPostLoginRoute", () => {
    it("should redirect to single module for single-access users", () => {
      mockUser.moduleAccess = [
        {
          moduleType: ModuleType.K12,
          accessLevel: "full",
          permissions: [],
        },
      ];

      const route = IntelligentRouter.getPostLoginRoute(mockUser);
      expect(route).toBe("/k12");
    });

    it("should redirect to dashboard for multi-module users", () => {
      mockUser.moduleAccess = [
        {
          moduleType: ModuleType.K12,
          accessLevel: "full",
          permissions: [],
        },
        {
          moduleType: ModuleType.POST_SECONDARY,
          accessLevel: "full",
          permissions: [],
        },
      ];

      const route = IntelligentRouter.getPostLoginRoute(mockUser);
      expect(route).toBe(AUTH_ROUTES.DASHBOARD);
    });

    it("should redirect to dashboard for admin users", () => {
      mockUser.role = UserRole.SYSTEM_ADMIN;
      mockUser.moduleAccess = [
        {
          moduleType: ModuleType.K12,
          accessLevel: "full",
          permissions: [],
        },
      ];

      const route = IntelligentRouter.getPostLoginRoute(mockUser);
      expect(route).toBe(AUTH_ROUTES.DASHBOARD);
    });

    it("should redirect to dashboard for developer users", () => {
      mockUser.role = UserRole.DEVELOPER;
      mockUser.moduleAccess = [];

      const route = IntelligentRouter.getPostLoginRoute(mockUser);
      expect(route).toBe(AUTH_ROUTES.DASHBOARD);
    });

    it("should redirect to dashboard for users with no module access", () => {
      mockUser.moduleAccess = [];

      const route = IntelligentRouter.getPostLoginRoute(mockUser);
      expect(route).toBe(AUTH_ROUTES.DASHBOARD);
    });
  });

  describe("shouldShowDashboard", () => {
    it("should return true for multi-module users", () => {
      mockUser.moduleAccess = [
        {
          moduleType: ModuleType.K12,
          accessLevel: "full",
          permissions: [],
        },
        {
          moduleType: ModuleType.POST_SECONDARY,
          accessLevel: "full",
          permissions: [],
        },
      ];

      expect(IntelligentRouter.shouldShowDashboard(mockUser)).toBe(true);
    });

    it("should return true for admin users", () => {
      mockUser.role = UserRole.SYSTEM_ADMIN;
      mockUser.moduleAccess = [
        {
          moduleType: ModuleType.K12,
          accessLevel: "full",
          permissions: [],
        },
      ];

      expect(IntelligentRouter.shouldShowDashboard(mockUser)).toBe(true);
    });

    it("should return false for single-module customers", () => {
      mockUser.role = UserRole.CUSTOMER;
      mockUser.moduleAccess = [
        {
          moduleType: ModuleType.K12,
          accessLevel: "full",
          permissions: [],
        },
      ];

      expect(IntelligentRouter.shouldShowDashboard(mockUser)).toBe(false);
    });
  });

  describe("hasModuleAccess", () => {
    beforeEach(() => {
      mockUser.moduleAccess = [
        {
          moduleType: ModuleType.K12,
          accessLevel: "full",
          permissions: [],
        },
        {
          moduleType: ModuleType.POST_SECONDARY,
          accessLevel: "restricted",
          permissions: [],
        },
      ];
    });

    it("should return true for full access modules", () => {
      expect(IntelligentRouter.hasModuleAccess(mockUser, ModuleType.K12)).toBe(
        true
      );
    });

    it("should return true for restricted access modules", () => {
      expect(
        IntelligentRouter.hasModuleAccess(mockUser, ModuleType.POST_SECONDARY)
      ).toBe(true);
    });

    it("should return false for modules without access", () => {
      expect(
        IntelligentRouter.hasModuleAccess(mockUser, ModuleType.TUTORING)
      ).toBe(false);
    });
  });

  describe("getRoutingStrategy", () => {
    it("should return direct strategy for single-module users", () => {
      mockUser.moduleAccess = [
        {
          moduleType: ModuleType.K12,
          accessLevel: "full",
          permissions: [],
        },
      ];

      const strategy = IntelligentRouter.getRoutingStrategy(mockUser);
      expect(strategy.strategy).toBe("direct");
      expect(strategy.targetRoute).toBe("/k12");
      expect(strategy.reason).toBe("Single module access");
    });

    it("should return dashboard strategy for multi-module users", () => {
      mockUser.moduleAccess = [
        {
          moduleType: ModuleType.K12,
          accessLevel: "full",
          permissions: [],
        },
        {
          moduleType: ModuleType.POST_SECONDARY,
          accessLevel: "full",
          permissions: [],
        },
      ];

      const strategy = IntelligentRouter.getRoutingStrategy(mockUser);
      expect(strategy.strategy).toBe("dashboard");
      expect(strategy.targetRoute).toBe(AUTH_ROUTES.DASHBOARD);
      expect(strategy.reason).toBe("Multiple modules or admin access");
    });

    it("should return restricted strategy for users with no access", () => {
      mockUser.moduleAccess = [];

      const strategy = IntelligentRouter.getRoutingStrategy(mockUser);
      expect(strategy.strategy).toBe("restricted");
      expect(strategy.targetRoute).toBe(AUTH_ROUTES.DASHBOARD);
      expect(strategy.reason).toBe("No module access");
    });
  });

  describe("validateRouteAccess", () => {
    beforeEach(() => {
      mockUser.moduleAccess = [
        {
          moduleType: ModuleType.K12,
          accessLevel: "full",
          permissions: [],
        },
      ];
    });

    it("should allow access for users with required role", () => {
      const validation = IntelligentRouter.validateRouteAccess(
        mockUser,
        "/some-route",
        [UserRole.CUSTOMER]
      );

      expect(validation.allowed).toBe(true);
    });

    it("should deny access for users without required role", () => {
      const validation = IntelligentRouter.validateRouteAccess(
        mockUser,
        "/admin-route",
        [UserRole.SYSTEM_ADMIN]
      );

      expect(validation.allowed).toBe(false);
      expect(validation.reason).toBe("Insufficient role permissions");
      expect(validation.redirectRoute).toBe(AUTH_ROUTES.DASHBOARD);
    });

    it("should allow access for users with required module", () => {
      const validation = IntelligentRouter.validateRouteAccess(
        mockUser,
        "/k12-route",
        undefined,
        [ModuleType.K12]
      );

      expect(validation.allowed).toBe(true);
    });

    it("should deny access for users without required module", () => {
      const validation = IntelligentRouter.validateRouteAccess(
        mockUser,
        "/tutoring-route",
        undefined,
        [ModuleType.TUTORING]
      );

      expect(validation.allowed).toBe(false);
      expect(validation.reason).toBe("No access to required module");
      expect(validation.redirectRoute).toBe(AUTH_ROUTES.DASHBOARD);
    });
  });

  describe("getPrimaryModule", () => {
    it("should return the only module for single-access users", () => {
      mockUser.moduleAccess = [
        {
          moduleType: ModuleType.K12,
          accessLevel: "full",
          permissions: [],
        },
      ];

      const primaryModule = IntelligentRouter.getPrimaryModule(mockUser);
      expect(primaryModule).toBe(ModuleType.K12);
    });

    it("should return preferred module for multi-access users", () => {
      mockUser.moduleAccess = [
        {
          moduleType: ModuleType.K12,
          accessLevel: "full",
          permissions: [],
        },
        {
          moduleType: ModuleType.POST_SECONDARY,
          accessLevel: "full",
          permissions: [],
        },
      ];
      mockUser.preferences.defaultModule = ModuleType.POST_SECONDARY;

      const primaryModule = IntelligentRouter.getPrimaryModule(mockUser);
      expect(primaryModule).toBe(ModuleType.POST_SECONDARY);
    });

    it("should return null for users with no module access", () => {
      mockUser.moduleAccess = [];

      const primaryModule = IntelligentRouter.getPrimaryModule(mockUser);
      expect(primaryModule).toBeNull();
    });
  });
});
