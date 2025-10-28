import { test, expect } from "@playwright/test";
import { unifiedAuthIntegration } from "../../apps/web/src/services/auth/unified-auth-integration";
import { sessionManagement } from "../../apps/web/src/services/auth/session-management";
import { cachingService } from "../../apps/web/src/services/performance/caching-service";

test.describe("Unified Auth Integration Service", () => {
  test.beforeEach(() => {
    // Clear any cached data
    sessionManagement.clearAllData();
    cachingService.clearAll();
  });

  test.describe("Authentication Flow", () => {
    test("should authenticate user with valid credentials", async () => {
      // Mock successful API response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          user: {
            id: 1,
            username: "test-user",
            role: "customer",
            customerId: "customer-123",
            customerName: "Test Customer",
          },
        }),
      });

      const result = await unifiedAuthIntegration.authenticate({
        username: "test-user",
        password: "password",
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.username).toBe("test-user");
      expect(result.user?.role).toBe("customer");
    });

    test("should handle authentication failure", async () => {
      // Mock failed API response
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: "Invalid credentials",
        }),
      });

      const result = await unifiedAuthIntegration.authenticate({
        username: "invalid-user",
        password: "invalid-password",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid credentials");
    });

    test("should handle network errors", async () => {
      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const result = await unifiedAuthIntegration.authenticate({
        username: "test-user",
        password: "password",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to connect to server");
    });
  });

  test.describe("Session Management", () => {
    test("should store user session after successful authentication", async () => {
      const mockUser = {
        id: "1",
        username: "test-user",
        email: "test@example.com",
        name: "Test User",
        role: "customer" as const,
        moduleAccess: [],
        preferences: {
          dashboardLayout: "grid" as const,
          theme: "light" as const,
          notifications: {
            email: true,
            browser: true,
            reportComplete: true,
            systemUpdates: false,
          },
        },
        lastLogin: new Date(),
      };

      // Mock successful API response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      await unifiedAuthIntegration.authenticate({
        username: "test-user",
        password: "password",
      });

      // Check that session is stored
      const storedSession = sessionManagement.getStoredSession();
      expect(storedSession).toBeDefined();
      expect(storedSession?.username).toBe("test-user");
    });

    test("should check authentication status", async () => {
      // Mock successful auth status response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          user: {
            id: 1,
            username: "test-user",
            role: "customer",
            customerId: "customer-123",
          },
        }),
      });

      const result = await unifiedAuthIntegration.checkAuthStatus();

      expect(result.isAuthenticated).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.username).toBe("test-user");
    });

    test("should handle unauthenticated status", async () => {
      // Mock unauthenticated response
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await unifiedAuthIntegration.checkAuthStatus();

      expect(result.isAuthenticated).toBe(false);
      expect(result.user).toBeUndefined();
    });
  });

  test.describe("User Registration", () => {
    test("should register new user successfully", async () => {
      // Mock successful registration response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await unifiedAuthIntegration.register(
        "new-user",
        "password",
        "new-user@example.com"
      );

      expect(result.success).toBe(true);
    });

    test("should handle registration failure", async () => {
      // Mock failed registration response
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: "Username already exists",
        }),
      });

      const result = await unifiedAuthIntegration.register(
        "existing-user",
        "password",
        "existing@example.com"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Username already exists");
    });
  });

  test.describe("Logout", () => {
    test("should logout user successfully", async () => {
      // Mock successful logout response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const result = await unifiedAuthIntegration.logout();

      expect(result.success).toBe(true);
    });

    test("should clear session data on logout", async () => {
      // Store some session data first
      const mockUser = {
        id: "1",
        username: "test-user",
        email: "test@example.com",
        name: "Test User",
        role: "customer" as const,
        moduleAccess: [],
        preferences: {
          dashboardLayout: "grid" as const,
          theme: "light" as const,
          notifications: {
            email: true,
            browser: true,
            reportComplete: true,
            systemUpdates: false,
          },
        },
        lastLogin: new Date(),
      };

      sessionManagement.storeUserSession(mockUser);
      expect(sessionManagement.getStoredSession()).toBeDefined();

      // Mock successful logout
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      await unifiedAuthIntegration.logout();

      // Session should be cleared
      expect(sessionManagement.getStoredSession()).toBeNull();
    });
  });

  test.describe("Admin Override", () => {
    test("should enable admin override for system admin", () => {
      const adminUser = {
        id: "1",
        username: "admin",
        email: "admin@example.com",
        name: "Admin User",
        role: "system_admin" as const,
        moduleAccess: [],
        preferences: {
          dashboardLayout: "grid" as const,
          theme: "light" as const,
          notifications: {
            email: true,
            browser: true,
            reportComplete: true,
            systemUpdates: false,
          },
        },
        lastLogin: new Date(),
      };

      unifiedAuthIntegration.enableAdminOverride(adminUser);

      expect(unifiedAuthIntegration.isAdminOverrideEnabled()).toBe(true);
    });

    test("should not enable admin override for regular user", () => {
      const regularUser = {
        id: "1",
        username: "user",
        email: "user@example.com",
        name: "Regular User",
        role: "customer" as const,
        moduleAccess: [],
        preferences: {
          dashboardLayout: "grid" as const,
          theme: "light" as const,
          notifications: {
            email: true,
            browser: true,
            reportComplete: true,
            systemUpdates: false,
          },
        },
        lastLogin: new Date(),
      };

      unifiedAuthIntegration.enableAdminOverride(regularUser);

      expect(unifiedAuthIntegration.isAdminOverrideEnabled()).toBe(false);
    });

    test("should disable admin override", () => {
      // Enable first
      const adminUser = {
        id: "1",
        username: "admin",
        email: "admin@example.com",
        name: "Admin User",
        role: "system_admin" as const,
        moduleAccess: [],
        preferences: {
          dashboardLayout: "grid" as const,
          theme: "light" as const,
          notifications: {
            email: true,
            browser: true,
            reportComplete: true,
            systemUpdates: false,
          },
        },
        lastLogin: new Date(),
      };

      unifiedAuthIntegration.enableAdminOverride(adminUser);
      expect(unifiedAuthIntegration.isAdminOverrideEnabled()).toBe(true);

      // Disable
      unifiedAuthIntegration.disableAdminOverride();
      expect(unifiedAuthIntegration.isAdminOverrideEnabled()).toBe(false);
    });
  });
});

// Mock global fetch for Node.js environment
declare global {
  var fetch: jest.Mock;
}

// Setup fetch mock
beforeAll(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});
