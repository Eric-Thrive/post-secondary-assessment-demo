import { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Running global teardown for E2E tests...");

  // Clean up any global test resources
  // This could include database cleanup, file cleanup, etc.

  console.log("✅ Global teardown completed");
}

export default globalTeardown;
