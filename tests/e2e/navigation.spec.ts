import { test, expect } from "@playwright/test";

test.describe("Navigation Tests", () => {
  test("should load the application homepage", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that we're either on a login page or the main app
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/(login|\/)/);
  });

  test("should handle demo environment routing", async ({ page }) => {
    // Test post-secondary demo routing
    await page.goto("/post-secondary-demo/");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/post-secondary-demo");
  });

  test("should handle k12 demo environment routing", async ({ page }) => {
    // Test k12 demo routing
    await page.goto("/k12-demo/");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/k12-demo");
  });

  test("should handle tutoring demo environment routing", async ({ page }) => {
    // Test tutoring demo routing
    await page.goto("/tutoring-demo/");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/tutoring-demo");
  });

  test("should be responsive on mobile devices", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check that the page renders properly on mobile
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Check that content doesn't overflow horizontally
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(375);
  });
});
