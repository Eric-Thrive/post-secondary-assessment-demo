#!/usr/bin/env tsx

/**
 * Enhanced test data seeding script for comprehensive RBAC validation
 * Extends the existing seed-test-data.ts with additional edge cases and scenarios
 */

import { db } from "../apps/server/db";
import {
  users,
  organizations,
  assessmentCases,
  UserRole,
  ModuleType,
} from "../packages/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  extendedTestUsers,
  extendedTestOrganizations,
  extendedTestAssessmentCases,
  testDataHelpers,
} from "../tests/fixtures/comprehensive-test-data";

async function seedComprehensiveTestData() {
  console.log("🌱 Starting comprehensive RBAC test data seeding...\n");

  try {
    // 1. Create extended test organizations
    console.log("📋 Creating extended test organizations...");
    for (const org of extendedTestOrganizations) {
      const existingOrg = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, org.id))
        .limit(1);

      if (existingOrg.length === 0) {
        await db.insert(organizations).values({
          id: org.id,
          name: org.name,
          customerId: org.customerId,
          assignedModules: org.assignedModules,
          maxUsers: org.maxUsers,
          isActive: org.isActive,
        });
        console.log(`  ✅ Created organization: ${org.name} (${org.id})`);
        console.log(`     Description: ${org.description}`);
        console.log(`     Test scenarios: ${org.testScenarios.join(", ")}`);
      } else {
        console.log(
          `  ⏭️  Organization already exists: ${org.name} (${org.id})`
        );
      }
    }

    // 2. Create extended test users
    console.log("\n👥 Creating extended test users...");
    const createdUsers: { [username: string]: number } = {};

    for (const user of extendedTestUsers) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.username, user.username))
        .limit(1);

      if (existingUser.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        const [newUser] = await db
          .insert(users)
          .values({
            username: user.username,
            email: user.email,
            password: hashedPassword,
            role: user.role,
            assignedModules: user.assignedModules,
            organizationId: user.organizationId,
            customerId: user.organizationId
              ? extendedTestOrganizations.find(
                  (org) => org.id === user.organizationId
                )?.customerId || "system"
              : user.role === UserRole.DEMO
              ? "demo-org"
              : "system",
            maxReports: user.maxReports,
            reportCount: user.reportCount,
            isActive: true,
          })
          .returning({ id: users.id });

        createdUsers[user.username] = newUser.id;
        console.log(
          `  ✅ Created user: ${user.username} (${user.role}) - ID: ${newUser.id}`
        );
        console.log(`     Description: ${user.description}`);
        console.log(`     Test scenarios: ${user.testScenarios.join(", ")}`);
      } else {
        createdUsers[user.username] = existingUser[0].id;
        console.log(
          `  ⏭️  User already exists: ${user.username} (${user.role}) - ID: ${existingUser[0].id}`
        );
      }
    }

    // 3. Create extended test assessment cases
    console.log("\n📄 Creating extended test assessment cases...");
    for (const testCase of extendedTestAssessmentCases) {
      const existingCase = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.caseId, testCase.caseId))
        .limit(1);

      if (existingCase.length === 0) {
        // Find a user from the same organization to assign as creator
        const orgCustomerId = testCase.customerId;
        const orgUser = extendedTestUsers.find(
          (u) =>
            u.organizationId &&
            extendedTestOrganizations.find((org) => org.id === u.organizationId)
              ?.customerId === orgCustomerId
        );

        await db.insert(assessmentCases).values({
          caseId: testCase.caseId,
          displayName: testCase.displayName,
          moduleType: testCase.moduleType,
          customerId: testCase.customerId,
          createdByUserId: orgUser ? createdUsers[orgUser.username] : undefined,
          status: testCase.status,
          gradeBand: testCase.gradeBand,
          documentNames: [],
          reportData: {},
          itemMasterData: {},
        });
        console.log(
          `  ✅ Created assessment case: ${testCase.displayName} (${testCase.caseId})`
        );
        console.log(`     Description: ${testCase.description}`);
        console.log(
          `     Test scenarios: ${testCase.testScenarios.join(", ")}`
        );
      } else {
        console.log(
          `  ⏭️  Assessment case already exists: ${testCase.displayName} (${testCase.caseId})`
        );
      }
    }

    // 4. Display comprehensive summary
    console.log("\n📊 Comprehensive Test Data Summary:");
    console.log(
      `  Extended Organizations: ${extendedTestOrganizations.length}`
    );
    console.log(`  Extended Users: ${extendedTestUsers.length}`);

    // Role distribution
    const roleDistribution = {
      [UserRole.DEVELOPER]: testDataHelpers.getUsersByRole(UserRole.DEVELOPER)
        .length,
      [UserRole.ADMIN]: testDataHelpers.getUsersByRole(UserRole.ADMIN).length,
      [UserRole.ORG_ADMIN]: testDataHelpers.getUsersByRole(UserRole.ORG_ADMIN)
        .length,
      [UserRole.CUSTOMER]: testDataHelpers.getUsersByRole(UserRole.CUSTOMER)
        .length,
      [UserRole.DEMO]: testDataHelpers.getUsersByRole(UserRole.DEMO).length,
    };

    console.log("  Role Distribution:");
    Object.entries(roleDistribution).forEach(([role, count]) => {
      console.log(`    - ${role}: ${count}`);
    });

    console.log(
      `  Extended Assessment Cases: ${extendedTestAssessmentCases.length}`
    );

    // Module distribution
    const moduleDistribution = {
      [ModuleType.K12]: testDataHelpers.getCasesByModule(ModuleType.K12).length,
      [ModuleType.POST_SECONDARY]: testDataHelpers.getCasesByModule(
        ModuleType.POST_SECONDARY
      ).length,
      [ModuleType.TUTORING]: testDataHelpers.getCasesByModule(
        ModuleType.TUTORING
      ).length,
    };

    console.log("  Module Case Distribution:");
    Object.entries(moduleDistribution).forEach(([module, count]) => {
      console.log(`    - ${module}: ${count}`);
    });

    // Demo user progression analysis
    console.log("\n🎭 Demo User Progression Analysis:");
    const demoUsers = testDataHelpers.getUsersByRole(UserRole.DEMO);
    const progressionCounts = {
      "0 reports": testDataHelpers.getDemoUsersByReportRange(0, 0).length,
      "1-2 reports": testDataHelpers.getDemoUsersByReportRange(1, 2).length,
      "3-4 reports": testDataHelpers.getDemoUsersByReportRange(3, 4).length,
      "5 reports (at limit)": testDataHelpers.getDemoUsersByReportRange(5, 5)
        .length,
    };

    Object.entries(progressionCounts).forEach(([range, count]) => {
      console.log(`  - ${range}: ${count} users`);
    });

    // Organization complexity analysis
    console.log("\n🏢 Organization Complexity Analysis:");
    const orgComplexity = {
      "Single module orgs": extendedTestOrganizations.filter(
        (org) => org.assignedModules.length === 1
      ).length,
      "Multi-module orgs": extendedTestOrganizations.filter(
        (org) => org.assignedModules.length > 1
      ).length,
      "Active orgs": extendedTestOrganizations.filter((org) => org.isActive)
        .length,
      "Inactive orgs": extendedTestOrganizations.filter((org) => !org.isActive)
        .length,
    };

    Object.entries(orgComplexity).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });

    console.log("\n🎯 Extended Test Scenarios Created:");
    console.log("  ✅ Boundary testing organizations (min/max user limits)");
    console.log("  ✅ Edge case users (high report counts, zero reports)");
    console.log(
      "  ✅ Complex permission scenarios (mixed modules, inactive orgs)"
    );
    console.log("  ✅ Comprehensive demo user journey (0->1->3->4->5 reports)");
    console.log(
      "  ✅ Module-specific demo experiences (K12, Tutoring, Post-Secondary)"
    );
    console.log("  ✅ Performance testing data (high-volume users)");
    console.log("  ✅ Multi-tenant isolation validation cases");
    console.log("  ✅ Permission boundary enforcement scenarios");

    console.log(
      "\n🔐 Extended Login Credentials (all passwords: TestPassword123!):"
    );
    extendedTestUsers.forEach((user) => {
      console.log(`  ${user.username} (${user.role}) - ${user.email}`);
      console.log(
        `    Reports: ${user.reportCount}/${
          user.maxReports === -1 ? "∞" : user.maxReports
        }`
      );
      console.log(`    Modules: ${user.assignedModules.join(", ")}`);
      console.log(`    Org: ${user.organizationId || "None"}`);
    });

    console.log(
      "\n✅ Comprehensive RBAC test data seeding completed successfully!"
    );
    console.log("\n🧪 Ready for comprehensive testing with:");
    console.log("  - npm run test:integration");
    console.log("  - npm run test:rbac");
    console.log(
      "  - vitest run tests/scenarios/rbac-comprehensive-scenarios.ts"
    );
  } catch (error) {
    console.error("❌ Error seeding comprehensive test data:", error);
    throw error;
  }
}

async function cleanupComprehensiveTestData() {
  console.log("🧹 Cleaning up comprehensive test data...\n");

  try {
    // Delete extended test assessment cases
    console.log("📄 Removing extended test assessment cases...");
    for (const testCase of extendedTestAssessmentCases) {
      await db
        .delete(assessmentCases)
        .where(eq(assessmentCases.caseId, testCase.caseId));
    }

    // Delete extended test users
    console.log("👥 Removing extended test users...");
    for (const user of extendedTestUsers) {
      await db.delete(users).where(eq(users.username, user.username));
    }

    // Delete extended test organizations
    console.log("📋 Removing extended test organizations...");
    for (const org of extendedTestOrganizations) {
      await db.delete(organizations).where(eq(organizations.id, org.id));
    }

    console.log("✅ Comprehensive test data cleanup completed!");
  } catch (error) {
    console.error("❌ Error cleaning up comprehensive test data:", error);
    throw error;
  }
}

async function validateTestDataIntegrity() {
  console.log("🔍 Validating test data integrity...\n");

  try {
    // Validate organizations
    console.log("📋 Validating organizations...");
    for (const org of extendedTestOrganizations) {
      const [dbOrg] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, org.id))
        .limit(1);

      if (dbOrg) {
        console.log(`  ✅ ${org.name}: Found in database`);

        // Validate organization users
        const orgUsers = await db
          .select()
          .from(users)
          .where(eq(users.organizationId, org.id));

        console.log(`     Users: ${orgUsers.length}/${org.maxUsers} (max)`);

        // Validate customer ID consistency
        const customerIds = [...new Set(orgUsers.map((u) => u.customerId))];
        if (customerIds.length <= 1) {
          console.log(
            `     ✅ Customer ID consistency: ${customerIds[0] || "None"}`
          );
        } else {
          console.log(
            `     ❌ Customer ID inconsistency: ${customerIds.join(", ")}`
          );
        }
      } else {
        console.log(`  ❌ ${org.name}: Not found in database`);
      }
    }

    // Validate users
    console.log("\n👥 Validating users...");
    let validUsers = 0;
    let invalidUsers = 0;

    for (const user of extendedTestUsers) {
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, user.username))
        .limit(1);

      if (dbUser) {
        validUsers++;

        // Validate user properties
        const validations = [
          { check: dbUser.role === user.role, name: "role" },
          {
            check:
              JSON.stringify(dbUser.assignedModules) ===
              JSON.stringify(user.assignedModules),
            name: "modules",
          },
          {
            check: dbUser.organizationId === user.organizationId,
            name: "organization",
          },
          { check: dbUser.maxReports === user.maxReports, name: "maxReports" },
          {
            check: dbUser.reportCount === user.reportCount,
            name: "reportCount",
          },
        ];

        const failedValidations = validations.filter((v) => !v.check);
        if (failedValidations.length === 0) {
          console.log(`  ✅ ${user.username}: All properties valid`);
        } else {
          console.log(
            `  ⚠️  ${user.username}: Issues with ${failedValidations
              .map((v) => v.name)
              .join(", ")}`
          );
        }
      } else {
        invalidUsers++;
        console.log(`  ❌ ${user.username}: Not found in database`);
      }
    }

    console.log(
      `\nUser validation summary: ${validUsers} valid, ${invalidUsers} invalid`
    );

    // Validate assessment cases
    console.log("\n📄 Validating assessment cases...");
    let validCases = 0;
    let invalidCases = 0;

    for (const testCase of extendedTestAssessmentCases) {
      const [dbCase] = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.caseId, testCase.caseId))
        .limit(1);

      if (dbCase) {
        validCases++;
        console.log(`  ✅ ${testCase.displayName}: Found in database`);
      } else {
        invalidCases++;
        console.log(`  ❌ ${testCase.displayName}: Not found in database`);
      }
    }

    console.log(
      `\nCase validation summary: ${validCases} valid, ${invalidCases} invalid`
    );

    const overallValid = invalidUsers === 0 && invalidCases === 0;
    console.log(
      `\n${overallValid ? "✅" : "❌"} Overall data integrity: ${
        overallValid ? "PASSED" : "FAILED"
      }`
    );

    return overallValid;
  } catch (error) {
    console.error("❌ Error validating test data integrity:", error);
    return false;
  }
}

// CLI interface
const command = process.argv[2];

if (command === "seed") {
  seedComprehensiveTestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else if (command === "cleanup") {
  cleanupComprehensiveTestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else if (command === "validate") {
  validateTestDataIntegrity()
    .then((isValid) => process.exit(isValid ? 0 : 1))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else {
  console.log("Usage:");
  console.log(
    "  tsx scripts/seed-comprehensive-test-data.ts seed     - Create comprehensive test data"
  );
  console.log(
    "  tsx scripts/seed-comprehensive-test-data.ts cleanup  - Remove comprehensive test data"
  );
  console.log(
    "  tsx scripts/seed-comprehensive-test-data.ts validate - Validate test data integrity"
  );
  process.exit(1);
}
