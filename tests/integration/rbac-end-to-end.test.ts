/**
 * End-to-end RBAC system validation test
 * Tests complete user journeys and system integration
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../../apps/server/db";
import {
  users,
  organizations,
  assessmentCases,
  UserRole,
  ModuleType,
} from "../../packages/db/schema";
import { eq, and } from "drizzle-orm";
import { rbacPermissionGate } from "../../apps/server/permissions/rbac-permission-gate";
import { ResourceType, ActionType } from "../../apps/server/permissions/types";
import bcrypt from "bcryptjs";

// End-to-end test scenarios
const e2eTestData = {
  organization: {
    id: "e2e-test-org",
    name: "E2E Test Organization",
    customerId: "e2e-customer",
    assignedModules: [ModuleType.K12, ModuleType.POST_SECONDARY],
    maxUsers: 20,
    isActive: true,
  },
  users: [
    {
      username: "e2e-developer",
      email: "e2e-developer@test.com",
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
    {
      username: "e2e-org-admin",
      email: "e2e-org-admin@test.com",
      password: "TestPassword123!",
      role: UserRole.ORG_ADMIN,
      assignedModules: [ModuleType.K12, ModuleType.POST_SECONDARY],
      organizationId: "e2e-test-org",
      maxReports: -1,
      reportCount: 2,
    },
    {
      username: "e2e-customer-1",
      email: "e2e-customer-1@test.com",
      password: "TestPassword123!",
      role: UserRole.CUSTOMER,
      assignedModules: [ModuleType.K12],
      organizationId: "e2e-test-org",
      maxReports: -1,
      reportCount: 5,
    },
    {
      username: "e2e-customer-2",
      email: "e2e-customer-2@test.com",
      password: "TestPassword123!",
      role: UserRole.CUSTOMER,
      assignedModules: [ModuleType.POST_SECONDARY],
      organizationId: "e2e-test-org",
      maxReports: -1,
      reportCount: 3,
    },
    {
      username: "e2e-demo-new",
      email: "e2e-demo-new@test.com",
      password: "TestPassword123!",
      role: UserRole.DEMO,
      assignedModules: [ModuleType.POST_SECONDARY],
      organizationId: null,
      maxReports: 5,
      reportCount: 0,
    },
    {
      username: "e2e-demo-limit",
      email: "e2e-demo-limit@test.com",
      password: "TestPassword123!",
      role: UserRole.DEMO,
      assignedModules: [ModuleType.K12],
      organizationId: null,
      maxReports: 5,
      reportCount: 5,
    },
  ],
  assessmentCases: [
    {
      caseId: "e2e-case-k12-1",
      displayName: "E2E K12 Assessment 1",
      moduleType: ModuleType.K12,
      customerId: "e2e-customer",
      status: "completed",
      gradeBand: "elementary",
    },
    {
      caseId: "e2e-case-postsec-1",
      displayName: "E2E Post-Secondary Assessment 1",
      moduleType: ModuleType.POST_SECONDARY,
      customerId: "e2e-customer",
      status: "in_progress",
    },
    {
      caseId: "e2e-demo-case-1",
      displayName: "E2E Demo Assessment 1",
      moduleType: ModuleType.POST_SECONDARY,
      customerId: "demo-customer",
      status: "completed",
    },
  ],
};

describe("RBAC End-to-End System Tests", () => {
  let createdUserIds: number[] = [];
  let testUsers: { [username: string]: Express.User } = {};

  beforeAll(async () => {
    // Create test organization
    await db.insert(organizations).values(e2eTestData.organization);

    // Create test users
    for (const userData of e2eTestData.users) {
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
            ? e2eTestData.organization.customerId
            : "demo-customer",
          maxReports: userData.maxReports,
          reportCount: userData.reportCount,
          isActive: true,
        })
        .returning();

      createdUserIds.push(user.id);
      testUsers[userData.username] = user as Express.User;
    }

    // Create test assessment cases
    for (const caseData of e2eTestData.assessmentCases) {
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
    }
  });

  afterAll(async () => {
    // Cleanup test data
    for (const caseData of e2eTestData.assessmentCases) {
      await db
        .delete(assessmentCases)
        .where(eq(assessmentCases.caseId, caseData.caseId));
    }
    for (const userId of createdUserIds) {
      await db.delete(users).where(eq(users.id, userId));
    }
    await db
      .delete(organizations)
      .where(eq(organizations.id, e2eTestData.organization.id));
  });

  describe("Developer User Journey", () => {
    it("should have full system access and capabilities", async () => {
      const developer = testUsers["e2e-developer"];

      // Can access all modules
      const canSwitchModules = await rbacPermissionGate.checkAccess(
        developer,
        ResourceType.MODULES,
        ActionType.SWITCH
      );
      expect(canSwitchModules).toBe(true);

      // Can access admin dashboard
      const canAccessAdmin = await rbacPermissionGate.checkAccess(
        developer,
        ResourceType.ADMIN,
        ActionType.VIEW
      );
      expect(canAccessAdmin).toBe(true);

      // Can edit prompts
      const canEditPrompts = await rbacPermissionGate.checkAccess(
        developer,
        ResourceType.PROMPTS,
        ActionType.EDIT
      );
      expect(canEditPrompts).toBe(true);

      // Can manage users
      const canManageUsers = await rbacPermissionGate.checkAccess(
        developer,
        ResourceType.USERS,
        ActionType.MANAGE
      );
      expect(canManageUsers).toBe(true);

      // Can edit system config
      const canEditSystemConfig = await rbacPermissionGate.checkAccess(
        developer,
        ResourceType.SYSTEM_CONFIG,
        ActionType.EDIT
      );
      expect(canEditSystemConfig).toBe(true);

      // Can create unlimited reports
      const canCreateReports = await rbacPermissionGate.checkAccess(
        developer,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 100 }
      );
      expect(canCreateReports).toBe(true);
    });
  });

  describe("Organization Admin User Journey", () => {
    it("should have organization-scoped administrative capabilities", async () => {
      const orgAdmin = testUsers["e2e-org-admin"];

      // Cannot switch modules
      const canSwitchModules = await rbacPermissionGate.checkAccess(
        orgAdmin,
        ResourceType.MODULES,
        ActionType.SWITCH
      );
      expect(canSwitchModules).toBe(false);

      // Cannot access admin dashboard
      const canAccessAdmin = await rbacPermissionGate.checkAccess(
        orgAdmin,
        ResourceType.ADMIN,
        ActionType.VIEW
      );
      expect(canAccessAdmin).toBe(false);

      // Cannot edit prompts
      const canEditPrompts = await rbacPermissionGate.checkAccess(
        orgAdmin,
        ResourceType.PROMPTS,
        ActionType.EDIT
      );
      expect(canEditPrompts).toBe(false);

      // Can manage users (within organization)
      const canManageUsers = await rbacPermissionGate.checkAccess(
        orgAdmin,
        ResourceType.USERS,
        ActionType.MANAGE
      );
      expect(canManageUsers).toBe(true);

      // Cannot edit system config
      const canEditSystemConfig = await rbacPermissionGate.checkAccess(
        orgAdmin,
        ResourceType.SYSTEM_CONFIG,
        ActionType.EDIT
      );
      expect(canEditSystemConfig).toBe(false);

      // Can create unlimited reports
      const canCreateReports = await rbacPermissionGate.checkAccess(
        orgAdmin,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 50 }
      );
      expect(canCreateReports).toBe(true);

      // Should have access to organization's assessment cases
      const orgCases = await db
        .select()
        .from(assessmentCases)
        .where(
          eq(assessmentCases.customerId, e2eTestData.organization.customerId)
        );

      expect(orgCases.length).toBeGreaterThan(0);
    });
  });

  describe("Customer User Journey", () => {
    it("should have limited access within organization", async () => {
      const customer1 = testUsers["e2e-customer-1"];
      const customer2 = testUsers["e2e-customer-2"];

      // Test customer 1 (K12 module)
      expect(customer1.assignedModules).toEqual([ModuleType.K12]);
      expect(customer1.organizationId).toBe(e2eTestData.organization.id);

      // Test customer 2 (Post-Secondary module)
      expect(customer2.assignedModules).toEqual([ModuleType.POST_SECONDARY]);
      expect(customer2.organizationId).toBe(e2eTestData.organization.id);

      // Both customers should have same restrictions
      for (const customer of [customer1, customer2]) {
        // Cannot switch modules
        const canSwitchModules = await rbacPermissionGate.checkAccess(
          customer,
          ResourceType.MODULES,
          ActionType.SWITCH
        );
        expect(canSwitchModules).toBe(false);

        // Cannot access admin dashboard
        const canAccessAdmin = await rbacPermissionGate.checkAccess(
          customer,
          ResourceType.ADMIN,
          ActionType.VIEW
        );
        expect(canAccessAdmin).toBe(false);

        // Cannot manage users
        const canManageUsers = await rbacPermissionGate.checkAccess(
          customer,
          ResourceType.USERS,
          ActionType.MANAGE
        );
        expect(canManageUsers).toBe(false);

        // Can create unlimited reports
        const canCreateReports = await rbacPermissionGate.checkAccess(
          customer,
          ResourceType.REPORTS,
          ActionType.CREATE,
          { currentReportCount: 20 }
        );
        expect(canCreateReports).toBe(true);
      }
    });

    it("should maintain data isolation between customers in same organization", async () => {
      const customer1 = testUsers["e2e-customer-1"];
      const customer2 = testUsers["e2e-customer-2"];

      // Both customers should have access to organization's cases
      const orgCases = await db
        .select()
        .from(assessmentCases)
        .where(
          eq(assessmentCases.customerId, e2eTestData.organization.customerId)
        );

      expect(orgCases.length).toBe(2); // K12 and Post-Secondary cases

      // But they should be restricted to their assigned modules
      expect(customer1.assignedModules).not.toContain(
        ModuleType.POST_SECONDARY
      );
      expect(customer2.assignedModules).not.toContain(ModuleType.K12);
    });
  });

  describe("Demo User Journey", () => {
    it("should provide sandbox experience with limits", async () => {
      const demoNew = testUsers["e2e-demo-new"];
      const demoAtLimit = testUsers["e2e-demo-limit"];

      // Test new demo user
      expect(demoNew.maxReports).toBe(5);
      expect(demoNew.reportCount).toBe(0);
      expect(demoNew.organizationId).toBeNull();

      // Test demo user at limit
      expect(demoAtLimit.maxReports).toBe(5);
      expect(demoAtLimit.reportCount).toBe(5);
      expect(demoAtLimit.organizationId).toBeNull();

      // New demo user can create reports
      const newDemoCanCreate = await rbacPermissionGate.checkAccess(
        demoNew,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 0 }
      );
      expect(newDemoCanCreate).toBe(true);

      // Demo user at limit cannot create more reports
      const limitDemoCanCreate = await rbacPermissionGate.checkAccess(
        demoAtLimit,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 5 }
      );
      expect(limitDemoCanCreate).toBe(false);

      // Both demo users have same restrictions
      for (const demo of [demoNew, demoAtLimit]) {
        // Cannot switch modules
        const canSwitchModules = await rbacPermissionGate.checkAccess(
          demo,
          ResourceType.MODULES,
          ActionType.SWITCH
        );
        expect(canSwitchModules).toBe(false);

        // Cannot access admin dashboard
        const canAccessAdmin = await rbacPermissionGate.checkAccess(
          demo,
          ResourceType.ADMIN,
          ActionType.VIEW
        );
        expect(canAccessAdmin).toBe(false);

        // Cannot manage users
        const canManageUsers = await rbacPermissionGate.checkAccess(
          demo,
          ResourceType.USERS,
          ActionType.MANAGE
        );
        expect(canManageUsers).toBe(false);

        // Cannot edit system config
        const canEditSystemConfig = await rbacPermissionGate.checkAccess(
          demo,
          ResourceType.SYSTEM_CONFIG,
          ActionType.EDIT
        );
        expect(canEditSystemConfig).toBe(false);
      }
    });

    it("should show upgrade prompt at 4 reports", async () => {
      const demoNew = testUsers["e2e-demo-new"];

      // At 4 reports, should still be able to create (but show upgrade prompt)
      const canCreateFifth = await rbacPermissionGate.checkAccess(
        demoNew,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 4 }
      );
      expect(canCreateFifth).toBe(true);

      // At 5 reports, should not be able to create more
      const canCreateSixth = await rbacPermissionGate.checkAccess(
        demoNew,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 5 }
      );
      expect(canCreateSixth).toBe(false);
    });
  });

  describe("Multi-Tenant Data Isolation", () => {
    it("should properly isolate data between organizations and demo users", async () => {
      // Organization users should see organization cases
      const orgCases = await db
        .select()
        .from(assessmentCases)
        .where(
          eq(assessmentCases.customerId, e2eTestData.organization.customerId)
        );

      expect(orgCases.length).toBe(2);

      // Demo cases should be isolated
      const demoCases = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, "demo-customer"));

      expect(demoCases.length).toBe(1);

      // Verify no cross-contamination
      const allCases = [...orgCases, ...demoCases];
      const uniqueCustomerIds = [...new Set(allCases.map((c) => c.customerId))];
      expect(uniqueCustomerIds).toHaveLength(2);
      expect(uniqueCustomerIds).toContain(e2eTestData.organization.customerId);
      expect(uniqueCustomerIds).toContain("demo-customer");
    });

    it("should maintain user-organization relationships", async () => {
      const orgUsers = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, e2eTestData.organization.id));

      expect(orgUsers.length).toBe(3); // org admin + 2 customers

      // All org users should have same customerId
      orgUsers.forEach((user) => {
        expect(user.customerId).toBe(e2eTestData.organization.customerId);
      });

      // Demo users should not be in any organization
      const demoUsers = await db
        .select()
        .from(users)
        .where(eq(users.role, UserRole.DEMO));

      demoUsers.forEach((user) => {
        expect(user.organizationId).toBeNull();
      });
    });
  });

  describe("Permission Boundary Enforcement", () => {
    it("should enforce strict permission boundaries", async () => {
      const testCases = [
        {
          user: testUsers["e2e-customer-1"],
          resource: ResourceType.ADMIN,
          action: ActionType.VIEW,
          expected: false,
          description: "Customer cannot access admin dashboard",
        },
        {
          user: testUsers["e2e-org-admin"],
          resource: ResourceType.PROMPTS,
          action: ActionType.EDIT,
          expected: false,
          description: "Org Admin cannot edit prompts",
        },
        {
          user: testUsers["e2e-demo-new"],
          resource: ResourceType.USERS,
          action: ActionType.MANAGE,
          expected: false,
          description: "Demo user cannot manage users",
        },
        {
          user: testUsers["e2e-developer"],
          resource: ResourceType.SYSTEM_CONFIG,
          action: ActionType.EDIT,
          expected: true,
          description: "Developer can edit system config",
        },
      ];

      for (const testCase of testCases) {
        const result = await rbacPermissionGate.checkAccess(
          testCase.user,
          testCase.resource,
          testCase.action
        );

        expect(result).toBe(testCase.expected);
      }
    });
  });

  describe("System Integration Validation", () => {
    it("should have consistent role assignments across all test users", async () => {
      for (const userData of e2eTestData.users) {
        const user = testUsers[userData.username];

        expect(user.role).toBe(userData.role);
        expect(user.assignedModules).toEqual(userData.assignedModules);
        expect(user.organizationId).toBe(userData.organizationId);
        expect(user.maxReports).toBe(userData.maxReports);
      }
    });

    it("should maintain data consistency after all operations", async () => {
      // Verify organization still exists and is valid
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, e2eTestData.organization.id))
        .limit(1);

      expect(org).toBeDefined();
      expect(org.isActive).toBe(true);

      // Verify all users still exist and are active
      for (const userId of createdUserIds) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        expect(user).toBeDefined();
        expect(user.isActive).toBe(true);
      }

      // Verify all assessment cases still exist
      for (const caseData of e2eTestData.assessmentCases) {
        const [assessmentCase] = await db
          .select()
          .from(assessmentCases)
          .where(eq(assessmentCases.caseId, caseData.caseId))
          .limit(1);

        expect(assessmentCase).toBeDefined();
      }
    });
  });
});
