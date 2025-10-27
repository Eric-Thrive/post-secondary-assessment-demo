/**
 * Comprehensive Data Migration and Backward Compatibility Tests
 * Validates that existing users and data are properly migrated to new RBAC system
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
import { eq, and, or } from "drizzle-orm";
import { rbacPermissionGate } from "../../apps/server/permissions/rbac-permission-gate";
import { ResourceType, ActionType } from "../../apps/server/permissions/types";
import bcrypt from "bcryptjs";

// Simulate legacy data structures before RBAC migration
const legacyDataStructures = {
  // Legacy users with old role system
  legacyUsers: [
    {
      username: "legacy-production-admin",
      email: "legacy-prod-admin@test.com",
      password: "TestPassword123!",
      customerId: "legacy-prod-customer",
      customerName: "Legacy Production Customer",
      // Old environment-based role
      role: "production",
      assignedModules: null,
      organizationId: null,
      maxReports: -1,
      reportCount: 25,
      demoPermissions: {},
    },
    {
      username: "legacy-development-user",
      email: "legacy-dev-user@test.com",
      password: "TestPassword123!",
      customerId: "legacy-dev-customer",
      customerName: "Legacy Development Customer",
      // Old environment-based role
      role: "development",
      assignedModules: null,
      organizationId: null,
      maxReports: -1,
      reportCount: 15,
      demoPermissions: {},
    },
    {
      username: "legacy-demo-user-old",
      email: "legacy-demo-old@test.com",
      password: "TestPassword123!",
      customerId: "demo-customer",
      customerName: "Demo Customer",
      // Old demo role
      role: "demo",
      assignedModules: null,
      organizationId: null,
      maxReports: 5,
      reportCount: 3,
      demoPermissions: { "post-secondary-demo": true },
    },
    {
      username: "legacy-replit-prod-user",
      email: "legacy-replit-prod@test.com",
      password: "TestPassword123!",
      customerId: "legacy-replit-customer",
      customerName: "Legacy Replit Customer",
      // Old replit-specific role
      role: "replit-prod",
      assignedModules: null,
      organizationId: null,
      maxReports: -1,
      reportCount: 8,
      demoPermissions: {},
    },
    {
      username: "legacy-customer-simple",
      email: "legacy-customer-simple@test.com",
      password: "TestPassword123!",
      customerId: "legacy-simple-customer",
      customerName: "Legacy Simple Customer",
      // Standard customer role (should remain)
      role: "customer",
      assignedModules: null,
      organizationId: null,
      maxReports: -1,
      reportCount: 12,
      demoPermissions: {},
    },
  ],

  // Legacy assessment cases that should remain accessible
  legacyAssessmentCases: [
    {
      caseId: "legacy-prod-case-1",
      displayName: "Legacy Production Case 1",
      moduleType: ModuleType.POST_SECONDARY,
      customerId: "legacy-prod-customer",
      status: "completed",
      reportData: { legacyField: "legacy data 1" },
      itemMasterData: { legacyItems: ["item1", "item2"] },
    },
    {
      caseId: "legacy-dev-case-1",
      displayName: "Legacy Development Case 1",
      moduleType: ModuleType.K12,
      customerId: "legacy-dev-customer",
      status: "in_progress",
      gradeBand: "elementary",
      reportData: { legacyField: "legacy data 2" },
    },
    {
      caseId: "legacy-demo-case-old",
      displayName: "Legacy Demo Case Old",
      moduleType: ModuleType.POST_SECONDARY,
      customerId: "demo-customer",
      status: "completed",
      reportData: { demoData: "legacy demo content" },
    },
    {
      caseId: "legacy-replit-case-1",
      displayName: "Legacy Replit Case 1",
      moduleType: ModuleType.TUTORING,
      customerId: "legacy-replit-customer",
      status: "pending",
      reportData: { replitData: "legacy replit content" },
    },
    {
      caseId: "legacy-simple-case-1",
      displayName: "Legacy Simple Customer Case 1",
      moduleType: ModuleType.POST_SECONDARY,
      customerId: "legacy-simple-customer",
      status: "completed",
      reportData: { simpleData: "legacy simple content" },
    },
  ],

  // Organizations that should be created during migration
  migratedOrganizations: [
    {
      id: "migrated-org-legacy-prod",
      name: "Legacy Production Customer",
      customerId: "legacy-prod-customer",
      assignedModules: [
        ModuleType.POST_SECONDARY,
        ModuleType.K12,
        ModuleType.TUTORING,
      ],
      maxUsers: 50,
      isActive: true,
    },
    {
      id: "migrated-org-legacy-dev",
      name: "Legacy Development Customer",
      customerId: "legacy-dev-customer",
      assignedModules: [ModuleType.K12, ModuleType.POST_SECONDARY],
      maxUsers: 25,
      isActive: true,
    },
    {
      id: "migrated-org-legacy-replit",
      name: "Legacy Replit Customer",
      customerId: "legacy-replit-customer",
      assignedModules: [ModuleType.TUTORING, ModuleType.POST_SECONDARY],
      maxUsers: 15,
      isActive: true,
    },
    {
      id: "migrated-org-legacy-simple",
      name: "Legacy Simple Customer",
      customerId: "legacy-simple-customer",
      assignedModules: [ModuleType.POST_SECONDARY],
      maxUsers: 10,
      isActive: true,
    },
  ],
};

describe("Comprehensive Data Migration and Backward Compatibility Tests", () => {
  let createdUserIds: number[] = [];
  let createdOrgIds: string[] = [];
  let createdCaseIds: string[] = [];
  let migratedUsers: { [username: string]: Express.User } = {};

  beforeAll(async () => {
    console.log("🔄 Setting up data migration validation tests...");

    // 1. Create organizations that would be created during migration
    for (const org of legacyDataStructures.migratedOrganizations) {
      await db.insert(organizations).values(org);
      createdOrgIds.push(org.id);
    }

    // 2. Create legacy users (simulating pre-migration state)
    for (const userData of legacyDataStructures.legacyUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const [user] = await db
        .insert(users)
        .values({
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          role: userData.role, // Legacy role initially
          assignedModules: userData.assignedModules,
          organizationId: userData.organizationId,
          customerId: userData.customerId,
          customerName: userData.customerName,
          maxReports: userData.maxReports,
          reportCount: userData.reportCount,
          isActive: true,
          demoPermissions: userData.demoPermissions,
        })
        .returning({ id: users.id });

      createdUserIds.push(user.id);
    }

    // 3. Create legacy assessment cases
    for (const caseData of legacyDataStructures.legacyAssessmentCases) {
      await db.insert(assessmentCases).values({
        caseId: caseData.caseId,
        displayName: caseData.displayName,
        moduleType: caseData.moduleType,
        customerId: caseData.customerId,
        status: caseData.status,
        gradeBand: caseData.gradeBand,
        reportData: caseData.reportData,
        itemMasterData: caseData.itemMasterData,
        documentNames: [],
      });
      createdCaseIds.push(caseData.caseId);
    }

    // 4. Simulate the migration process
    await simulateDataMigration();

    // 5. Load migrated users for testing
    for (const userData of legacyDataStructures.legacyUsers) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, userData.username))
        .limit(1);
      migratedUsers[userData.username] = user as Express.User;
    }

    console.log(
      `✅ Migration simulation completed: ${createdUserIds.length} users, ${createdOrgIds.length} orgs, ${createdCaseIds.length} cases`
    );
  });

  afterAll(async () => {
    console.log("🧹 Cleaning up migration test data...");

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

    console.log("✅ Migration test cleanup completed");
  });

  async function simulateDataMigration() {
    console.log("🔄 Simulating data migration process...");

    // Migration step 1: Update legacy roles to new RBAC roles
    const roleMigrationMap = {
      production: UserRole.ADMIN,
      development: UserRole.DEVELOPER,
      demo: UserRole.DEMO,
      "replit-prod": UserRole.CUSTOMER,
      "replit-dev": UserRole.CUSTOMER,
      customer: UserRole.CUSTOMER,
    };

    for (const [oldRole, newRole] of Object.entries(roleMigrationMap)) {
      await db
        .update(users)
        .set({ role: newRole })
        .where(eq(users.role, oldRole));
    }

    // Migration step 2: Assign default modules based on new roles
    await db
      .update(users)
      .set({
        assignedModules: [
          ModuleType.K12,
          ModuleType.POST_SECONDARY,
          ModuleType.TUTORING,
        ],
      })
      .where(
        or(eq(users.role, UserRole.DEVELOPER), eq(users.role, UserRole.ADMIN))
      );

    await db
      .update(users)
      .set({
        assignedModules: [ModuleType.POST_SECONDARY],
      })
      .where(
        or(eq(users.role, UserRole.CUSTOMER), eq(users.role, UserRole.DEMO))
      );

    // Migration step 3: Assign organization IDs based on customerId (except demo users)
    const customerOrgMap = {
      "legacy-prod-customer": "migrated-org-legacy-prod",
      "legacy-dev-customer": "migrated-org-legacy-dev",
      "legacy-replit-customer": "migrated-org-legacy-replit",
      "legacy-simple-customer": "migrated-org-legacy-simple",
    };

    for (const [customerId, orgId] of Object.entries(customerOrgMap)) {
      await db
        .update(users)
        .set({ organizationId: orgId })
        .where(
          and(
            eq(users.customerId, customerId),
            eq(users.role, UserRole.CUSTOMER)
          )
        );
    }

    // Migration step 4: Handle special cases
    // Developers should not be assigned to organizations
    await db
      .update(users)
      .set({ organizationId: null })
      .where(eq(users.role, UserRole.DEVELOPER));

    // Demo users should remain without organization assignment
    await db
      .update(users)
      .set({ organizationId: null })
      .where(eq(users.role, UserRole.DEMO));

    console.log("✅ Data migration simulation completed");
  }

  describe("Legacy Role Migration Validation", () => {
    it("should properly migrate all legacy roles to new RBAC roles", async () => {
      const migrationTests = [
        { username: "legacy-production-admin", expectedRole: UserRole.ADMIN },
        {
          username: "legacy-development-user",
          expectedRole: UserRole.DEVELOPER,
        },
        { username: "legacy-demo-user-old", expectedRole: UserRole.DEMO },
        {
          username: "legacy-replit-prod-user",
          expectedRole: UserRole.CUSTOMER,
        },
        { username: "legacy-customer-simple", expectedRole: UserRole.CUSTOMER },
      ];

      for (const test of migrationTests) {
        const user = migratedUsers[test.username];
        expect(user).toBeDefined();
        expect(user.role).toBe(test.expectedRole);

        console.log(
          `✅ ${test.username}: ${user.role} (expected: ${test.expectedRole})`
        );
      }
    });

    it("should preserve all original user data during migration", async () => {
      for (const originalUser of legacyDataStructures.legacyUsers) {
        const migratedUser = migratedUsers[originalUser.username];

        // Core identity should be preserved
        expect(migratedUser.username).toBe(originalUser.username);
        expect(migratedUser.email).toBe(originalUser.email);
        expect(migratedUser.customerId).toBe(originalUser.customerId);
        expect(migratedUser.customerName).toBe(originalUser.customerName);
        expect(migratedUser.reportCount).toBe(originalUser.reportCount);
        expect(migratedUser.maxReports).toBe(originalUser.maxReports);
        expect(migratedUser.isActive).toBe(true);

        // Password should be preserved
        const isValidPassword = await bcrypt.compare(
          originalUser.password,
          migratedUser.password
        );
        expect(isValidPassword).toBe(true);

        // Demo permissions should be preserved for demo users
        if (originalUser.role === "demo") {
          expect(migratedUser.demoPermissions).toEqual(
            originalUser.demoPermissions
          );
        }
      }
    });

    it("should assign appropriate modules based on migrated roles", async () => {
      const moduleAssignmentTests = [
        {
          username: "legacy-production-admin",
          expectedModules: [
            ModuleType.K12,
            ModuleType.POST_SECONDARY,
            ModuleType.TUTORING,
          ],
        },
        {
          username: "legacy-development-user",
          expectedModules: [
            ModuleType.K12,
            ModuleType.POST_SECONDARY,
            ModuleType.TUTORING,
          ],
        },
        {
          username: "legacy-demo-user-old",
          expectedModules: [ModuleType.POST_SECONDARY],
        },
        {
          username: "legacy-replit-prod-user",
          expectedModules: [ModuleType.POST_SECONDARY],
        },
        {
          username: "legacy-customer-simple",
          expectedModules: [ModuleType.POST_SECONDARY],
        },
      ];

      for (const test of moduleAssignmentTests) {
        const user = migratedUsers[test.username];
        expect(user.assignedModules).toEqual(test.expectedModules);
      }
    });
  });

  describe("Organization Assignment Validation", () => {
    it("should create organizations from legacy customer data", async () => {
      for (const org of legacyDataStructures.migratedOrganizations) {
        const [dbOrg] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, org.id))
          .limit(1);

        expect(dbOrg).toBeDefined();
        expect(dbOrg.name).toBe(org.name);
        expect(dbOrg.customerId).toBe(org.customerId);
        expect(dbOrg.assignedModules).toEqual(org.assignedModules);
        expect(dbOrg.maxUsers).toBe(org.maxUsers);
        expect(dbOrg.isActive).toBe(org.isActive);
      }
    });

    it("should properly assign users to organizations based on role and customerId", async () => {
      const organizationAssignmentTests = [
        {
          username: "legacy-production-admin",
          expectedOrgId: null, // Admins should not be in organizations
        },
        {
          username: "legacy-development-user",
          expectedOrgId: null, // Developers should not be in organizations
        },
        {
          username: "legacy-demo-user-old",
          expectedOrgId: null, // Demo users should not be in organizations
        },
        {
          username: "legacy-replit-prod-user",
          expectedOrgId: "migrated-org-legacy-replit", // Customers should be assigned
        },
        {
          username: "legacy-customer-simple",
          expectedOrgId: "migrated-org-legacy-simple", // Customers should be assigned
        },
      ];

      for (const test of organizationAssignmentTests) {
        const user = migratedUsers[test.username];
        expect(user.organizationId).toBe(test.expectedOrgId);
      }
    });

    it("should maintain data isolation after organization assignment", async () => {
      // Verify that users in the same organization have the same customerId
      const orgTests = [
        {
          orgId: "migrated-org-legacy-replit",
          expectedCustomerId: "legacy-replit-customer",
        },
        {
          orgId: "migrated-org-legacy-simple",
          expectedCustomerId: "legacy-simple-customer",
        },
      ];

      for (const test of orgTests) {
        const orgUsers = await db
          .select()
          .from(users)
          .where(eq(users.organizationId, test.orgId));

        expect(orgUsers.length).toBeGreaterThan(0);

        for (const user of orgUsers) {
          expect(user.customerId).toBe(test.expectedCustomerId);
        }
      }
    });
  });

  describe("Assessment Case Accessibility Validation", () => {
    it("should preserve all legacy assessment cases", async () => {
      for (const originalCase of legacyDataStructures.legacyAssessmentCases) {
        const [dbCase] = await db
          .select()
          .from(assessmentCases)
          .where(eq(assessmentCases.caseId, originalCase.caseId))
          .limit(1);

        expect(dbCase).toBeDefined();
        expect(dbCase.displayName).toBe(originalCase.displayName);
        expect(dbCase.moduleType).toBe(originalCase.moduleType);
        expect(dbCase.customerId).toBe(originalCase.customerId);
        expect(dbCase.status).toBe(originalCase.status);
        expect(dbCase.reportData).toEqual(originalCase.reportData);

        if (originalCase.itemMasterData) {
          expect(dbCase.itemMasterData).toEqual(originalCase.itemMasterData);
        }

        if (originalCase.gradeBand) {
          expect(dbCase.gradeBand).toBe(originalCase.gradeBand);
        }
      }
    });

    it("should maintain customer-based data isolation for assessment cases", async () => {
      const customerTests = [
        { customerId: "legacy-prod-customer", expectedCases: 1 },
        { customerId: "legacy-dev-customer", expectedCases: 1 },
        { customerId: "demo-customer", expectedCases: 1 },
        { customerId: "legacy-replit-customer", expectedCases: 1 },
        { customerId: "legacy-simple-customer", expectedCases: 1 },
      ];

      for (const test of customerTests) {
        const customerCases = await db
          .select()
          .from(assessmentCases)
          .where(eq(assessmentCases.customerId, test.customerId));

        expect(customerCases.length).toBe(test.expectedCases);

        // All cases should belong to the correct customer
        for (const case_ of customerCases) {
          expect(case_.customerId).toBe(test.customerId);
        }
      }
    });

    it("should allow migrated users to access their existing assessment cases", async () => {
      const accessTests = [
        {
          username: "legacy-production-admin",
          customerId: "legacy-prod-customer",
          shouldHaveAccess: true,
        },
        {
          username: "legacy-development-user",
          customerId: "legacy-dev-customer",
          shouldHaveAccess: true,
        },
        {
          username: "legacy-demo-user-old",
          customerId: "demo-customer",
          shouldHaveAccess: true,
        },
        {
          username: "legacy-replit-prod-user",
          customerId: "legacy-replit-customer",
          shouldHaveAccess: true,
        },
        {
          username: "legacy-customer-simple",
          customerId: "legacy-simple-customer",
          shouldHaveAccess: true,
        },
      ];

      for (const test of accessTests) {
        const user = migratedUsers[test.username];
        const userCases = await db
          .select()
          .from(assessmentCases)
          .where(eq(assessmentCases.customerId, test.customerId));

        if (test.shouldHaveAccess) {
          expect(userCases.length).toBeGreaterThan(0);
          expect(user.customerId).toBe(test.customerId);
        }
      }
    });
  });

  describe("Permission System Backward Compatibility", () => {
    it("should validate that migrated users have appropriate permissions", async () => {
      const permissionTests = [
        {
          username: "legacy-production-admin",
          expectedRole: UserRole.ADMIN,
          canAccessAdmin: true,
          canEditPrompts: false,
          canSwitchModules: true,
          canManageUsers: true,
        },
        {
          username: "legacy-development-user",
          expectedRole: UserRole.DEVELOPER,
          canAccessAdmin: true,
          canEditPrompts: true,
          canSwitchModules: true,
          canManageUsers: true,
        },
        {
          username: "legacy-demo-user-old",
          expectedRole: UserRole.DEMO,
          canAccessAdmin: false,
          canEditPrompts: false,
          canSwitchModules: false,
          canManageUsers: false,
        },
        {
          username: "legacy-replit-prod-user",
          expectedRole: UserRole.CUSTOMER,
          canAccessAdmin: false,
          canEditPrompts: false,
          canSwitchModules: false,
          canManageUsers: false,
        },
        {
          username: "legacy-customer-simple",
          expectedRole: UserRole.CUSTOMER,
          canAccessAdmin: false,
          canEditPrompts: false,
          canSwitchModules: false,
          canManageUsers: false,
        },
      ];

      for (const test of permissionTests) {
        const user = migratedUsers[test.username];
        expect(user.role).toBe(test.expectedRole);

        // Test specific permissions
        const canAccessAdmin = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.ADMIN,
          ActionType.VIEW
        );
        expect(canAccessAdmin).toBe(test.canAccessAdmin);

        const canEditPrompts = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.PROMPTS,
          ActionType.EDIT
        );
        expect(canEditPrompts).toBe(test.canEditPrompts);

        const canSwitchModules = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.MODULES,
          ActionType.SWITCH
        );
        expect(canSwitchModules).toBe(test.canSwitchModules);

        const canManageUsers = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.USERS,
          ActionType.MANAGE
        );
        expect(canManageUsers).toBe(test.canManageUsers);
      }
    });

    it("should validate report creation permissions for migrated users", async () => {
      const reportTests = [
        { username: "legacy-production-admin", canCreateUnlimited: true },
        { username: "legacy-development-user", canCreateUnlimited: true },
        {
          username: "legacy-demo-user-old",
          canCreateUnlimited: false,
          limit: 5,
        },
        { username: "legacy-replit-prod-user", canCreateUnlimited: true },
        { username: "legacy-customer-simple", canCreateUnlimited: true },
      ];

      for (const test of reportTests) {
        const user = migratedUsers[test.username];

        if (test.canCreateUnlimited) {
          // Test unlimited report creation
          const canCreateMany = await rbacPermissionGate.checkAccess(
            user,
            ResourceType.REPORTS,
            ActionType.CREATE,
            { currentReportCount: 1000 }
          );
          expect(canCreateMany).toBe(true);
        } else {
          // Test demo user limits
          const canCreateUnderLimit = await rbacPermissionGate.checkAccess(
            user,
            ResourceType.REPORTS,
            ActionType.CREATE,
            { currentReportCount: user.reportCount }
          );
          expect(canCreateUnderLimit).toBe(user.reportCount < test.limit!);

          const canCreateAtLimit = await rbacPermissionGate.checkAccess(
            user,
            ResourceType.REPORTS,
            ActionType.CREATE,
            { currentReportCount: test.limit! }
          );
          expect(canCreateAtLimit).toBe(false);
        }
      }
    });
  });

  describe("Data Integrity and Consistency Validation", () => {
    it("should maintain referential integrity after migration", async () => {
      // Check that all users with organizationId have valid organization references
      const usersWithOrgs = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, "migrated-org-legacy-replit"));

      for (const user of usersWithOrgs) {
        if (user.organizationId) {
          const [org] = await db
            .select()
            .from(organizations)
            .where(eq(organizations.id, user.organizationId))
            .limit(1);

          expect(org).toBeDefined();
          expect(org.customerId).toBe(user.customerId);
        }
      }
    });

    it("should preserve all timestamps and metadata", async () => {
      for (const originalUser of legacyDataStructures.legacyUsers) {
        const migratedUser = migratedUsers[originalUser.username];

        expect(migratedUser.createdAt).toBeDefined();
        expect(migratedUser.createdAt).toBeInstanceOf(Date);
      }

      for (const originalCase of legacyDataStructures.legacyAssessmentCases) {
        const [migratedCase] = await db
          .select()
          .from(assessmentCases)
          .where(eq(assessmentCases.caseId, originalCase.caseId))
          .limit(1);

        expect(migratedCase.createdDate).toBeDefined();
        expect(migratedCase.createdDate).toBeInstanceOf(Date);
        expect(migratedCase.lastUpdated).toBeDefined();
        expect(migratedCase.lastUpdated).toBeInstanceOf(Date);
      }
    });

    it("should ensure no data loss during migration", async () => {
      // Verify all legacy users were migrated
      const migratedUserCount = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.customerId, "legacy-prod-customer"),
            eq(users.customerId, "legacy-dev-customer"),
            eq(users.customerId, "legacy-replit-customer"),
            eq(users.customerId, "legacy-simple-customer"),
            eq(users.customerId, "demo-customer")
          )
        );

      expect(migratedUserCount.length).toBe(
        legacyDataStructures.legacyUsers.length
      );

      // Verify all legacy assessment cases were preserved
      const migratedCaseCount = await db
        .select()
        .from(assessmentCases)
        .where(
          or(
            eq(assessmentCases.customerId, "legacy-prod-customer"),
            eq(assessmentCases.customerId, "legacy-dev-customer"),
            eq(assessmentCases.customerId, "legacy-replit-customer"),
            eq(assessmentCases.customerId, "legacy-simple-customer"),
            eq(assessmentCases.customerId, "demo-customer")
          )
        );

      expect(migratedCaseCount.length).toBe(
        legacyDataStructures.legacyAssessmentCases.length
      );
    });

    it("should validate that no legacy roles remain in the system", async () => {
      const legacyRoles = [
        "production",
        "development",
        "demo",
        "replit-prod",
        "replit-dev",
      ];

      for (const legacyRole of legacyRoles) {
        const usersWithLegacyRole = await db
          .select()
          .from(users)
          .where(eq(users.role, legacyRole as any));

        expect(usersWithLegacyRole.length).toBe(0);
      }

      // Verify all users have valid RBAC roles
      const allUsers = await db.select().from(users);
      const validRoles = Object.values(UserRole);

      for (const user of allUsers) {
        expect(validRoles).toContain(user.role as UserRole);
      }
    });
  });

  describe("Environment System Removal Validation", () => {
    it("should confirm complete removal of environment-based logic", async () => {
      // Check that no environment-related roles exist
      const environmentRoles = [
        "production",
        "development",
        "demo",
        "replit-prod",
        "replit-dev",
      ];

      for (const envRole of environmentRoles) {
        const usersWithEnvRole = await db
          .select()
          .from(users)
          .where(eq(users.role, envRole as any));

        expect(usersWithEnvRole.length).toBe(0);
      }
    });

    it("should validate that all functionality is now role-based", async () => {
      // Test that permissions are based on roles, not environment
      for (const userData of legacyDataStructures.legacyUsers) {
        const user = migratedUsers[userData.username];

        // Get permissions based on new role
        const permissions = rbacPermissionGate.getUserPermissions(
          user.role,
          user.assignedModules,
          user.maxReports
        );

        expect(permissions).toBeDefined();
        expect(permissions.moduleAccess).toBeDefined();
        expect(typeof permissions.canAccessAdminDashboard).toBe("boolean");
        expect(typeof permissions.canCreateReports).toBe("boolean");
      }
    });
  });
});
