/**
 * Test script for Slack notifications
 * Run with: npx tsx test-slack-notification.ts
 */

import dotenv from "dotenv";
dotenv.config();

import {
  sendSlackRegistrationNotification,
  sendSlackSupportNotification,
  sendSlackSalesNotification,
} from "./apps/server/services/slack-notifications.js";

async function testSlackNotifications() {
  console.log("🧪 Testing Slack Notifications...\n");

  // Test 1: Registration Notification
  console.log("1️⃣ Testing Registration Notification...");
  const registrationSuccess = await sendSlackRegistrationNotification({
    username: "test_user",
    email: "test@example.com",
    organizationName: "Test Organization",
    registeredAt: new Date(),
  });
  console.log(
    registrationSuccess
      ? "✅ Registration notification sent successfully"
      : "❌ Registration notification failed"
  );
  console.log();

  // Test 2: Support Request Notification
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
  console.log(
    supportSuccess
      ? "✅ Support notification sent successfully"
      : "❌ Support notification failed"
  );
  console.log();

  // Test 3: Sales Inquiry Notification
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
  console.log(
    salesSuccess
      ? "✅ Sales notification sent successfully"
      : "❌ Sales notification failed"
  );
  console.log();

  // Summary
  console.log("📊 Test Summary:");
  console.log(`Registration: ${registrationSuccess ? "✅" : "❌"}`);
  console.log(`Support: ${supportSuccess ? "✅" : "❌"}`);
  console.log(`Sales: ${salesSuccess ? "✅" : "❌"}`);

  const allSuccess = registrationSuccess && supportSuccess && salesSuccess;
  console.log(
    allSuccess
      ? "\n🎉 All tests passed!"
      : "\n⚠️ Some tests failed. Check the logs above."
  );
}

// Run the tests
testSlackNotifications().catch((error) => {
  console.error("❌ Test script error:", error);
  process.exit(1);
});
