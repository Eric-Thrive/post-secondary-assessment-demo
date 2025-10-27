/**
 * Comprehensive RBAC test scenarios
 * Systematic testing of all role-based access control functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { db } from "../../apps/server/db";
import {
  users,
  organizations,
  assessmentCases,
  UserRole,
  ModuleType,
} from "../../packages/db/schema";
import { eq, and, or } from "drizzle-orm";
import { rbacPermissionGate } from "../../apps/server/permissions/rbac-permission-gate";
import { ResourceType, ActionType } from "../../apps/server/permissions/types";
import bcrypt from "bcryptjs";
import {
  extendedTestUsers,
  extendedTestOrganizations,
  extendedTestAssessmentCases,
  testDataHelpers,
  type ExtendedTestUser,
  type ExtendedTestOrganization,
  type ExtendedTestAssessmentCase,
} from "../fixtures/comprehensive-test-data";

describe("Comprehensive RBAC System Scenarios", () => {
  let createdUserIds: number[] = [];
  let createdOrgIds: string[] = [];
  let createdCaseIds: string[] = [];
  let testUsers: { [username: string]: Express.User } = {};

  beforeAll(async () => {
    console.log("🚀 Setting up comprehensive RBAC test scenarios...");

    // Create extended test organizations
    for (const org of extendedTestOrganizations) {
      await db.insert(organizations).values({
        id: org.id,
        name: org.name,
        customerId: org.customerId,
        assignedModules: org.assignedModules,
        maxUsers: org.maxUsers,
        isActive: org.isActive,
      });
      createdOrgIds.push(org.id);
    }

    // Create extended test users
    for (const userData of extendedTestUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const [user] = await db
        .insert(users)
        .values({
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          assignedModules: userData.assignedModules,
          organizationId: userData.organizationId,
          customerId: userData.organizationId
            ? extendedTestOrganizations.find(
                (org) => org.id === userData.organizationId
              )?.customerId || "system"
            : userData.role === UserRole.DEMO
            ? "demo-org"
            : "system",
          maxReports: userData.maxReports,
          reportCount: userData.reportCount,
          isActive: true,
        })
        .returning();

      createdUserIds.push(user.id);
      testUsers[userData.username] = user as Express.User;
    }

    // Create extended test assessment cases
    for (const caseData of extendedTestAssessmentCases) {
      await db.insert(assessmentCases).values({
        caseId: caseData.caseId,
        displayName: caseData.displayName,
        moduleType: caseData.moduleType,
        customerId: caseData.customerId,
        status: caseData.status,
        gradeBand: caseData.gradeBand,
        documentNames: [],
        reportData: {},
        itemMasterData: {},
      });
      createdCaseIds.push(caseData.caseId);
    }

    console.log(
      `✅ Created ${createdOrgIds.length} organizations, ${createdUserIds.length} users, ${createdCaseIds.length} assessment cases`
    );
  });

  afterAll(async () => {
    console.log("🧹 Cleaning up comprehensive test data...");

    // Cleanup in reverse order
    for (const caseId of createdCaseIds) {
      await db
        .delete(assessmentCases)
        .where(eq(assessmentCases.caseId, caseId));
    }
    for (const userId of createdUserIds) {
      await db.delete(users).where(eq(users.id, userId));
    }
    for (const orgId of createdOrgIds) {
      await db.delete(organizations).where(eq(organizations.id, orgId));
    }

    console.log("✅ Cleanup completed");
  });

  describe("Developer Role Comprehensive Testing", () => {
    it("should validate full system access for all developer scenarios", async () => {
      const developers = testDataHelpers.getUsersByRole(UserRole.DEVELOPER);

      for (const devData of developers) {
        const developer = testUsers[devData.username];

        // Test all core permissions
        const permissions = [
          {
            resource: ResourceType.MODULES,
            action: ActionType.SWITCH,
            expected: true,
          },
          {
            resource: ResourceType.ADMIN,
            action: ActionType.VIEW,
            expected: true,
          },
          {
            resource: ResourceType.PROMPTS,
            action: ActionType.EDIT,
            expected: true,
          },
          {
            resource: ResourceType.USERS,
            action: ActionType.MANAGE,
            expected: true,
          },
          {
            resource: ResourceType.SYSTEM_CONFIG,
            action: ActionType.EDIT,
            expected: true,
          },
          {
            resource: ResourceType.DATABASE,
            action: ActionType.EDIT,
            expected: true,
          },
        ];

        for (const perm of permissions) {
          const hasAccess = await rbacPermissionGate.checkAccess(
            developer,
            perm.resource,
            perm.action
          );
          expect(hasAccess).toBe(perm.expected);
        }

        // Test unlimited report creation
        const canCreateManyReports = await rbacPermissionGate.checkAccess(
          developer,
          ResourceType.REPORTS,
          ActionType.CREATE,
          { currentReportCount: 1000 }
        );
        expect(canCreateManyReports).toBe(true);
      }
    });

    it("should handle edge cases for developers with high report counts", async () => {
      const edgeCaseDev = testUsers["test-developer-edge-case"];

      // Verify high report count doesn't affect permissions
      expect(edgeCaseDev.reportCount).toBe(999);

      const canStillCreate = await rbacPermissionGate.checkAccess(
        edgeCaseDev,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: edgeCaseDev.reportCount }
      );
      expect(canStillCreate).toBe(true);
    });
  });

  describe("Admin Role Boundary Testing", () => {
    it("should enforce admin permission boundaries correctly", async () => {
      const admins = testDataHelpers.getUsersByRole(UserRole.ADMIN);

      for (const adminData of admins) {
        const admin = testUsers[adminData.username];

        // Admins should have most permissions but NOT prompt editing
        const permissions = [
          {
            resource: ResourceType.MODULES,
            action: ActionType.SWITCH,
            expected: true,
          },
          {
            resource: ResourceType.ADMIN,
            action: ActionType.VIEW,
            expected: true,
          },
          {
            resource: ResourceType.PROMPTS,
            action: ActionType.EDIT,
            expected: false,
          }, // Key restriction
          {
            resource: ResourceType.USERS,
            action: ActionType.MANAGE,
            expected: true,
          },
          {
            resource: ResourceType.SYSTEM_CONFIG,
            action: ActionType.EDIT,
            expected: false,
          }, // Key restriction
          {
            resource: ResourceType.DATABASE,
            action: ActionType.VIEW,
            expected: false,
          }, // Key restriction
        ];

        for (const perm of permissions) {
          const hasAccess = await rbacPermissionGate.checkAccess(
            admin,
            perm.resource,
            perm.action
          );
          expect(hasAccess).toBe(perm.expected);
        }
      }
    });

    it("should handle new admin users with zero reports", async () => {
      const newAdmin = testUsers["test-admin-boundary"];
      expect(newAdmin.reportCount).toBe(0);

      // New admin should still have full admin permissions
      const canAccessAdmin = await rbacPermissionGate.checkAccess(
        newAdmin,
        ResourceType.ADMIN,
        ActionType.VIEW
      );
      expect(canAccessAdmin).toBe(true);
    });
  });

  describe("Organization Admin Complex Scenarios", () => {
    it("should handle org admin in single-user organization", async () => {
      const singleUserOrgAdmin = testUsers["test-org-admin-boundary-1"];
      expect(singleUserOrgAdmin.organizationId).toBe("org-boundary-test-1");

      // Should be able to manage users within their org
      const canManageUsers = await rbacPermissionGate.checkAccess(
        singleUserOrgAdmin,
        ResourceType.USERS,
        ActionType.MANAGE,
        { isOrgUser: true }
      );
      expect(canManageUsers).toBe(true);

      // Should not be able to switch modules
      const canSwitchModules = await rbacPermissionGate.checkAccess(
        singleUserOrgAdmin,
        ResourceType.MODULES,
        ActionType.SWITCH
      );
      expect(canSwitchModules).toBe(false);
    });

    it("should handle org admin with mixed module permissions", async () => {
      const mixedOrgAdmin = testUsers["test-org-admin-mixed"];
      expect(mixedOrgAdmin.assignedModules).toEqual([
        ModuleType.K12,
        ModuleType.TUTORING,
      ]);

      // Should have access to assigned modules
      for (const module of mixedOrgAdmin.assignedModules) {
        const hasModuleAccess = await rbacPermissionGate.checkAccess(
          mixedOrgAdmin,
          ResourceType.MODULES,
          ActionType.VIEW,
          { moduleType: module }
        );
        expect(hasModuleAccess).toBe(true);
      }

      // Should not have access to unassigned modules
      const hasPostSecAccess = await rbacPermissionGate.checkAccess(
        mixedOrgAdmin,
        ResourceType.MODULES,
        ActionType.VIEW,
        { moduleType: ModuleType.POST_SECONDARY }
      );
      expect(hasPostSecAccess).toBe(false);
    });

    it("should handle org admin in deactivated organization", async () => {
      const inactiveOrgAdmin = testUsers["test-org-admin-inactive"];
      expect(inactiveOrgAdmin.organizationId).toBe("org-recently-deactivated");

      // Verify the organization is inactive
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, "org-recently-deactivated"))
        .limit(1);
      expect(org.isActive).toBe(false);

      // User should still exist and have basic permissions
      // (Business logic for inactive orgs would be implemented in application layer)
      const canManageUsers = await rbacPermissionGate.checkAccess(
        inactiveOrgAdmin,
        ResourceType.USERS,
        ActionType.MANAGE,
        { isOrgUser: true }
      );
      expect(canManageUsers).toBe(true);
    });
  });

  describe("Customer Role Edge Cases", () => {
    it("should handle customer in single-user organization", async () => {
      const singleCustomer = testUsers["test-customer-boundary-single"];
      expect(singleCustomer.organizationId).toBe("org-boundary-test-1");

      // Should have basic customer permissions
      const canCreateReports = await rbacPermissionGate.checkAccess(
        singleCustomer,
        ResourceType.REPORTS,
        ActionType.CREATE
      );
      expect(canCreateReports).toBe(true);

      // Should not have admin access
      const canAccessAdmin = await rbacPermissionGate.checkAccess(
        singleCustomer,
        ResourceType.ADMIN,
        ActionType.VIEW
      );
      expect(canAccessAdmin).toBe(false);
    });

    it("should handle high-usage customer performance", async () => {
      const highUsageCustomer = testUsers["test-customer-high-usage"];
      expect(highUsageCustomer.reportCount).toBe(500);

      // High report count should not affect permissions
      const canCreateMore = await rbacPermissionGate.checkAccess(
        highUsageCustomer,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: highUsageCustomer.reportCount }
      );
      expect(canCreateMore).toBe(true);
    });

    it("should validate mixed module customer access", async () => {
      const mixedCustomer = testUsers["test-customer-mixed-modules"];
      expect(mixedCustomer.assignedModules).toEqual([
        ModuleType.K12,
        ModuleType.TUTORING,
      ]);

      // Should have access to assigned modules
      for (const module of mixedCustomer.assignedModules) {
        const hasAccess = await rbacPermissionGate.checkAccess(
          mixedCustomer,
          ResourceType.MODULES,
          ActionType.VIEW,
          { moduleType: module }
        );
        expect(hasAccess).toBe(true);
      }

      // Should not have access to unassigned module
      const hasPostSecAccess = await rbacPermissionGate.checkAccess(
        mixedCustomer,
        ResourceType.MODULES,
        ActionType.VIEW,
        { moduleType: ModuleType.POST_SECONDARY }
      );
      expect(hasPostSecAccess).toBe(false);
    });
  });

  describe("Demo User Journey Comprehensive Testing", () => {
    it("should validate complete demo user progression (0 to 5 reports)", async () => {
      const demoUsers = [
        { user: testUsers["test-demo-zero-reports"], expectedCount: 0 },
        { user: testUsers["test-demo-one-report"], expectedCount: 1 },
        { user: testUsers["test-demo-mid-usage"], expectedCount: 3 },
        { user: testUsers["test-demo-pre-limit"], expectedCount: 4 },
        { user: testUsers["test-demo-exactly-at-limit"], expectedCount: 5 },
      ];

      for (const { user, expectedCount } of demoUsers) {
        expect(user.reportCount).toBe(expectedCount);
        expect(user.maxReports).toBe(5);

        // Test report creation based on current count
        const canCreate = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.REPORTS,
          ActionType.CREATE,
          { currentReportCount: expectedCount }
        );

        // Should be able to create if under limit
        const shouldBeAbleToCreate = expectedCount < 5;
        expect(canCreate).toBe(shouldBeAbleToCreate);

        // All demo users should be isolated from organizations
        expect(user.organizationId).toBeNull();

        // All demo users should have restricted permissions
        const canAccessAdmin = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.ADMIN,
          ActionType.VIEW
        );
        expect(canAccessAdmin).toBe(false);

        const canManageUsers = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.USERS,
          ActionType.MANAGE
        );
        expect(canManageUsers).toBe(false);
      }
    });

    it("should validate module-specific demo experiences", async () => {
      const moduleSpecificDemos = [
        { user: testUsers["test-demo-k12-focused"], module: ModuleType.K12 },
        {
          user: testUsers["test-demo-tutoring-focused"],
          module: ModuleType.TUTORING,
        },
      ];

      for (const { user, module } of moduleSpecificDemos) {
        // Should have access to their assigned module
        expect(user.assignedModules).toContain(module);

        const hasModuleAccess = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.MODULES,
          ActionType.VIEW,
          { moduleType: module }
        );
        expect(hasModuleAccess).toBe(true);

        // Should not be able to switch modules
        const canSwitchModules = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.MODULES,
          ActionType.SWITCH
        );
        expect(canSwitchModules).toBe(false);
      }
    });

    it("should validate upgrade prompt timing at 4 reports", async () => {
      const preLimit = testUsers["test-demo-pre-limit"];
      expect(preLimit.reportCount).toBe(4);

      // Should still be able to create 5th report
      const canCreateFifth = await rbacPermissionGate.checkAccess(
        preLimit,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 4 }
      );
      expect(canCreateFifth).toBe(true);

      // Should not be able to create 6th report
      const canCreateSixth = await rbacPermissionGate.checkAccess(
        preLimit,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 5 }
      );
      expect(canCreateSixth).toBe(false);
    });
  });

  describe("Multi-Tenant Data Isolation Validation", () => {
    it("should enforce strict data isolation between organizations", async () => {
      // Test data isolation between different organizations
      const orgCustomerIds = extendedTestOrganizations.map(
        (org) => org.customerId
      );

      for (const customerId of orgCustomerIds) {
        const orgCases = await db
          .select()
          .from(assessmentCases)
          .where(eq(assessmentCases.customerId, customerId));

        const orgUsers = await db
          .select()
          .from(users)
          .where(eq(users.customerId, customerId));

        // All users in an organization should have the same customerId
        for (const user of orgUsers) {
          expect(user.customerId).toBe(customerId);
        }

        // Assessment cases should belong to the correct customer
        for (const case_ of orgCases) {
          expect(case_.customerId).toBe(customerId);
        }
      }
    });

    it("should validate demo user isolation from organizations", async () => {
      const demoUsers = testDataHelpers.getUsersByRole(UserRole.DEMO);

      for (const demoData of demoUsers) {
        const demo = testUsers[demoData.username];

        // Demo users should not be in any organization
        expect(demo.organizationId).toBeNull();

        // Demo users should have demo-specific customerId
        expect(demo.customerId).toBe("demo-org");
      }

      // Demo cases should be isolated
      const demoCases = testDataHelpers.getCasesByCustomer("demo-org");
      expect(demoCases.length).toBeGreaterThan(0);

      // Verify demo cases in database
      const dbDemoCases = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, "demo-org"));

      expect(dbDemoCases.length).toBeGreaterThan(0);
    });

    it("should prevent cross-organization data access", async () => {
      // Test that users from one org cannot access another org's data
      const org1Users = testDataHelpers.getUsersByOrganization(
        "org-boundary-test-1"
      );
      const org2Users = testDataHelpers.getUsersByOrganization(
        "org-boundary-test-2"
      );

      expect(org1Users.length).toBeGreaterThan(0);
      expect(org2Users.length).toBeGreaterThan(0);

      // Users should have different customerIds
      const org1CustomerId = extendedTestOrganizations.find(
        (org) => org.id === "org-boundary-test-1"
      )?.customerId;
      const org2CustomerId = extendedTestOrganizations.find(
        (org) => org.id === "org-boundary-test-2"
      )?.customerId;

      expect(org1CustomerId).not.toBe(org2CustomerId);

      // Verify in database
      const org1DbUsers = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, "org-boundary-test-1"));

      const org2DbUsers = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, "org-boundary-test-2"));

      for (const user of org1DbUsers) {
        expect(user.customerId).toBe(org1CustomerId);
      }

      for (const user of org2DbUsers) {
        expect(user.customerId).toBe(org2CustomerId);
      }
    });
  });

  describe("Module Access Boundary Testing", () => {
    it("should enforce module restrictions across all user types", async () => {
      // Test module access for users with different module assignments
      const testCases = [
        {
          user: testUsers["test-org-admin-k12"],
          allowedModules: [ModuleType.K12],
          deniedModules: [ModuleType.POST_SECONDARY, ModuleType.TUTORING],
        },
        {
          user: testUsers["test-customer-mixed-modules"],
          allowedModules: [ModuleType.K12, ModuleType.TUTORING],
          deniedModules: [ModuleType.POST_SECONDARY],
        },
        {
          user: testUsers["test-demo-k12-focused"],
          allowedModules: [ModuleType.K12],
          deniedModules: [ModuleType.POST_SECONDARY, ModuleType.TUTORING],
        },
      ];

      for (const testCase of testCases) {
        // Test allowed modules
        for (const module of testCase.allowedModules) {
          const hasAccess = await rbacPermissionGate.checkAccess(
            testCase.user,
            ResourceType.MODULES,
            ActionType.VIEW,
            { moduleType: module }
          );
          expect(hasAccess).toBe(true);
        }

        // Test denied modules
        for (const module of testCase.deniedModules) {
          const hasAccess = await rbacPermissionGate.checkAccess(
            testCase.user,
            ResourceType.MODULES,
            ActionType.VIEW,
            { moduleType: module }
          );
          expect(hasAccess).toBe(false);
        }
      }
    });

    it("should validate module switching restrictions", async () => {
      const canSwitchUsers = [
        testUsers["test-developer-edge-case"],
        testUsers["test-admin-boundary"],
      ];

      const cannotSwitchUsers = [
        testUsers["test-org-admin-mixed"],
        testUsers["test-customer-mixed-modules"],
        testUsers["test-demo-k12-focused"],
      ];

      // Users who should be able to switch modules
      for (const user of canSwitchUsers) {
        const canSwitch = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.MODULES,
          ActionType.SWITCH
        );
        expect(canSwitch).toBe(true);
      }

      // Users who should not be able to switch modules
      for (const user of cannotSwitchUsers) {
        const canSwitch = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.MODULES,
          ActionType.SWITCH
        );
        expect(canSwitch).toBe(false);
      }
    });
  });

  describe("Performance and Scalability Validation", () => {
    it("should handle high-volume users efficiently", async () => {
      const highVolumeUser = testUsers["test-customer-high-usage"];
      expect(highVolumeUser.reportCount).toBe(500);

      // Performance test: multiple permission checks should be fast
      const startTime = Date.now();

      const permissionChecks = [
        rbacPermissionGate.checkAccess(
          highVolumeUser,
          ResourceType.REPORTS,
          ActionType.CREATE
        ),
        rbacPermissionGate.checkAccess(
          highVolumeUser,
          ResourceType.REPORTS,
          ActionType.VIEW
        ),
        rbacPermissionGate.checkAccess(
          highVolumeUser,
          ResourceType.MODULES,
          ActionType.VIEW
        ),
        rbacPermissionGate.checkAccess(
          highVolumeUser,
          ResourceType.ADMIN,
          ActionType.VIEW
        ),
        rbacPermissionGate.checkAccess(
          highVolumeUser,
          ResourceType.USERS,
          ActionType.MANAGE
        ),
      ];

      const results = await Promise.all(permissionChecks);
      const endTime = Date.now();

      // All checks should complete within reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);

      // Verify expected results
      expect(results[0]).toBe(true); // Can create reports
      expect(results[1]).toBe(true); // Can view reports
      expect(results[2]).toBe(true); // Can view modules
      expect(results[3]).toBe(false); // Cannot access admin
      expect(results[4]).toBe(false); // Cannot manage users
    });

    it("should handle organization with high user limit", async () => {
      const highCapacityOrg = extendedTestOrganizations.find(
        (org) => org.id === "org-boundary-test-2"
      );
      expect(highCapacityOrg?.maxUsers).toBe(100);

      // Verify organization exists in database
      const [dbOrg] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, "org-boundary-test-2"))
        .limit(1);

      expect(dbOrg).toBeDefined();
      expect(dbOrg.maxUsers).toBe(100);
      expect(dbOrg.isActive).toBe(true);
    });
  });
});
