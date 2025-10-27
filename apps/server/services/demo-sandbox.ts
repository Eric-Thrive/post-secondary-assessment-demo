import { db } from "../db";
import { users, assessmentCases, UserRole } from "@shared/schema";
import { eq, and, sql, lt } from "drizzle-orm";

export interface DemoLimitCheck {
  canCreate: boolean;
  currentCount: number;
  maxReports: number;
  isNearLimit: boolean;
  shouldShowUpgradePrompt: boolean;
}

export interface DemoUpgradePrompt {
  show: boolean;
  title: string;
  message: string;
  currentCount: number;
  maxReports: number;
  upgradeUrl?: string;
}

export class DemoSandboxService {
  private static readonly DEMO_REPORT_LIMIT = 5;
  private static readonly UPGRADE_PROMPT_THRESHOLD = 4;
  private static readonly DEMO_RETENTION_DAYS = 30;

  /**
   * Check if a demo user can create a new report
   */
  static async checkDemoReportLimit(userId: number): Promise<DemoLimitCheck> {
    // Get user details to verify they are a demo user
    const [user] = await db
      .select({
        role: users.role,
        reportCount: users.reportCount,
        maxReports: users.maxReports,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new Error("User not found");
    }

    // Only apply demo limits to demo users
    if (user.role !== UserRole.DEMO) {
      return {
        canCreate: true,
        currentCount: user.reportCount,
        maxReports: user.maxReports,
        isNearLimit: false,
        shouldShowUpgradePrompt: false,
      };
    }

    // For demo users, enforce the 5-report limit
    const currentCount = user.reportCount;
    const maxReports = this.DEMO_REPORT_LIMIT;
    const canCreate = currentCount < maxReports;
    const isNearLimit = currentCount >= this.UPGRADE_PROMPT_THRESHOLD;
    const shouldShowUpgradePrompt = isNearLimit && canCreate;

    return {
      canCreate,
      currentCount,
      maxReports,
      isNearLimit,
      shouldShowUpgradePrompt,
    };
  }

  /**
   * Increment report count for demo users with validation
   */
  static async incrementDemoReportCount(userId: number): Promise<void> {
    // First check if the user can create a report
    const limitCheck = await this.checkDemoReportLimit(userId);

    if (!limitCheck.canCreate) {
      throw new Error(
        `Demo report limit exceeded. Maximum ${limitCheck.maxReports} reports allowed.`
      );
    }

    // Increment the report count
    await db
      .update(users)
      .set({ reportCount: sql`report_count + 1` })
      .where(eq(users.id, userId));

    console.log(
      `Demo report count incremented for user ${userId}. New count: ${
        limitCheck.currentCount + 1
      }`
    );
  }

  /**
   * Get upgrade prompt configuration for demo users
   */
  static async getDemoUpgradePrompt(
    userId: number
  ): Promise<DemoUpgradePrompt> {
    const limitCheck = await this.checkDemoReportLimit(userId);

    if (!limitCheck.shouldShowUpgradePrompt) {
      return {
        show: false,
        title: "",
        message: "",
        currentCount: limitCheck.currentCount,
        maxReports: limitCheck.maxReports,
      };
    }

    const reportsRemaining = limitCheck.maxReports - limitCheck.currentCount;

    let title: string;
    let message: string;

    if (reportsRemaining === 1) {
      title = "Last Demo Report";
      message = `This is your final demo report (${
        limitCheck.currentCount + 1
      } of ${
        limitCheck.maxReports
      }). Upgrade to continue creating unlimited assessment reports.`;
    } else {
      title = "Demo Limit Approaching";
      message = `You have ${reportsRemaining} demo reports remaining (${limitCheck.currentCount} of ${limitCheck.maxReports} used). Upgrade to unlock unlimited reports and advanced features.`;
    }

    return {
      show: true,
      title,
      message,
      currentCount: limitCheck.currentCount,
      maxReports: limitCheck.maxReports,
      upgradeUrl: "/upgrade", // This would be configured based on your upgrade flow
    };
  }

  /**
   * Get demo users that are approaching or have exceeded their limits
   */
  static async getDemoUsersNearLimit(): Promise<
    Array<{
      id: number;
      username: string;
      email: string;
      reportCount: number;
      maxReports: number;
      createdAt: Date;
    }>
  > {
    const demoUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        reportCount: users.reportCount,
        maxReports: users.maxReports,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.role, UserRole.DEMO),
          eq(users.isActive, true),
          sql`report_count >= ${this.UPGRADE_PROMPT_THRESHOLD}`
        )
      );

    return demoUsers.map((user) => ({
      ...user,
      createdAt: user.createdAt || new Date(),
    }));
  }

  /**
   * Initialize demo user with proper limits
   */
  static async initializeDemoUser(userId: number): Promise<void> {
    await db
      .update(users)
      .set({
        maxReports: this.DEMO_REPORT_LIMIT,
        reportCount: 0,
      })
      .where(eq(users.id, userId));

    console.log(
      `Demo user ${userId} initialized with ${this.DEMO_REPORT_LIMIT} report limit`
    );
  }

  /**
   * Check if a demo user has exceeded their trial period
   */
  static async isDemoUserExpired(userId: number): Promise<boolean> {
    const [user] = await db
      .select({
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user || user.role !== UserRole.DEMO) {
      return false;
    }

    if (!user.createdAt) {
      return false;
    }

    const expirationDate = new Date(user.createdAt);
    expirationDate.setDate(expirationDate.getDate() + this.DEMO_RETENTION_DAYS);

    return new Date() > expirationDate;
  }

  /**
   * Get demo users that are expired and ready for cleanup
   */
  static async getExpiredDemoUsers(): Promise<
    Array<{
      id: number;
      username: string;
      email: string;
      createdAt: Date;
      expirationDate: Date;
    }>
  > {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.DEMO_RETENTION_DAYS);

    const expiredUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.role, UserRole.DEMO),
          eq(users.isActive, true),
          lt(users.createdAt, cutoffDate)
        )
      );

    return expiredUsers.map((user) => {
      const createdAt = user.createdAt || new Date();
      const expirationDate = new Date(createdAt);
      expirationDate.setDate(
        expirationDate.getDate() + this.DEMO_RETENTION_DAYS
      );

      return {
        ...user,
        createdAt,
        expirationDate,
      };
    });
  }
}
