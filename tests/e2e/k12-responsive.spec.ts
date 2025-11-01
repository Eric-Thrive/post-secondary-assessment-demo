import { test, expect, Page } from "@playwright/test";

const BREAKPOINTS = {
  mobileSmall: 320,
  tablet: 768,
  tabletLarge: 1024,
  desktop: 1200,
  largeDesktop: 1920,
};

async function checkNoHorizontalScroll(page: Page) {
  const hasHorizontalScroll = await page.evaluate(() => {
    return (
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth
    );
  });
  expect(hasHorizontalScroll).toBe(false);
}

test.describe("K-12 Report Viewer - Responsive Design", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/k12-report-viewer-demo");
    await page.waitForLoadState("networkidle");
  });

  test.describe("320px - Mobile Small", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({
        width: BREAKPOINTS.mobileSmall,
        height: 667,
      });
    });

    test("should have no horizontal scroll", async ({ page }) => {
      await checkNoHorizontalScroll(page);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await checkNoHorizontalScroll(page);
    });

    test("should display cards without overflow", async ({ page }) => {
      const cards = page.locator(
        '[data-testid*="card"], .card, [class*="Card"]'
      );
      const cardCount = await cards.count();

      if (cardCount > 0) {
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = cards.nth(i);
          const isOverflowing = await card.evaluate((el) => {
            return el.scrollWidth > el.clientWidth;
          });
          expect(isOverflowing).toBe(false);
        }
      }
    });

    test("should have readable text", async ({ page }) => {
      const bodyText = page.locator("body").first();
      const fontSize = await bodyText.evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });

      const fontSizeNum = parseInt(fontSize);
      expect(fontSizeNum).toBeGreaterThanOrEqual(14);
    });
  });

  test.describe("768px - Tablet Breakpoint", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: BREAKPOINTS.tablet, height: 1024 });
    });

    test("should have no horizontal scroll", async ({ page }) => {
      await checkNoHorizontalScroll(page);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await checkNoHorizontalScroll(page);
    });

    test("should display all cards readable", async ({ page }) => {
      const cards = page.locator(
        '[data-testid*="card"], .card, [class*="Card"]'
      );
      const cardCount = await cards.count();

      if (cardCount > 0) {
        const firstCard = cards.first();
        await expect(firstCard).toBeVisible();
      }
    });
  });

  test.describe("1024px - Tablet Large", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({
        width: BREAKPOINTS.tabletLarge,
        height: 1366,
      });
    });

    test("should have no horizontal scroll", async ({ page }) => {
      await checkNoHorizontalScroll(page);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await checkNoHorizontalScroll(page);
    });

    test("should display accordions properly", async ({ page }) => {
      const accordions = page.locator(
        '[data-state="closed"], [data-state="open"]'
      );
      const accordionCount = await accordions.count();

      if (accordionCount > 0) {
        const firstAccordion = accordions.first();
        await expect(firstAccordion).toBeVisible();

        await firstAccordion.click();
        await page.waitForTimeout(350);

        const state = await firstAccordion.getAttribute("data-state");
        expect(state).toBe("open");
      }
    });
  });

  test.describe("1200px - Desktop", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: BREAKPOINTS.desktop, height: 1080 });
    });

    test("should have no horizontal scroll", async ({ page }) => {
      await checkNoHorizontalScroll(page);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await checkNoHorizontalScroll(page);
    });

    test("should have proper card styling", async ({ page }) => {
      const cards = page.locator(
        '[data-testid*="card"], .card, [class*="Card"]'
      );
      const cardCount = await cards.count();

      if (cardCount > 0) {
        const firstCard = cards.first();

        const boxShadow = await firstCard.evaluate((el) => {
          return window.getComputedStyle(el).boxShadow;
        });
        expect(boxShadow).not.toBe("none");
      }
    });
  });

  test.describe("1920px - Large Desktop", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({
        width: BREAKPOINTS.largeDesktop,
        height: 1080,
      });
    });

    test("should have no horizontal scroll", async ({ page }) => {
      await checkNoHorizontalScroll(page);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await checkNoHorizontalScroll(page);
    });

    test("should maintain readability", async ({ page }) => {
      const paragraphs = page.locator("p");
      const pCount = await paragraphs.count();

      if (pCount > 0) {
        const firstP = paragraphs.first();
        const width = await firstP.evaluate((el) => {
          return el.getBoundingClientRect().width;
        });

        expect(width).toBeLessThan(1200);
      }
    });
  });

  test.describe("Cross-breakpoint functionality", () => {
    test("should maintain functionality when resizing", async ({ page }) => {
      await page.setViewportSize({ width: BREAKPOINTS.desktop, height: 1080 });
      await checkNoHorizontalScroll(page);

      await page.setViewportSize({ width: BREAKPOINTS.tablet, height: 1024 });
      await page.waitForTimeout(100);
      await checkNoHorizontalScroll(page);

      await page.setViewportSize({
        width: BREAKPOINTS.mobileSmall,
        height: 667,
      });
      await page.waitForTimeout(100);
      await checkNoHorizontalScroll(page);
    });
  });
});
