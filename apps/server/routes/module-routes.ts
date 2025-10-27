import type { Express, Request, Response } from "express";
import { requireAuth, requireRole } from "../auth";
import { ModuleAssignmentService } from "../services/module-assignment-service";
import { ModuleGate } from "../permissions/gates/module-gate";
import { UserRole, ModuleType } from "@shared/schema";

/**
 * Register module-related API routes
 */
export function registerModuleRoutes(app: Express): void {
  // Get user's module assignments and switching capabilities
  app.get(
    "/api/modules/assignments",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const summary =
          await ModuleAssignmentService.getModuleAssignmentSummary(req.user);

        res.json({
          success: true,
          data: summary,
        });
      } catch (error: any) {
        console.error("Error fetching module assignments:", error);
        res.status(500).json({
          error: "Failed to fetch module assignments",
          message: error.message,
        });
      }
    }
  );

  // Check if user can access a specific module
  app.get(
    "/api/modules/:moduleType/access",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const { moduleType } = req.params;

        // Validate module type
        if (!Object.values(ModuleType).includes(moduleType as ModuleType)) {
          return res.status(400).json({
            error: "Invalid module type",
            validModules: Object.values(ModuleType),
          });
        }

        const hasAccess = await ModuleGate.hasModuleAccess(
          req.user,
          moduleType as ModuleType
        );
        const assignedModules =
          await ModuleAssignmentService.getAssignedModules(req.user);
        const canSwitch = ModuleAssignmentService.canSwitchModules(req.user);

        res.json({
          success: true,
          data: {
            moduleType,
            hasAccess,
            assignedModules,
            canSwitchModules: canSwitch,
            userRole: req.user.role,
          },
        });
      } catch (error: any) {
        console.error("Error checking module access:", error);
        res.status(500).json({
          error: "Failed to check module access",
          message: error.message,
        });
      }
    }
  );

  // Switch to a different module (for privileged users only)
  app.post(
    "/api/modules/switch",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const { targetModule, currentModule } = req.body;

        // Validate target module
        if (!Object.values(ModuleType).includes(targetModule)) {
          return res.status(400).json({
            error: "Invalid target module type",
            validModules: Object.values(ModuleType),
          });
        }

        // Check if user can switch modules
        const canSwitch = ModuleAssignmentService.canSwitchModules(req.user);
        if (!canSwitch) {
          return res.status(403).json({
            error: "Module switching not allowed",
            message: "Your role does not permit module switching",
            userRole: req.user.role,
            allowedRoles: [UserRole.DEVELOPER, UserRole.ADMIN],
          });
        }

        // Validate access to target module
        const hasAccess = await ModuleAssignmentService.validateModuleAccess(
          req.user,
          targetModule
        );
        if (!hasAccess) {
          const assignedModules =
            await ModuleAssignmentService.getAssignedModules(req.user);
          return res.status(403).json({
            error: "Access denied to target module",
            message: `You do not have access to the ${targetModule} module`,
            targetModule,
            assignedModules,
          });
        }

        // Module switch is successful (this is primarily a validation endpoint)
        // The actual module switching is handled client-side in the frontend
        const assignedModules =
          await ModuleAssignmentService.getAssignedModules(req.user);

        res.json({
          success: true,
          data: {
            newModule: targetModule,
            previousModule: currentModule,
            message: `Successfully switched to ${targetModule} module`,
            canSwitch: true,
            assignedModules,
            userRole: req.user.role,
          },
        });

        // Log the module switch for audit purposes
        console.log(
          `🔄 Module switch: User ${req.user.username} (${
            req.user.role
          }) switched from ${currentModule || "unknown"} to ${targetModule}`
        );
      } catch (error: any) {
        console.error("Error switching modules:", error);
        res.status(500).json({
          error: "Failed to switch modules",
          message: error.message,
        });
      }
    }
  );

  // Get available modules for the current user
  app.get(
    "/api/modules/available",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const assignedModules =
          await ModuleAssignmentService.getAssignedModules(req.user);
        const canSwitch = ModuleAssignmentService.canSwitchModules(req.user);
        const defaultModule = await ModuleAssignmentService.getDefaultModule(
          req.user
        );

        // Get detailed module information
        const moduleDetails = assignedModules.map((module) => ({
          type: module,
          name: getModuleDisplayName(module),
          description: getModuleDescription(module),
          icon: getModuleIcon(module),
        }));

        res.json({
          success: true,
          data: {
            assignedModules,
            moduleDetails,
            canSwitchModules: canSwitch,
            defaultModule,
            userRole: req.user.role,
            totalAvailable: assignedModules.length,
          },
        });
      } catch (error: any) {
        console.error("Error fetching available modules:", error);
        res.status(500).json({
          error: "Failed to fetch available modules",
          message: error.message,
        });
      }
    }
  );

  // Admin endpoint: Update user module assignments
  app.patch(
    "/api/modules/users/:userId/assignments",
    requireAuth,
    requireRole([UserRole.DEVELOPER, UserRole.ADMIN]),
    async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const { moduleTypes } = req.body;

        // Validate user ID
        const userIdNum = parseInt(userId);
        if (isNaN(userIdNum)) {
          return res.status(400).json({ error: "Invalid user ID" });
        }

        // Validate module types
        if (!Array.isArray(moduleTypes) || moduleTypes.length === 0) {
          return res.status(400).json({
            error: "Invalid module types",
            message: "moduleTypes must be a non-empty array",
          });
        }

        const invalidModules = moduleTypes.filter(
          (module) => !Object.values(ModuleType).includes(module)
        );
        if (invalidModules.length > 0) {
          return res.status(400).json({
            error: "Invalid module types",
            invalidModules,
            validModules: Object.values(ModuleType),
          });
        }

        // Update module assignments
        await ModuleAssignmentService.updateUserModuleAssignments(
          userIdNum,
          moduleTypes
        );

        res.json({
          success: true,
          message: `Module assignments updated for user ${userId}`,
          data: {
            userId: userIdNum,
            assignedModules: moduleTypes,
            updatedBy: req.user?.username,
            updatedAt: new Date().toISOString(),
          },
        });

        // Log the assignment change for audit purposes
        console.log(
          `🔧 Module assignments updated: User ${userId} assigned modules [${moduleTypes.join(
            ", "
          )}] by ${req.user?.username}`
        );
      } catch (error: any) {
        console.error("Error updating user module assignments:", error);
        res.status(500).json({
          error: "Failed to update module assignments",
          message: error.message,
        });
      }
    }
  );

  // Admin endpoint: Update organization module assignments
  app.patch(
    "/api/modules/organizations/:organizationId/assignments",
    requireAuth,
    requireRole([UserRole.DEVELOPER, UserRole.ADMIN]),
    async (req: Request, res: Response) => {
      try {
        const { organizationId } = req.params;
        const { moduleTypes } = req.body;

        // Validate module types
        if (!Array.isArray(moduleTypes) || moduleTypes.length === 0) {
          return res.status(400).json({
            error: "Invalid module types",
            message: "moduleTypes must be a non-empty array",
          });
        }

        const invalidModules = moduleTypes.filter(
          (module) => !Object.values(ModuleType).includes(module)
        );
        if (invalidModules.length > 0) {
          return res.status(400).json({
            error: "Invalid module types",
            invalidModules,
            validModules: Object.values(ModuleType),
          });
        }

        // Update organization module assignments
        await ModuleAssignmentService.updateOrganizationModuleAssignments(
          organizationId,
          moduleTypes
        );

        res.json({
          success: true,
          message: `Module assignments updated for organization ${organizationId}`,
          data: {
            organizationId,
            assignedModules: moduleTypes,
            updatedBy: req.user?.username,
            updatedAt: new Date().toISOString(),
          },
        });

        // Log the assignment change for audit purposes
        console.log(
          `🔧 Organization module assignments updated: Organization ${organizationId} assigned modules [${moduleTypes.join(
            ", "
          )}] by ${req.user?.username}`
        );
      } catch (error: any) {
        console.error("Error updating organization module assignments:", error);
        res.status(500).json({
          error: "Failed to update organization module assignments",
          message: error.message,
        });
      }
    }
  );
}

/**
 * Helper function to get display name for a module
 */
function getModuleDisplayName(moduleType: ModuleType): string {
  switch (moduleType) {
    case ModuleType.K12:
      return "K-12 Education";
    case ModuleType.POST_SECONDARY:
      return "Post-Secondary Education";
    case ModuleType.TUTORING:
      return "Tutoring Services";
    default:
      return moduleType;
  }
}

/**
 * Helper function to get description for a module
 */
function getModuleDescription(moduleType: ModuleType): string {
  switch (moduleType) {
    case ModuleType.K12:
      return "Assessment tools for K-12 educational environments";
    case ModuleType.POST_SECONDARY:
      return "Assessment tools for post-secondary and higher education";
    case ModuleType.TUTORING:
      return "Assessment tools for tutoring and supplemental education";
    default:
      return "Educational assessment module";
  }
}

/**
 * Helper function to get icon for a module
 */
function getModuleIcon(moduleType: ModuleType): string {
  switch (moduleType) {
    case ModuleType.K12:
      return "BookOpen";
    case ModuleType.POST_SECONDARY:
      return "GraduationCap";
    case ModuleType.TUTORING:
      return "Users";
    default:
      return "Book";
  }
}
