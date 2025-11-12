/**
 * Slack Webhook Notification Service
 * Sends formatted notifications to Slack via webhook
 */

import type {
  RegistrationData,
  SupportRequest,
  SalesInquiry,
} from "./sendgrid";

interface SlackMessage {
  text?: string;
  blocks?: Array<any>;
}

/**
 * Send a message to Slack via webhook
 */
async function sendSlackMessage(message: SlackMessage): Promise<boolean> {
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

  if (!SLACK_WEBHOOK_URL) {
    console.warn(
      "⚠️ SLACK_WEBHOOK_URL not configured. Skipping Slack notification."
    );
    return false;
  }

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
      console.error(`Slack webhook error: ${response.status} - ${errorText}`);
      return false;
    }

    console.log("✅ Slack notification sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending Slack notification:", error);
    return false;
  }
}

/**
 * Send registration notification to Slack
 */
export async function sendSlackRegistrationNotification(
  userData: RegistrationData
): Promise<boolean> {
  const timestamp = userData.registeredAt.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "long",
  });

  const message: SlackMessage = {
    text: `🎉 New User Registration: ${userData.username}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🎉 New User Registration",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Username:*\n${userData.username}`,
          },
          {
            type: "mrkdwn",
            text: `*Email:*\n${userData.email}`,
          },
          {
            type: "mrkdwn",
            text: `*Organization:*\n${
              userData.organizationName || "Not provided"
            }`,
          },
          {
            type: "mrkdwn",
            text: `*Registered:*\n${timestamp}`,
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "ℹ️ User needs to verify their email before accessing the platform",
          },
        ],
      },
      {
        type: "divider",
      },
    ],
  };

  return sendSlackMessage(message);
}

/**
 * Send support request notification to Slack
 */
export async function sendSlackSupportNotification(
  request: SupportRequest
): Promise<boolean> {
  const timestamp = request.createdAt.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "long",
  });

  const urgencyEmoji = {
    low: "🟢",
    medium: "🟡",
    high: "🔴",
  };

  const message: SlackMessage = {
    text: `${urgencyEmoji[request.urgency]} Support Request: ${
      request.subject
    }`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${urgencyEmoji[request.urgency]} Support Request`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Urgency:* ${request.urgency.toUpperCase()}`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Name:*\n${request.name}`,
          },
          {
            type: "mrkdwn",
            text: `*Email:*\n${request.email}`,
          },
          {
            type: "mrkdwn",
            text: `*Category:*\n${request.category}`,
          },
          {
            type: "mrkdwn",
            text: `*Submitted:*\n${timestamp}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Subject:*\n${request.subject}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Description:*\n${request.description}`,
        },
      },
      {
        type: "divider",
      },
    ],
  };

  return sendSlackMessage(message);
}

/**
 * Send sales inquiry notification to Slack
 */
export async function sendSlackSalesNotification(
  inquiry: SalesInquiry
): Promise<boolean> {
  const timestamp = inquiry.createdAt.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "long",
  });

  const modulesText =
    inquiry.interestedModules.length > 0
      ? inquiry.interestedModules.join(", ")
      : "Not specified";

  const message: SlackMessage = {
    text: `💰 Sales Inquiry: ${inquiry.organization}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "💰 Sales Inquiry",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Inquiry Type:* ${inquiry.inquiryType.toUpperCase()}`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Name:*\n${inquiry.name}`,
          },
          {
            type: "mrkdwn",
            text: `*Email:*\n${inquiry.email}`,
          },
          {
            type: "mrkdwn",
            text: `*Organization:*\n${inquiry.organization}`,
          },
          {
            type: "mrkdwn",
            text: `*Org Size:*\n${inquiry.organizationSize || "Not provided"}`,
          },
          {
            type: "mrkdwn",
            text: `*Interested Modules:*\n${modulesText}`,
          },
          {
            type: "mrkdwn",
            text: `*Submitted:*\n${timestamp}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Message:*\n${inquiry.message}`,
        },
      },
      {
        type: "divider",
      },
    ],
  };

  return sendSlackMessage(message);
}
