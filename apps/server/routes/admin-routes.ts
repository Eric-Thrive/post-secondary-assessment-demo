import type { Express } from "express";
import "../types";
import { db } from "../db";
import { users, organizations, assessmentCases } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../auth";
import { UserRole } from "@shared/schema";

/**
 * Register admin dashboard routes.
 * These routes provide analytics and statistics for admin users.
 */
export function registerAdminDashboardRoutes(app: Express): void {
  // Get admin dashboard statistics (for Admin and Developer roles)
  app.get(
    "/api/admin/stats",
    requireAuth,
    requireRole([UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER]),
    async (_req, res) => {
      try {
        // Get user statistics
        const allUsers = await db.select().from(users);
        const activeUsers = allUsers.filter((u) => u.isActive);

        const usersByRole: Record<string, number> = {};
        const usersByModule: Record<string, number> = {};

        allUsers.forEach((user) => {
          // Count by role
          usersByRole[user.role] = (usersByRole[user.role] || 0) + 1;

          // Count by module
          const modules = (user.assignedModules as string[]) || [];
          modules.forEach((module) => {
            usersByModule[module] = (usersByModule[module] || 0) + 1;
          });
        });

        // Get organization statistics
        const allOrgs = await db.select().from(organizations);
        const activeOrgs = allOrgs.filter((o) => o.isActive);

        // Get report statistics
        const allReports = await db.select().from(assessmentCases);

        const reportsByModule: Record<string, number> = {};
        const reportsByStatus: Record<string, number> = {};

        allReports.forEach((report) => {
          // Count by module
          reportsByModule[report.moduleType] =
            (reportsByModule[report.moduleType] || 0) + 1;

          // Count by status
          reportsByStatus[report.status] =
            (reportsByStatus[report.status] || 0) + 1;
        });

        // Get system health (simplified - would integrate with performance routes)
        const systemHealth = {
          apiHealth: "healthy" as const,
          databaseHealth: "healthy" as const,
          aiCosts24h: 0, // Would integrate with AI cost tracking
        };

        res.json({
          users: {
            total: allUsers.length,
            active: activeUsers.length,
            byRole: usersByRole,
            byModule: usersByModule,
          },
          organizations: {
            total: allOrgs.length,
            active: activeOrgs.length,
          },
          reports: {
            total: allReports.length,
            byModule: reportsByModule,
            byStatus: reportsByStatus,
          },
          system: systemHealth,
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ error: "Failed to fetch admin statistics" });
      }
    }
  );

  // Get organization admin dashboard statistics (for Org Admin role)
  app.get(
    "/api/admin/org-stats",
    requireAuth,
    requireRole([UserRole.ORG_ADMIN]),
    async (req, res) => {
      try {
        if (!req.user?.organizationId) {
          return res.status(400).json({
            error: "User is not associated with an organization",
          });
        }

        // Get organization details
        const [organization] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, req.user.organizationId));

        if (!organization) {
          return res.status(404).json({ error: "Organization not found" });
        }

        // Get organization users
        const orgUsers = await db
          .select()
          .from(users)
          .where(eq(users.organizationId, req.user.organizationId));

        const activeUsers = orgUsers.filter((u) => u.isActive);

        const usersByRole: Record<string, number> = {};
        orgUsers.forEach((user) => {
          usersByRole[user.role] = (usersByRole[user.role] || 0) + 1;
        });

        // Get organization reports
        const orgReports = await db
          .select({
            id: assessmentCases.id,
            displayName: assessmentCases.displayName,
            status: assessmentCases.status,
            createdByUserId: assessmentCases.createdByUserId,
            createdDate: assessmentCases.createdDate,
          })
          .from(assessmentCases)
          .where(
            sql`${assessmentCases.createdByUserId} IN (SELECT id FROM ${users} WHERE organization_id = ${req.user.organizationId})`
          )
          .orderBy(desc(assessmentCases.createdDate))
          .limit(10);

        const reportsByStatus: Record<string, number> = {};
        const allOrgReports = await db
          .select()
          .from(assessmentCases)
          .where(
            sql`${assessmentCases.createdByUserId} IN (SELECT id FROM ${users} WHERE organization_id = ${req.user.organizationId})`
          );

        allOrgReports.forEach((report) => {
          reportsByStatus[report.status] =
            (reportsByStatus[report.status] || 0) + 1;
        });

        // Get user details for recent reports
        const recentReportsWithUsers = await Promise.all(
          orgReports.map(async (report) => {
            const [creator] = report.createdByUserId
              ? await db
                  .select({ username: users.username })
                  .from(users)
                  .where(eq(users.id, report.createdByUserId))
              : [{ username: "Unknown" }];

            return {
              id: report.id,
              displayName: report.displayName,
              createdBy: creator?.username || "Unknown",
              status: report.status,
              createdAt: report.createdDate?.toISOString() || "",
            };
          })
        );

        res.json({
          organization: {
            id: organization.id,
            name: organization.name,
            userCount: orgUsers.length,
            maxUsers: organization.maxUsers,
            assignedModules: organization.assignedModules as string[],
          },
          users: {
            total: orgUsers.length,
            active: activeUsers.length,
            byRole: usersByRole,
          },
          reports: {
            total: allOrgReports.length,
            byStatus: reportsByStatus,
            recentReports: recentReportsWithUsers,
          },
        });
      } catch (error) {
        console.error("Error fetching org admin stats:", error);
        res
          .status(500)
          .json({ error: "Failed to fetch organization statistics" });
      }
    }
  );

  // Get user management page data (for Admin, Developer, and Org Admin)
  app.get(
    "/api/admin/users",
    requireAuth,
    requireRole([
      UserRole.SYSTEM_ADMIN,
      UserRole.DEVELOPER,
      UserRole.ORG_ADMIN,
    ]),
    async (req, res) => {
      try {
        let usersQuery = db.select().from(users);

        // If org admin, filter to only their organization
        if (req.user?.role === UserRole.ORG_ADMIN) {
          if (!req.user.organizationId) {
            return res.status(400).json({
              error: "User is not associated with an organization",
            });
          }

          const orgUsers = await db
            .select()
            .from(users)
            .where(eq(users.organizationId, req.user.organizationId));

          return res.json({
            users: orgUsers.map((u) => ({
              id: u.id,
              username: u.username,
              email: u.email,
              role: u.role,
              assignedModules: u.assignedModules,
              organizationId: u.organizationId,
              isActive: u.isActive,
              reportCount: u.reportCount,
              maxReports: u.maxReports,
              createdAt: u.createdAt,
              lastLogin: u.lastLogin,
            })),
            totalUsers: orgUsers.length,
            activeUsers: orgUsers.filter((u) => u.isActive).length,
          });
        }

        // Admin and Developer see all users
        const allUsers = await usersQuery;

        res.json({
          users: allUsers.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role,
            assignedModules: u.assignedModules,
            organizationId: u.organizationId,
            isActive: u.isActive,
            reportCount: u.reportCount,
            maxReports: u.maxReports,
            createdAt: u.createdAt,
            lastLogin: u.lastLogin,
          })),
          totalUsers: allUsers.length,
          activeUsers: allUsers.filter((u) => u.isActive).length,
        });
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
      }
    }
  );

  // Update user (for Admin, Developer, and Org Admin)
  app.patch(
    "/api/admin/users/:userId",
    requireAuth,
    requireRole([
      UserRole.SYSTEM_ADMIN,
      UserRole.DEVELOPER,
      UserRole.ORG_ADMIN,
    ]),
    async (req, res) => {
      try {
        const { userId } = req.params;
        const { role, assignedModules, isActive, maxReports, organizationId } =
          req.body;

        // Get the user being updated
        const [targetUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, parseInt(userId, 10)));

        if (!targetUser) {
          return res.status(404).json({ error: "User not found" });
        }

        // If org admin, verify they can only update users in their organization
        if (req.user?.role === UserRole.ORG_ADMIN) {
          if (targetUser.organizationId !== req.user.organizationId) {
            return res.status(403).json({
              error: "You can only update users in your organization",
            });
          }

          // Org admins cannot assign admin or developer roles
          if (
            role &&
            (role === UserRole.SYSTEM_ADMIN ||
              role === UserRole.DEVELOPER ||
              role === UserRole.ORG_ADMIN)
          ) {
            return res.status(403).json({
              error: "You cannot assign admin or developer roles",
            });
          }
        }

        const updateData: any = {};
        if (role !== undefined) updateData.role = role;
        if (assignedModules !== undefined)
          updateData.assignedModules = assignedModules;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (maxReports !== undefined) updateData.maxReports = maxReports;
        if (organizationId !== undefined)
          updateData.organizationId = organizationId;

        await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, parseInt(userId, 10)));

        res.json({ message: "User updated successfully" });
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Failed to update user" });
      }
    }
  );

  // Demo cleanup management endpoints (Admin and Developer only)

  // Get demo cleanup statistics
  app.get(
    "/api/admin/demo/cleanup-stats",
    requireAuth,
    requireRole([UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER]),
    async (_req, res) => {
      try {
        const { DemoCleanupService } = await import("../services/demo-cleanup");
        const stats = await DemoCleanupService.getCleanupStats();
        res.json(stats);
      } catch (error) {
        console.error("Error fetching demo cleanup stats:", error);
        res
          .status(500)
          .json({ error: "Failed to fetch demo cleanup statistics" });
      }
    }
  );

  // Get demo users needing cleanup
  app.get(
    "/api/admin/demo/users-cleanup-info",
    requireAuth,
    requireRole([UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER]),
    async (_req, res) => {
      try {
        const { DemoCleanupService } = await import("../services/demo-cleanup");
        const allUsers = await DemoCleanupService.getDemoUsersCleanupInfo();
        const usersNeedingWarning =
          await DemoCleanupService.getDemoUsersNeedingWarning();
        const expiredUsers = await DemoCleanupService.getExpiredDemoUsers();

        res.json({
          allDemoUsers: allUsers,
          usersNeedingWarning,
          expiredUsers,
        });
      } catch (error) {
        console.error("Error fetching demo users cleanup info:", error);
        res
          .status(500)
          .json({ error: "Failed to fetch demo users cleanup info" });
      }
    }
  );

  // Send cleanup warnings to demo users
  app.post(
    "/api/admin/demo/send-warnings",
    requireAuth,
    requireRole([UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER]),
    async (_req, res) => {
      try {
        const { DemoCleanupService } = await import("../services/demo-cleanup");
        const result = await DemoCleanupService.sendCleanupWarnings();
        res.json({
          message: `Sent ${result.sent} cleanup warnings`,
          ...result,
        });
      } catch (error) {
        console.error("Error sending cleanup warnings:", error);
        res.status(500).json({ error: "Failed to send cleanup warnings" });
      }
    }
  );

  // Perform demo cleanup (with dry run option)
  app.post(
    "/api/admin/demo/cleanup",
    requireAuth,
    requireRole([UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER]),
    async (req, res) => {
      try {
        const { dryRun = true } = req.body;
        const { DemoCleanupService } = await import("../services/demo-cleanup");
        const result = await DemoCleanupService.cleanupExpiredDemoUsers(dryRun);

        res.json({
          message: dryRun
            ? `Dry run completed: Would process ${result.usersProcessed} users`
            : `Cleanup completed: Processed ${result.usersProcessed} users`,
          dryRun,
          ...result,
        });
      } catch (error) {
        console.error("Error performing demo cleanup:", error);
        res.status(500).json({ error: "Failed to perform demo cleanup" });
      }
    }
  );

  // Export demo user data (Admin only)
  app.get(
    "/api/admin/demo/export/:userId",
    requireAuth,
    requireRole([UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER]),
    async (req, res) => {
      try {
        const { userId } = req.params;
        const { DemoCleanupService } = await import("../services/demo-cleanup");
        const exportData = await DemoCleanupService.exportDemoUserData(
          parseInt(userId, 10)
        );

        if (!exportData) {
          return res
            .status(404)
            .json({ error: "Demo user not found or no data to export" });
        }

        // Set headers for file download
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="admin-export-demo-user-${
            exportData.username
          }-${new Date().toISOString().split("T")[0]}.json"`
        );

        res.json(exportData);
      } catch (error) {
        console.error("Error exporting demo user data:", error);
        res.status(500).json({ error: "Failed to export demo user data" });
      }
    }
  );

  // Demo cleanup job management endpoints

  // Get demo cleanup job status
  app.get(
    "/api/admin/demo/job-status",
    requireAuth,
    requireRole([UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER]),
    async (_req, res) => {
      try {
        const { DemoCleanupJob } = await import("../jobs/demo-cleanup-job");
        const status = DemoCleanupJob.getJobStatus();
        res.json(status);
      } catch (error) {
        console.error("Error getting demo job status:", error);
        res.status(500).json({ error: "Failed to get demo job status" });
      }
    }
  );

  // Trigger manual demo cleanup
  app.post(
    "/api/admin/demo/trigger-cleanup",
    requireAuth,
    requireRole([UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER]),
    async (req, res) => {
      try {
        const { dryRun = true } = req.body;
        const { DemoCleanupJob } = await import("../jobs/demo-cleanup-job");
        const result = await DemoCleanupJob.triggerManualCleanup(dryRun);
        res.json(result);
      } catch (error) {
        console.error("Error triggering manual cleanup:", error);
        res.status(500).json({ error: "Failed to trigger manual cleanup" });
      }
    }
  );

  // Trigger manual demo warnings
  app.post(
    "/api/admin/demo/trigger-warnings",
    requireAuth,
    requireRole([UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER]),
    async (_req, res) => {
      try {
        const { DemoCleanupJob } = await import("../jobs/demo-cleanup-job");
        const result = await DemoCleanupJob.triggerManualWarnings();
        res.json(result);
      } catch (error) {
        console.error("Error triggering manual warnings:", error);
        res.status(500).json({ error: "Failed to trigger manual warnings" });
      }
    }
  );

  // Update demo cleanup job configuration
  app.patch(
    "/api/admin/demo/job-config",
    requireAuth,
    requireRole([UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER]),
    async (req, res) => {
      try {
        const { DemoCleanupJob } = await import("../jobs/demo-cleanup-job");
        DemoCleanupJob.updateConfig(req.body);
        const updatedStatus = DemoCleanupJob.getJobStatus();
        res.json({
          message: "Demo cleanup job configuration updated",
          config: updatedStatus.config,
        });
      } catch (error) {
        console.error("Error updating demo job config:", error);
        res
          .status(500)
          .json({ error: "Failed to update demo job configuration" });
      }
    }
  );
}
