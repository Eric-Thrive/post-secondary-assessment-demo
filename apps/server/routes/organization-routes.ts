import type { Express } from "express";
import "../types";
import { db } from "../db";
import { organizations, users } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../auth";
import { UserRole, ModuleType } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

/**
 * Register organization management routes.
 * These routes allow admins and developers to manage organizations and their users.
 */
export function registerOrganizationRoutes(app: Express): void {
  // Get all organizations
  app.get(
    "/api/organizations",
    requireAuth,
    requireRole([UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER]),
    async (_req, res) => {
      try {
        const allOrganizations = await db
          .select({
            id: organizations.id,
            name: organizations.name,
            customerId: organizations.customerId,
            assignedModules: organizations.assignedModules,
            maxUsers: organizations.maxUsers,
            isActive: organizations.isActive,
            createdAt: organizations.createdAt,
            lastUpdated: organizations.lastUpdated,
          })
          .from(organizations)
          .orderBy(organizations.createdAt);

        // Get user counts for each organization
        const orgsWithUserCounts = await Promise.all(
          allOrganizations.map(async (org) => {
            const [userCount] = await db
              .select({ count: sql<number>`count(*)` })
              .from(users)
              .where(eq(users.organizationId, org.id));

            return {
              ...org,
              userCount: Number(userCount?.count || 0),
            };
          })
        );

        res.json({
          organizations: orgsWithUserCounts,
          totalOrganizations: orgsWithUserCounts.length,
          activeOrganizations: orgsWithUserCounts.filter((o) => o.isActive)
            .length,
        });
      } catch (error) {
        console.error("Error fetching organizations:", error);
        res.status(500).json({ error: "Failed to fetch organizations" });
      }
    }
  );

  // Get a single organization by ID
  app.get(
    "/api/organizations/:orgId",
    requireAuth,
    requireRole([
      UserRole.SYSTEM_ADMIN,
      UserRole.DEVELOPER,
      UserRole.ORG_ADMIN,
    ]),
    async (req, res) => {
      try {
        const { orgId } = req.params;

        // If user is org admin, verify they belong to this organization
        if (req.user?.role === UserRole.ORG_ADMIN) {
          if (req.user.organizationId !== orgId) {
            return res.status(403).json({
              error: "You can only view your own organization",
            });
          }
        }

        const [organization] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, orgId));

        if (!organization) {
          return res.status(404).json({ error: "Organization not found" });
        }

        // Get users in this organization
        const orgUsers = await db
          .select({
            id: users.id,
            username: users.username,
            email: users.email,
            role: users.role,
            assignedModules: users.assignedModules,
            isActive: users.isActive,
            reportCount: users.reportCount,
            maxReports: users.maxReports,
            createdAt: users.createdAt,
            lastLogin: users.lastLogin,
          })
          .from(users)
          .where(eq(users.organizationId, orgId))
          .orderBy(users.createdAt);

        res.json({
          organization,
          users: orgUsers,
          userCount: orgUsers.length,
        });
      } catch (error) {
        console.error("Error fetching organization:", error);
        res.status(500).json({ error: "Failed to fetch organization" });
      }
    }
  );

  // Create a new organization
  app.post(
    "/api/organizations",
    requireAuth,
    requireRole([UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER]),
    async (req, res) => {
      try {
        const { name, customerId, assignedModules, maxUsers } = req.body;

        if (!name || !customerId) {
          return res.status(400).json({
            error: "Organization name and customer ID are required",
          });
        }

        // Check if customerId already exists
        const [existingOrg] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.customerId, customerId));

        if (existingOrg) {
          return res.status(409).json({
            error: "An organization with this customer ID already exists",
          });
        }

        // Validate assigned modules
        const validModules = [
          ModuleType.K12,
          ModuleType.POST_SECONDARY,
          ModuleType.TUTORING,
        ];
        const modules = assignedModules || [ModuleType.POST_SECONDARY];

        for (const module of modules) {
          if (!validModules.includes(module)) {
            return res.status(400).json({
              error: `Invalid module: ${module}`,
            });
          }
        }

        const [newOrg] = await db
          .insert(organizations)
          .values({
            id: uuidv4(),
            name,
            customerId,
            assignedModules: modules,
            maxUsers: maxUsers || 10,
            isActive: true,
          })
          .returning();

        res.status(201).json({
          message: "Organization created successfully",
          organization: newOrg,
        });
      } catch (error) {
        console.error("Error creating organization:", error);
        res.status(500).json({ error: "Failed to create organization" });
      }
    }
  );

  // Update an organization
  app.patch(
    "/api/organizations/:orgId",
    requireAuth,
    requireRole([UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER]),
    async (req, res) => {
      try {
        const { orgId } = req.params;
        const { name, assignedModules, maxUsers, isActive } = req.body;

        const [existingOrg] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, orgId));

        if (!existingOrg) {
          return res.status(404).json({ error: "Organization not found" });
        }

        const updateData: any = {
          lastUpdated: new Date(),
        };

        if (name !== undefined) updateData.name = name;
        if (assignedModules !== undefined) {
          // Validate modules
          const validModules = [
            ModuleType.K12,
            ModuleType.POST_SECONDARY,
            ModuleType.TUTORING,
          ];
          for (const module of assignedModules) {
            if (!validModules.includes(module)) {
              return res.status(400).json({
                error: `Invalid module: ${module}`,
              });
            }
          }
          updateData.assignedModules = assignedModules;
        }
        if (maxUsers !== undefined) updateData.maxUsers = maxUsers;
        if (isActive !== undefined) updateData.isActive = isActive;

        const [updatedOrg] = await db
          .update(organizations)
          .set(updateData)
          .where(eq(organizations.id, orgId))
          .returning();

        res.json({
          message: "Organization updated successfully",
          organization: updatedOrg,
        });
      } catch (error) {
        console.error("Error updating organization:", error);
        res.status(500).json({ error: "Failed to update organization" });
      }
    }
  );

  // Delete an organization (soft delete by setting isActive to false)
  app.delete(
    "/api/organizations/:orgId",
    requireAuth,
    requireRole([UserRole.SYSTEM_ADMIN, UserRole.DEVELOPER]),
    async (req, res) => {
      try {
        const { orgId } = req.params;

        const [existingOrg] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, orgId));

        if (!existingOrg) {
          return res.status(404).json({ error: "Organization not found" });
        }

        // Check if organization has active users
        const orgUsers = await db
          .select({ id: users.id })
          .from(users)
          .where(
            and(eq(users.organizationId, orgId), eq(users.isActive, true))
          );

        if (orgUsers.length > 0) {
          return res.status(400).json({
            error: `Cannot delete organization with ${orgUsers.length} active user(s). Deactivate users first.`,
          });
        }

        // Soft delete by setting isActive to false
        await db
          .update(organizations)
          .set({
            isActive: false,
            lastUpdated: new Date(),
          })
          .where(eq(organizations.id, orgId));

        res.json({
          message: "Organization deactivated successfully",
        });
      } catch (error) {
        console.error("Error deleting organization:", error);
        res.status(500).json({ error: "Failed to delete organization" });
      }
    }
  );

  // Assign user to organization
  app.post(
    "/api/organizations/:orgId/users",
    requireAuth,
    requireRole([
      UserRole.SYSTEM_ADMIN,
      UserRole.DEVELOPER,
      UserRole.ORG_ADMIN,
    ]),
    async (req, res) => {
      try {
        const { orgId } = req.params;
        const { userId, role, assignedModules } = req.body;

        // If user is org admin, verify they belong to this organization
        if (req.user?.role === UserRole.ORG_ADMIN) {
          if (req.user.organizationId !== orgId) {
            return res.status(403).json({
              error: "You can only manage users in your own organization",
            });
          }
          // Org admins cannot assign admin or developer roles
          if (
            role === UserRole.SYSTEM_ADMIN ||
            role === UserRole.DEVELOPER ||
            role === UserRole.ORG_ADMIN
          ) {
            return res.status(403).json({
              error: "You cannot assign admin or developer roles",
            });
          }
        }

        if (!userId) {
          return res.status(400).json({ error: "User ID is required" });
        }

        const [organization] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, orgId));

        if (!organization) {
          return res.status(404).json({ error: "Organization not found" });
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Check if organization has reached max users
        const [userCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(
            and(eq(users.organizationId, orgId), eq(users.isActive, true))
          );

        if (Number(userCount?.count || 0) >= organization.maxUsers) {
          return res.status(400).json({
            error: `Organization has reached maximum user limit of ${organization.maxUsers}`,
          });
        }

        const updateData: any = {
          organizationId: orgId,
        };

        if (role) updateData.role = role;
        if (assignedModules) updateData.assignedModules = assignedModules;

        await db.update(users).set(updateData).where(eq(users.id, userId));

        res.json({
          message: "User assigned to organization successfully",
        });
      } catch (error) {
        console.error("Error assigning user to organization:", error);
        res
          .status(500)
          .json({ error: "Failed to assign user to organization" });
      }
    }
  );

  // Remove user from organization
  app.delete(
    "/api/organizations/:orgId/users/:userId",
    requireAuth,
    requireRole([
      UserRole.SYSTEM_ADMIN,
      UserRole.DEVELOPER,
      UserRole.ORG_ADMIN,
    ]),
    async (req, res) => {
      try {
        const { orgId, userId } = req.params;

        // If user is org admin, verify they belong to this organization
        if (req.user?.role === UserRole.ORG_ADMIN) {
          if (req.user.organizationId !== orgId) {
            return res.status(403).json({
              error: "You can only manage users in your own organization",
            });
          }
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, parseInt(userId, 10)));

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        if (user.organizationId !== orgId) {
          return res.status(400).json({
            error: "User does not belong to this organization",
          });
        }

        // Remove organization assignment
        await db
          .update(users)
          .set({
            organizationId: null,
          })
          .where(eq(users.id, parseInt(userId, 10)));

        res.json({
          message: "User removed from organization successfully",
        });
      } catch (error) {
        console.error("Error removing user from organization:", error);
        res
          .status(500)
          .json({ error: "Failed to remove user from organization" });
      }
    }
  );
}
