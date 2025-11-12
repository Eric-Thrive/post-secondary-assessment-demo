/**
 * Simple Slack webhook test
 * Run with: node test-slack-simple.mjs
 */

import dotenv from "dotenv";
dotenv.config();

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

async function sendTestMessage() {
  console.log("🧪 Testing Slack Webhook...\n");

  if (!SLACK_WEBHOOK_URL) {
    console.error("❌ SLACK_WEBHOOK_URL not found in environment variables");
    process.exit(1);
  }

  console.log("📡 Webhook URL configured");
  console.log("🚀 Sending test message...\n");

  const message = {
    text: "🎉 Test Notification from THRIVE Platform",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🎉 Test Notification",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "This is a test message to verify Slack integration is working correctly.",
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: "*Status:*\nTesting",
          },
          {
            type: "mrkdwn",
            text: "*Time:*\n" + new Date().toLocaleString(),
          },
        ],
      },
      {
        type: "divider",
      },
    ],
  };

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ Slack webhook error: ${response.status} - ${errorText}`
      );
      return false;
    }

    console.log("✅ Test message sent successfully!");
    console.log("\n📱 Check your Slack channel for the message.");
    return true;
  } catch (error) {
    console.error("❌ Error sending message:", error);
    return false;
  }
}

sendTestMessage().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
