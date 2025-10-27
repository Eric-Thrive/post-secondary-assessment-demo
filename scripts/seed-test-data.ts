#!/usr/bin/env tsx

/**
 * Comprehensive test data seeding script for RBAC system validation
 * Creates test users, organizations, and assessment cases for all role types
 */

import { db } from "../apps/server/db";
import {
  users,
  organizations,
  assessmentCases,
  UserRole,
  ModuleType,
  type InsertUser,
  type InsertOrganization,
  type InsertAssessmentCase,
} from "../packages/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

interface TestUser {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  assignedModules: ModuleType[];
  organizationId?: string;
  maxReports: number;
  reportCount: number;
}

interface TestOrganization {
  id: string;
  name: string;
  customerId: string;
  assignedModules: ModuleType[];
  maxUsers: number;
  isActive: boolean;
}

interface TestAssessmentCase {
  caseId: string;
  displayName: string;
  moduleType: ModuleType;
  customerId: string;
  createdByUserId?: number;
  status: string;
  gradeBand?: string;
}

// Test organizations with different module assignments
const testOrganizations: TestOrganization[] = [
  {
    id: "org-multi-module",
    name: "Multi-Module Education District",
    customerId: "multi-module-district",
    assignedModules: [
      ModuleType.K12,
      ModuleType.POST_SECONDARY,
      ModuleType.TUTORING,
    ],
    maxUsers: 50,
    isActive: true,
  },
  {
    id: "org-k12-only",
    name: "K-12 School District",
    customerId: "k12-district",
    assignedModules: [ModuleType.K12],
    maxUsers: 25,
    isActive: true,
  },
  {
    id: "org-post-sec-only",
    name: "University Accessibility Services",
    customerId: "university-access",
    assignedModules: [ModuleType.POST_SECONDARY],
    maxUsers: 15,
    isActive: true,
  },
  {
    id: "org-tutoring-only",
    name: "Private Tutoring Center",
    customerId: "tutoring-center",
    assignedModules: [ModuleType.TUTORING],
    maxUsers: 10,
    isActive: true,
  },
  {
    id: "org-inactive",
    name: "Inactive Organization",
    customerId: "inactive-org",
    assignedModules: [ModuleType.POST_SECONDARY],
    maxUsers: 5,
    isActive: false,
  },
];

// Test users covering all role types and scenarios
const testUsers: TestUser[] = [
  // Developer users - full system access
  {
    username: "test-developer",
    email: "developer@test.com",
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
    username: "test-developer-2",
    email: "developer2@test.com",
    password: "TestPassword123!",
    role: UserRole.DEVELOPER,
    assignedModules: [
      ModuleType.K12,
      ModuleType.POST_SECONDARY,
      ModuleType.TUTORING,
    ],
    maxReports: -1,
    reportCount: 5,
  },

  // Admin users - full module access, no prompt editing
  {
    username: "test-admin",
    email: "admin@test.com",
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
    username: "test-admin-active",
    email: "admin-active@test.com",
    password: "TestPassword123!",
    role: UserRole.ADMIN,
    assignedModules: [
      ModuleType.K12,
      ModuleType.POST_SECONDARY,
      ModuleType.TUTORING,
    ],
    maxReports: -1,
    reportCount: 12,
  },

  // Org Admin users - organization-scoped access
  {
    username: "test-org-admin-multi",
    email: "orgadmin-multi@test.com",
    password: "TestPassword123!",
    role: UserRole.ORG_ADMIN,
    assignedModules: [
      ModuleType.K12,
      ModuleType.POST_SECONDARY,
      ModuleType.TUTORING,
    ],
    organizationId: "org-multi-module",
    maxReports: -1,
    reportCount: 3,
  },
  {
    username: "test-org-admin-k12",
    email: "orgadmin-k12@test.com",
    password: "TestPassword123!",
    role: UserRole.ORG_ADMIN,
    assignedModules: [ModuleType.K12],
    organizationId: "org-k12-only",
    maxReports: -1,
    reportCount: 8,
  },
  {
    username: "test-org-admin-postsec",
    email: "orgadmin-postsec@test.com",
    password: "TestPassword123!",
    role: UserRole.ORG_ADMIN,
    assignedModules: [ModuleType.POST_SECONDARY],
    organizationId: "org-post-sec-only",
    maxReports: -1,
    reportCount: 15,
  },
  {
    username: "test-org-admin-tutoring",
    email: "orgadmin-tutoring@test.com",
    password: "TestPassword123!",
    role: UserRole.ORG_ADMIN,
    assignedModules: [ModuleType.TUTORING],
    organizationId: "org-tutoring-only",
    maxReports: -1,
    reportCount: 2,
  },

  // Customer users - individual access within organizations
  {
    username: "test-customer-multi-1",
    email: "customer-multi-1@test.com",
    password: "TestPassword123!",
    role: UserRole.CUSTOMER,
    assignedModules: [ModuleType.K12, ModuleType.POST_SECONDARY],
    organizationId: "org-multi-module",
    maxReports: -1,
    reportCount: 7,
  },
  {
    username: "test-customer-multi-2",
    email: "customer-multi-2@test.com",
    password: "TestPassword123!",
    role: UserRole.CUSTOMER,
    assignedModules: [ModuleType.TUTORING],
    organizationId: "org-multi-module",
    maxReports: -1,
    reportCount: 4,
  },
  {
    username: "test-customer-k12",
    email: "customer-k12@test.com",
    password: "TestPassword123!",
    role: UserRole.CUSTOMER,
    assignedModules: [ModuleType.K12],
    organizationId: "org-k12-only",
    maxReports: -1,
    reportCount: 11,
  },
  {
    username: "test-customer-postsec",
    email: "customer-postsec@test.com",
    password: "TestPassword123!",
    role: UserRole.CUSTOMER,
    assignedModules: [ModuleType.POST_SECONDARY],
    organizationId: "org-post-sec-only",
    maxReports: -1,
    reportCount: 6,
  },
  {
    username: "test-customer-tutoring",
    email: "customer-tutoring@test.com",
    password: "TestPassword123!",
    role: UserRole.CUSTOMER,
    assignedModules: [ModuleType.TUTORING],
    organizationId: "org-tutoring-only",
    maxReports: -1,
    reportCount: 9,
  },

  // Demo users - limited access with report limits
  {
    username: "test-demo-new",
    email: "demo-new@test.com",
    password: "TestPassword123!",
    role: UserRole.DEMO,
    assignedModules: [ModuleType.POST_SECONDARY],
    maxReports: 5,
    reportCount: 0,
  },
  {
    username: "test-demo-approaching-limit",
    email: "demo-approaching@test.com",
    password: "TestPassword123!",
    role: UserRole.DEMO,
    assignedModules: [ModuleType.K12],
    maxReports: 5,
    reportCount: 4, // Should show upgrade prompt
  },
  {
    username: "test-demo-at-limit",
    email: "demo-limit@test.com",
    password: "TestPassword123!",
    role: UserRole.DEMO,
    assignedModules: [ModuleType.TUTORING],
    maxReports: 5,
    reportCount: 5, // Should prevent new reports
  },
  {
    username: "test-demo-k12",
    email: "demo-k12@test.com",
    password: "TestPassword123!",
    role: UserRole.DEMO,
    assignedModules: [ModuleType.K12],
    maxReports: 5,
    reportCount: 2,
  },
  {
    username: "test-demo-tutoring",
    email: "demo-tutoring@test.com",
    password: "TestPassword123!",
    role: UserRole.DEMO,
    assignedModules: [ModuleType.TUTORING],
    maxReports: 5,
    reportCount: 3,
  },
];

// Test assessment cases for multi-tenant validation
const testAssessmentCases: TestAssessmentCase[] = [
  // Multi-module organization cases
  {
    caseId: "test-case-multi-k12-1",
    displayName: "Multi-Org K12 Assessment 1",
    moduleType: ModuleType.K12,
    customerId: "multi-module-district",
    status: "completed",
    gradeBand: "elementary",
  },
  {
    caseId: "test-case-multi-postsec-1",
    displayName: "Multi-Org Post-Secondary Assessment 1",
    moduleType: ModuleType.POST_SECONDARY,
    customerId: "multi-module-district",
    status: "completed",
  },
  {
    caseId: "test-case-multi-tutoring-1",
    displayName: "Multi-Org Tutoring Assessment 1",
    moduleType: ModuleType.TUTORING,
    customerId: "multi-module-district",
    status: "in_progress",
  },

  // K12-only organization cases
  {
    caseId: "test-case-k12-elem-1",
    displayName: "K12 Elementary Assessment 1",
    moduleType: ModuleType.K12,
    customerId: "k12-district",
    status: "completed",
    gradeBand: "elementary",
  },
  {
    caseId: "test-case-k12-middle-1",
    displayName: "K12 Middle School Assessment 1",
    moduleType: ModuleType.K12,
    customerId: "k12-district",
    status: "completed",
    gradeBand: "middle",
  },
  {
    caseId: "test-case-k12-high-1",
    displayName: "K12 High School Assessment 1",
    moduleType: ModuleType.K12,
    customerId: "k12-district",
    status: "pending",
    gradeBand: "high",
  },

  // Post-secondary organization cases
  {
    caseId: "test-case-postsec-undergrad-1",
    displayName: "University Undergraduate Assessment 1",
    moduleType: ModuleType.POST_SECONDARY,
    customerId: "university-access",
    status: "completed",
  },
  {
    caseId: "test-case-postsec-grad-1",
    displayName: "University Graduate Assessment 1",
    moduleType: ModuleType.POST_SECONDARY,
    customerId: "university-access",
    status: "in_progress",
  },

  // Tutoring organization cases
  {
    caseId: "test-case-tutoring-1",
    displayName: "Private Tutoring Assessment 1",
    moduleType: ModuleType.TUTORING,
    customerId: "tutoring-center",
    status: "completed",
  },
  {
    caseId: "test-case-tutoring-2",
    displayName: "Private Tutoring Assessment 2",
    moduleType: ModuleType.TUTORING,
    customerId: "tutoring-center",
    status: "pending",
  },

  // Demo user cases
  {
    caseId: "test-case-demo-1",
    displayName: "Demo Assessment 1",
    moduleType: ModuleType.POST_SECONDARY,
    customerId: "demo-org",
    status: "completed",
  },
  {
    caseId: "test-case-demo-2",
    displayName: "Demo Assessment 2",
    moduleType: ModuleType.K12,
    customerId: "demo-org",
    status: "completed",
    gradeBand: "elementary",
  },
];

async function seedTestData() {
  console.log("🌱 Starting RBAC test data seeding...\n");

  try {
    // 1. Create test organizations
    console.log("📋 Creating test organizations...");
    for (const org of testOrganizations) {
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
      } else {
        console.log(
          `  ⏭️  Organization already exists: ${org.name} (${org.id})`
        );
      }
    }

    // 2. Create test users
    console.log("\n👥 Creating test users...");
    const createdUsers: { [username: string]: number } = {};

    for (const user of testUsers) {
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
              ? testOrganizations.find((org) => org.id === user.organizationId)
                  ?.customerId || "system"
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
      } else {
        createdUsers[user.username] = existingUser[0].id;
        console.log(
          `  ⏭️  User already exists: ${user.username} (${user.role}) - ID: ${existingUser[0].id}`
        );
      }
    }

    // 3. Create test assessment cases
    console.log("\n📄 Creating test assessment cases...");
    for (const testCase of testAssessmentCases) {
      const existingCase = await db
        .select()
        .from(assessmentCases)
        .where(eq(assessmentCases.caseId, testCase.caseId))
        .limit(1);

      if (existingCase.length === 0) {
        // Find a user from the same organization to assign as creator
        const orgCustomerId = testCase.customerId;
        const orgUser = testUsers.find(
          (u) =>
            u.organizationId &&
            testOrganizations.find((org) => org.id === u.organizationId)
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
      } else {
        console.log(
          `  ⏭️  Assessment case already exists: ${testCase.displayName} (${testCase.caseId})`
        );
      }
    }

    // 4. Display summary
    console.log("\n📊 Test Data Summary:");
    console.log(`  Organizations: ${testOrganizations.length}`);
    console.log(`  Users: ${testUsers.length}`);
    console.log(
      `    - Developers: ${
        testUsers.filter((u) => u.role === UserRole.DEVELOPER).length
      }`
    );
    console.log(
      `    - Admins: ${
        testUsers.filter((u) => u.role === UserRole.ADMIN).length
      }`
    );
    console.log(
      `    - Org Admins: ${
        testUsers.filter((u) => u.role === UserRole.ORG_ADMIN).length
      }`
    );
    console.log(
      `    - Customers: ${
        testUsers.filter((u) => u.role === UserRole.CUSTOMER).length
      }`
    );
    console.log(
      `    - Demo Users: ${
        testUsers.filter((u) => u.role === UserRole.DEMO).length
      }`
    );
    console.log(`  Assessment Cases: ${testAssessmentCases.length}`);

    console.log("\n🎯 Test Scenarios Created:");
    console.log("  ✅ Multi-module organization with mixed user roles");
    console.log(
      "  ✅ Single-module organizations (K12, Post-Secondary, Tutoring)"
    );
    console.log(
      "  ✅ Demo users at different report count stages (0, 4, 5 reports)"
    );
    console.log("  ✅ Organization-based data isolation test cases");
    console.log("  ✅ Module switching permission boundaries");
    console.log("  ✅ Inactive organization scenario");

    console.log("\n🔐 Login Credentials (all passwords: TestPassword123!):");
    testUsers.forEach((user) => {
      console.log(`  ${user.username} (${user.role}) - ${user.email}`);
    });

    console.log("\n✅ RBAC test data seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding test data:", error);
    throw error;
  }
}

async function cleanupTestData() {
  console.log("🧹 Cleaning up existing test data...\n");

  try {
    // Delete test assessment cases
    console.log("📄 Removing test assessment cases...");
    for (const testCase of testAssessmentCases) {
      await db
        .delete(assessmentCases)
        .where(eq(assessmentCases.caseId, testCase.caseId));
    }

    // Delete test users
    console.log("👥 Removing test users...");
    for (const user of testUsers) {
      await db.delete(users).where(eq(users.username, user.username));
    }

    // Delete test organizations
    console.log("📋 Removing test organizations...");
    for (const org of testOrganizations) {
      await db.delete(organizations).where(eq(organizations.id, org.id));
    }

    console.log("✅ Test data cleanup completed!");
  } catch (error) {
    console.error("❌ Error cleaning up test data:", error);
    throw error;
  }
}

// CLI interface
const command = process.argv[2];

if (command === "seed") {
  seedTestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else if (command === "cleanup") {
  cleanupTestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else {
  console.log("Usage:");
  console.log("  npm run seed-test-data seed    - Create test data");
  console.log("  npm run seed-test-data cleanup - Remove test data");
  process.exit(1);
}
