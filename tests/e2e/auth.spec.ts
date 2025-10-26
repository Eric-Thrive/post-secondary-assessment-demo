import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should display login page for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/");

    // Should redirect to login or show login form
    await expect(page).toHaveURL(/login/);
  });

  test("should handle post-secondary demo login", async ({ page }) => {
    await page.goto("/post-secondary-demo-login");

    // Check if the demo login page loads
    await expect(
      page.locator('h1, h2, [data-testid="demo-title"]')
    ).toBeVisible();
  });

  test("should handle k12 demo login", async ({ page }) => {
    await page.goto("/k12-demo-login");

    // Check if the demo login page loads
    await expect(
      page.locator('h1, h2, [data-testid="demo-title"]')
    ).toBeVisible();
  });

  test("should handle tutoring demo login", async ({ page }) => {
    await page.goto("/tutoring-demo-login");

    // Check if the demo login page loads
    await expect(
      page.locator('h1, h2, [data-testid="demo-title"]')
    ).toBeVisible();
  });

  test("should handle 404 for unknown routes", async ({ page }) => {
    await page.goto("/unknown-route");

    // Should show 404 page or redirect
    const response = await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/unknown-route");
  });
});
