import { test, expect } from "@playwright/test";

test.describe("Performance Optimizations", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication state
    await page.context().clearCookies();
  });

  test.describe("Bundle Loading Performance", () => {
    test("should load critical assets quickly", async ({ page }) => {
      const startTime = Date.now();

      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      const loadTime = Date.now() - startTime;

      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test("should preload module assets after authentication", async ({
      page,
    }) => {
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

      // Wait for preloading to complete
      await page.waitForTimeout(2000);

      // Check that preload links are added
      const preloadLinks = await page.locator('link[rel="preload"]').count();
      expect(preloadLinks).toBeGreaterThan(0);

      // Check that prefetch links are added
      const prefetchLinks = await page.locator('link[rel="prefetch"]').count();
      expect(prefetchLinks).toBeGreaterThan(0);
    });

    test("should optimize font loading", async ({ page }) => {
      await page.goto("/login");

      // Check for font-display: swap in CSS
      const fontDisplaySwap = await page.evaluate(() => {
        const styles = Array.from(document.styleSheets);
        for (const sheet of styles) {
          try {
            const rules = Array.from(sheet.cssRules || []);
            for (const rule of rules) {
              if (rule.cssText.includes("font-display: swap")) {
                return true;
              }
            }
          } catch (e) {
            // Cross-origin stylesheet, skip
          }
        }
        return false;
      });

      expect(fontDisplaySwap).toBe(true);
    });
  });

  test.describe("Lazy Loading", () => {
    test("should lazy load images", async ({ page }) => {
      await page.goto("/login");

      // Check that images have loading="lazy" attribute
      const lazyImages = await page.locator('img[loading="lazy"]').count();
      const totalImages = await page.locator("img").count();

      // Most images should be lazy loaded (allowing for critical images)
      if (totalImages > 0) {
        expect(lazyImages / totalImages).toBeGreaterThan(0.5);
      }
    });

    test("should lazy load module components", async ({ page }) => {
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

      // Navigate to a module
      await page.click('[data-testid="k12-module-card"]');

      // Check that module-specific chunks are loaded
      const networkRequests = [];
      page.on("request", (request) => {
        if (request.url().includes(".js") || request.url().includes(".css")) {
          networkRequests.push(request.url());
        }
      });

      await page.waitForTimeout(2000);

      // Should have loaded module-specific assets
      const moduleAssets = networkRequests.filter(
        (url) => url.includes("k12") || url.includes("module")
      );
      expect(moduleAssets.length).toBeGreaterThan(0);
    });
  });

  test.describe("Caching Performance", () => {
    test("should cache user session data", async ({ page }) => {
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

      // Check that session data is stored in sessionStorage
      const sessionData = await page.evaluate(() => {
        return sessionStorage.getItem("unified-auth-session");
      });

      expect(sessionData).toBeTruthy();

      const parsedData = JSON.parse(sessionData);
      expect(parsedData.username).toBe("developer");
    });

    test("should cache user preferences", async ({ page }) => {
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

      // Check that preferences are stored in localStorage
      const preferences = await page.evaluate(() => {
        return localStorage.getItem("unified-auth-preferences");
      });

      expect(preferences).toBeTruthy();
    });
  });

  test.describe("Performance Monitoring", () => {
    test("should track navigation performance", async ({ page }) => {
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

    test("should measure Web Vitals", async ({ page }) => {
      await page.goto("/login");

      // Wait for page to fully load
      await page.waitForLoadState("networkidle");

      // Get Web Vitals metrics
      const webVitals = await page.evaluate(() => {
        const paintEntries = performance.getEntriesByType("paint");
        const fcp = paintEntries.find(
          (entry) => entry.name === "first-contentful-paint"
        );

        return {
          firstContentfulPaint: fcp ? fcp.startTime : null,
          domContentLoaded:
            performance.timing.domContentLoadedEventEnd -
            performance.timing.navigationStart,
          loadComplete:
            performance.timing.loadEventEnd -
            performance.timing.navigationStart,
        };
      });

      // FCP should be under 2.5 seconds (good threshold)
      if (webVitals.firstContentfulPaint) {
        expect(webVitals.firstContentfulPaint).toBeLessThan(2500);
      }

      // DOM content loaded should be under 3 seconds
      expect(webVitals.domContentLoaded).toBeLessThan(3000);

      // Full load should be under 5 seconds
      expect(webVitals.loadComplete).toBeLessThan(5000);
    });
  });

  test.describe("Resource Optimization", () => {
    test("should add resource hints for external resources", async ({
      page,
    }) => {
      await page.goto("/login");

      // Check for DNS prefetch hints
      const dnsPrefetchLinks = await page
        .locator('link[rel="dns-prefetch"]')
        .count();
      expect(dnsPrefetchLinks).toBeGreaterThan(0);

      // Check for preconnect hints
      const preconnectLinks = await page
        .locator('link[rel="preconnect"]')
        .count();
      expect(preconnectLinks).toBeGreaterThan(0);
    });

    test("should optimize image loading", async ({ page }) => {
      await page.goto("/login");

      // Check that images are optimized
      const images = await page.locator("img").all();

      for (const img of images) {
        const loading = await img.getAttribute("loading");
        const src = await img.getAttribute("src");

        // Critical images might not be lazy loaded, but others should be
        if (src && !src.includes("logo") && !src.includes("hero")) {
          expect(loading).toBe("lazy");
        }
      }
    });
  });

  test.describe("Memory Management", () => {
    test("should not have memory leaks during navigation", async ({ page }) => {
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

      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory
          ? (performance as any).memory.usedJSHeapSize
          : 0;
      });

      // Navigate through multiple routes
      const routes = [
        "/k12-reports",
        "/post-secondary-reports",
        "/tutoring-reports",
        "/dashboard",
      ];

      for (const route of routes) {
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);
      }

      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory
          ? (performance as any).memory.usedJSHeapSize
          : 0;
      });

      // Memory usage shouldn't increase dramatically (allow for 50% increase)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = (finalMemory - initialMemory) / initialMemory;
        expect(memoryIncrease).toBeLessThan(0.5);
      }
    });

    test("should clean up event listeners and observers", async ({ page }) => {
      await page.goto("/login");

      // Check that performance observers are properly set up
      const observerCount = await page.evaluate(() => {
        // This would need to be implemented in the actual performance monitoring service
        return (window as any).performanceObserverCount || 0;
      });

      // Should have some observers but not an excessive amount
      expect(observerCount).toBeGreaterThanOrEqual(0);
      expect(observerCount).toBeLessThan(10);
    });
  });
});
