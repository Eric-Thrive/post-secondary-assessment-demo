/**
 * Comprehensive RBAC Integration Tests
 * Tests complete authentication flow, role assignment, permissions, and multi-tenancy
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

// Comprehensive test data for integration testing
const integrationTestData = {
  organizations: [
    {
      id: "integration-org-full",
      name: "Full Integration Test Organization",
      customerId: "integration-full-customer",
      assignedModules: [
        ModuleType.K12,
        ModuleType.POST_SECONDARY,
        ModuleType.TUTORING,
      ],
      maxUsers: 50,
      isActive: true,
    },
    {
      id: "integration-org-limited",
      name: "Limited Integration Test Organization",
      customerId: "integration-limited-customer",
      assignedModules: [ModuleType.POST_SECONDARY],
      maxUsers: 10,
      isActive: true,
    },
    {
      id: "integration-org-inactive",
      name: "Inactive Integration Test Organization",
      customerId: "integration-inactive-customer",
      assignedModules: [ModuleType.K12],
      maxUsers: 5,
      isActive: false,
    },
  ],
  users: [
    // Developer for full system testing
    {
      username: "integration-developer",
      email: "integration-developer@test.com",
      password: "TestPassword123!",
      role: UserRole.DEVELOPER,
      assignedModules: [
        ModuleType.K12,
        ModuleType.POST_SECONDARY,
        ModuleType.TUTORING,
      ],
      organizationId: null,
      maxReports: -1,
      reportCount: 0,
    },
    // Admin for system management testing
    {
      username: "integration-admin",
      email: "integration-admin@test.com",
      password: "TestPassword123!",
      role: UserRole.ADMIN,
      assignedModules: [
        ModuleType.K12,
        ModuleType.POST_SECONDARY,
        ModuleType.TUTORING,
      ],
      organizationId: null,
      maxReports: -1,
      reportCount: 5,
    },
    // Org Admin for organization management testing
    {
      username: "integration-org-admin-full",
      email: "integration-org-admin-full@test.com",
      password: "TestPassword123!",
      role: UserRole.ORG_ADMIN,
      assignedModules: [
        ModuleType.K12,
        ModuleType.POST_SECONDARY,
        ModuleType.TUTORING,
      ],
      organizationId: "integration-org-full",
      maxReports: -1,
      reportCount: 10,
    },
    {
      username: "integration-org-admin-limited",
      email: "integration-org-admin-limited@test.com",
      password: "TestPassword123!",
      role: UserRole.ORG_ADMIN,
      assignedModules: [ModuleType.POST_SECONDARY],
      organizationId: "integration-org-limited",
      maxReports: -1,
      reportCount: 3,
    },
    // Customers for organization access testing
    {
      username: "integration-customer-full-1",
      email: "integration-customer-full-1@test.com",
      password: "TestPassword123!",
      role: UserRole.CUSTOMER,
      assignedModules: [ModuleType.K12, ModuleType.POST_SECONDARY],
      organizationId: "integration-org-full",
      maxReports: -1,
      reportCount: 8,
    },
    {
      username: "integration-customer-full-2",
      email: "integration-customer-full-2@test.com",
      password: "TestPassword123!",
      role: UserRole.CUSTOMER,
      assignedModules: [ModuleType.TUTORING],
      organizationId: "integration-org-full",
      maxReports: -1,
      reportCount: 12,
    },
    {
      username: "integration-customer-limited",
      email: "integration-customer-limited@test.com",
      password: "TestPassword123!",
      role: UserRole.CUSTOMER,
      assignedModules: [ModuleType.POST_SECONDARY],
      organizationId: "integration-org-limited",
      maxReports: -1,
      reportCount: 6,
    },
    // Demo users for sandbox testing
    {
      username: "integration-demo-new",
      email: "integration-demo-new@test.com",
      password: "TestPassword123!",
      role: UserRole.DEMO,
      assignedModules: [ModuleType.POST_SECONDARY],
      organizationId: null,
      maxReports: 5,
      reportCount: 0,
    },
    {
      username: "integration-demo-mid",
      email: "integration-demo-mid@test.com",
      password: "TestPassword123!",
      role: UserRole.DEMO,
      assignedModules: [ModuleType.K12],
      organizationId: null,
      maxReports: 5,
      reportCount: 3,
    },
    {
      username: "integration-demo-limit",
      email: "integration-demo-limit@test.com",
      password: "TestPassword123!",
      role: UserRole.DEMO,
      assignedModules: [ModuleType.TUTORING],
      organizationId: null,
      maxReports: 5,
      reportCount: 5,
    },
  ],
  assessmentCases: [
    // Full organization cases
    {
      caseId: "integration-case-full-k12-1",
      displayName: "Integration Full Org K12 Case 1",
      moduleType: ModuleType.K12,
      customerId: "integration-full-customer",
      status: "completed",
      gradeBand: "elementary",
    },
    {
      caseId: "integration-case-full-postsec-1",
      displayName: "Integration Full Org Post-Secondary Case 1",
      moduleType: ModuleType.POST_SECONDARY,
      customerId: "integration-full-customer",
      status: "in_progress",
    },
    {
      caseId: "integration-case-full-tutoring-1",
      displayName: "Integration Full Org Tutoring Case 1",
      moduleType: ModuleType.TUTORING,
      customerId: "integration-full-customer",
      status: "pending",
    },
    // Limited organization cases
    {
      caseId: "integration-case-limited-postsec-1",
      displayName: "Integration Limited Org Post-Secondary Case 1",
      moduleType: ModuleType.POST_SECONDARY,
      customerId: "integration-limited-customer",
      status: "completed",
    },
    {
      caseId: "integration-case-limited-postsec-2",
      displayName: "Integration Limited Org Post-Secondary Case 2",
      moduleType: ModuleType.POST_SECONDARY,
      customerId: "integration-limited-customer",
      status: "in_progress",
    },
    // Inactive organization cases
    {
      caseId: "integration-case-inactive-k12-1",
      displayName: "Integration Inactive Org K12 Case 1",
      moduleType: ModuleType.K12,
      customerId: "integration-inactive-customer",
      status: "completed",
      gradeBand: "middle",
    },
    // Demo cases
    {
      caseId: "integration-case-demo-1",
      displayName: "Integration Demo Case 1",
      moduleType: ModuleType.POST_SECONDARY,
      customerId: "demo-org",
      status: "completed",
    },
    {
      caseId: "integration-case-demo-2",
      displayName: "Integration Demo Case 2",
      moduleType: ModuleType.K12,
      customerId: "demo-org",
      status: "completed",
      gradeBand: "elementary",
    },
  ],
};

describe("Comprehensive RBAC Integration Tests", () => {
  let createdUserIds: number[] = [];
  let createdOrgIds: string[] = [];
  let createdCaseIds: string[] = [];
  let testUsers: { [username: string]: Express.User } = {};

  beforeAll(async () => {
    console.log("🚀 Setting up comprehensive RBAC integration tests...");

    // Create test organizations
    for (const org of integrationTestData.organizations) {
      await db.insert(organizations).values(org);
      createdOrgIds.push(org.id);
    }

    // Create test users
    for (const userData of integrationTestData.users) {
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
            ? integrationTestData.organizations.find(
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

    // Create test assessment cases
    for (const caseData of integrationTestData.assessmentCases) {
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
      `✅ Created ${createdOrgIds.length} orgs, ${createdUserIds.length} users, ${createdCaseIds.length} cases`
    );
  });

  afterAll(async () => {
    console.log("🧹 Cleaning up integration test data...");

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

    console.log("✅ Integration test cleanup completed");
  });

  describe("Complete Authentication Flow", () => {
    it("should authenticate users and assign correct roles and permissions", async () => {
      for (const userData of integrationTestData.users) {
        const user = testUsers[userData.username];

        // Verify user exists and has correct properties
        expect(user).toBeDefined();
        expect(user.role).toBe(userData.role);
        expect(user.assignedModules).toEqual(userData.assignedModules);
        expect(user.organizationId).toBe(userData.organizationId);
        expect(user.maxReports).toBe(userData.maxReports);
        expect(user.reportCount).toBe(userData.reportCount);
        expect(user.isActive).toBe(true);

        // Verify password is properly hashed
        const isValidPassword = await bcrypt.compare(
          userData.password,
          user.password
        );
        expect(isValidPassword).toBe(true);

        // Verify user permissions are correctly assigned
        const permissions = rbacPermissionGate.getUserPermissions(
          user.role,
          user.assignedModules,
          user.maxReports
        );
        expect(permissions).toBeDefined();
        expect(permissions.moduleAccess).toEqual(user.assignedModules);
      }
    });

    it("should handle authentication edge cases", async () => {
      // Test inactive user (simulated)
      const activeUser = testUsers["integration-developer"];
      expect(activeUser.isActive).toBe(true);

      // Test user with high report count
      const highReportUser = testUsers["integration-customer-full-2"];
      expect(highReportUser.reportCount).toBe(12);

      const canCreateReports = await rbacPermissionGate.checkAccess(
        highReportUser,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: highReportUser.reportCount }
      );
      expect(canCreateReports).toBe(true); // Customer should have unlimited reports
    });
  });

  describe("Module Access Control Integration", () => {
    it("should enforce module access across all user roles", async () => {
      const testCases = [
        {
          user: testUsers["integration-developer"],
          shouldHaveAccess: [
            ModuleType.K12,
            ModuleType.POST_SECONDARY,
            ModuleType.TUTORING,
          ],
          shouldNotHaveAccess: [],
          canSwitch: true,
        },
        {
          user: testUsers["integration-admin"],
          shouldHaveAccess: [
            ModuleType.K12,
            ModuleType.POST_SECONDARY,
            ModuleType.TUTORING,
          ],
          shouldNotHaveAccess: [],
          canSwitch: true,
        },
        {
          user: testUsers["integration-org-admin-limited"],
          shouldHaveAccess: [ModuleType.POST_SECONDARY],
          shouldNotHaveAccess: [ModuleType.K12, ModuleType.TUTORING],
          canSwitch: false,
        },
        {
          user: testUsers["integration-customer-full-1"],
          shouldHaveAccess: [ModuleType.K12, ModuleType.POST_SECONDARY],
          shouldNotHaveAccess: [ModuleType.TUTORING],
          canSwitch: false,
        },
        {
          user: testUsers["integration-demo-new"],
          shouldHaveAccess: [ModuleType.POST_SECONDARY],
          shouldNotHaveAccess: [ModuleType.K12, ModuleType.TUTORING],
          canSwitch: false,
        },
      ];

      for (const testCase of testCases) {
        // Test module access
        for (const module of testCase.shouldHaveAccess) {
          const hasAccess = await rbacPermissionGate.checkAccess(
            testCase.user,
            ResourceType.MODULES,
            ActionType.VIEW,
            { moduleType: module }
          );
          expect(hasAccess).toBe(true);
        }

        for (const module of testCase.shouldNotHaveAccess) {
          const hasAccess = await rbacPermissionGate.checkAccess(
            testCase.user,
            ResourceType.MODULES,
            ActionType.VIEW,
            { moduleType: module }
          );
          expect(hasAccess).toBe(false);
        }

        // Test module switching
        const canSwitch = await rbacPermissionGate.checkAccess(
          testCase.user,
          ResourceType.MODULES,
          ActionType.SWITCH
        );
        expect(canSwitch).toBe(testCase.canSwitch);
      }
    });

    it("should validate module-specific functionality access", async () => {
      // Test that users can only access functionality for their assigned modules
      const limitedOrgAdmin = testUsers["integration-org-admin-limited"];
      expect(limitedOrgAdmin.assignedModules).toEqual([
        ModuleType.POST_SECONDARY,
      ]);

      // Should be able to access post-secondary functionality
      const hasPostSecAccess = await rbacPermissionGate.checkAccess(
        limitedOrgAdmin,
        ResourceType.MODULES,
        ActionType.VIEW,
        { moduleType: ModuleType.POST_SECONDARY }
      );
      expect(hasPostSecAccess).toBe(true);

      // Should not be able to access K12 functionality
      const hasK12Access = await rbacPermissionGate.checkAccess(
        limitedOrgAdmin,
        ResourceType.MODULES,
        ActionType.VIEW,
        { moduleType: ModuleType.K12 }
      );
      expect(hasK12Access).toBe(false);
    });
  });

  describe("Report Creation and Access Control", () => {
    it("should enforce report creation permissions and limits", async () => {
      const testCases = [
        {
          user: testUsers["integration-developer"],
          canCreateUnlimited: true,
          reportLimit: -1,
        },
        {
          user: testUsers["integration-admin"],
          canCreateUnlimited: true,
          reportLimit: -1,
        },
        {
          user: testUsers["integration-org-admin-full"],
          canCreateUnlimited: true,
          reportLimit: -1,
        },
        {
          user: testUsers["integration-customer-full-1"],
          canCreateUnlimited: true,
          reportLimit: -1,
        },
        {
          user: testUsers["integration-demo-new"],
          canCreateUnlimited: false,
          reportLimit: 5,
        },
        {
          user: testUsers["integration-demo-limit"],
          canCreateUnlimited: false,
          reportLimit: 5,
        },
      ];

      for (const testCase of testCases) {
        expect(testCase.user.maxReports).toBe(testCase.reportLimit);

        if (testCase.canCreateUnlimited) {
          // Test unlimited report creation
          const canCreateMany = await rbacPermissionGate.checkAccess(
            testCase.user,
            ResourceType.REPORTS,
            ActionType.CREATE,
            { currentReportCount: 1000 }
          );
          expect(canCreateMany).toBe(true);
        } else {
          // Test demo user limits
          const canCreateUnderLimit = await rbacPermissionGate.checkAccess(
            testCase.user,
            ResourceType.REPORTS,
            ActionType.CREATE,
            { currentReportCount: testCase.user.reportCount }
          );

          const canCreateAtLimit = await rbacPermissionGate.checkAccess(
            testCase.user,
            ResourceType.REPORTS,
            ActionType.CREATE,
            { currentReportCount: 5 }
          );

          if (testCase.user.reportCount < 5) {
            expect(canCreateUnderLimit).toBe(true);
          }
          expect(canCreateAtLimit).toBe(false);
        }
      }
    });

    it("should validate report sharing and access permissions", async () => {
      const testCases = [
        {
          user: testUsers["integration-developer"],
          canViewAll: true,
          canViewOrg: true,
          canViewOwn: true,
          canShare: true,
        },
        {
          user: testUsers["integration-admin"],
          canViewAll: true,
          canViewOrg: true,
          canViewOwn: true,
          canShare: true,
        },
        {
          user: testUsers["integration-org-admin-full"],
          canViewAll: false,
          canViewOrg: true,
          canViewOwn: true,
          canShare: true,
        },
        {
          user: testUsers["integration-customer-full-1"],
          canViewAll: false,
          canViewOrg: false,
          canViewOwn: true,
          canShare: true,
        },
        {
          user: testUsers["integration-demo-new"],
          canViewAll: false,
          canViewOrg: false,
          canViewOwn: true,
          canShare: true,
        },
      ];

      for (const testCase of testCases) {
        const viewAllReports = await rbacPermissionGate.checkAccess(
          testCase.user,
          ResourceType.REPORTS,
          ActionType.VIEW
        );
        expect(viewAllReports).toBe(testCase.canViewAll);

        const viewOrgReports = await rbacPermissionGate.checkAccess(
          testCase.user,
          ResourceType.REPORTS,
          ActionType.VIEW,
          { isOrgReport: true }
        );
        expect(viewOrgReports).toBe(testCase.canViewOrg);

        const viewOwnReports = await rbacPermissionGate.checkAccess(
          testCase.user,
          ResourceType.REPORTS,
          ActionType.VIEW,
          { isOwnReport: true }
        );
        expect(viewOwnReports).toBe(testCase.canViewOwn);

        const shareReports = await rbacPermissionGate.checkAccess(
          testCase.user,
          ResourceType.REPORTS,
          ActionType.SHARE
        );
        expect(shareReports).toBe(testCase.canShare);
      }
    });
  });

  describe("Admin Dashboard Access Control", () => {
    it("should enforce admin dashboard access permissions", async () => {
      const testCases = [
        { user: testUsers["integration-developer"], canAccess: true },
        { user: testUsers["integration-admin"], canAccess: true },
        { user: testUsers["integration-org-admin-full"], canAccess: false },
        { user: testUsers["integration-customer-full-1"], canAccess: false },
        { user: testUsers["integration-demo-new"], canAccess: false },
      ];

      for (const testCase of testCases) {
        const canAccessAdmin = await rbacPermissionGate.checkAccess(
          testCase.user,
          ResourceType.ADMIN,
          ActionType.VIEW
        );
        expect(canAccessAdmin).toBe(testCase.canAccess);
      }
    });

    it("should validate system analytics access", async () => {
      const developer = testUsers["integration-developer"];
      const admin = testUsers["integration-admin"];
      const orgAdmin = testUsers["integration-org-admin-full"];

      // Developers and admins should have analytics access
      const devAnalytics = await rbacPermissionGate.checkAccess(
        developer,
        ResourceType.ADMIN,
        ActionType.MANAGE
      );
      expect(devAnalytics).toBe(true);

      const adminAnalytics = await rbacPermissionGate.checkAccess(
        admin,
        ResourceType.ADMIN,
        ActionType.MANAGE
      );
      expect(adminAnalytics).toBe(true);

      // Org admins should not have system analytics access
      const orgAdminAnalytics = await rbacPermissionGate.checkAccess(
        orgAdmin,
        ResourceType.ADMIN,
        ActionType.MANAGE
      );
      expect(orgAdminAnalytics).toBe(false);
    });
  });

  describe("User Management Permissions", () => {
    it("should enforce user management permissions by role", async () => {
      const testCases = [
        {
          user: testUsers["integration-developer"],
          canManageAll: true,
          canManageOrg: true,
        },
        {
          user: testUsers["integration-admin"],
          canManageAll: true,
          canManageOrg: true,
        },
        {
          user: testUsers["integration-org-admin-full"],
          canManageAll: false,
          canManageOrg: true,
        },
        {
          user: testUsers["integration-customer-full-1"],
          canManageAll: false,
          canManageOrg: false,
        },
        {
          user: testUsers["integration-demo-new"],
          canManageAll: false,
          canManageOrg: false,
        },
      ];

      for (const testCase of testCases) {
        const canManageAllUsers = await rbacPermissionGate.checkAccess(
          testCase.user,
          ResourceType.USERS,
          ActionType.MANAGE
        );
        expect(canManageAllUsers).toBe(testCase.canManageAll);

        const canManageOrgUsers = await rbacPermissionGate.checkAccess(
          testCase.user,
          ResourceType.USERS,
          ActionType.MANAGE,
          { isOrgUser: true }
        );
        expect(canManageOrgUsers).toBe(testCase.canManageOrg);
      }
    });

    it("should validate organization-scoped user management", async () => {
      const fullOrgAdmin = testUsers["integration-org-admin-full"];
      const limitedOrgAdmin = testUsers["integration-org-admin-limited"];

      // Both should be able to manage users within their organizations
      const fullOrgCanManage = await rbacPermissionGate.checkAccess(
        fullOrgAdmin,
        ResourceType.USERS,
        ActionType.MANAGE,
        { isOrgUser: true }
      );
      expect(fullOrgCanManage).toBe(true);

      const limitedOrgCanManage = await rbacPermissionGate.checkAccess(
        limitedOrgAdmin,
        ResourceType.USERS,
        ActionType.MANAGE,
        { isOrgUser: true }
      );
      expect(limitedOrgCanManage).toBe(true);

      // Neither should be able to manage users outside their organizations
      const fullOrgCanManageAll = await rbacPermissionGate.checkAccess(
        fullOrgAdmin,
        ResourceType.USERS,
        ActionType.MANAGE
      );
      expect(fullOrgCanManageAll).toBe(false);

      const limitedOrgCanManageAll = await rbacPermissionGate.checkAccess(
        limitedOrgAdmin,
        ResourceType.USERS,
        ActionType.MANAGE
      );
      expect(limitedOrgCanManageAll).toBe(false);
    });
  });

  describe("Organization-based Data Isolation", () => {
    it("should enforce strict data isolation between organizations", async () => {
      // Verify users are properly assigned to organizations
      const fullOrgUsers = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, "integration-org-full"));

      const limitedOrgUsers = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, "integration-org-limited"));

      expect(fullOrgUsers.length).toBeGreaterThan(0);
      expect(limitedOrgUsers.length).toBeGreaterThan(0);

      // All users in an organization should have the same customerId
      const fullOrgCustomerId = fullOrgUsers[0].customerId;
      const limitedOrgCustomerId = limitedOrgUsers[0].customerId;

      expect(fullOrgCustomerId).toBe("integration-full-customer");
      expect(limitedOrgCustomerId).toBe("integration-limited-customer");
      expect(fullOrgCustomerId).not.toBe(limitedOrgCustomerId);

      for (const user of fullOrgUsers) {
        expect(user.customerId).toBe(fullOrgCustomerId);
      }

      for (const user of limitedOrgUsers) {
        expect(user.customerId).toBe(limitedOrgCustomerId);
      }
    });

    it("should isolate assessment cases by customer", async () => {
      // Verify assessment cases are properly isolated
      const fullOrgCases = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, "integration-full-customer"));

      const limitedOrgCases = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, "integration-limited-customer"));

      const demoCases = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, "demo-org"));

      expect(fullOrgCases.length).toBe(3); // K12, Post-Secondary, Tutoring
      expect(limitedOrgCases.length).toBe(2); // Post-Secondary only
      expect(demoCases.length).toBe(2); // Demo cases

      // Verify no cross-contamination
      const allCustomerIds = [
        ...fullOrgCases.map((c) => c.customerId),
        ...limitedOrgCases.map((c) => c.customerId),
        ...demoCases.map((c) => c.customerId),
      ];

      const uniqueCustomerIds = [...new Set(allCustomerIds)];
      expect(uniqueCustomerIds).toHaveLength(3);
      expect(uniqueCustomerIds).toContain("integration-full-customer");
      expect(uniqueCustomerIds).toContain("integration-limited-customer");
      expect(uniqueCustomerIds).toContain("demo-org");
    });

    it("should maintain demo user isolation", async () => {
      const demoUsers = await db
        .select()
        .from(users)
        .where(eq(users.role, UserRole.DEMO));

      // All demo users should be isolated from organizations
      for (const demo of demoUsers) {
        expect(demo.organizationId).toBeNull();
        expect(demo.customerId).toBe("demo-org");
      }

      // Demo users should have access to demo cases only
      const demoCases = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, "demo-org"));

      expect(demoCases.length).toBeGreaterThan(0);
    });
  });

  describe("Demo User Journey Integration", () => {
    it("should validate complete demo user lifecycle", async () => {
      const demoUsers = [
        { user: testUsers["integration-demo-new"], stage: "new" },
        { user: testUsers["integration-demo-mid"], stage: "mid" },
        { user: testUsers["integration-demo-limit"], stage: "limit" },
      ];

      for (const { user, stage } of demoUsers) {
        // All demo users should have same basic restrictions
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

        const canSwitchModules = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.MODULES,
          ActionType.SWITCH
        );
        expect(canSwitchModules).toBe(false);

        // Report creation should depend on current count
        const canCreateReports = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.REPORTS,
          ActionType.CREATE,
          { currentReportCount: user.reportCount }
        );

        if (stage === "limit") {
          expect(canCreateReports).toBe(false);
        } else {
          expect(canCreateReports).toBe(true);
        }
      }
    });

    it("should validate demo upgrade prompts and limits", async () => {
      const demoAtLimit = testUsers["integration-demo-limit"];
      expect(demoAtLimit.reportCount).toBe(5);
      expect(demoAtLimit.maxReports).toBe(5);

      // Should not be able to create more reports
      const canCreateMore = await rbacPermissionGate.checkAccess(
        demoAtLimit,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 5 }
      );
      expect(canCreateMore).toBe(false);

      // Should still be able to view own reports
      const canViewOwn = await rbacPermissionGate.checkAccess(
        demoAtLimit,
        ResourceType.REPORTS,
        ActionType.VIEW,
        { isOwnReport: true }
      );
      expect(canViewOwn).toBe(true);
    });
  });

  describe("System Configuration and Prompt Management", () => {
    it("should enforce system configuration access", async () => {
      const testCases = [
        {
          user: testUsers["integration-developer"],
          canEdit: true,
          canView: true,
        },
        {
          user: testUsers["integration-admin"],
          canEdit: false,
          canView: false,
        },
        {
          user: testUsers["integration-org-admin-full"],
          canEdit: false,
          canView: false,
        },
        {
          user: testUsers["integration-customer-full-1"],
          canEdit: false,
          canView: false,
        },
        {
          user: testUsers["integration-demo-new"],
          canEdit: false,
          canView: false,
        },
      ];

      for (const testCase of testCases) {
        const canEditConfig = await rbacPermissionGate.checkAccess(
          testCase.user,
          ResourceType.SYSTEM_CONFIG,
          ActionType.EDIT
        );
        expect(canEditConfig).toBe(testCase.canEdit);

        const canViewConfig = await rbacPermissionGate.checkAccess(
          testCase.user,
          ResourceType.SYSTEM_CONFIG,
          ActionType.VIEW
        );
        expect(canViewConfig).toBe(testCase.canView);
      }
    });

    it("should enforce prompt editing permissions", async () => {
      const testCases = [
        { user: testUsers["integration-developer"], canEdit: true },
        { user: testUsers["integration-admin"], canEdit: false },
        { user: testUsers["integration-org-admin-full"], canEdit: false },
        { user: testUsers["integration-customer-full-1"], canEdit: false },
        { user: testUsers["integration-demo-new"], canEdit: false },
      ];

      for (const testCase of testCases) {
        const canEditPrompts = await rbacPermissionGate.checkAccess(
          testCase.user,
          ResourceType.PROMPTS,
          ActionType.EDIT
        );
        expect(canEditPrompts).toBe(testCase.canEdit);
      }
    });
  });

  describe("Inactive Organization Handling", () => {
    it("should handle users in inactive organizations", async () => {
      // Verify inactive organization exists
      const [inactiveOrg] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, "integration-org-inactive"))
        .limit(1);

      expect(inactiveOrg).toBeDefined();
      expect(inactiveOrg.isActive).toBe(false);

      // Note: Business logic for handling inactive organizations would be
      // implemented at the application layer, not in the permission system
      // The permission system should still function normally for these users
    });

    it("should maintain data integrity for inactive organizations", async () => {
      const inactiveOrgCases = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, "integration-inactive-customer"));

      expect(inactiveOrgCases.length).toBe(1);
      expect(inactiveOrgCases[0].customerId).toBe(
        "integration-inactive-customer"
      );
    });
  });

  describe("Performance and Error Handling", () => {
    it("should handle permission checks efficiently", async () => {
      const user = testUsers["integration-developer"];

      // Perform multiple permission checks and measure performance
      const startTime = Date.now();

      const checks = await Promise.all([
        rbacPermissionGate.checkAccess(
          user,
          ResourceType.MODULES,
          ActionType.SWITCH
        ),
        rbacPermissionGate.checkAccess(
          user,
          ResourceType.ADMIN,
          ActionType.VIEW
        ),
        rbacPermissionGate.checkAccess(
          user,
          ResourceType.PROMPTS,
          ActionType.EDIT
        ),
        rbacPermissionGate.checkAccess(
          user,
          ResourceType.USERS,
          ActionType.MANAGE
        ),
        rbacPermissionGate.checkAccess(
          user,
          ResourceType.REPORTS,
          ActionType.CREATE
        ),
        rbacPermissionGate.checkAccess(
          user,
          ResourceType.SYSTEM_CONFIG,
          ActionType.EDIT
        ),
        rbacPermissionGate.checkAccess(
          user,
          ResourceType.DATABASE,
          ActionType.EDIT
        ),
      ]);

      const endTime = Date.now();

      // All checks should complete quickly (< 50ms)
      expect(endTime - startTime).toBeLessThan(50);

      // All checks should return true for developer
      checks.forEach((result) => expect(result).toBe(true));
    });

    it("should handle invalid user gracefully", async () => {
      const invalidUser = null as any;

      const hasAccess = await rbacPermissionGate.checkAccess(
        invalidUser,
        ResourceType.ADMIN,
        ActionType.VIEW
      );

      expect(hasAccess).toBe(false);
    });

    it("should handle invalid resource/action combinations", async () => {
      const user = testUsers["integration-developer"];

      const hasAccess = await rbacPermissionGate.checkAccess(
        user,
        "invalid-resource" as any,
        "invalid-action" as any
      );

      expect(hasAccess).toBe(false);
    });
  });
});
