import { DemoCleanupService } from "../services/demo-cleanup";

export interface DemoCleanupJobConfig {
  enableAutomaticCleanup: boolean;
  enableWarningNotifications: boolean;
  cleanupSchedule: string; // Cron expression
  warningSchedule: string; // Cron expression
  dryRunMode: boolean;
}

export class DemoCleanupJob {
  private static config: DemoCleanupJobConfig = {
    enableAutomaticCleanup: process.env.DEMO_AUTO_CLEANUP === "true",
    enableWarningNotifications: process.env.DEMO_AUTO_WARNINGS === "true",
    cleanupSchedule: process.env.DEMO_CLEANUP_SCHEDULE || "0 2 * * *", // Daily at 2 AM
    warningSchedule: process.env.DEMO_WARNING_SCHEDULE || "0 9 * * *", // Daily at 9 AM
    dryRunMode: process.env.DEMO_CLEANUP_DRY_RUN !== "false", // Default to dry run for safety
  };

  /**
   * Run the demo cleanup job
   */
  static async runCleanupJob(): Promise<void> {
    console.log("🧹 Starting demo cleanup job...");

    try {
      if (!this.config.enableAutomaticCleanup) {
        console.log("⏸️ Demo cleanup is disabled via configuration");
        return;
      }

      const result = await DemoCleanupService.cleanupExpiredDemoUsers(
        this.config.dryRunMode
      );

      console.log(`✅ Demo cleanup job completed:`, {
        dryRun: this.config.dryRunMode,
        usersProcessed: result.usersProcessed,
        usersDeactivated: result.usersDeactivated,
        reportsDeleted: result.reportsDeleted,
        errors: result.errors.length,
      });

      if (result.errors.length > 0) {
        console.error("❌ Demo cleanup errors:", result.errors);
        // TODO: Send alert to administrators
        await this.sendAdminAlert("Demo Cleanup Errors", {
          errors: result.errors,
          result,
        });
      }

      // Log successful cleanup for audit purposes
      if (!this.config.dryRunMode && result.usersDeactivated > 0) {
        console.log(
          `📊 Demo cleanup audit: Deactivated ${result.usersDeactivated} expired demo accounts and deleted ${result.reportsDeleted} reports`
        );

        // TODO: Store audit log in database
        await this.logCleanupAudit(result);
      }
    } catch (error) {
      console.error("💥 Demo cleanup job failed:", error);

      // TODO: Send alert to administrators
      await this.sendAdminAlert("Demo Cleanup Job Failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Run the demo warning notification job
   */
  static async runWarningJob(): Promise<void> {
    console.log("📧 Starting demo warning notification job...");

    try {
      if (!this.config.enableWarningNotifications) {
        console.log(
          "⏸️ Demo warning notifications are disabled via configuration"
        );
        return;
      }

      const result = await DemoCleanupService.sendCleanupWarnings();

      console.log(`✅ Demo warning job completed:`, {
        warningsSent: result.sent,
        errors: result.errors.length,
      });

      if (result.errors.length > 0) {
        console.error("❌ Demo warning errors:", result.errors);
        // TODO: Send alert to administrators
        await this.sendAdminAlert("Demo Warning Errors", {
          errors: result.errors,
          result,
        });
      }
    } catch (error) {
      console.error("💥 Demo warning job failed:", error);

      // TODO: Send alert to administrators
      await this.sendAdminAlert("Demo Warning Job Failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get job status and configuration
   */
  static getJobStatus(): {
    config: DemoCleanupJobConfig;
    nextCleanupRun?: string;
    nextWarningRun?: string;
    isEnabled: boolean;
  } {
    return {
      config: this.config,
      isEnabled:
        this.config.enableAutomaticCleanup ||
        this.config.enableWarningNotifications,
      // TODO: Calculate next run times based on cron schedule
    };
  }

  /**
   * Update job configuration
   */
  static updateConfig(newConfig: Partial<DemoCleanupJobConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("🔧 Demo cleanup job configuration updated:", this.config);
  }

  /**
   * Send alert to administrators (placeholder implementation)
   */
  private static async sendAdminAlert(
    subject: string,
    data: any
  ): Promise<void> {
    const alert = {
      to: process.env.ADMIN_EMAIL || "admin@example.com",
      subject: `[Demo Cleanup Alert] ${subject}`,
      timestamp: new Date().toISOString(),
      data,
      message: `
🚨 DEMO CLEANUP SYSTEM ALERT

Subject: ${subject}
Timestamp: ${new Date().toLocaleString()}

Details:
${JSON.stringify(data, null, 2)}

This is an automated alert from the demo cleanup system.
Please review the logs and take appropriate action if needed.
      `,
    };

    // TODO: Integrate with actual email/notification service
    console.log("🚨 ADMIN ALERT QUEUED:");
    console.log(alert.message);

    // In a production system, this would send an email or push notification
    // await notificationService.send(alert);
  }

  /**
   * Log cleanup audit information (placeholder implementation)
   */
  private static async logCleanupAudit(result: any): Promise<void> {
    const auditLog = {
      timestamp: new Date().toISOString(),
      action: "demo_cleanup",
      usersProcessed: result.usersProcessed,
      usersDeactivated: result.usersDeactivated,
      reportsDeleted: result.reportsDeleted,
      errors: result.errors,
    };

    // TODO: Store in audit log table or external logging service
    console.log("📋 AUDIT LOG:", auditLog);

    // In a production system, this would store the audit log
    // await auditService.log(auditLog);
  }

  /**
   * Manual trigger for cleanup job (for admin interface)
   */
  static async triggerManualCleanup(dryRun: boolean = true): Promise<any> {
    console.log(`🔧 Manual demo cleanup triggered (dryRun: ${dryRun})`);

    const originalDryRunMode = this.config.dryRunMode;
    this.config.dryRunMode = dryRun;

    try {
      await this.runCleanupJob();
      return { success: true, message: "Manual cleanup completed" };
    } finally {
      this.config.dryRunMode = originalDryRunMode;
    }
  }

  /**
   * Manual trigger for warning job (for admin interface)
   */
  static async triggerManualWarnings(): Promise<any> {
    console.log("🔧 Manual demo warnings triggered");

    try {
      await this.runWarningJob();
      return { success: true, message: "Manual warnings sent" };
    } catch (error) {
      return {
        success: false,
        message: "Manual warnings failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export configuration for environment setup
export const DEMO_CLEANUP_ENV_VARS = {
  DEMO_AUTO_CLEANUP: "Enable automatic demo cleanup (true/false)",
  DEMO_AUTO_WARNINGS: "Enable automatic warning notifications (true/false)",
  DEMO_CLEANUP_SCHEDULE: "Cron schedule for cleanup job (default: 0 2 * * *)",
  DEMO_WARNING_SCHEDULE: "Cron schedule for warning job (default: 0 9 * * *)",
  DEMO_CLEANUP_DRY_RUN:
    "Run cleanup in dry-run mode (true/false, default: true)",
  ADMIN_EMAIL: "Email address for admin alerts",
};
