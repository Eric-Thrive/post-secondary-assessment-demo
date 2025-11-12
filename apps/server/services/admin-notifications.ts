import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  sendAdminRegistrationNotification,
  sendAdminSupportNotification,
  sendAdminSalesNotification,
  type RegistrationData,
  type SupportRequest,
  type SalesInquiry,
} from "./sendgrid";
import {
  sendSlackRegistrationNotification,
  sendSlackSupportNotification,
  sendSlackSalesNotification,
} from "./slack-notifications";

// Cache for system admin list
interface AdminCache {
  admins: Array<{ id: number; email: string; username: string }>;
  timestamp: number;
}

let adminCache: AdminCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Retrieve all users with system_admin role
 * Implements caching with 5-minute TTL
 * @returns Array of system admin users
 */
export async function getSystemAdmins(): Promise<
  Array<{ id: number; email: string; username: string }>
> {
  const now = Date.now();

  // Return cached admins if cache is valid
  if (adminCache && now - adminCache.timestamp < CACHE_TTL_MS) {
    console.log("Using cached system admin list");
    return adminCache.admins;
  }

  try {
    // Query database for system admins
    const systemAdmins = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
      })
      .from(users)
      .where(eq(users.role, "system_admin"));

    // Handle case where no admins exist
    if (systemAdmins.length === 0) {
      console.warn(
        "⚠️ No system administrators found in database. Admin notifications will not be sent."
      );
      return [];
    }

    // Update cache
    adminCache = {
      admins: systemAdmins,
      timestamp: now,
    };

    console.log(`Found ${systemAdmins.length} system administrator(s)`);
    return systemAdmins;
  } catch (error) {
    console.error("Error fetching system administrators:", error);
    // Return empty array on error to prevent blocking user operations
    return [];
  }
}

/**
 * Invalidate the admin cache
 * Call this when admin roles are modified
 */
export function invalidateAdminCache(): void {
  adminCache = null;
  console.log("Admin cache invalidated");
}

/**
 * Send registration notification to all system administrators
 * Runs asynchronously to avoid blocking user registration
 * Sends to Slack webhook if configured, otherwise falls back to email
 * @param userData User registration data
 */
export async function sendRegistrationNotification(
  userData: RegistrationData
): Promise<void> {
  // Run asynchronously without blocking
  setImmediate(async () => {
    try {
      // Try Slack notification first
      const slackSuccess = await sendSlackRegistrationNotification(userData);

      if (slackSuccess) {
        console.log("✅ Registration notification sent to Slack");
        return;
      }

      // Fall back to email if Slack fails or is not configured
      console.log("Falling back to email notifications for registration");
      const admins = await getSystemAdmins();

      if (admins.length === 0) {
        console.log(
          "No system admins to notify for registration:",
          userData.email
        );
        return;
      }

      // Send notification to each admin
      const notificationPromises = admins.map((admin) =>
        sendAdminRegistrationNotification(admin.email, userData)
          .then((success) => {
            if (success) {
              console.log(
                `✅ Registration notification sent to admin: ${admin.email}`
              );
            } else {
              console.error(
                `❌ Failed to send registration notification to admin: ${admin.email}`
              );
            }
            return success;
          })
          .catch((error) => {
            console.error(
              `Error sending registration notification to ${admin.email}:`,
              error
            );
            return false;
          })
      );

      // Wait for all notifications to complete
      const results = await Promise.all(notificationPromises);
      const successCount = results.filter((r) => r).length;

      console.log(
        `Registration notifications: ${successCount}/${admins.length} sent successfully`
      );
    } catch (error) {
      console.error("Error in sendRegistrationNotification:", error);
    }
  });
}

/**
 * Send support request notification to all system administrators
 * Runs asynchronously to avoid blocking user request submission
 * Sends to Slack webhook if configured, otherwise falls back to email
 * @param request Support request data
 */
export async function sendSupportRequestNotification(
  request: SupportRequest
): Promise<void> {
  // Run asynchronously without blocking
  setImmediate(async () => {
    try {
      // Try Slack notification first
      const slackSuccess = await sendSlackSupportNotification(request);

      if (slackSuccess) {
        console.log("✅ Support request notification sent to Slack");
        return;
      }

      // Fall back to email if Slack fails or is not configured
      console.log("Falling back to email notifications for support request");
      const admins = await getSystemAdmins();

      if (admins.length === 0) {
        console.log(
          "No system admins to notify for support request:",
          request.email
        );
        return;
      }

      // Send notification to each admin
      const notificationPromises = admins.map((admin) =>
        sendAdminSupportNotification(admin.email, request)
          .then((success) => {
            if (success) {
              console.log(
                `✅ Support request notification sent to admin: ${admin.email}`
              );
            } else {
              console.error(
                `❌ Failed to send support request notification to admin: ${admin.email}`
              );
            }
            return success;
          })
          .catch((error) => {
            console.error(
              `Error sending support request notification to ${admin.email}:`,
              error
            );
            return false;
          })
      );

      // Wait for all notifications to complete
      const results = await Promise.all(notificationPromises);
      const successCount = results.filter((r) => r).length;

      console.log(
        `Support request notifications: ${successCount}/${admins.length} sent successfully`
      );
    } catch (error) {
      console.error("Error in sendSupportRequestNotification:", error);
    }
  });
}

/**
 * Send sales inquiry notification to all system administrators
 * Runs asynchronously to avoid blocking user inquiry submission
 * Sends to Slack webhook if configured, otherwise falls back to email
 * @param inquiry Sales inquiry data
 */
export async function sendSalesInquiryNotification(
  inquiry: SalesInquiry
): Promise<void> {
  // Run asynchronously without blocking
  setImmediate(async () => {
    try {
      // Try Slack notification first
      const slackSuccess = await sendSlackSalesNotification(inquiry);

      if (slackSuccess) {
        console.log("✅ Sales inquiry notification sent to Slack");
        return;
      }

      // Fall back to email if Slack fails or is not configured
      console.log("Falling back to email notifications for sales inquiry");
      const admins = await getSystemAdmins();

      if (admins.length === 0) {
        console.log(
          "No system admins to notify for sales inquiry:",
          inquiry.email
        );
        return;
      }

      // Send notification to each admin
      const notificationPromises = admins.map((admin) =>
        sendAdminSalesNotification(admin.email, inquiry)
          .then((success) => {
            if (success) {
              console.log(
                `✅ Sales inquiry notification sent to admin: ${admin.email}`
              );
            } else {
              console.error(
                `❌ Failed to send sales inquiry notification to admin: ${admin.email}`
              );
            }
            return success;
          })
          .catch((error) => {
            console.error(
              `Error sending sales inquiry notification to ${admin.email}:`,
              error
            );
            return false;
          })
      );

      // Wait for all notifications to complete
      const results = await Promise.all(notificationPromises);
      const successCount = results.filter((r) => r).length;

      console.log(
        `Sales inquiry notifications: ${successCount}/${admins.length} sent successfully`
      );
    } catch (error) {
      console.error("Error in sendSalesInquiryNotification:", error);
    }
  });
}
