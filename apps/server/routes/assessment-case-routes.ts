import type { Express, Request, Response } from "express";
import "../types";
import { storage } from "../storage";
import { db } from "../db";
import { assessmentCases, UserRole, ModuleType } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { DEMO_CUSTOMER_ID } from "@shared/constants/environments";
import {
  requireAuth,
  requireCustomerAccess,
  requireOrganizationAccess,
  requireOrganizationMembership,
  checkReportLimit,
  incrementReportCount,
} from "../auth";
import { ModuleGate } from "../permissions/gates/module-gate";

export function registerAssessmentCaseRoutes(app: Express): void {
  // Public shared report route (no authentication required)
  app.get("/api/shared/:shareToken", async (req, res) => {
    try {
      const { shareToken } = req.params;
      console.log(`Fetching shared report with token: ${shareToken}`);

      // Get the shared report from storage
      const sharedReport = await storage.getSharedReport(shareToken);

      if (!sharedReport) {
        return res.status(404).json({
          error: "Shared report not found or sharing has been disabled",
        });
      }

      // Return the shared report data
      res.json({
        success: true,
        ...sharedReport,
      });
    } catch (error: any) {
      console.error("Error fetching shared report:", error);
      res.status(500).json({ error: "Failed to fetch shared report" });
    }
  });

  // API route to enable sharing for a report
  app.post(
    "/api/reports/:caseId/share",
    requireAuth,
    requireCustomerAccess,
    async (req, res) => {
      try {
        const { caseId } = req.params;
        console.log(`Enabling sharing for case: ${caseId}`);

        // Enable sharing and get the share token
        const shareToken = await storage.enableReportSharing(
          caseId,
          req.user?.organizationId
        );

        if (!shareToken) {
          return res.status(404).json({ error: "Report not found" });
        }

        // Generate the shareable URL
        const shareUrl = `${req.protocol}://${req.get(
          "host"
        )}/shared/${shareToken}`;

        res.json({
          success: true,
          shareToken,
          shareUrl,
          message: "Report sharing enabled successfully",
        });
      } catch (error: any) {
        console.error("Error enabling report sharing:", error);
        res.status(500).json({ error: "Failed to enable report sharing" });
      }
    }
  );

  // API route to disable sharing for a report
  app.delete(
    "/api/reports/:caseId/share",
    requireAuth,
    requireCustomerAccess,
    async (req, res) => {
      try {
        const { caseId } = req.params;
        console.log(`Disabling sharing for case: ${caseId}`);

        // Disable sharing
        const success = await storage.disableReportSharing(
          caseId,
          req.user?.organizationId
        );

        if (!success) {
          return res.status(404).json({ error: "Report not found" });
        }

        res.json({
          success: true,
          message: "Report sharing disabled successfully",
        });
      } catch (error: any) {
        console.error("Error disabling report sharing:", error);
        res.status(500).json({ error: "Failed to disable report sharing" });
      }
    }
  );

  // Demo Assessment Cases - requires authentication to ensure user isolation
  app.get(
    "/api/demo-assessment-cases/:moduleType",
    requireAuth,
    (req, res, next) => {
      // Add module access validation
      const moduleType = req.params.moduleType as ModuleType;
      if (Object.values(ModuleType).includes(moduleType)) {
        return ModuleGate.requireModuleAccess(moduleType)(req, res, next);
      }
      return res.status(400).json({ error: "Invalid module type" });
    },
    async (req, res) => {
      try {
        const { moduleType } = req.params;
        const userId = req.user?.id;

        // In demo mode, userId is MANDATORY for security
        if (!userId || typeof userId !== "number") {
          console.error(
            `Demo security violation: Missing or invalid userId. User object:`,
            req.user
          );
          return res.status(403).json({
            error: "Authentication required - invalid user session",
            demo: true,
          });
        }

        console.log(
          `Demo API Route hit: GET /demo-assessment-cases/${moduleType}`
        );
        console.log(
          `Fetching demo assessment cases for module: ${moduleType}, user: ${userId}`
        );

        // System admins and developers can see all cases, even in demo mode
        let cases;
        if (
          req.user?.role === UserRole.SYSTEM_ADMIN ||
          req.user?.role === UserRole.DEVELOPER
        ) {
          console.log(
            `✅ System admin/developer access in demo mode - showing all cases`
          );
          // Get all cases without customer or user filters
          cases = await storage.getAssessmentCases(moduleType);
        } else {
          // Get demo cases filtered by the current user's ID
          // This ensures users only see their own assessment cases
          cases = await storage.getAssessmentCases(
            moduleType,
            DEMO_CUSTOMER_ID,
            userId
          );
        }

        console.log(
          `Found ${cases.length} demo ${moduleType} cases for user ${userId}`
        );
        res.json(cases || []);
      } catch (error: any) {
        console.error(
          `Error fetching demo assessment cases for ${req.params.moduleType}:`,
          error
        );
        res.status(500).json({
          error: "Failed to fetch demo assessment cases",
          demo: true,
        });
      }
    }
  );

  // Assessment Cases - now with customer isolation (NO CACHE)
  app.get(
    "/api/assessment-cases/:moduleType",
    requireAuth,
    requireCustomerAccess,
    (req, res, next) => {
      // Add module access validation
      const moduleType = req.params.moduleType as ModuleType;
      if (Object.values(ModuleType).includes(moduleType)) {
        return ModuleGate.requireModuleAccess(moduleType)(req, res, next);
      }
      return res.status(400).json({ error: "Invalid module type" });
    },
    async (req, res) => {
      try {
        const { moduleType } = req.params;
        console.log(`API Route hit: GET /assessment-cases/${moduleType}`);
        console.log(
          `🔍 Route Handler - req.customerFilter: "${req.customerFilter}"`
        );
        console.log(
          `🔍 Route Handler - req.user.organizationId: "${req.user?.organizationId}"`
        );
        console.log(
          `Fetching assessment cases for module: ${moduleType}, customer: ${req.customerFilter}`
        );

        // Add cache-busting headers to force fresh queries
        res.set({
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          ETag: `${Date.now()}-${Math.random()}`,
        });

        // Use customer filter for data isolation - FRESH QUERY EVERY TIME
        const cases = await storage.getAssessmentCases(
          moduleType,
          req.customerFilter
        );
        console.log(
          `Found ${cases.length} cases for module ${moduleType}, customer ${req.customerFilter}`
        );
        res.json(cases);
      } catch (error: any) {
        console.error("Error fetching assessment cases:", error);
        res.json([]);
      }
    }
  );

  // Demo upgrade prompt endpoint
  app.get("/api/demo/upgrade-prompt", requireAuth, async (req, res) => {
    try {
      if (req.user?.role !== UserRole.DEMO) {
        return res.json({
          show: false,
          message: "Not a demo user",
        });
      }

      const { DemoSandboxService } = await import("../services/demo-sandbox");
      const upgradePrompt = await DemoSandboxService.getDemoUpgradePrompt(
        req.user.id
      );

      res.json(upgradePrompt);
    } catch (error: any) {
      console.error("Error getting demo upgrade prompt:", error);
      res.status(500).json({ error: "Failed to get upgrade prompt" });
    }
  });

  // Demo report limit status endpoint
  app.get("/api/demo/report-status", requireAuth, async (req, res) => {
    try {
      if (req.user?.role !== UserRole.DEMO) {
        return res.json({
          isDemoUser: false,
          message: "Not a demo user",
        });
      }

      const { DemoSandboxService } = await import("../services/demo-sandbox");
      const limitCheck = await DemoSandboxService.checkDemoReportLimit(
        req.user.id
      );

      res.json({
        isDemoUser: true,
        ...limitCheck,
      });
    } catch (error: any) {
      console.error("Error getting demo report status:", error);
      res.status(500).json({ error: "Failed to get report status" });
    }
  });

  // Demo data export endpoint
  app.get("/api/demo/export-data", requireAuth, async (req, res) => {
    try {
      if (req.user?.role !== UserRole.DEMO) {
        return res
          .status(403)
          .json({ error: "Only demo users can export their data" });
      }

      const { DemoCleanupService } = await import("../services/demo-cleanup");
      const exportData = await DemoCleanupService.exportDemoUserData(
        req.user.id
      );

      if (!exportData) {
        return res.status(404).json({ error: "No data found to export" });
      }

      // Set headers for file download
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="demo-data-${req.user.username}-${
          new Date().toISOString().split("T")[0]
        }.json"`
      );

      res.json(exportData);
    } catch (error: any) {
      console.error("Error exporting demo data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Demo cleanup info endpoint (for the user to see their expiration status)
  app.get("/api/demo/cleanup-info", requireAuth, async (req, res) => {
    try {
      if (req.user?.role !== UserRole.DEMO) {
        return res.json({
          isDemoUser: false,
          message: "Not a demo user",
        });
      }

      const { DemoCleanupService } = await import("../services/demo-cleanup");
      const allUsers = await DemoCleanupService.getDemoUsersCleanupInfo();
      const userInfo = allUsers.find((u) => u.id === req.user!.id);

      if (!userInfo) {
        return res.status(404).json({ error: "Demo user info not found" });
      }

      res.json({
        isDemoUser: true,
        ...userInfo,
      });
    } catch (error: any) {
      console.error("Error getting demo cleanup info:", error);
      res.status(500).json({ error: "Failed to get cleanup info" });
    }
  });

  // Assessment creation endpoint - now with customer isolation and report limiting
  app.post(
    "/api/assessment-cases",
    requireAuth,
    requireCustomerAccess,
    (req, res, next) => {
      // Add module access validation based on the moduleType in request body
      const moduleType = req.body.moduleType as ModuleType;
      if (moduleType && Object.values(ModuleType).includes(moduleType)) {
        return ModuleGate.requireModuleAccess(moduleType)(req, res, next);
      }
      // If no moduleType specified, allow (will default to user's assigned modules)
      return next();
    },
    async (req, res) => {
      try {
        console.log("Creating new assessment case:", req.body);

        // Check if user is admin or developer (no report limits for privileged users)
        const isAdmin =
          req.user?.role === UserRole.SYSTEM_ADMIN ||
          req.user?.role === UserRole.DEVELOPER;

        if (!isAdmin) {
          // Check report limit before creating case (but don't increment yet)
          const reportCheck = await checkReportLimit(req.user!.id);

          if (!reportCheck.canCreateReport) {
            // For demo users, provide upgrade information
            if (req.user?.role === UserRole.DEMO) {
              const { DemoSandboxService } = await import(
                "../services/demo-sandbox"
              );
              const upgradePrompt =
                await DemoSandboxService.getDemoUpgradePrompt(req.user.id);

              return res.status(403).json({
                error: "Demo limit exceeded",
                message: `You have reached your demo limit of ${reportCheck.maxReports} reports. Upgrade to continue creating unlimited assessment reports.`,
                currentCount: reportCheck.currentCount,
                maxReports: reportCheck.maxReports,
                isDemoUser: true,
                upgradePrompt: {
                  title: "Demo Limit Reached",
                  message: `You've used all ${reportCheck.maxReports} of your demo reports. Upgrade now to unlock unlimited reports and advanced features.`,
                  upgradeUrl: "/upgrade",
                },
              });
            }

            return res.status(403).json({
              error: "Report limit exceeded",
              message: `You have reached your maximum of ${reportCheck.maxReports} reports. Current count: ${reportCheck.currentCount}`,
              currentCount: reportCheck.currentCount,
              maxReports: reportCheck.maxReports,
            });
          }
        }

        // Add customer isolation and user tracking to the case
        const caseData = {
          ...req.body,
          organizationId: req.user?.organizationId,
          createdByUserId: req.user?.id,
        };

        // Create assessment case first
        const newCase = await storage.createAssessmentCase(caseData);
        console.log("Assessment case created successfully:", newCase.id);

        // Only increment report count after successful case creation
        if (!isAdmin) {
          await incrementReportCount(req.user!.id);
          console.log(`Report count incremented for user ${req.user!.id}`);
        }

        res.json(newCase);
      } catch (error: any) {
        console.error("Error creating assessment case:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  // DEPRECATED: Legacy endpoint - use /api/assessment-cases/:moduleType instead
  // This endpoint is kept for backward compatibility but now requires authentication
  app.get(
    "/api/assessment-cases",
    requireAuth,
    requireCustomerAccess,
    async (req, res) => {
      try {
        const moduleType = req.query.moduleType as string;

        // Require authentication and customer filtering for data isolation
        if (!req.customerFilter) {
          return res.status(403).json({
            error: "Access denied: Customer filter required",
          });
        }

        if (moduleType) {
          const cases = await storage.getAssessmentCases(
            moduleType,
            req.customerFilter
          );
          res.json(cases);
        } else {
          // Get all cases for this customer across all modules they have access to
          const assignedModules = req.user?.assignedModules || [
            "post_secondary",
          ];
          let allCases: any[] = [];

          for (const module of assignedModules) {
            const cases = await storage.getAssessmentCases(
              module,
              req.customerFilter
            );
            allCases = [...allCases, ...cases];
          }

          res.json(allCases);
        }
      } catch (error: any) {
        console.error("Error fetching assessment cases:", error);
        res.status(500).json({ error: "Failed to fetch assessment cases" });
      }
    }
  );

  // Version Management Routes
  app.post("/api/assessment-cases/:id/finalize", async (req, res) => {
    try {
      const { id } = req.params;
      const { content, changesSummary } = req.body;

      console.log(`Finalizing report for case: ${id}`);
      const result = await storage.finalizeReport(
        id,
        content,
        changesSummary || []
      );

      res.json({
        success: true,
        version: result.report_data?.currentVersion,
        finalized: true,
      });
    } catch (error: any) {
      console.error("Error finalizing report:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/assessment-cases/:id/versions", async (req, res) => {
    try {
      const { id } = req.params;

      console.log(`Getting versions for case: ${id}`);
      const versions = await storage.getReportVersions(id);

      // Debug: Log the actual versions data structure
      console.log("🔍 DEBUG: Versions response structure:", {
        hasVersions: !!versions,
        versionsType: typeof versions,
        versionsKeys: versions ? Object.keys(versions) : "none",
        currentVersion: versions?.currentVersion,
        versionsArray: versions?.versions,
        versionsArrayLength: versions?.versions?.length || 0,
        isFinalized: versions?.isFinalized,
        firstVersionSample: versions?.versions?.[0],
      });

      res.json(versions);
    } catch (error: any) {
      console.error("Error getting report versions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/assessment-cases/:id/switch-version", async (req, res) => {
    try {
      const { id } = req.params;
      const { version } = req.body;

      console.log(`Switching to version ${version} for case: ${id}`);
      const result = await storage.switchToVersion(id, version);

      const content = result.report_data?.markdown_report || "";
      console.log(
        `📄 Returning content for version ${version}: ${content.substring(
          0,
          100
        )}...`
      );

      res.json({
        success: true,
        currentVersion: version,
        content: content,
      });
    } catch (error: any) {
      console.error("Error switching version:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // K12-specific change approval endpoints
  app.post("/api/k12-assessment-cases/approve-change", async (req, res) => {
    try {
      const { caseId, changeId, action } = req.body;
      console.log(`K12: Approving change ${changeId} for case: ${caseId}`);

      // Get existing case - for K12 we know it should be in the k12 module
      const k12Cases = await storage.getAssessmentCases("k12");
      const existingCase = k12Cases.find((c) => c.id === caseId);

      if (!existingCase) {
        console.log(`❌ K12 Case ${caseId} not found`);
        return res.status(404).json({ error: "K12 assessment case not found" });
      }

      const editChanges = existingCase.report_data?.edit_changes || [];

      // Debug: Log the actual report_data structure
      console.log(`📊 Debug report_data structure for case ${caseId}:`, {
        hasReportData: !!existingCase.report_data,
        reportDataKeys: existingCase.report_data
          ? Object.keys(existingCase.report_data)
          : [],
        editChangesType: typeof existingCase.report_data?.edit_changes,
        editChangesLength: editChanges.length,
        editChangesContent: editChanges.slice(0, 2), // Show first 2 changes for debugging
        lookingForChangeId: changeId,
      });

      const changeToApprove = editChanges.find(
        (change: any) => change.id === changeId
      );

      if (!changeToApprove) {
        console.log(
          `❌ Change ${changeId} not found in ${editChanges.length} available changes`
        );
        console.log(
          `📋 Available change IDs:`,
          editChanges.map((c: any) => c.id)
        );
        return res.status(404).json({ error: "Change not found" });
      }

      // Update the change status to 'approved'
      const updatedChanges = editChanges.map((change: any) =>
        change.id === changeId ? { ...change, status: "approved" } : change
      );

      // Update report data with approved status
      const updatedReportData = {
        ...(existingCase.report_data || {}),
        edit_changes: updatedChanges,
        last_updated: new Date().toISOString(),
      };

      // Update the case using direct SQL
      const { pool } = await import("../db");
      await pool.query(
        `UPDATE assessment_cases 
           SET report_data = $1, last_updated = NOW() 
           WHERE id = $2`,
        [JSON.stringify(updatedReportData), caseId]
      );

      console.log(`✅ K12 change ${changeId} approved successfully`);
      res.json({
        success: true,
        message: "Change approved successfully",
      });
    } catch (error) {
      console.error("Error approving K12 change:", error);
      res.status(500).json({ error: "Failed to approve change" });
    }
  });

  app.post("/api/k12-assessment-cases/reject-change", async (req, res) => {
    try {
      const { caseId, changeId, action } = req.body;
      console.log(`K12: Rejecting change ${changeId} for case: ${caseId}`);

      // Get existing case - for K12 we know it should be in the k12 module
      const k12Cases = await storage.getAssessmentCases("k12");
      const existingCase = k12Cases.find((c) => c.id === caseId);

      if (!existingCase) {
        console.log(`❌ K12 Case ${caseId} not found`);
        return res.status(404).json({ error: "K12 assessment case not found" });
      }

      const editChanges = existingCase.report_data?.edit_changes || [];
      const changeToReject = editChanges.find(
        (change: any) => change.id === changeId
      );

      if (!changeToReject) {
        console.log(
          `❌ Change ${changeId} not found in ${editChanges.length} available changes`
        );
        return res.status(404).json({ error: "Change not found" });
      }

      // Update the change status to 'rejected'
      const updatedChanges = editChanges.map((change: any) =>
        change.id === changeId ? { ...change, status: "rejected" } : change
      );

      // Update report data with rejected status
      const updatedReportData = {
        ...(existingCase.report_data || {}),
        edit_changes: updatedChanges,
        last_updated: new Date().toISOString(),
      };

      // Update the case using direct SQL
      const { pool } = await import("../db");
      await pool.query(
        `UPDATE assessment_cases 
           SET report_data = $1, last_updated = NOW() 
           WHERE id = $2`,
        [JSON.stringify(updatedReportData), caseId]
      );

      console.log(`✅ K12 change ${changeId} rejected successfully`);
      res.json({
        success: true,
        message: "Change rejected successfully",
      });
    } catch (error) {
      console.error("Error rejecting K12 change:", error);
      res.status(500).json({ error: "Failed to reject change" });
    }
  });

  // K12-specific edit endpoint (routes to generic edit logic)
  app.post("/api/k12-assessment-cases/edit", async (req, res) => {
    console.log(
      "📝 K12-specific edit endpoint called, routing to generic edit logic"
    );

    // Route to the generic edit endpoint logic
    const { caseId, changes, status, reportContent, createBackup } = req.body;
    console.log(`💾 K12 Edit - Updating assessment case: ${caseId}`, {
      hasChanges: !!changes,
      changesCount: changes?.length || 0,
      hasReportContent: !!reportContent,
      reportContentLength: reportContent?.length || 0,
      createBackup,
    });

    try {
      // Get existing case - for K12 we know it should be in the k12 module
      const k12Cases = await storage.getAssessmentCases("k12");
      const existingCase = k12Cases.find((c) => c.id === caseId);

      if (!existingCase) {
        console.log(`❌ K12 Case ${caseId} not found`);
        return res.status(404).json({ error: "K12 assessment case not found" });
      }

      console.log(`📋 K12 Existing case data:`, {
        hasReportData: !!existingCase.report_data,
        hasMarkdownReport: !!existingCase.report_data?.markdown_report,
        hasBackupReport: !!existingCase.report_data?.backup_report,
        isEdited: existingCase.report_data?.is_edited,
      });

      // Create backup if it doesn't exist and we're creating one
      const originalContent = existingCase.report_data?.markdown_report;
      const backupContent =
        existingCase.report_data?.backup_report || originalContent;

      const updatedReportData = {
        ...(existingCase.report_data || {}),
        markdown_report: reportContent || originalContent,
        backup_report: backupContent,
        last_edited: new Date().toISOString(),
        edit_changes: changes,
        is_edited: true,
      };

      console.log(`💾 K12 Updated report data:`, {
        hasMarkdownReport: !!updatedReportData.markdown_report,
        markdownLength: updatedReportData.markdown_report?.length || 0,
        hasBackupReport: !!updatedReportData.backup_report,
        backupLength: updatedReportData.backup_report?.length || 0,
        isEdited: updatedReportData.is_edited,
        changesCount: updatedReportData.edit_changes?.length || 0,
      });

      // Update the case using direct SQL
      const { pool } = await import("../db");
      await pool.query(
        `UPDATE assessment_cases 
           SET report_data = $1, last_updated = NOW() 
           WHERE id = $2`,
        [JSON.stringify(updatedReportData), caseId]
      );

      console.log(`✅ K12 changes saved successfully`);
      res.json({ success: true, message: "K12 changes saved successfully" });
    } catch (error) {
      console.error("Error updating K12 assessment case:", error);
      res.status(500).json({ error: "Failed to update K12 assessment case" });
    }
  });

  // Get assessment reports from database
  app.get(
    "/api/assessment-reports/:moduleType",
    requireAuth,
    (req, res, next) => {
      // Add module access validation
      const moduleType = req.params.moduleType as ModuleType;
      if (Object.values(ModuleType).includes(moduleType)) {
        return ModuleGate.requireModuleAccess(moduleType)(req, res, next);
      }
      return res.status(400).json({ error: "Invalid module type" });
    },
    async (req: Request, res: Response) => {
      const { moduleType } = req.params;
      console.log(`API Route hit: GET /assessment-reports/${moduleType}`);

      try {
        // Use direct database query instead of Database
        const reports = await db
          .select()
          .from(assessmentCases)
          .where(
            and(
              eq(assessmentCases.moduleType, moduleType),
              eq(assessmentCases.status, "completed")
            )
          )
          .orderBy(desc(assessmentCases.createdDate))
          .limit(10);

        console.log(`Found ${reports.length} reports for module ${moduleType}`);
        res.json(reports);
      } catch (error) {
        console.error("Error fetching assessment reports:", error);
        res.status(500).json({ error: "Failed to fetch assessment reports" });
      }
    }
  );

  // Case-specific item master data endpoint
  app.get(
    "/api/case-item-master/:caseId/:moduleType",
    requireAuth,
    (req, res, next) => {
      // Add module access validation
      const moduleType = req.params.moduleType as ModuleType;
      if (Object.values(ModuleType).includes(moduleType)) {
        return ModuleGate.requireModuleAccess(moduleType)(req, res, next);
      }
      return res.status(400).json({ error: "Invalid module type" });
    },
    async (req, res) => {
      try {
        const { caseId, moduleType } = req.params;
        console.log(
          `Fetching item master data for case: ${caseId}, module: ${moduleType}`
        );

        // Query item master data from database for this specific case
        const itemMasterData =
          (await storage.getItemMasterData?.(caseId, moduleType)) || [];

        console.log(
          `Found ${itemMasterData.length} item master records for case ${caseId}`
        );
        res.json(itemMasterData);
      } catch (error: any) {
        console.error("Error fetching case item master data:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Post-secondary item master endpoint
  app.get("/api/post-secondary-item-master", async (req, res) => {
    try {
      const itemMasterData =
        (await storage.getPostSecondaryItemMaster?.()) || [];
      console.log(
        `Found ${itemMasterData.length} post-secondary item master records`
      );
      res.json(itemMasterData);
    } catch (error: any) {
      console.error("Error fetching post-secondary item master data:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Prompt Sections - Direct database query with proper transformation
  app.get(
    "/api/prompt-sections",
    requireAuth,
    (req, res, next) => {
      // Add module access validation
      const moduleType =
        (req.query.moduleType as ModuleType) || ModuleType.POST_SECONDARY;
      if (Object.values(ModuleType).includes(moduleType)) {
        return ModuleGate.requireModuleAccess(moduleType)(req, res, next);
      }
      return res.status(400).json({ error: "Invalid module type" });
    },
    async (req, res) => {
      try {
        const moduleType = (req.query.moduleType as string) || "post_secondary";
        const promptType = req.query.promptType as string | undefined;
        console.log(
          `DEBUG: Fetching prompt sections from database for: ${moduleType}, type: ${
            promptType || "all"
          }`
        );

        const sections = await storage.getPromptSections(
          moduleType,
          promptType
        );
        console.log(
          `DEBUG: Found ${sections.length} prompt sections in database`
        );

        if (sections.length === 0) {
          console.log(`DEBUG: No sections found, returning empty array`);
          res.json([]);
          return;
        }

        // Transform database results to match frontend expectations
        const transformedSections = sections.map(
          (section: any, index: number) => ({
            id: String(index + 1),
            section_key: section.section_key,
            section_name:
              section.section_name ||
              `${section.section_key
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l: string) => l.toUpperCase())}`,
            content: section.content,
            version: section.version || "1.0",
            module_type: section.module_type,
            prompt_type: section.prompt_type,
            created_at: section.created_at,
            last_updated: section.last_updated,
          })
        );

        console.log(
          `DEBUG: Returning ${transformedSections.length} prompt sections for ${moduleType}`
        );
        console.log(
          `DEBUG: Section keys: ${transformedSections
            .map((s) => s.section_key)
            .join(", ")}`
        );
        res.json(transformedSections);
      } catch (error: any) {
        console.error(
          `ERROR: Failed to fetch prompt sections for ${req.query.moduleType}:`,
          error
        );
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Prompt Sections - Path parameter format for backward compatibility
  app.get(
    "/api/prompt-sections/:moduleType",
    requireAuth,
    (req, res, next) => {
      // Add module access validation
      const moduleType = req.params.moduleType as ModuleType;
      if (Object.values(ModuleType).includes(moduleType)) {
        return ModuleGate.requireModuleAccess(moduleType)(req, res, next);
      }
      return res.status(400).json({ error: "Invalid module type" });
    },
    async (req, res) => {
      try {
        const { moduleType } = req.params;
        console.log(
          `DEBUG: Fetching prompt sections from database for: ${moduleType}`
        );

        const sections = await storage.getPromptSections(moduleType);
        console.log(
          `DEBUG: Found ${sections.length} prompt sections in database`
        );

        if (sections.length === 0) {
          console.log(`DEBUG: No sections found, returning empty array`);
          res.json([]);
          return;
        }

        // Transform database results to match frontend expectations
        const transformedSections = sections.map(
          (section: any, index: number) => ({
            id: String(index + 1),
            section_key: section.section_key,
            section_name:
              section.section_name ||
              `${section.section_key
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l: string) => l.toUpperCase())}`,
            content: section.content,
            version: section.version || "1.0",
            module_type: section.module_type,
            created_at: section.created_at,
            last_updated: section.last_updated,
          })
        );

        console.log(
          `DEBUG: Returning ${transformedSections.length} prompt sections for ${moduleType}`
        );
        console.log(
          `DEBUG: Section keys: ${transformedSections
            .map((s) => s.section_key)
            .join(", ")}`
        );

        // Add cache-busting headers to ensure frontend gets fresh data
        res.set({
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          ETag: `"${Date.now()}"`, // Force fresh response
        });

        res.json(transformedSections);
      } catch (error: any) {
        console.error(
          `ERROR: Failed to fetch prompt sections for ${req.params.moduleType}:`,
          error
        );
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Update prompt section
  app.patch("/api/prompt-sections/:sectionKey", async (req, res) => {
    try {
      const { sectionKey } = req.params;
      const { content, promptType } = req.body;
      console.log(
        `Updating prompt section: ${sectionKey}, type: ${
          promptType || "not specified"
        }`
      );
      const section = await storage.updatePromptSection(sectionKey, {
        content,
        promptType,
      });
      res.json(section);
    } catch (error: any) {
      console.error("Error updating prompt section:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Save prompt section (PUT for create/update)
  app.put("/api/prompt-sections/:sectionKey", async (req, res) => {
    try {
      const { sectionKey } = req.params;
      const { content, module_type, execution_order, is_system_prompt } =
        req.body;
      console.log(
        `Saving prompt section: ${sectionKey}, module: ${
          module_type || "post_secondary"
        }`
      );

      // Use updatePromptSection for now - it handles both create and update
      const section = await storage.updatePromptSection(sectionKey, {
        content,
        moduleType: module_type,
        executionOrder: execution_order,
        isSystemPrompt: is_system_prompt,
      });
      res.json(section);
    } catch (error: any) {
      console.error("Error saving prompt section:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add missing API endpoints
  app.get(
    "/api/lookup-tables/:moduleType",
    requireAuth,
    (req, res, next) => {
      // Add module access validation
      const moduleType = req.params.moduleType as ModuleType;
      if (Object.values(ModuleType).includes(moduleType)) {
        return ModuleGate.requireModuleAccess(moduleType)(req, res, next);
      }
      return res.status(400).json({ error: "Invalid module type" });
    },
    async (req, res) => {
      try {
        const { moduleType } = req.params;
        const tables = await storage.getLookupTables(moduleType);
        res.json(tables);
      } catch (error: any) {
        console.error("Error fetching lookup tables:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.get("/api/ai-config", async (req, res) => {
    try {
      const config = await storage.getAiConfig();
      res.json(config);
    } catch (error: any) {
      console.error("Error fetching AI config:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get(
    "/api/barrier-glossary/:moduleType",
    requireAuth,
    (req, res, next) => {
      // Add module access validation
      const moduleType = req.params.moduleType as ModuleType;
      if (Object.values(ModuleType).includes(moduleType)) {
        return ModuleGate.requireModuleAccess(moduleType)(req, res, next);
      }
      return res.status(400).json({ error: "Invalid module type" });
    },
    async (req, res) => {
      try {
        const { moduleType } = req.params;
        const glossary = await storage.getBarrierGlossary(moduleType);
        res.json(glossary);
      } catch (error: any) {
        console.error("Error fetching barrier glossary:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.get(
    "/api/inference-triggers/:moduleType",
    requireAuth,
    (req, res, next) => {
      // Add module access validation
      const moduleType = req.params.moduleType as ModuleType;
      if (Object.values(ModuleType).includes(moduleType)) {
        return ModuleGate.requireModuleAccess(moduleType)(req, res, next);
      }
      return res.status(400).json({ error: "Invalid module type" });
    },
    async (req, res) => {
      try {
        const { moduleType } = req.params;
        const triggers = await storage.getInferenceTriggers(moduleType);
        res.json(triggers);
      } catch (error: any) {
        console.error("Error fetching inference triggers:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.get(
    "/api/plain-language-mappings/:moduleType",
    requireAuth,
    (req, res, next) => {
      // Add module access validation
      const moduleType = req.params.moduleType as ModuleType;
      if (Object.values(ModuleType).includes(moduleType)) {
        return ModuleGate.requireModuleAccess(moduleType)(req, res, next);
      }
      return res.status(400).json({ error: "Invalid module type" });
    },
    async (req, res) => {
      try {
        const { moduleType } = req.params;
        const mappings = await storage.getPlainLanguageMappings(moduleType);
        res.json(mappings);
      } catch (error: any) {
        console.error("Error fetching plain language mappings:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  app.get(
    "/api/mapping-configurations/:moduleType",
    requireAuth,
    (req, res, next) => {
      // Add module access validation
      const moduleType = req.params.moduleType as ModuleType;
      if (Object.values(ModuleType).includes(moduleType)) {
        return ModuleGate.requireModuleAccess(moduleType)(req, res, next);
      }
      return res.status(400).json({ error: "Invalid module type" });
    },
    async (req, res) => {
      try {
        const { moduleType } = req.params;
        const configurations = await storage.getMappingConfigurations(
          moduleType
        );
        res.json(configurations);
      } catch (error: any) {
        console.error("Error fetching mapping configurations:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Environment switching endpoints removed - now using RBAC system
  // Module access is controlled by user roles, not environment switching

  // Update assessment case report content
  app.post("/api/assessment-cases/edit", async (req, res) => {
    try {
      const { caseId, changes, status, reportContent, createBackup } = req.body;
      console.log(`💾 Updating assessment case: ${caseId}`, {
        hasChanges: !!changes,
        changesCount: changes?.length || 0,
        hasReportContent: !!reportContent,
        reportContentLength: reportContent?.length || 0,
        createBackup,
      });

      // Get existing case - check both module types to find the case
      const postSecondaryCases = await storage.getAssessmentCases(
        "post_secondary"
      );
      const k12Cases = await storage.getAssessmentCases("k12");
      const allCases = [...postSecondaryCases, ...k12Cases];
      const existingCase = allCases.find((c) => c.id === caseId);

      console.log(
        `🔍 Looking for case ${caseId} in ${allCases.length} total cases`
      );

      if (!existingCase) {
        console.log(`❌ Case ${caseId} not found in ${allCases.length} cases`);
        return res.status(404).json({ error: "Assessment case not found" });
      }

      console.log(`📋 Existing case data:`, {
        hasReportData: !!existingCase.report_data,
        hasMarkdownReport: !!existingCase.report_data?.markdown_report,
        hasBackupReport: !!existingCase.report_data?.backup_report,
        isEdited: existingCase.report_data?.is_edited,
      });

      // Create backup if it doesn't exist and we're creating one
      const originalContent = existingCase.report_data?.markdown_report;
      const backupContent =
        existingCase.report_data?.backup_report || originalContent;

      const updatedReportData = {
        ...(existingCase.report_data || {}),
        markdown_report: reportContent || originalContent,
        backup_report: backupContent,
        last_edited: new Date().toISOString(),
        edit_changes: changes,
        is_edited: true,
      };

      console.log(`💾 Updated report data:`, {
        hasMarkdownReport: !!updatedReportData.markdown_report,
        markdownLength: updatedReportData.markdown_report?.length || 0,
        hasBackupReport: !!updatedReportData.backup_report,
        backupLength: updatedReportData.backup_report?.length || 0,
        isEdited: updatedReportData.is_edited,
      });

      // Update the case using direct SQL
      const { pool } = await import("../db");
      await pool.query(
        `UPDATE assessment_cases 
           SET report_data = $1, last_updated = NOW() 
           WHERE id = $2`,
        [JSON.stringify(updatedReportData), caseId]
      );

      res.json({ success: true, message: "Changes saved successfully" });
    } catch (error) {
      console.error("Error updating assessment case:", error);
      res.status(500).json({ error: "Failed to update assessment case" });
    }
  });

  // Restore assessment case to original backup
  app.post("/api/assessment-cases/restore", async (req, res) => {
    try {
      const { caseId } = req.body;
      console.log(`Restoring assessment case to backup: ${caseId}`);

      // Get existing case - check both module types to find the case
      const postSecondaryCases = await storage.getAssessmentCases(
        "post_secondary"
      );
      const k12Cases = await storage.getAssessmentCases("k12");
      const allCases = [...postSecondaryCases, ...k12Cases];
      const existingCase = allCases.find((c) => c.id === caseId);

      console.log(
        `🔍 Looking for case ${caseId} in ${allCases.length} total cases`
      );

      if (!existingCase) {
        console.log(`❌ Case ${caseId} not found in ${allCases.length} cases`);
        return res.status(404).json({ error: "Assessment case not found" });
      }

      if (!existingCase.report_data?.backup_report) {
        return res
          .status(400)
          .json({ error: "No backup available for this report" });
      }

      // Restore from backup
      const restoredReportData = {
        ...(existingCase.report_data || {}),
        markdown_report: existingCase.report_data.backup_report,
        last_restored: new Date().toISOString(),
        is_edited: false,
        edit_changes: [],
      };

      // Update the case using direct SQL
      const { pool } = await import("../db");
      await pool.query(
        `UPDATE assessment_cases 
           SET report_data = $1, last_updated = NOW() 
           WHERE id = $2`,
        [JSON.stringify(restoredReportData), caseId]
      );

      res.json({
        success: true,
        message: "Report restored to original version",
      });
    } catch (error) {
      console.error("Error restoring assessment case:", error);
      res.status(500).json({ error: "Failed to restore assessment case" });
    }
  });

  app.post("/api/assessment-cases/revert-change", async (req, res) => {
    try {
      const { caseId, changeId } = req.body;
      console.log(
        `🔄 Reverting specific change ${changeId} for case: ${caseId}`
      );

      // Get existing case - check both module types to find the case
      const postSecondaryCases = await storage.getAssessmentCases(
        "post_secondary"
      );
      const k12Cases = await storage.getAssessmentCases("k12");
      const allCases = [...postSecondaryCases, ...k12Cases];
      const existingCase = allCases.find((c) => c.id === caseId);

      if (!existingCase) {
        console.log(`❌ Case ${caseId} not found`);
        return res.status(404).json({ error: "Assessment case not found" });
      }

      const editChanges = existingCase.report_data?.edit_changes || [];
      console.log(`📋 Available changes in case:`, {
        totalChanges: editChanges.length,
        changeIds: editChanges.map((c: any) => c.id),
        lookingFor: changeId,
      });

      const changeToRevert = editChanges.find(
        (change: any) => change.id === changeId
      );

      if (!changeToRevert) {
        console.log(
          `❌ Change ${changeId} not found in ${editChanges.length} available changes`
        );
        return res.status(404).json({
          error: "Change not found",
          availableChanges: editChanges.map((c: any) => ({
            id: c.id,
            type: c.type,
            timestamp: c.timestamp,
          })),
        });
      }

      if (!changeToRevert.oldContent) {
        return res.status(400).json({
          error: "Cannot revert change - no previous content available",
        });
      }

      console.log(
        `📝 Reverting change in section: ${changeToRevert.sectionId}`
      );

      // Get current content and apply reversion
      let currentContent = existingCase.report_data?.markdown_report || "";

      // Replace the new content with the old content
      if (changeToRevert.newContent && changeToRevert.oldContent) {
        // Find and replace the new content with the old content
        const newContentLines = changeToRevert.newContent.split("\n");
        const oldContentLines = changeToRevert.oldContent.split("\n");

        // Try to find a unique section to replace
        // This is a simplified approach - in a real system you'd want more sophisticated diff/patch logic
        if (currentContent.includes(changeToRevert.newContent)) {
          currentContent = currentContent.replace(
            changeToRevert.newContent,
            changeToRevert.oldContent
          );
        } else {
          // Fallback: try line-by-line replacement for partial matches
          for (
            let i = 0;
            i < newContentLines.length && i < oldContentLines.length;
            i++
          ) {
            if (
              newContentLines[i].trim() &&
              currentContent.includes(newContentLines[i])
            ) {
              currentContent = currentContent.replace(
                newContentLines[i],
                oldContentLines[i]
              );
            }
          }
        }
      }

      // Remove the reverted change from edit_changes array
      const updatedChanges = editChanges.filter(
        (change: any) => change.id !== changeId
      );

      // Add a reversion record
      const reversionRecord = {
        id: Date.now().toString(),
        type: "revert",
        timestamp: new Date().toISOString(),
        sectionId: changeToRevert.sectionId,
        sectionTitle: changeToRevert.sectionTitle,
        revertedChangeId: changeId,
        user: "system",
      };

      updatedChanges.push(reversionRecord);

      // Update report data
      const updatedReportData = {
        ...(existingCase.report_data || {}),
        markdown_report: currentContent,
        last_edited: new Date().toISOString(),
        edit_changes: updatedChanges,
        is_edited:
          updatedChanges.filter((c: any) => c.type !== "revert").length > 0,
      };

      console.log(`💾 Updated report data:`, {
        hasMarkdownReport: !!updatedReportData.markdown_report,
        markdownLength: updatedReportData.markdown_report?.length || 0,
        changesCount: updatedChanges.length,
        isEdited: updatedReportData.is_edited,
      });

      // Update the case using direct SQL
      const { pool } = await import("../db");
      await pool.query(
        `UPDATE assessment_cases 
           SET report_data = $1, last_updated = NOW() 
           WHERE id = $2`,
        [JSON.stringify(updatedReportData), caseId]
      );

      res.json({
        success: true,
        message: "Change reverted successfully",
        remainingChanges: updatedChanges.length,
      });
    } catch (error) {
      console.error("Error reverting change:", error);
      res.status(500).json({ error: "Failed to revert change" });
    }
  });
}
