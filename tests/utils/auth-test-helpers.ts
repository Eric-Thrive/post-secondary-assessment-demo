import { Page, expect } from "@playwright/test";
import {
  AuthenticatedUser,
  UserRole,
  ModuleType,
} from "../../apps/web/src/types/unified-auth";

/**
 * Test utilities for unified authentication system
 */
export class AuthTestHelpers {
  constructor(private page: Page) {}

  /**
   * Mock successful login response
   */
  async mockSuccessfulLogin(user: Partial<AuthenticatedUser> = {}) {
    const defaultUser = {
      id: 1,
      username: "test-user",
      role: "customer",
      customerId: "customer-123",
      customerName: "Test Customer",
      ...user,
    };

    await this.page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: defaultUser }),
      });
    });

    return defaultUser;
  }

  /**
   * Mock failed login response
   */
  async mockFailedLogin(error: string = "Invalid credentials") {
    await this.page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error }),
      });
    });
  }

  /**
   * Mock authentication status check
   */
  async mockAuthStatus(user: Partial<AuthenticatedUser> | null = null) {
    if (user) {
      await this.page.route("**/api/auth/me", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ user }),
        });
      });
    } else {
      await this.page.route("**/api/auth/me", async (route) => {
        await route.fulfill({ status: 401 });
      });
    }
  }

  /**
   * Mock logout response
   */
  async mockLogout() {
    await this.page.route("**/api/auth/logout", async (route) => {
      await route.fulfill({ status: 200 });
    });
  }

  /**
   * Perform login with credentials
   */
  async performLogin(
    username: string = "test-user",
    password: string = "password"
  ) {
    await this.page.goto("/login");
    await this.page.fill('[data-testid="input-username"]', username);
    await this.page.fill('[data-testid="input-password"]', password);
    await this.page.click('[data-testid="button-sign-in"]');
  }

  /**
   * Wait for successful login and navigation
   */
  async waitForLoginSuccess(expectedUrl?: string) {
    if (expectedUrl) {
      await expect(this.page).toHaveURL(expectedUrl, { timeout: 10000 });
    } else {
      // Wait for any navigation away from login
      await this.page.waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: 10000,
      });
    }
  }

  /**
   * Create a developer user for testing
   */
  createDeveloperUser(): Partial<AuthenticatedUser> {
    return {
      id: 1,
      username: "developer",
      role: "developer" as UserRole,
      customerId: "system",
      customerName: "System Developer",
    };
  }

  /**
   * Create a customer user for testing
   */
  createCustomerUser(): Partial<AuthenticatedUser> {
    return {
      id: 2,
      username: "customer",
      role: "customer" as UserRole,
      customerId: "customer-123",
      customerName: "Test Customer",
    };
  }

  /**
   * Create a demo user for testing
   */
  createDemoUser(): Partial<AuthenticatedUser> {
    return {
      id: 3,
      username: "demo-user",
      role: "demo" as UserRole,
      customerId: "demo-123",
      customerName: "Demo User",
    };
  }

  /**
   * Create an admin user for testing
   */
  createAdminUser(): Partial<AuthenticatedUser> {
    return {
      id: 4,
      username: "admin",
      role: "system_admin" as UserRole,
      customerId: "admin-123",
      customerName: "System Admin",
    };
  }

  /**
   * Check if login form is visible and functional
   */
  async verifyLoginFormVisible() {
    await expect(
      this.page.locator("text=THRIVE Assessment Portal")
    ).toBeVisible();
    await expect(this.page.locator("text=Welcome Back")).toBeVisible();
    await expect(
      this.page.locator('[data-testid="input-username"]')
    ).toBeVisible();
    await expect(
      this.page.locator('[data-testid="input-password"]')
    ).toBeVisible();
    await expect(
      this.page.locator('[data-testid="button-sign-in"]')
    ).toBeVisible();
  }

  /**
   * Check if dashboard is visible
   */
  async verifyDashboardVisible() {
    await expect(this.page.locator("text=Dashboard")).toBeVisible();
    // Add more dashboard-specific checks as needed
  }

  /**
   * Check if error message is displayed
   */
  async verifyErrorMessage(message: string) {
    await expect(this.page.locator(`text=${message}`)).toBeVisible();
  }

  /**
   * Check if success message is displayed
   */
  async verifySuccessMessage(message: string) {
    await expect(this.page.locator(`text=${message}`)).toBeVisible();
  }

  /**
   * Clear all authentication state
   */
  async clearAuthState() {
    await this.page.context().clearCookies();
    await this.page.context().clearPermissions();
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Set up performance monitoring
   */
  async setupPerformanceMonitoring() {
    await this.page.addInitScript(() => {
      // Track performance metrics
      (window as any).performanceMetrics = [];

      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const start = performance.now();
        const response = await originalFetch(...args);
        const end = performance.now();

        (window as any).performanceMetrics.push({
          type: "fetch",
          url: args[0],
          duration: end - start,
          timestamp: Date.now(),
        });

        return response;
      };
    });
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics() {
    return await this.page.evaluate(() => {
      return (window as any).performanceMetrics || [];
    });
  }

  /**
   * Wait for network idle
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Take screenshot for debugging
   */
  async takeDebugScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/debug-${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  /**
   * Check accessibility violations
   */
  async checkAccessibility() {
    // This would integrate with axe-core or similar tool
    const violations = await this.page.evaluate(() => {
      // Placeholder for accessibility checking
      return [];
    });

    expect(violations).toHaveLength(0);
  }

  /**
   * Simulate slow network conditions
   */
  async simulateSlowNetwork() {
    await this.page.route("**/*", async (route) => {
      // Add delay to simulate slow network
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.continue();
    });
  }

  /**
   * Simulate network error
   */
  async simulateNetworkError(urlPattern: string = "**/*") {
    await this.page.route(urlPattern, async (route) => {
      await route.abort("failed");
    });
  }

  /**
   * Check if preload links are present
   */
  async verifyPreloadLinks() {
    const preloadLinks = await this.page.locator('link[rel="preload"]').count();
    expect(preloadLinks).toBeGreaterThan(0);
  }

  /**
   * Check if prefetch links are present
   */
  async verifyPrefetchLinks() {
    const prefetchLinks = await this.page
      .locator('link[rel="prefetch"]')
      .count();
    expect(prefetchLinks).toBeGreaterThan(0);
  }

  /**
   * Verify session storage contains user data
   */
  async verifySessionStorage() {
    const sessionData = await this.page.evaluate(() => {
      return sessionStorage.getItem("unified-auth-session");
    });

    expect(sessionData).toBeTruthy();
    return JSON.parse(sessionData);
  }

  /**
   * Verify local storage contains preferences
   */
  async verifyLocalStorage() {
    const preferences = await this.page.evaluate(() => {
      return localStorage.getItem("unified-auth-preferences");
    });

    expect(preferences).toBeTruthy();
    return JSON.parse(preferences);
  }
}

/**
 * Create auth test helpers for a page
 */
export function createAuthTestHelpers(page: Page): AuthTestHelpers {
  return new AuthTestHelpers(page);
}
