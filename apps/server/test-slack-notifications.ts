/**
 * Test Slack notifications
 * Run from server directory: npx tsx test-slack-notifications.ts
 */

import dotenv from "dotenv";
import path from "path";

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import {
  sendSlackRegistrationNotification,
  sendSlackSupportNotification,
  sendSlackSalesNotification,
} from "./services/slack-notifications";

async function testNotifications() {
  console.log("🧪 Testing Slack Notification Functions...\n");
  console.log("Environment check:");
  console.log(
    `SLACK_WEBHOOK_URL: ${
      process.env.SLACK_WEBHOOK_URL ? "✅ Set" : "❌ Not set"
    }`
  );
  console.log();

  // Test 1: Registration
  console.log("1️⃣ Testing Registration Notification...");
  const regSuccess = await sendSlackRegistrationNotification({
    username: "test_user",
    email: "test@example.com",
    organizationName: "Test Organization",
    registeredAt: new Date(),
  });
  console.log(regSuccess ? "✅ Success\n" : "❌ Failed\n");

  // Wait a bit between messages
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 2: Support Request
  console.log("2️⃣ Testing Support Request Notification...");
  const supportSuccess = await sendSlackSupportNotification({
    name: "John Doe",
    email: "john@example.com",
    subject: "Test Support Request",
    description: "This is a test support request to verify Slack integration.",
    urgency: "medium",
    category: "technical",
    createdAt: new Date(),
  });
  console.log(supportSuccess ? "✅ Success\n" : "❌ Failed\n");

  // Wait a bit between messages
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 3: Sales Inquiry
  console.log("3️⃣ Testing Sales Inquiry Notification...");
  const salesSuccess = await sendSlackSalesNotification({
    name: "Jane Smith",
    email: "jane@example.com",
    organization: "Acme Corp",
    organizationSize: "50-100 employees",
    interestedModules: ["K-12 Module", "Post-Secondary Module"],
    message: "We're interested in learning more about your platform.",
    inquiryType: "pricing",
    createdAt: new Date(),
  });
  console.log(salesSuccess ? "✅ Success\n" : "❌ Failed\n");

  // Summary
  console.log("📊 Test Summary:");
  console.log(`Registration: ${regSuccess ? "✅" : "❌"}`);
  console.log(`Support: ${supportSuccess ? "✅" : "❌"}`);
  console.log(`Sales: ${salesSuccess ? "✅" : "❌"}`);

  const allSuccess = regSuccess && supportSuccess && salesSuccess;
  console.log(
    allSuccess
      ? "\n🎉 All tests passed! Check your Slack channel."
      : "\n⚠️ Some tests failed."
  );
}

testNotifications().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
