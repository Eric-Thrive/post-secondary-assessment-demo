import { test, expect } from "@playwright/test";

test.describe("Module System Tests", () => {
  test.describe("Post-Secondary Module", () => {
    test("should load post-secondary assessment page", async ({ page }) => {
      await page.goto("/post-secondary-demo/assessment");
      await page.waitForLoadState("networkidle");

      // Should be on the assessment page
      expect(page.url()).toContain("/post-secondary-demo/assessment");
    });

    test("should load post-secondary reports page", async ({ page }) => {
      await page.goto("/post-secondary-demo/reports");
      await page.waitForLoadState("networkidle");

      // Should be on the reports page
      expect(page.url()).toContain("/post-secondary-demo/reports");
    });
  });

  test.describe("K-12 Module", () => {
    test("should load k12 assessment page", async ({ page }) => {
      await page.goto("/k12-demo/assessment");
      await page.waitForLoadState("networkidle");

      // Should be on the assessment page
      expect(page.url()).toContain("/k12-demo/assessment");
    });

    test("should load k12 reports page", async ({ page }) => {
      await page.goto("/k12-demo/reports");
      await page.waitForLoadState("networkidle");

      // Should be on the reports page
      expect(page.url()).toContain("/k12-demo/reports");
    });
  });

  test.describe("Tutoring Module", () => {
    test("should load tutoring assessment page", async ({ page }) => {
      await page.goto("/tutoring-demo/assessment");
      await page.waitForLoadState("networkidle");

      // Should be on the assessment page
      expect(page.url()).toContain("/tutoring-demo/assessment");
    });

    test("should load tutoring reports page", async ({ page }) => {
      await page.goto("/tutoring-demo/reports");
      await page.waitForLoadState("networkidle");

      // Should be on the reports page
      expect(page.url()).toContain("/tutoring-demo/reports");
    });
  });

  test("should handle cross-module navigation", async ({ page }) => {
    // Start with post-secondary demo
    await page.goto("/post-secondary-demo/");
    await page.waitForLoadState("networkidle");

    // Navigate to k12 demo
    await page.goto("/k12-demo/");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/k12-demo");

    // Navigate to tutoring demo
    await page.goto("/tutoring-demo/");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/tutoring-demo");
  });
});
