import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting global setup for E2E tests...");

  // Set up test environment variables
  process.env.NODE_ENV = "test";
  process.env.APP_ENVIRONMENT = "test";

  // Wait for the server to be ready
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the application to be ready
    await page.goto(config.projects[0].use?.baseURL || "http://localhost:5173");
    await page.waitForLoadState("networkidle");
    console.log("✅ Application is ready for E2E testing");
  } catch (error) {
    console.error("❌ Failed to verify application readiness:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
