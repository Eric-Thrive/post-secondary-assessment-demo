import { db } from "../db";
import {
  users,
  organizations,
  assessmentCases,
  promptSections,
  UserRole,
  ModuleType,
} from "@shared/schema";
import { eq, and, inArray, sql, desc } from "drizzle-orm";

/**
 * Optimized database queries for RBAC system performance
 * These queries use proper indexes and minimize data transfer
 */
export class OptimizedQueries {
  /**
   * Get user with organization data in a single optimized query
   * Uses indexes: idx_users_role_active, idx_users_org_role
   */
  public static async getUserWithOrganization(userId: number) {
    return await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        assignedModules: users.assignedModules,
        organizationId: users.organizationId,
        customerId: users.customerId,
        reportCount: users.reportCount,
        maxReports: users.maxReports,
        isActive: users.isActive,
        lastLogin: users.lastLogin,
        // Organization data
        orgName: organizations.name,
        orgAssignedModules: organizations.assignedModules,
        orgMaxUsers: organizations.maxUsers,
        orgIsActive: organizations.isActive,
      })
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .where(and(eq(users.id, userId), eq(users.isActive, true)))
      .limit(1);
  }

  /**
   * Get users by organization with role filtering
   * Uses indexes: idx_users_org_role, idx_organizations_active_modules
   */
  public static async getUsersByOrganization(
    organizationId: string,
    roles?: UserRole[]
  ) {
    const conditions = [
      eq(users.organizationId, organizationId),
      eq(users.isActive, true),
    ];

    if (roles && roles.length > 0) {
      conditions.push(inArray(users.role, roles));
    }

    return await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        assignedModules: users.assignedModules,
        reportCount: users.reportCount,
        maxReports: users.maxReports,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(users.username);
  }

  /**
   * Get assessment cases with organization filtering
   * Uses indexes: idx_assessment_cases_org_module, idx_assessment_cases_org_created
   */
  public static async getAssessmentCasesByOrganization(
    organizationId: string,
    moduleType?: ModuleType,
    limit: number = 50,
    offset: number = 0
  ) {
    const conditions = [eq(assessmentCases.organizationId, organizationId)];

    if (moduleType) {
      conditions.push(eq(assessmentCases.moduleType, moduleType));
    }

    return await db
      .select({
        id: assessmentCases.id,
        caseId: assessmentCases.caseId,
        moduleType: assessmentCases.moduleType,
        displayName: assessmentCases.displayName,
        status: assessmentCases.status,
        createdDate: assessmentCases.createdDate,
        lastUpdated: assessmentCases.lastUpdated,
        createdByUserId: assessmentCases.createdByUserId,
        // Include creator username for display
        creatorUsername: users.username,
      })
      .from(assessmentCases)
      .leftJoin(users, eq(assessmentCases.createdByUserId, users.id))
      .where(and(...conditions))
      .orderBy(desc(assessmentCases.createdDate))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get assessment cases by user with organization validation
   * Uses indexes: idx_assessment_cases_user_status, idx_users_org_role
   */
  public static async getAssessmentCasesByUser(
    userId: number,
    organizationId?: string,
    moduleType?: ModuleType
  ) {
    const conditions = [eq(assessmentCases.createdByUserId, userId)];

    if (organizationId) {
      conditions.push(eq(assessmentCases.organizationId, organizationId));
    }

    if (moduleType) {
      conditions.push(eq(assessmentCases.moduleType, moduleType));
    }

    return await db
      .select({
        id: assessmentCases.id,
        caseId: assessmentCases.caseId,
        moduleType: assessmentCases.moduleType,
        displayName: assessmentCases.displayName,
        status: assessmentCases.status,
        createdDate: assessmentCases.createdDate,
        lastUpdated: assessmentCases.lastUpdated,
        isShared: assessmentCases.isShared,
        shareToken: assessmentCases.shareToken,
      })
      .from(assessmentCases)
      .where(and(...conditions))
      .orderBy(desc(assessmentCases.createdDate));
  }

  /**
   * Get demo users approaching report limits
   * Uses indexes: idx_users_demo_reports
   */
  public static async getDemoUsersNearLimit(warningThreshold: number = 4) {
    return await db
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
          sql`${users.reportCount} >= ${warningThreshold}`
        )
      );
  }

  /**
   * Get expired demo users for cleanup
   * Uses indexes: idx_users_role_active, idx_users_active_created
   */
  public static async getExpiredDemoUsers(retentionDays: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    return await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        reportCount: users.reportCount,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.role, UserRole.DEMO),
          eq(users.isActive, true),
          sql`${users.createdAt} < ${cutoffDate}`
        )
      );
  }

  /**
   * Get prompt sections with caching optimization
   * Uses indexes: idx_prompt_sections_module_type, idx_prompt_sections_key_module
   */
  public static async getPromptSections(
    moduleType: ModuleType,
    promptType?: string,
    pathwayType?: string
  ) {
    const conditions = [eq(promptSections.moduleType, moduleType)];

    if (promptType) {
      conditions.push(eq(promptSections.promptType, promptType));
    }

    if (pathwayType) {
      conditions.push(eq(promptSections.pathwayType, pathwayType));
    }

    return await db
      .select({
        id: promptSections.id,
        sectionKey: promptSections.sectionKey,
        sectionName: promptSections.sectionName,
        content: promptSections.content,
        version: promptSections.version,
        moduleType: promptSections.moduleType,
        promptType: promptSections.promptType,
        pathwayType: promptSections.pathwayType,
        lastUpdated: promptSections.lastUpdated,
      })
      .from(promptSections)
      .where(and(...conditions))
      .orderBy(promptSections.sectionKey);
  }

  /**
   * Get organization statistics for admin dashboard
   * Uses indexes: idx_organizations_active_modules, idx_users_org_role
   */
  public static async getOrganizationStats() {
    return await db
      .select({
        orgId: organizations.id,
        orgName: organizations.name,
        isActive: organizations.isActive,
        assignedModules: organizations.assignedModules,
        maxUsers: organizations.maxUsers,
        userCount: sql<number>`count(${users.id})`,
        activeUserCount: sql<number>`count(case when ${users.isActive} then 1 end)`,
        adminCount: sql<number>`count(case when ${users.role} = 'org_admin' then 1 end)`,
        customerCount: sql<number>`count(case when ${users.role} = 'customer' then 1 end)`,
        demoCount: sql<number>`count(case when ${users.role} = 'demo' then 1 end)`,
      })
      .from(organizations)
      .leftJoin(users, eq(organizations.id, users.organizationId))
      .where(eq(organizations.isActive, true))
      .groupBy(
        organizations.id,
        organizations.name,
        organizations.isActive,
        organizations.assignedModules,
        organizations.maxUsers
      )
      .orderBy(organizations.name);
  }

  /**
   * Batch update user report counts for demo users
   * Uses indexes: idx_users_demo_reports
   */
  public static async incrementDemoUserReportCount(userId: number) {
    return await db
      .update(users)
      .set({
        reportCount: sql`${users.reportCount} + 1`,
        lastLogin: new Date(),
      })
      .where(
        and(
          eq(users.id, userId),
          eq(users.role, UserRole.DEMO),
          eq(users.isActive, true)
        )
      )
      .returning({
        id: users.id,
        reportCount: users.reportCount,
        maxReports: users.maxReports,
      });
  }

  /**
   * Get system performance metrics for monitoring
   */
  public static async getSystemMetrics() {
    const [userStats] = await db
      .select({
        totalUsers: sql<number>`count(*)`,
        activeUsers: sql<number>`count(case when ${users.isActive} then 1 end)`,
        developerCount: sql<number>`count(case when ${users.role} = 'developer' then 1 end)`,
        adminCount: sql<number>`count(case when ${users.role} = 'admin' then 1 end)`,
        orgAdminCount: sql<number>`count(case when ${users.role} = 'org_admin' then 1 end)`,
        customerCount: sql<number>`count(case when ${users.role} = 'customer' then 1 end)`,
        demoCount: sql<number>`count(case when ${users.role} = 'demo' then 1 end)`,
      })
      .from(users);

    const [orgStats] = await db
      .select({
        totalOrgs: sql<number>`count(*)`,
        activeOrgs: sql<number>`count(case when ${organizations.isActive} then 1 end)`,
      })
      .from(organizations);

    const [caseStats] = await db
      .select({
        totalCases: sql<number>`count(*)`,
        k12Cases: sql<number>`count(case when ${assessmentCases.moduleType} = 'k12' then 1 end)`,
        postSecondaryCase: sql<number>`count(case when ${assessmentCases.moduleType} = 'post_secondary' then 1 end)`,
        tutoringCases: sql<number>`count(case when ${assessmentCases.moduleType} = 'tutoring' then 1 end)`,
      })
      .from(assessmentCases);

    return {
      users: userStats,
      organizations: orgStats,
      assessmentCases: caseStats,
    };
  }
}
