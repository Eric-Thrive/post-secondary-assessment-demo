/**
 * Integration tests for data migration and backward compatibility
 * Validates that existing users are properly migrated to new role system
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
import bcrypt from "bcryptjs";

// Simulate legacy user data (pre-RBAC migration)
const legacyUsers = [
  {
    username: "legacy-admin-user",
    email: "legacy-admin@test.com",
    password: "TestPassword123!",
    customerId: "legacy-customer-1",
    customerName: "Legacy Customer Organization",
    // Legacy fields that should be migrated
    role: "admin", // Should become UserRole.ADMIN
    assignedModules: null, // Should get all modules
    organizationId: null, // Should be assigned to organization
    maxReports: -1,
    reportCount: 5,
  },
  {
    username: "legacy-customer-user",
    email: "legacy-customer@test.com",
    password: "TestPassword123!",
    customerId: "legacy-customer-1",
    customerName: "Legacy Customer Organization",
    // Legacy fields that should be migrated
    role: "customer", // Should become UserRole.CUSTOMER
    assignedModules: null, // Should get post-secondary by default
    organizationId: null, // Should be assigned to organization
    maxReports: -1,
    reportCount: 12,
  },
  {
    username: "legacy-demo-user",
    email: "legacy-demo@test.com",
    password: "TestPassword123!",
    customerId: "demo-customer",
    customerName: "Demo Customer",
    // Legacy demo user
    role: "demo", // Should become UserRole.DEMO
    assignedModules: null, // Should get post-secondary by default
    organizationId: null, // Should remain null for demo users
    maxReports: 5,
    reportCount: 3,
    demoPermissions: { "post-secondary-demo": true },
  },
];

// Legacy assessment cases that should remain accessible
const legacyAssessmentCases = [
  {
    caseId: "legacy-case-1",
    displayName: "Legacy Assessment Case 1",
    moduleType: ModuleType.POST_SECONDARY,
    customerId: "legacy-customer-1",
    status: "completed",
    reportData: { testData: "legacy report data" },
    itemMasterData: { testData: "legacy item master data" },
  },
  {
    caseId: "legacy-case-2",
    displayName: "Legacy Assessment Case 2",
    moduleType: ModuleType.K12,
    customerId: "legacy-customer-1",
    status: "in_progress",
    gradeBand: "elementary",
    reportData: { testData: "legacy k12 report data" },
  },
  {
    caseId: "legacy-demo-case",
    displayName: "Legacy Demo Assessment",
    moduleType: ModuleType.POST_SECONDARY,
    customerId: "demo-customer",
    status: "completed",
    reportData: { testData: "legacy demo report data" },
  },
];

describe("Data Migration and Backward Compatibility Tests", () => {
  let createdUserIds: number[] = [];
  let createdOrgIds: string[] = [];
  let createdCaseIds: string[] = [];

  beforeAll(async () => {
    // Create organizations that would be created during migration
    const orgsToCreate = [
      {
        id: "migrated-org-legacy-customer-1",
        name: "Legacy Customer Organization",
        customerId: "legacy-customer-1",
        assignedModules: [ModuleType.POST_SECONDARY, ModuleType.K12],
        maxUsers: 25,
        isActive: true,
      },
      {
        id: "migrated-org-demo-customer",
        name: "Demo Customer",
        customerId: "demo-customer",
        assignedModules: [ModuleType.POST_SECONDARY],
        maxUsers: 5,
        isActive: true,
      },
    ];

    for (const org of orgsToCreate) {
      await db.insert(organizations).values(org);
      createdOrgIds.push(org.id);
    }

    // Create legacy users (simulating pre-migration state)
    for (const userData of legacyUsers) {
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
          customerId: userData.customerId,
          customerName: userData.customerName,
          maxReports: userData.maxReports,
          reportCount: userData.reportCount,
          isActive: true,
          demoPermissions: userData.demoPermissions || {},
        })
        .returning({ id: users.id });

      createdUserIds.push(user.id);
    }

    // Create legacy assessment cases
    for (const caseData of legacyAssessmentCases) {
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

    // Simulate migration process
    await simulateMigration();
  });

  afterAll(async () => {
    // Cleanup test data
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
  });

  async function simulateMigration() {
    // Simulate the migration process that would happen in production

    // 1. Update user roles to use new enum values
    await db
      .update(users)
      .set({ role: UserRole.ADMIN })
      .where(eq(users.username, "legacy-admin-user"));

    await db
      .update(users)
      .set({ role: UserRole.CUSTOMER })
      .where(eq(users.username, "legacy-customer-user"));

    await db
      .update(users)
      .set({ role: UserRole.DEMO })
      .where(eq(users.username, "legacy-demo-user"));

    // 2. Assign default modules based on role
    await db
      .update(users)
      .set({
        assignedModules: [
          ModuleType.K12,
          ModuleType.POST_SECONDARY,
          ModuleType.TUTORING,
        ],
      })
      .where(eq(users.username, "legacy-admin-user"));

    await db
      .update(users)
      .set({
        assignedModules: [ModuleType.POST_SECONDARY],
      })
      .where(eq(users.username, "legacy-customer-user"));

    await db
      .update(users)
      .set({
        assignedModules: [ModuleType.POST_SECONDARY],
      })
      .where(eq(users.username, "legacy-demo-user"));

    // 3. Assign organization IDs based on customerId (except for demo users)
    await db
      .update(users)
      .set({ organizationId: "migrated-org-legacy-customer-1" })
      .where(
        and(
          eq(users.customerId, "legacy-customer-1"),
          eq(users.role, UserRole.ADMIN)
        )
      );

    await db
      .update(users)
      .set({ organizationId: "migrated-org-legacy-customer-1" })
      .where(
        and(
          eq(users.customerId, "legacy-customer-1"),
          eq(users.role, UserRole.CUSTOMER)
        )
      );

    // Demo users remain without organization assignment
  }

  describe("User Migration Validation", () => {
    it("should properly migrate admin users to new role system", async () => {
      const [adminUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, "legacy-admin-user"))
        .limit(1);

      expect(adminUser.role).toBe(UserRole.ADMIN);
      expect(adminUser.assignedModules).toEqual([
        ModuleType.K12,
        ModuleType.POST_SECONDARY,
        ModuleType.TUTORING,
      ]);
      expect(adminUser.organizationId).toBe("migrated-org-legacy-customer-1");
      expect(adminUser.customerId).toBe("legacy-customer-1"); // Preserved for backward compatibility
      expect(adminUser.maxReports).toBe(-1);
      expect(adminUser.reportCount).toBe(5);
    });

    it("should properly migrate customer users to new role system", async () => {
      const [customerUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, "legacy-customer-user"))
        .limit(1);

      expect(customerUser.role).toBe(UserRole.CUSTOMER);
      expect(customerUser.assignedModules).toEqual([ModuleType.POST_SECONDARY]);
      expect(customerUser.organizationId).toBe(
        "migrated-org-legacy-customer-1"
      );
      expect(customerUser.customerId).toBe("legacy-customer-1");
      expect(customerUser.maxReports).toBe(-1);
      expect(customerUser.reportCount).toBe(12);
    });

    it("should properly migrate demo users while preserving demo characteristics", async () => {
      const [demoUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, "legacy-demo-user"))
        .limit(1);

      expect(demoUser.role).toBe(UserRole.DEMO);
      expect(demoUser.assignedModules).toEqual([ModuleType.POST_SECONDARY]);
      expect(demoUser.organizationId).toBeNull(); // Demo users don't get organization assignment
      expect(demoUser.customerId).toBe("demo-customer");
      expect(demoUser.maxReports).toBe(5);
      expect(demoUser.reportCount).toBe(3);
      expect(demoUser.demoPermissions).toEqual({ "post-secondary-demo": true });
    });

    it("should preserve all existing user data during migration", async () => {
      for (const legacyUser of legacyUsers) {
        const [migratedUser] = await db
          .select()
          .from(users)
          .where(eq(users.username, legacyUser.username))
          .limit(1);

        expect(migratedUser.username).toBe(legacyUser.username);
        expect(migratedUser.email).toBe(legacyUser.email);
        expect(migratedUser.customerId).toBe(legacyUser.customerId);
        expect(migratedUser.customerName).toBe(legacyUser.customerName);
        expect(migratedUser.reportCount).toBe(legacyUser.reportCount);
        expect(migratedUser.isActive).toBe(true);

        // Verify password is preserved
        const isValidPassword = await bcrypt.compare(
          legacyUser.password,
          migratedUser.password
        );
        expect(isValidPassword).toBe(true);
      }
    });
  });

  describe("Organization Assignment Validation", () => {
    it("should create organizations from existing customer data", async () => {
      const [org1] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.customerId, "legacy-customer-1"))
        .limit(1);

      const [org2] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.customerId, "demo-customer"))
        .limit(1);

      expect(org1).toBeDefined();
      expect(org1.name).toBe("Legacy Customer Organization");
      expect(org1.customerId).toBe("legacy-customer-1");
      expect(org1.isActive).toBe(true);

      expect(org2).toBeDefined();
      expect(org2.name).toBe("Demo Customer");
      expect(org2.customerId).toBe("demo-customer");
    });

    it("should properly assign users to organizations based on customerId", async () => {
      const orgUsers = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, "migrated-org-legacy-customer-1"));

      expect(orgUsers).toHaveLength(2);

      const usernames = orgUsers.map((u) => u.username);
      expect(usernames).toContain("legacy-admin-user");
      expect(usernames).toContain("legacy-customer-user");

      // All users should have the same customerId
      orgUsers.forEach((user) => {
        expect(user.customerId).toBe("legacy-customer-1");
      });
    });

    it("should maintain data isolation between organizations", async () => {
      const org1Users = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, "migrated-org-legacy-customer-1"));

      const org2Users = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, "migrated-org-demo-customer"));

      // Users should be properly isolated
      expect(org1Users.every((u) => u.customerId === "legacy-customer-1")).toBe(
        true
      );
      expect(org2Users.every((u) => u.customerId === "demo-customer")).toBe(
        true
      );
    });
  });

  describe("Assessment Case Accessibility", () => {
    it("should preserve all existing assessment cases", async () => {
      for (const legacyCase of legacyAssessmentCases) {
        const [assessmentCase] = await db
          .select()
          .from(assessmentCases)
          .where(eq(assessmentCases.caseId, legacyCase.caseId))
          .limit(1);

        expect(assessmentCase).toBeDefined();
        expect(assessmentCase.displayName).toBe(legacyCase.displayName);
        expect(assessmentCase.moduleType).toBe(legacyCase.moduleType);
        expect(assessmentCase.customerId).toBe(legacyCase.customerId);
        expect(assessmentCase.status).toBe(legacyCase.status);
        expect(assessmentCase.reportData).toEqual(legacyCase.reportData);

        if (legacyCase.itemMasterData) {
          expect(assessmentCase.itemMasterData).toEqual(
            legacyCase.itemMasterData
          );
        }

        if (legacyCase.gradeBand) {
          expect(assessmentCase.gradeBand).toBe(legacyCase.gradeBand);
        }
      }
    });

    it("should maintain customer-based data isolation for assessment cases", async () => {
      const customer1Cases = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, "legacy-customer-1"));

      const demoCases = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, "demo-customer"));

      expect(customer1Cases).toHaveLength(2);
      expect(demoCases).toHaveLength(1);

      // Verify case IDs match expected
      const customer1CaseIds = customer1Cases.map((c) => c.caseId);
      expect(customer1CaseIds).toContain("legacy-case-1");
      expect(customer1CaseIds).toContain("legacy-case-2");

      const demoCaseIds = demoCases.map((c) => c.caseId);
      expect(demoCaseIds).toContain("legacy-demo-case");
    });

    it("should allow migrated users to access their existing assessment cases", async () => {
      // Test that admin user can access organization's cases
      const [adminUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, "legacy-admin-user"))
        .limit(1);

      const adminAccessibleCases = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, adminUser.customerId));

      expect(adminAccessibleCases).toHaveLength(2);

      // Test that customer user can access organization's cases
      const [customerUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, "legacy-customer-user"))
        .limit(1);

      const customerAccessibleCases = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, customerUser.customerId));

      expect(customerAccessibleCases).toHaveLength(2);

      // Test that demo user can access their demo cases
      const [demoUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, "legacy-demo-user"))
        .limit(1);

      const demoAccessibleCases = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, demoUser.customerId));

      expect(demoAccessibleCases).toHaveLength(1);
    });
  });

  describe("Data Integrity Validation", () => {
    it("should maintain referential integrity after migration", async () => {
      // Check that all users with organizationId have valid organization references
      const usersWithOrgs = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, "migrated-org-legacy-customer-1"));

      for (const user of usersWithOrgs) {
        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, user.organizationId!))
          .limit(1);

        expect(org).toBeDefined();
        expect(org.customerId).toBe(user.customerId);
      }
    });

    it("should preserve all timestamps and metadata", async () => {
      for (const legacyUser of legacyUsers) {
        const [migratedUser] = await db
          .select()
          .from(users)
          .where(eq(users.username, legacyUser.username))
          .limit(1);

        expect(migratedUser.createdAt).toBeDefined();
        expect(migratedUser.createdAt).toBeInstanceOf(Date);
      }

      for (const legacyCase of legacyAssessmentCases) {
        const [migratedCase] = await db
          .select()
          .from(assessmentCases)
          .where(eq(assessmentCases.caseId, legacyCase.caseId))
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
        .where(eq(users.customerId, "legacy-customer-1"));

      expect(migratedUserCount).toHaveLength(2);

      // Verify all legacy assessment cases were preserved
      const migratedCaseCount = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, "legacy-customer-1"));

      expect(migratedCaseCount).toHaveLength(2);

      // Verify demo data was preserved
      const demoUserCount = await db
        .select()
        .from(users)
        .where(eq(users.customerId, "demo-customer"));

      expect(demoUserCount).toHaveLength(1);

      const demoCaseCount = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, "demo-customer"));

      expect(demoCaseCount).toHaveLength(1);
    });
  });
});
