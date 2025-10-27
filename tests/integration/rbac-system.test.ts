/**
 * Integration tests for RBAC system
 * Tests complete authentication flow, role assignment, and permissions
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
import { eq } from "drizzle-orm";
import { rbacPermissionGate } from "../../apps/server/permissions/rbac-permission-gate";
import { ResourceType, ActionType } from "../../apps/server/permissions/types";
import bcrypt from "bcryptjs";

// Test user data
const testUsers = [
  {
    username: "test-integration-developer",
    email: "integration-developer@test.com",
    password: "TestPassword123!",
    role: UserRole.DEVELOPER,
    assignedModules: [
      ModuleType.K12,
      ModuleType.POST_SECONDARY,
      ModuleType.TUTORING,
    ],
    maxReports: -1,
    reportCount: 0,
  },
  {
    username: "test-integration-admin",
    email: "integration-admin@test.com",
    password: "TestPassword123!",
    role: UserRole.ADMIN,
    assignedModules: [
      ModuleType.K12,
      ModuleType.POST_SECONDARY,
      ModuleType.TUTORING,
    ],
    maxReports: -1,
    reportCount: 0,
  },
  {
    username: "test-integration-org-admin",
    email: "integration-org-admin@test.com",
    password: "TestPassword123!",
    role: UserRole.ORG_ADMIN,
    assignedModules: [ModuleType.POST_SECONDARY],
    organizationId: "test-integration-org",
    maxReports: -1,
    reportCount: 0,
  },
  {
    username: "test-integration-customer",
    email: "integration-customer@test.com",
    password: "TestPassword123!",
    role: UserRole.CUSTOMER,
    assignedModules: [ModuleType.POST_SECONDARY],
    organizationId: "test-integration-org",
    maxReports: -1,
    reportCount: 0,
  },
  {
    username: "test-integration-demo",
    email: "integration-demo@test.com",
    password: "TestPassword123!",
    role: UserRole.DEMO,
    assignedModules: [ModuleType.POST_SECONDARY],
    maxReports: 5,
    reportCount: 3,
  },
];

const testOrganization = {
  id: "test-integration-org",
  name: "Integration Test Organization",
  customerId: "integration-test-customer",
  assignedModules: [ModuleType.POST_SECONDARY],
  maxUsers: 10,
  isActive: true,
};

describe("RBAC System Integration Tests", () => {
  let createdUserIds: number[] = [];

  beforeAll(async () => {
    // Create test organization
    await db.insert(organizations).values(testOrganization);

    // Create test users
    for (const userData of testUsers) {
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
            ? testOrganization.customerId
            : "system",
          maxReports: userData.maxReports,
          reportCount: userData.reportCount,
          isActive: true,
        })
        .returning({ id: users.id });

      createdUserIds.push(user.id);
    }
  });

  afterAll(async () => {
    // Cleanup test data
    for (const userId of createdUserIds) {
      await db.delete(users).where(eq(users.id, userId));
    }
    await db
      .delete(organizations)
      .where(eq(organizations.id, testOrganization.id));
  });

  describe("Authentication and Role Assignment", () => {
    it("should authenticate users and assign correct roles", async () => {
      for (const userData of testUsers) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, userData.username))
          .limit(1);

        expect(user).toBeDefined();
        expect(user.role).toBe(userData.role);
        expect(user.assignedModules).toEqual(userData.assignedModules);
        expect(user.maxReports).toBe(userData.maxReports);
        expect(user.reportCount).toBe(userData.reportCount);
      }
    });

    it("should properly hash passwords", async () => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-developer"))
        .limit(1);

      expect(user.password).not.toBe("TestPassword123!");
      const isValidPassword = await bcrypt.compare(
        "TestPassword123!",
        user.password
      );
      expect(isValidPassword).toBe(true);
    });
  });

  describe("Module Access Control", () => {
    it("should allow Developer and Admin to switch between all modules", async () => {
      const developerUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-developer"))
        .limit(1);

      const adminUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-admin"))
        .limit(1);

      // Test Developer permissions
      const devCanSwitch = await rbacPermissionGate.checkAccess(
        developerUser[0] as Express.User,
        ResourceType.MODULES,
        ActionType.SWITCH
      );
      expect(devCanSwitch).toBe(true);

      // Test Admin permissions
      const adminCanSwitch = await rbacPermissionGate.checkAccess(
        adminUser[0] as Express.User,
        ResourceType.MODULES,
        ActionType.SWITCH
      );
      expect(adminCanSwitch).toBe(true);
    });

    it("should restrict Org Admin, Customer, and Demo users to assigned modules", async () => {
      const orgAdminUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-org-admin"))
        .limit(1);

      const customerUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-customer"))
        .limit(1);

      const demoUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-demo"))
        .limit(1);

      // None of these users should be able to switch modules
      const orgAdminCanSwitch = await rbacPermissionGate.checkAccess(
        orgAdminUser[0] as Express.User,
        ResourceType.MODULES,
        ActionType.SWITCH
      );
      expect(orgAdminCanSwitch).toBe(false);

      const customerCanSwitch = await rbacPermissionGate.checkAccess(
        customerUser[0] as Express.User,
        ResourceType.MODULES,
        ActionType.SWITCH
      );
      expect(customerCanSwitch).toBe(false);

      const demoCanSwitch = await rbacPermissionGate.checkAccess(
        demoUser[0] as Express.User,
        ResourceType.MODULES,
        ActionType.SWITCH
      );
      expect(demoCanSwitch).toBe(false);
    });
  });

  describe("Admin Dashboard Access", () => {
    it("should allow Developer and Admin to access admin dashboard", async () => {
      const developerUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-developer"))
        .limit(1);

      const adminUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-admin"))
        .limit(1);

      const devCanAccessAdmin = await rbacPermissionGate.checkAccess(
        developerUser[0] as Express.User,
        ResourceType.ADMIN,
        ActionType.VIEW
      );
      expect(devCanAccessAdmin).toBe(true);

      const adminCanAccessAdmin = await rbacPermissionGate.checkAccess(
        adminUser[0] as Express.User,
        ResourceType.ADMIN,
        ActionType.VIEW
      );
      expect(adminCanAccessAdmin).toBe(true);
    });

    it("should deny admin dashboard access to Org Admin, Customer, and Demo users", async () => {
      const orgAdminUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-org-admin"))
        .limit(1);

      const customerUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-customer"))
        .limit(1);

      const demoUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-demo"))
        .limit(1);

      const orgAdminCanAccessAdmin = await rbacPermissionGate.checkAccess(
        orgAdminUser[0] as Express.User,
        ResourceType.ADMIN,
        ActionType.VIEW
      );
      expect(orgAdminCanAccessAdmin).toBe(false);

      const customerCanAccessAdmin = await rbacPermissionGate.checkAccess(
        customerUser[0] as Express.User,
        ResourceType.ADMIN,
        ActionType.VIEW
      );
      expect(customerCanAccessAdmin).toBe(false);

      const demoCanAccessAdmin = await rbacPermissionGate.checkAccess(
        demoUser[0] as Express.User,
        ResourceType.ADMIN,
        ActionType.VIEW
      );
      expect(demoCanAccessAdmin).toBe(false);
    });
  });

  describe("Prompt Editing Permissions", () => {
    it("should allow only Developer to edit prompts", async () => {
      const developerUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-developer"))
        .limit(1);

      const adminUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-admin"))
        .limit(1);

      const devCanEditPrompts = await rbacPermissionGate.checkAccess(
        developerUser[0] as Express.User,
        ResourceType.PROMPTS,
        ActionType.EDIT
      );
      expect(devCanEditPrompts).toBe(true);

      const adminCanEditPrompts = await rbacPermissionGate.checkAccess(
        adminUser[0] as Express.User,
        ResourceType.PROMPTS,
        ActionType.EDIT
      );
      expect(adminCanEditPrompts).toBe(false);
    });
  });

  describe("User Management Permissions", () => {
    it("should allow Developer and Admin to manage all users", async () => {
      const developerUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-developer"))
        .limit(1);

      const adminUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-admin"))
        .limit(1);

      const devCanManageUsers = await rbacPermissionGate.checkAccess(
        developerUser[0] as Express.User,
        ResourceType.USERS,
        ActionType.MANAGE
      );
      expect(devCanManageUsers).toBe(true);

      const adminCanManageUsers = await rbacPermissionGate.checkAccess(
        adminUser[0] as Express.User,
        ResourceType.USERS,
        ActionType.MANAGE
      );
      expect(adminCanManageUsers).toBe(true);
    });

    it("should allow Org Admin to manage users within their organization", async () => {
      const orgAdminUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-org-admin"))
        .limit(1);

      const orgAdminCanManageUsers = await rbacPermissionGate.checkAccess(
        orgAdminUser[0] as Express.User,
        ResourceType.USERS,
        ActionType.MANAGE
      );
      expect(orgAdminCanManageUsers).toBe(true);
    });

    it("should deny user management to Customer and Demo users", async () => {
      const customerUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-customer"))
        .limit(1);

      const demoUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-demo"))
        .limit(1);

      const customerCanManageUsers = await rbacPermissionGate.checkAccess(
        customerUser[0] as Express.User,
        ResourceType.USERS,
        ActionType.MANAGE
      );
      expect(customerCanManageUsers).toBe(false);

      const demoCanManageUsers = await rbacPermissionGate.checkAccess(
        demoUser[0] as Express.User,
        ResourceType.USERS,
        ActionType.MANAGE
      );
      expect(demoCanManageUsers).toBe(false);
    });
  });

  describe("Report Creation and Limits", () => {
    it("should allow unlimited report creation for non-demo users", async () => {
      const developerUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-developer"))
        .limit(1);

      const customerUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-customer"))
        .limit(1);

      const devCanCreateReports = await rbacPermissionGate.checkAccess(
        developerUser[0] as Express.User,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 100 } // High count to test unlimited
      );
      expect(devCanCreateReports).toBe(true);

      const customerCanCreateReports = await rbacPermissionGate.checkAccess(
        customerUser[0] as Express.User,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 50 } // High count to test unlimited
      );
      expect(customerCanCreateReports).toBe(true);
    });

    it("should enforce report limits for demo users", async () => {
      const demoUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-demo"))
        .limit(1);

      // Demo user with 3 reports should be able to create more
      const demoCanCreateMore = await rbacPermissionGate.checkAccess(
        demoUser[0] as Express.User,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 3 }
      );
      expect(demoCanCreateMore).toBe(true);

      // Demo user at limit should not be able to create more
      const demoAtLimit = await rbacPermissionGate.checkAccess(
        demoUser[0] as Express.User,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 5 }
      );
      expect(demoAtLimit).toBe(false);
    });
  });

  describe("Organization-based Data Isolation", () => {
    it("should properly assign users to organizations", async () => {
      const orgAdminUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-org-admin"))
        .limit(1);

      const customerUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-customer"))
        .limit(1);

      expect(orgAdminUser[0].organizationId).toBe("test-integration-org");
      expect(customerUser[0].organizationId).toBe("test-integration-org");
      expect(orgAdminUser[0].customerId).toBe(testOrganization.customerId);
      expect(customerUser[0].customerId).toBe(testOrganization.customerId);
    });

    it("should isolate users without organization assignments", async () => {
      const developerUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-developer"))
        .limit(1);

      const demoUser = await db
        .select()
        .from(users)
        .where(eq(users.username, "test-integration-demo"))
        .limit(1);

      expect(developerUser[0].organizationId).toBeNull();
      expect(demoUser[0].organizationId).toBeNull();
    });
  });

  describe("Permission Summary Validation", () => {
    it("should return correct permission summary for each role", async () => {
      // Test Developer permissions
      const devPermissions = rbacPermissionGate.getUserPermissions(
        UserRole.DEVELOPER,
        [ModuleType.K12, ModuleType.POST_SECONDARY, ModuleType.TUTORING],
        -1
      );
      expect(devPermissions.canSwitchModules).toBe(true);
      expect(devPermissions.canAccessAdminDashboard).toBe(true);
      expect(devPermissions.canEditPrompts).toBe(true);
      expect(devPermissions.canViewAllReports).toBe(true);
      expect(devPermissions.canManageUsers).toBe(true);
      expect(devPermissions.canEditSystemConfig).toBe(true);
      expect(devPermissions.reportLimit).toBeNull();

      // Test Admin permissions
      const adminPermissions = rbacPermissionGate.getUserPermissions(
        UserRole.ADMIN,
        [ModuleType.K12, ModuleType.POST_SECONDARY, ModuleType.TUTORING],
        -1
      );
      expect(adminPermissions.canSwitchModules).toBe(true);
      expect(adminPermissions.canAccessAdminDashboard).toBe(true);
      expect(adminPermissions.canEditPrompts).toBe(false);
      expect(adminPermissions.canViewAllReports).toBe(true);
      expect(adminPermissions.canManageUsers).toBe(true);
      expect(adminPermissions.canEditSystemConfig).toBe(false);

      // Test Demo permissions
      const demoPermissions = rbacPermissionGate.getUserPermissions(
        UserRole.DEMO,
        [ModuleType.POST_SECONDARY],
        5
      );
      expect(demoPermissions.canSwitchModules).toBe(false);
      expect(demoPermissions.canAccessAdminDashboard).toBe(false);
      expect(demoPermissions.canEditPrompts).toBe(false);
      expect(demoPermissions.canViewAllReports).toBe(false);
      expect(demoPermissions.canManageUsers).toBe(false);
      expect(demoPermissions.canEditSystemConfig).toBe(false);
      expect(demoPermissions.reportLimit).toBe(5);
    });
  });
});
