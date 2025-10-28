import { describe, it, expect, beforeEach } from "vitest";
import { RouteResolver } from "../routeResolver";
import {
  AuthenticatedUser,
  ModuleType,
  UserRole,
  NavigationState,
} from "@/types/unified-auth";
import { AUTH_ROUTES } from "@/config/routes";

describe("RouteResolver", () => {
  let mockUser: AuthenticatedUser;
  let mockNavigationState: NavigationState;

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
          permissions: [],
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

    mockNavigationState = {
      currentPath: "/",
    };
  });

  describe("resolvePostAuthRoute", () => {
    it("should use redirect path when available and valid", () => {
      mockNavigationState.redirectAfterLogin = "/k12-reports";

      const result = RouteResolver.resolvePostAuthRoute(
        mockUser,
        mockNavigationState
      );

      expect(result.route).toBe("/k12-reports");
      expect(result.replace).toBe(true);
      expect(result.preserveQuery).toBe(true);
    });

    it("should use default route when no redirect is set", () => {
      const result = RouteResolver.resolvePostAuthRoute(
        mockUser,
        mockNavigationState
      );

      expect(result.route).toBe("/k12"); // Single module access
      expect(result.replace).toBe(true);
    });

    it("should use default route when redirect is invalid", () => {
      mockNavigationState.redirectAfterLogin = "/admin"; // User doesn't have admin access

      const result = RouteResolver.resolvePostAuthRoute(
        mockUser,
        mockNavigationState
      );

      expect(result.route).toBe("/k12"); // Falls back to default
      expect(result.replace).toBe(true);
    });
  });

  describe("resolveModuleRoute", () => {
    it("should allow access to accessible modules", () => {
      const result = RouteResolver.resolveModuleRoute(mockUser, ModuleType.K12);

      expect(result.allowed).toBe(true);
      expect(result.route).toBe("/k12");
    });

    it("should deny access to inaccessible modules", () => {
      const result = RouteResolver.resolveModuleRoute(
        mockUser,
        ModuleType.TUTORING
      );

      expect(result.allowed).toBe(false);
      expect(result.route).toBe(AUTH_ROUTES.DASHBOARD);
      expect(result.reason).toBe("No access to selected module");
    });
  });

  describe("resolveRouteConflict", () => {
    it("should redirect to single module for single-access users", () => {
      const result = RouteResolver.resolveRouteConflict(
        mockUser,
        "/unauthorized-route",
        "Access denied"
      );

      expect(result.shouldRedirect).toBe(true);
      expect(result.alternativeRoute).toBe("/k12");
      expect(result.message).toBe("Redirected to your available module.");
    });

    it("should redirect to dashboard for multi-module users", () => {
      mockUser.moduleAccess.push({
        moduleType: ModuleType.POST_SECONDARY,
        accessLevel: "full",
        permissions: [],
      });

      const result = RouteResolver.resolveRouteConflict(
        mockUser,
        "/unauthorized-route",
        "Access denied"
      );

      expect(result.shouldRedirect).toBe(true);
      expect(result.alternativeRoute).toBe(AUTH_ROUTES.DASHBOARD);
      expect(result.message).toBe("Please select a module from the dashboard.");
    });

    it("should show appropriate message for users with no access", () => {
      mockUser.moduleAccess = [];

      const result = RouteResolver.resolveRouteConflict(
        mockUser,
        "/unauthorized-route",
        "Access denied"
      );

      expect(result.shouldRedirect).toBe(true);
      expect(result.alternativeRoute).toBe(AUTH_ROUTES.DASHBOARD);
      expect(result.message).toBe(
        "No module access available. Please contact your administrator."
      );
    });
  });

  describe("requiresConfirmation", () => {
    it("should require confirmation when leaving a module", () => {
      const result = RouteResolver.requiresConfirmation(
        "/k12-assessment",
        "/dashboard",
        mockUser
      );

      expect(result.required).toBe(true);
      expect(result.message).toContain("unsaved work");
      expect(result.confirmText).toBe("Leave Module");
      expect(result.cancelText).toBe("Stay Here");
    });

    it("should not require confirmation for navigation within modules", () => {
      const result = RouteResolver.requiresConfirmation(
        "/k12-assessment",
        "/k12-reports",
        mockUser
      );

      expect(result.required).toBe(false);
    });

    it("should not require confirmation for non-module navigation", () => {
      const result = RouteResolver.requiresConfirmation(
        "/dashboard",
        "/admin",
        mockUser
      );

      expect(result.required).toBe(false);
    });
  });

  describe("getBreadcrumbs", () => {
    it("should create breadcrumbs for dashboard users", () => {
      mockUser.moduleAccess.push({
        moduleType: ModuleType.POST_SECONDARY,
        accessLevel: "full",
        permissions: [],
      });

      const breadcrumbs = RouteResolver.getBreadcrumbs("/dashboard", mockUser);

      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].label).toBe("Dashboard");
      expect(breadcrumbs[0].route).toBe(AUTH_ROUTES.DASHBOARD);
      expect(breadcrumbs[0].active).toBe(true);
    });

    it("should create breadcrumbs for module pages", () => {
      mockUser.moduleAccess.push({
        moduleType: ModuleType.POST_SECONDARY,
        accessLevel: "full",
        permissions: [],
      });

      const breadcrumbs = RouteResolver.getBreadcrumbs(
        "/k12-reports",
        mockUser
      );

      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs[0].label).toBe("Dashboard");
      expect(breadcrumbs[1].label).toBe("K-12 Module");
      expect(breadcrumbs[2].label).toBe("Reports");
      expect(breadcrumbs[2].active).toBe(true);
    });

    it("should not include dashboard for single-module users", () => {
      const breadcrumbs = RouteResolver.getBreadcrumbs("/k12", mockUser);

      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].label).toBe("K-12 Module");
      expect(breadcrumbs[0].active).toBe(true);
    });
  });

  describe("validateNavigation", () => {
    it("should allow navigation to accessible modules", () => {
      const result = RouteResolver.validateNavigation(
        mockUser,
        "/dashboard",
        "/k12-reports"
      );

      expect(result.allowed).toBe(true);
    });

    it("should deny navigation to inaccessible modules", () => {
      const result = RouteResolver.validateNavigation(
        mockUser,
        "/dashboard",
        "/tutoring-reports"
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("No access to target module");
      expect(result.alternativeRoute).toBe("/k12"); // User's fallback route
    });

    it("should deny admin navigation for non-admin users", () => {
      const result = RouteResolver.validateNavigation(
        mockUser,
        "/dashboard",
        "/admin/users"
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Admin access required");
      expect(result.alternativeRoute).toBe("/k12");
    });

    it("should allow admin navigation for admin users", () => {
      mockUser.role = UserRole.SYSTEM_ADMIN;

      const result = RouteResolver.validateNavigation(
        mockUser,
        "/dashboard",
        "/admin/users"
      );

      expect(result.allowed).toBe(true);
    });
  });
});
