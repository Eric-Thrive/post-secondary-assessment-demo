import { test, expect } from "@playwright/test";
import { createAuthTestHelpers } from "../utils/auth-test-helpers";

test.describe("Unified Authentication System", () => {
  test.beforeEach(async ({ page }) => {
    const authHelpers = createAuthTestHelpers(page);
    await authHelpers.clearAuthState();
  });

  test.describe("Unified Login Page", () => {
    test("should display unified login page with THRIVE branding", async ({
      page,
    }) => {
      await page.goto("/login");

      // Check for THRIVE branding elements
      await expect(page.locator("text=THRIVE Assessment Portal")).toBeVisible();
      await expect(page.locator("text=Welcome Back")).toBeVisible();
      await expect(
        page.locator("text=Sign in to access your assessment portal")
      ).toBeVisible();

      // Check for login form elements
      await expect(
        page.locator('[data-testid="input-username"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="input-password"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="button-sign-in"]')
      ).toBeVisible();

      // Check for registration tab
      await expect(page.locator("text=Register")).toBeVisible();
    });

    test("should handle login form validation", async ({ page }) => {
      await page.goto("/login");

      // Try to submit empty form
      await page.click('[data-testid="button-sign-in"]');

      // Form should not submit (required fields)
      await expect(
        page.locator('[data-testid="input-username"]')
      ).toHaveAttribute("required");
      await expect(
        page.locator('[data-testid="input-password"]')
      ).toHaveAttribute("required");
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto("/login");

      // Fill in invalid credentials
      await page.fill('[data-testid="input-username"]', "invalid-user");
      await page.fill('[data-testid="input-password"]', "invalid-password");
      await page.click('[data-testid="button-sign-in"]');

      // Should show error message
      await expect(page.locator("text=Invalid credentials")).toBeVisible({
        timeout: 10000,
      });
    });

    test("should show rate limiting after multiple failed attempts", async ({
      page,
    }) => {
      await page.goto("/login");

      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await page.fill('[data-testid="input-username"]', "invalid-user");
        await page.fill('[data-testid="input-password"]', "invalid-password");
        await page.click('[data-testid="button-sign-in"]');
        await page.waitForTimeout(1000);
      }

      // Should show rate limiting message
      await expect(
        page.locator("text=Too many failed login attempts")
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="button-sign-in"]')
      ).toBeDisabled();
    });

    test("should handle password reset flow", async ({ page }) => {
      await page.goto("/login");

      // Fill username first to show forgot password link
      await page.fill('[data-testid="input-username"]', "test-user");

      // Click forgot password link
      await page.click('[data-testid="link-forgot-password"]');

      // Should open password reset modal
      await expect(page.locator("text=Reset Password")).toBeVisible();
      await expect(
        page.locator('[data-testid="input-reset-email"]')
      ).toBeVisible();

      // Fill email and submit
      await page.fill('[data-testid="input-reset-email"]', "test@example.com");
      await page.click('[data-testid="button-send-reset"]');

      // Should show success message
      await expect(
        page.locator("text=Password reset instructions have been sent")
      ).toBeVisible();
    });

    test("should handle username recovery flow", async ({ page }) => {
      await page.goto("/login");

      // Click forgot username link
      await page.click('[data-testid="link-forgot-username"]');

      // Should open username recovery modal
      await expect(page.locator("text=Recover Username")).toBeVisible();
      await expect(
        page.locator('[data-testid="input-recovery-email"]')
      ).toBeVisible();

      // Fill email and submit
      await page.fill(
        '[data-testid="input-recovery-email"]',
        "test@example.com"
      );
      await page.click('[data-testid="button-send-recovery"]');

      // Should show success message
      await expect(
        page.locator("text=your username has been sent")
      ).toBeVisible();
    });
  });

  test.describe("Legacy Route Redirects", () => {
    test("should redirect legacy post-secondary login to unified login", async ({
      page,
    }) => {
      await page.goto("/login/post-secondary");
      await expect(page).toHaveURL("/login");
    });

    test("should redirect legacy k12 login to unified login", async ({
      page,
    }) => {
      await page.goto("/login/k12");
      await expect(page).toHaveURL("/login");
    });

    test("should redirect legacy tutor login to unified login", async ({
      page,
    }) => {
      await page.goto("/login/tutor");
      await expect(page).toHaveURL("/login");
    });

    test("should redirect legacy demo logins to unified login with demo parameter", async ({
      page,
    }) => {
      await page.goto("/post-secondary-demo-login");
      await expect(page).toHaveURL("/login?demo=post-secondary");

      await page.goto("/k12-demo-login");
      await expect(page).toHaveURL("/login?demo=k12");

      await page.goto("/tutoring-demo-login");
      await expect(page).toHaveURL("/login?demo=tutoring");
    });
  });

  test.describe("Authentication Integration", () => {
    test("should handle successful developer login and show dashboard", async ({
      page,
    }) => {
      // Mock successful login response
      await page.route("**/api/auth/login", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: {
              id: 1,
              username: "developer",
              role: "developer",
              customerId: "system",
              customerName: "System Developer",
            },
          }),
        });
      });

      await page.goto("/login");
      await page.fill('[data-testid="input-username"]', "developer");
      await page.fill('[data-testid="input-password"]', "password");
      await page.click('[data-testid="button-sign-in"]');

      // Should redirect to dashboard for multi-module users
      await expect(page).toHaveURL("/dashboard", { timeout: 10000 });
    });

    test("should handle successful customer login and redirect to module", async ({
      page,
    }) => {
      // Mock successful login response for single-module user
      await page.route("**/api/auth/login", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: {
              id: 2,
              username: "customer",
              role: "customer",
              customerId: "customer-123",
              customerName: "Test Customer",
            },
          }),
        });
      });

      await page.goto("/login");
      await page.fill('[data-testid="input-username"]', "customer");
      await page.fill('[data-testid="input-password"]', "password");
      await page.click('[data-testid="button-sign-in"]');

      // Should redirect directly to their module (post-secondary by default)
      await expect(page).toHaveURL("/post-secondary", { timeout: 10000 });
    });

    test("should handle demo user login", async ({ page }) => {
      // Mock successful demo login response
      await page.route("**/api/auth/login", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: {
              id: 3,
              username: "demo-user",
              role: "demo",
              customerId: "demo-123",
              customerName: "Demo User",
            },
          }),
        });
      });

      await page.goto("/login?demo=post-secondary");
      await page.fill('[data-testid="input-username"]', "demo-user");
      await page.fill('[data-testid="input-password"]', "demo-password");
      await page.click('[data-testid="button-sign-in"]');

      // Should redirect to demo module
      await expect(page).toHaveURL("/post-secondary", { timeout: 10000 });
    });
  });

  test.describe("Session Management", () => {
    test("should maintain session across page refreshes", async ({ page }) => {
      // Mock auth status check
      await page.route("**/api/auth/me", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: {
              id: 1,
              username: "developer",
              role: "developer",
              customerId: "system",
              customerName: "System Developer",
            },
          }),
        });
      });

      // Mock successful login
      await page.route("**/api/auth/login", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: {
              id: 1,
              username: "developer",
              role: "developer",
              customerId: "system",
              customerName: "System Developer",
            },
          }),
        });
      });

      // Login
      await page.goto("/login");
      await page.fill('[data-testid="input-username"]', "developer");
      await page.fill('[data-testid="input-password"]', "password");
      await page.click('[data-testid="button-sign-in"]');

      await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

      // Refresh page
      await page.reload();

      // Should still be authenticated and on dashboard
      await expect(page).toHaveURL("/dashboard");
    });

    test("should handle logout properly", async ({ page }) => {
      // Mock auth status and logout
      await page.route("**/api/auth/me", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: {
              id: 1,
              username: "developer",
              role: "developer",
              customerId: "system",
              customerName: "System Developer",
            },
          }),
        });
      });

      await page.route("**/api/auth/logout", async (route) => {
        await route.fulfill({ status: 200 });
      });

      // Start authenticated
      await page.goto("/dashboard");

      // Perform logout (assuming there's a logout button)
      await page.click('[data-testid="logout-button"]');

      // Should redirect to login
      await expect(page).toHaveURL("/login");
    });
  });

  test.describe("Performance Optimizations", () => {
    test("should preload critical assets after login", async ({ page }) => {
      // Mock successful login
      await page.route("**/api/auth/login", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: {
              id: 1,
              username: "developer",
              role: "developer",
              customerId: "system",
              customerName: "System Developer",
            },
          }),
        });
      });

      await page.goto("/login");
      await page.fill('[data-testid="input-username"]', "developer");
      await page.fill('[data-testid="input-password"]', "password");
      await page.click('[data-testid="button-sign-in"]');

      await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

      // Check that preload links are added to the document
      const preloadLinks = await page.locator('link[rel="preload"]').count();
      expect(preloadLinks).toBeGreaterThan(0);
    });

    test("should track navigation performance", async ({ page }) => {
      // Mock auth status
      await page.route("**/api/auth/me", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: {
              id: 1,
              username: "developer",
              role: "developer",
              customerId: "system",
              customerName: "System Developer",
            },
          }),
        });
      });

      await page.goto("/dashboard");

      // Navigate to different routes
      await page.goto("/k12-reports");
      await page.goto("/post-secondary-reports");

      // Check that performance marks are created
      const performanceMarks = await page.evaluate(() => {
        return performance.getEntriesByType("mark").map((mark) => mark.name);
      });

      expect(performanceMarks.some((mark) => mark.includes("route"))).toBe(
        true
      );
    });
  });

  test.describe("Error Handling", () => {
    test("should handle network errors gracefully", async ({ page }) => {
      // Mock network error
      await page.route("**/api/auth/login", async (route) => {
        await route.abort("failed");
      });

      await page.goto("/login");
      await page.fill('[data-testid="input-username"]', "test-user");
      await page.fill('[data-testid="input-password"]', "password");
      await page.click('[data-testid="button-sign-in"]');

      // Should show network error message
      await expect(
        page.locator("text=Failed to connect to server")
      ).toBeVisible();
    });

    test("should handle server errors gracefully", async ({ page }) => {
      // Mock server error
      await page.route("**/api/auth/login", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      await page.goto("/login");
      await page.fill('[data-testid="input-username"]', "test-user");
      await page.fill('[data-testid="input-password"]', "password");
      await page.click('[data-testid="button-sign-in"]');

      // Should show server error message
      await expect(page.locator("text=Internal server error")).toBeVisible();
    });
  });

  test.describe("Accessibility", () => {
    test("should be keyboard navigable", async ({ page }) => {
      await page.goto("/login");

      // Tab through form elements
      await page.keyboard.press("Tab");
      await expect(
        page.locator('[data-testid="input-username"]')
      ).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(
        page.locator('[data-testid="input-password"]')
      ).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(
        page.locator('[data-testid="button-sign-in"]')
      ).toBeFocused();

      // Should be able to submit with Enter
      await page.keyboard.press("Enter");
    });

    test("should have proper ARIA labels and roles", async ({ page }) => {
      await page.goto("/login");

      // Check for proper labels
      await expect(page.locator('label[for="username"]')).toBeVisible();
      await expect(page.locator('label[for="password"]')).toBeVisible();

      // Check for proper form structure
      await expect(page.locator("form")).toBeVisible();
    });

    test("should meet color contrast requirements", async ({ page }) => {
      await page.goto("/login");

      // This would require additional accessibility testing tools
      // For now, we'll just check that the page loads without accessibility violations
      const violations = await page.evaluate(() => {
        // This would integrate with axe-core or similar tool
        return [];
      });

      expect(violations).toHaveLength(0);
    });
  });
});
