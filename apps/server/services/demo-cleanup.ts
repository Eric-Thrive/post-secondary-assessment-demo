import { db } from "../db";
import { users, assessmentCases, UserRole } from "@shared/schema";
import { eq, and, lt, sql } from "drizzle-orm";

export interface DemoCleanupResult {
  usersProcessed: number;
  usersDeactivated: number;
  reportsDeleted: number;
  errors: string[];
}

export interface DemoUserCleanupInfo {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
  expirationDate: Date;
  reportCount: number;
  daysUntilExpiration: number;
  isExpired: boolean;
}

export interface DemoDataExport {
  userId: number;
  username: string;
  email: string;
  reports: Array<{
    id: string;
    displayName: string;
    moduleType: string;
    createdDate: Date;
    reportData: any;
  }>;
  exportedAt: Date;
}

export class DemoCleanupService {
  private static readonly DEMO_RETENTION_DAYS = 30;
  private static readonly WARNING_DAYS_BEFORE_CLEANUP = 7;

  /**
   * Get all demo users with their cleanup status
   */
  static async getDemoUsersCleanupInfo(): Promise<DemoUserCleanupInfo[]> {
    const demoUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt,
        reportCount: users.reportCount,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.role, UserRole.DEMO));

    const now = new Date();

    return demoUsers.map((user) => {
      const createdAt = user.createdAt || new Date();
      const expirationDate = new Date(createdAt);
      expirationDate.setDate(
        expirationDate.getDate() + this.DEMO_RETENTION_DAYS
      );

      const daysUntilExpiration = Math.ceil(
        (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt,
        expirationDate,
        reportCount: user.reportCount,
        daysUntilExpiration,
        isExpired: daysUntilExpiration <= 0,
      };
    });
  }

  /**
   * Get demo users that need warning notifications (7 days before cleanup)
   */
  static async getDemoUsersNeedingWarning(): Promise<DemoUserCleanupInfo[]> {
    const allUsers = await this.getDemoUsersCleanupInfo();

    return allUsers.filter(
      (user) =>
        user.daysUntilExpiration <= this.WARNING_DAYS_BEFORE_CLEANUP &&
        user.daysUntilExpiration > 0 &&
        user.reportCount > 0 // Only warn users who have created reports
    );
  }

  /**
   * Get demo users that are expired and ready for cleanup
   */
  static async getExpiredDemoUsers(): Promise<DemoUserCleanupInfo[]> {
    const allUsers = await this.getDemoUsersCleanupInfo();

    return allUsers.filter((user) => user.isExpired);
  }

  /**
   * Export demo user data before cleanup
   */
  static async exportDemoUserData(
    userId: number
  ): Promise<DemoDataExport | null> {
    // Get user details
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user || user.role !== UserRole.DEMO) {
      return null;
    }

    // Get user's assessment reports
    const reports = await db
      .select({
        id: assessmentCases.id,
        displayName: assessmentCases.displayName,
        moduleType: assessmentCases.moduleType,
        createdDate: assessmentCases.createdDate,
        reportData: assessmentCases.reportData,
        status: assessmentCases.status,
      })
      .from(assessmentCases)
      .where(eq(assessmentCases.createdByUserId, userId));

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      reports: reports.map((report) => ({
        id: report.id,
        displayName: report.displayName,
        moduleType: report.moduleType,
        createdDate: report.createdDate || new Date(),
        reportData: report.reportData,
      })),
      exportedAt: new Date(),
    };
  }

  /**
   * Send warning notification to demo user before cleanup
   */
  static async sendCleanupWarning(userId: number): Promise<void> {
    const userInfo = (await this.getDemoUsersCleanupInfo()).find(
      (u) => u.id === userId
    );

    if (!userInfo) {
      throw new Error("Demo user not found");
    }

    const notification = {
      to: userInfo.email,
      subject: "Demo Account Expiring Soon - Export Your Data",
      timestamp: new Date().toISOString(),
      userDetails: userInfo,
      message: `
🔔 DEMO ACCOUNT EXPIRATION WARNING

Hello ${userInfo.username},

Your demo account will expire in ${
        userInfo.daysUntilExpiration
      } days (on ${userInfo.expirationDate.toLocaleDateString()}).

📊 Your Demo Summary:
   - Reports Created: ${userInfo.reportCount}
   - Account Created: ${userInfo.createdAt.toLocaleDateString()}
   - Expiration Date: ${userInfo.expirationDate.toLocaleDateString()}

⚠️ What happens when your demo expires:
   - Your account will be deactivated
   - All your assessment reports will be deleted
   - This action cannot be undone

🚀 To keep your data and continue using the platform:
   1. Upgrade to a full account before ${userInfo.expirationDate.toLocaleDateString()}
   2. Export your reports if you want to save them
   3. Contact support if you need assistance

Upgrade now: [Upgrade Link]
Export data: [Export Link]

Questions? Contact our support team.

Best regards,
The Assessment Platform Team
      `,
    };

    // TODO: Integrate with actual email service (SendGrid, etc.)
    console.log("📧 DEMO CLEANUP WARNING EMAIL QUEUED:");
    console.log(notification.message);

    // In a production system, this would call an email service
    // await emailService.send(notification);
  }

  /**
   * Perform cleanup of expired demo users
   */
  static async cleanupExpiredDemoUsers(
    dryRun: boolean = true
  ): Promise<DemoCleanupResult> {
    const result: DemoCleanupResult = {
      usersProcessed: 0,
      usersDeactivated: 0,
      reportsDeleted: 0,
      errors: [],
    };

    try {
      const expiredUsers = await this.getExpiredDemoUsers();
      result.usersProcessed = expiredUsers.length;

      console.log(
        `${dryRun ? "[DRY RUN] " : ""}Processing ${
          expiredUsers.length
        } expired demo users`
      );

      for (const user of expiredUsers) {
        try {
          console.log(
            `${dryRun ? "[DRY RUN] " : ""}Processing user: ${
              user.username
            } (ID: ${user.id})`
          );

          // Export user data before cleanup
          const exportData = await this.exportDemoUserData(user.id);
          if (exportData) {
            console.log(
              `${dryRun ? "[DRY RUN] " : ""}Exported ${
                exportData.reports.length
              } reports for user ${user.username}`
            );

            // TODO: Store export data in a secure location or send to user
            // await storageService.saveExport(exportData);
          }

          if (!dryRun) {
            // Delete user's assessment reports
            const deletedReports = await db
              .delete(assessmentCases)
              .where(eq(assessmentCases.createdByUserId, user.id))
              .returning({ id: assessmentCases.id });

            result.reportsDeleted += deletedReports.length;
            console.log(
              `Deleted ${deletedReports.length} reports for user ${user.username}`
            );

            // Deactivate user account (don't delete to preserve referential integrity)
            await db
              .update(users)
              .set({
                isActive: false,
                // Clear sensitive data but keep record for audit purposes
                email: `deleted_${user.id}@demo.expired`,
                password: "ACCOUNT_EXPIRED",
                resetToken: null,
                resetTokenExpiry: null,
                registrationToken: null,
              })
              .where(eq(users.id, user.id));

            result.usersDeactivated++;
            console.log(`Deactivated user account: ${user.username}`);
          } else {
            console.log(
              `[DRY RUN] Would delete ${user.reportCount} reports and deactivate user ${user.username}`
            );
            result.reportsDeleted += user.reportCount;
            result.usersDeactivated++;
          }
        } catch (error) {
          const errorMsg = `Failed to cleanup user ${user.username}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      console.log(`${dryRun ? "[DRY RUN] " : ""}Cleanup completed:`, result);
      return result;
    } catch (error) {
      const errorMsg = `Demo cleanup failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
      return result;
    }
  }

  /**
   * Send cleanup warnings to users approaching expiration
   */
  static async sendCleanupWarnings(): Promise<{
    sent: number;
    errors: string[];
  }> {
    const result = { sent: 0, errors: [] as string[] };

    try {
      const usersNeedingWarning = await this.getDemoUsersNeedingWarning();
      console.log(
        `Sending cleanup warnings to ${usersNeedingWarning.length} demo users`
      );

      for (const user of usersNeedingWarning) {
        try {
          await this.sendCleanupWarning(user.id);
          result.sent++;
          console.log(
            `Sent cleanup warning to ${user.username} (${user.email})`
          );
        } catch (error) {
          const errorMsg = `Failed to send warning to ${user.username}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      return result;
    } catch (error) {
      const errorMsg = `Failed to send cleanup warnings: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
      return result;
    }
  }

  /**
   * Get cleanup statistics
   */
  static async getCleanupStats(): Promise<{
    totalDemoUsers: number;
    activeDemoUsers: number;
    usersNeedingWarning: number;
    expiredUsers: number;
    totalDemoReports: number;
  }> {
    const allUsers = await this.getDemoUsersCleanupInfo();
    const usersNeedingWarning = await this.getDemoUsersNeedingWarning();
    const expiredUsers = await this.getExpiredDemoUsers();

    // Get total demo reports count
    const [reportStats] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(assessmentCases)
      .innerJoin(users, eq(assessmentCases.createdByUserId, users.id))
      .where(eq(users.role, UserRole.DEMO));

    return {
      totalDemoUsers: allUsers.length,
      activeDemoUsers: allUsers.filter((u) => !u.isExpired).length,
      usersNeedingWarning: usersNeedingWarning.length,
      expiredUsers: expiredUsers.length,
      totalDemoReports: reportStats?.count || 0,
    };
  }
}
