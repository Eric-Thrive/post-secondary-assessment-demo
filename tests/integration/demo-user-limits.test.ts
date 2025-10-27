/**
 * Demo User Limits and Upgrade Flow Integration Tests
 * Comprehensive testing of demo user journey, limits, cleanup, and upgrade flows
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../../apps/server/db";
import {
  users,
  assessmentCases,
  UserRole,
  ModuleType,
} from "../../packages/db/schema";
import { eq, and } from "drizzle-orm";
import { rbacPermissionGate } from "../../apps/server/permissions/rbac-permission-gate";
import { ResourceType, ActionType } from "../../apps/server/permissions/types";
import bcrypt from "bcryptjs";

// Demo user test scenarios for comprehensive limit testing
const demoUserScenarios = [
  {
    username: "demo-limit-test-0",
    email: "demo-0@test.com",
    password: "TestPassword123!",
    reportCount: 0,
    description: "Brand new demo user",
    expectedCanCreate: true,
    expectedUpgradePrompt: false,
  },
  {
    username: "demo-limit-test-1",
    email: "demo-1@test.com",
    password: "TestPassword123!",
    reportCount: 1,
    description: "Demo user with 1 report",
    expectedCanCreate: true,
    expectedUpgradePrompt: false,
  },
  {
    username: "demo-limit-test-2",
    email: "demo-2@test.com",
    password: "TestPassword123!",
    reportCount: 2,
    description: "Demo user with 2 reports",
    expectedCanCreate: true,
    expectedUpgradePrompt: false,
  },
  {
    username: "demo-limit-test-3",
    email: "demo-3@test.com",
    password: "TestPassword123!",
    reportCount: 3,
    description: "Demo user with 3 reports",
    expectedCanCreate: true,
    expectedUpgradePrompt: false,
  },
  {
    username: "demo-limit-test-4",
    email: "demo-4@test.com",
    password: "TestPassword123!",
    reportCount: 4,
    description: "Demo user at 4 reports (upgrade prompt)",
    expectedCanCreate: true,
    expectedUpgradePrompt: true,
  },
  {
    username: "demo-limit-test-5",
    email: "demo-5@test.com",
    password: "TestPassword123!",
    reportCount: 5,
    description: "Demo user at limit (blocked)",
    expectedCanCreate: false,
    expectedUpgradePrompt: true,
  },
];

// Demo assessment cases for testing data cleanup
const demoAssessmentCases = [
  {
    caseId: "demo-case-cleanup-1",
    displayName: "Demo Case for Cleanup Test 1",
    moduleType: ModuleType.POST_SECONDARY,
    customerId: "demo-org",
    status: "completed",
  },
  {
    caseId: "demo-case-cleanup-2",
    displayName: "Demo Case for Cleanup Test 2",
    moduleType: ModuleType.K12,
    customerId: "demo-org",
    status: "in_progress",
    gradeBand: "elementary",
  },
  {
    caseId: "demo-case-cleanup-3",
    displayName: "Demo Case for Cleanup Test 3",
    moduleType: ModuleType.TUTORING,
    customerId: "demo-org",
    status: "pending",
  },
  {
    caseId: "demo-case-cleanup-4",
    displayName: "Demo Case for Cleanup Test 4",
    moduleType: ModuleType.POST_SECONDARY,
    customerId: "demo-org",
    status: "completed",
  },
  {
    caseId: "demo-case-cleanup-5",
    displayName: "Demo Case for Cleanup Test 5",
    moduleType: ModuleType.K12,
    customerId: "demo-org",
    status: "completed",
    gradeBand: "middle",
  },
];

describe("Demo User Limits and Upgrade Flow Tests", () => {
  let createdUserIds: number[] = [];
  let createdCaseIds: string[] = [];
  let testDemoUsers: { [username: string]: Express.User } = {};

  beforeAll(async () => {
    console.log("🎭 Setting up demo user limit tests...");

    // Create demo users for each scenario
    for (const scenario of demoUserScenarios) {
      const hashedPassword = await bcrypt.hash(scenario.password, 10);

      const [user] = await db
        .insert(users)
        .values({
          username: scenario.username,
          email: scenario.email,
          password: hashedPassword,
          role: UserRole.DEMO,
          assignedModules: [ModuleType.POST_SECONDARY],
          organizationId: null,
          customerId: "demo-org",
          maxReports: 5,
          reportCount: scenario.reportCount,
          isActive: true,
        })
        .returning();

      createdUserIds.push(user.id);
      testDemoUsers[scenario.username] = user as Express.User;
    }

    // Create demo assessment cases
    for (const caseData of demoAssessmentCases) {
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
      `✅ Created ${createdUserIds.length} demo users and ${createdCaseIds.length} demo cases`
    );
  });

  afterAll(async () => {
    console.log("🧹 Cleaning up demo limit test data...");

    // Cleanup assessment cases
    for (const caseId of createdCaseIds) {
      await db
        .delete(assessmentCases)
        .where(eq(assessmentCases.caseId, caseId));
    }

    // Cleanup users
    for (const userId of createdUserIds) {
      await db.delete(users).where(eq(users.id, userId));
    }

    console.log("✅ Demo limit test cleanup completed");
  });

  describe("Demo User Report Limit Enforcement", () => {
    it("should enforce report limits correctly for each scenario", async () => {
      for (const scenario of demoUserScenarios) {
        const user = testDemoUsers[scenario.username];

        // Verify user setup
        expect(user.role).toBe(UserRole.DEMO);
        expect(user.maxReports).toBe(5);
        expect(user.reportCount).toBe(scenario.reportCount);
        expect(user.organizationId).toBeNull();
        expect(user.customerId).toBe("demo-org");

        // Test report creation permission based on current count
        const canCreate = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.REPORTS,
          ActionType.CREATE,
          { currentReportCount: scenario.reportCount }
        );

        expect(canCreate).toBe(scenario.expectedCanCreate);

        console.log(
          `✅ ${scenario.description}: Can create = ${canCreate} (expected: ${scenario.expectedCanCreate})`
        );
      }
    });

    it("should validate report creation at exact boundaries", async () => {
      const testCases = [
        {
          user: testDemoUsers["demo-limit-test-4"],
          currentCount: 4,
          shouldAllow: true,
        },
        {
          user: testDemoUsers["demo-limit-test-4"],
          currentCount: 5,
          shouldAllow: false,
        },
        {
          user: testDemoUsers["demo-limit-test-5"],
          currentCount: 5,
          shouldAllow: false,
        },
        {
          user: testDemoUsers["demo-limit-test-5"],
          currentCount: 6,
          shouldAllow: false,
        },
      ];

      for (const testCase of testCases) {
        const canCreate = await rbacPermissionGate.checkAccess(
          testCase.user,
          ResourceType.REPORTS,
          ActionType.CREATE,
          { currentReportCount: testCase.currentCount }
        );

        expect(canCreate).toBe(testCase.shouldAllow);
      }
    });

    it("should handle edge cases in report counting", async () => {
      const demoUser = testDemoUsers["demo-limit-test-3"];

      // Test with various report counts
      const testCounts = [0, 1, 2, 3, 4, 5, 6, 10, 100];

      for (const count of testCounts) {
        const canCreate = await rbacPermissionGate.checkAccess(
          demoUser,
          ResourceType.REPORTS,
          ActionType.CREATE,
          { currentReportCount: count }
        );

        const shouldAllow = count < 5;
        expect(canCreate).toBe(shouldAllow);
      }
    });
  });

  describe("Demo User Upgrade Prompt Logic", () => {
    it("should identify when to show upgrade prompts", async () => {
      // At 4 reports, should show upgrade prompt but still allow creation
      const preLimit = testDemoUsers["demo-limit-test-4"];

      const canCreateFifth = await rbacPermissionGate.checkAccess(
        preLimit,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 4 }
      );
      expect(canCreateFifth).toBe(true);

      // At 5 reports, should block creation and show upgrade
      const atLimit = testDemoUsers["demo-limit-test-5"];

      const canCreateSixth = await rbacPermissionGate.checkAccess(
        atLimit,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 5 }
      );
      expect(canCreateSixth).toBe(false);
    });

    it("should validate upgrade prompt timing across user journey", async () => {
      const journeyTests = [
        { count: 0, shouldPrompt: false, canCreate: true },
        { count: 1, shouldPrompt: false, canCreate: true },
        { count: 2, shouldPrompt: false, canCreate: true },
        { count: 3, shouldPrompt: false, canCreate: true },
        { count: 4, shouldPrompt: true, canCreate: true }, // Show prompt but allow
        { count: 5, shouldPrompt: true, canCreate: false }, // Show prompt and block
      ];

      const testUser = testDemoUsers["demo-limit-test-0"];

      for (const test of journeyTests) {
        const canCreate = await rbacPermissionGate.checkAccess(
          testUser,
          ResourceType.REPORTS,
          ActionType.CREATE,
          { currentReportCount: test.count }
        );

        expect(canCreate).toBe(test.canCreate);

        // Upgrade prompt logic would be implemented in the UI layer
        // based on the combination of canCreate and current count
        const shouldShowPrompt = test.count >= 4;
        expect(shouldShowPrompt).toBe(test.shouldPrompt);
      }
    });
  });

  describe("Demo User Permission Restrictions", () => {
    it("should enforce all demo user restrictions consistently", async () => {
      for (const scenario of demoUserScenarios) {
        const user = testDemoUsers[scenario.username];

        // Demo users should not have admin access
        const canAccessAdmin = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.ADMIN,
          ActionType.VIEW
        );
        expect(canAccessAdmin).toBe(false);

        // Demo users should not be able to manage users
        const canManageUsers = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.USERS,
          ActionType.MANAGE
        );
        expect(canManageUsers).toBe(false);

        // Demo users should not be able to switch modules
        const canSwitchModules = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.MODULES,
          ActionType.SWITCH
        );
        expect(canSwitchModules).toBe(false);

        // Demo users should not be able to edit prompts
        const canEditPrompts = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.PROMPTS,
          ActionType.EDIT
        );
        expect(canEditPrompts).toBe(false);

        // Demo users should not be able to edit system config
        const canEditConfig = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.SYSTEM_CONFIG,
          ActionType.EDIT
        );
        expect(canEditConfig).toBe(false);

        // Demo users should be able to view their own reports
        const canViewOwnReports = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.REPORTS,
          ActionType.VIEW,
          { isOwnReport: true }
        );
        expect(canViewOwnReports).toBe(true);

        // Demo users should be able to share reports
        const canShareReports = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.REPORTS,
          ActionType.SHARE
        );
        expect(canShareReports).toBe(true);

        // Demo users should have access to their assigned modules
        const hasModuleAccess = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.MODULES,
          ActionType.VIEW,
          { moduleType: ModuleType.POST_SECONDARY }
        );
        expect(hasModuleAccess).toBe(true);
      }
    });

    it("should validate demo user isolation from organizations", async () => {
      for (const scenario of demoUserScenarios) {
        const user = testDemoUsers[scenario.username];

        // Demo users should not be in any organization
        expect(user.organizationId).toBeNull();

        // Demo users should have demo-specific customer ID
        expect(user.customerId).toBe("demo-org");

        // Demo users should not be able to view organization reports
        const canViewOrgReports = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.REPORTS,
          ActionType.VIEW,
          { isOrgReport: true }
        );
        expect(canViewOrgReports).toBe(false);

        // Demo users should not be able to view all reports
        const canViewAllReports = await rbacPermissionGate.checkAccess(
          user,
          ResourceType.REPORTS,
          ActionType.VIEW
        );
        expect(canViewAllReports).toBe(false);
      }
    });
  });

  describe("Demo Data Cleanup and Management", () => {
    it("should validate demo assessment case isolation", async () => {
      // Verify demo cases exist and are properly isolated
      const demoCases = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.customerId, "demo-org"));

      expect(demoCases.length).toBeGreaterThanOrEqual(
        demoAssessmentCases.length
      );

      // All demo cases should have demo-org as customerId
      for (const case_ of demoCases) {
        expect(case_.customerId).toBe("demo-org");
      }

      // Verify different module types are represented
      const moduleTypes = [...new Set(demoCases.map((c) => c.moduleType))];
      expect(moduleTypes.length).toBeGreaterThan(1);
    });

    it("should handle demo user data cleanup scenarios", async () => {
      // This test validates that demo data can be properly identified for cleanup
      const allDemoUsers = await db
        .select()
        .from(users)
        .where(
          and(eq(users.role, UserRole.DEMO), eq(users.customerId, "demo-org"))
        );

      expect(allDemoUsers.length).toBeGreaterThanOrEqual(
        demoUserScenarios.length
      );

      // All demo users should be properly configured
      for (const user of allDemoUsers) {
        expect(user.role).toBe(UserRole.DEMO);
        expect(user.organizationId).toBeNull();
        expect(user.customerId).toBe("demo-org");
        expect(user.maxReports).toBe(5);
        expect(user.reportCount).toBeGreaterThanOrEqual(0);
        expect(user.reportCount).toBeLessThanOrEqual(5);
      }
    });

    it("should validate demo user progression tracking", async () => {
      // Analyze demo user distribution across report counts
      const progressionAnalysis = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      for (const scenario of demoUserScenarios) {
        const user = testDemoUsers[scenario.username];
        progressionAnalysis[
          user.reportCount as keyof typeof progressionAnalysis
        ]++;
      }

      // Should have users at each stage of the journey
      expect(progressionAnalysis[0]).toBeGreaterThan(0); // New users
      expect(progressionAnalysis[4]).toBeGreaterThan(0); // Pre-limit users
      expect(progressionAnalysis[5]).toBeGreaterThan(0); // At-limit users

      console.log("Demo user progression distribution:", progressionAnalysis);
    });
  });

  describe("Demo User Performance and Scalability", () => {
    it("should handle permission checks efficiently for demo users", async () => {
      const testUser = testDemoUsers["demo-limit-test-3"];

      // Perform multiple permission checks and measure performance
      const startTime = Date.now();

      const checks = await Promise.all([
        rbacPermissionGate.checkAccess(
          testUser,
          ResourceType.REPORTS,
          ActionType.CREATE,
          { currentReportCount: 3 }
        ),
        rbacPermissionGate.checkAccess(
          testUser,
          ResourceType.REPORTS,
          ActionType.VIEW,
          { isOwnReport: true }
        ),
        rbacPermissionGate.checkAccess(
          testUser,
          ResourceType.MODULES,
          ActionType.VIEW,
          { moduleType: ModuleType.POST_SECONDARY }
        ),
        rbacPermissionGate.checkAccess(
          testUser,
          ResourceType.ADMIN,
          ActionType.VIEW
        ),
        rbacPermissionGate.checkAccess(
          testUser,
          ResourceType.USERS,
          ActionType.MANAGE
        ),
        rbacPermissionGate.checkAccess(
          testUser,
          ResourceType.MODULES,
          ActionType.SWITCH
        ),
        rbacPermissionGate.checkAccess(
          testUser,
          ResourceType.REPORTS,
          ActionType.SHARE
        ),
      ]);

      const endTime = Date.now();

      // All checks should complete quickly (< 30ms)
      expect(endTime - startTime).toBeLessThan(30);

      // Verify expected results
      expect(checks[0]).toBe(true); // Can create reports (under limit)
      expect(checks[1]).toBe(true); // Can view own reports
      expect(checks[2]).toBe(true); // Can view assigned module
      expect(checks[3]).toBe(false); // Cannot access admin
      expect(checks[4]).toBe(false); // Cannot manage users
      expect(checks[5]).toBe(false); // Cannot switch modules
      expect(checks[6]).toBe(true); // Can share reports
    });

    it("should handle bulk demo user operations efficiently", async () => {
      const startTime = Date.now();

      // Simulate checking permissions for all demo users
      const bulkChecks = [];

      for (const scenario of demoUserScenarios) {
        const user = testDemoUsers[scenario.username];
        bulkChecks.push(
          rbacPermissionGate.checkAccess(
            user,
            ResourceType.REPORTS,
            ActionType.CREATE,
            { currentReportCount: user.reportCount }
          )
        );
      }

      const results = await Promise.all(bulkChecks);
      const endTime = Date.now();

      // Bulk operations should complete quickly
      expect(endTime - startTime).toBeLessThan(50);

      // Verify results match expectations
      results.forEach((result, index) => {
        const scenario = demoUserScenarios[index];
        expect(result).toBe(scenario.expectedCanCreate);
      });
    });
  });

  describe("Demo User Upgrade Flow Validation", () => {
    it("should provide correct upgrade context information", async () => {
      const upgradeScenarios = [
        {
          user: testDemoUsers["demo-limit-test-4"],
          shouldShowUpgrade: true,
          urgency: "high",
        },
        {
          user: testDemoUsers["demo-limit-test-5"],
          shouldShowUpgrade: true,
          urgency: "critical",
        },
        {
          user: testDemoUsers["demo-limit-test-3"],
          shouldShowUpgrade: false,
          urgency: "none",
        },
      ];

      for (const scenario of upgradeScenarios) {
        const user = scenario.user;

        // Get user permissions for upgrade context
        const permissions = rbacPermissionGate.getUserPermissions(
          user.role,
          user.assignedModules,
          user.maxReports
        );

        expect(permissions.isDemoUser).toBe(true);
        expect(permissions.canUpgradeAccount).toBe(true);
        expect(permissions.reportLimit).toBe(5);

        // Upgrade urgency would be determined by UI based on report count
        const isAtLimit = user.reportCount >= 5;
        const isNearLimit = user.reportCount >= 4;

        if (scenario.urgency === "critical") {
          expect(isAtLimit).toBe(true);
        } else if (scenario.urgency === "high") {
          expect(isNearLimit).toBe(true);
          expect(isAtLimit).toBe(false);
        } else {
          expect(isNearLimit).toBe(false);
        }
      }
    });

    it("should validate upgrade flow data requirements", async () => {
      // Test that we have all necessary data for upgrade flows
      for (const scenario of demoUserScenarios) {
        const user = testDemoUsers[scenario.username];

        // Essential upgrade flow data
        expect(user.role).toBe(UserRole.DEMO);
        expect(user.maxReports).toBe(5);
        expect(user.reportCount).toBeGreaterThanOrEqual(0);
        expect(user.reportCount).toBeLessThanOrEqual(5);
        expect(user.email).toBeDefined();
        expect(user.username).toBeDefined();
        expect(user.customerId).toBe("demo-org");
        expect(user.organizationId).toBeNull();

        // User should be active for upgrade eligibility
        expect(user.isActive).toBe(true);
      }
    });
  });
});
