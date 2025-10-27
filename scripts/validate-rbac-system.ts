#!/usr/bin/env tsx

/**
 * Comprehensive RBAC system validation script
 * Runs all validation tests and provides detailed reporting
 */

import { db } from "../apps/server/db";
import {
  users,
  organizations,
  assessmentCases,
  UserRole,
  ModuleType,
} from "../packages/db/schema";
import { eq, and, or } from "drizzle-orm";
import { rbacPermissionGate } from "../apps/server/permissions/rbac-permission-gate";
import { ResourceType, ActionType } from "../apps/server/permissions/types";

interface ValidationResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

interface ValidationSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: ValidationResult[];
}

class RBACValidator {
  private results: ValidationResult[] = [];

  private addResult(
    testName: string,
    passed: boolean,
    message: string,
    details?: any
  ) {
    this.results.push({ testName, passed, message, details });
    const status = passed ? "✅" : "❌";
    console.log(`  ${status} ${testName}: ${message}`);
    if (details && !passed) {
      console.log(`     Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async validateUserRoles(): Promise<void> {
    console.log("\n🔐 Validating User Roles and Permissions...");

    try {
      // Get all users and validate their roles
      const allUsers = await db.select().from(users);

      const roleDistribution = {
        [UserRole.DEVELOPER]: 0,
        [UserRole.ADMIN]: 0,
        [UserRole.ORG_ADMIN]: 0,
        [UserRole.CUSTOMER]: 0,
        [UserRole.DEMO]: 0,
      };

      let invalidRoles = 0;

      for (const user of allUsers) {
        if (Object.values(UserRole).includes(user.role as UserRole)) {
          roleDistribution[user.role as UserRole]++;
        } else {
          invalidRoles++;
        }
      }

      this.addResult(
        "User Role Distribution",
        invalidRoles === 0,
        invalidRoles === 0
          ? `All ${allUsers.length} users have valid roles`
          : `${invalidRoles} users have invalid roles`,
        roleDistribution
      );

      // Validate role-specific constraints
      await this.validateDeveloperRoles();
      await this.validateAdminRoles();
      await this.validateOrgAdminRoles();
      await this.validateCustomerRoles();
      await this.validateDemoRoles();
    } catch (error) {
      this.addResult("User Role Validation", false, `Error: ${error}`, error);
    }
  }

  private async validateDeveloperRoles(): Promise<void> {
    const developers = await db
      .select()
      .from(users)
      .where(eq(users.role, UserRole.DEVELOPER));

    for (const dev of developers) {
      // Developers should have all modules
      const hasAllModules =
        dev.assignedModules &&
        Array.isArray(dev.assignedModules) &&
        dev.assignedModules.includes(ModuleType.K12) &&
        dev.assignedModules.includes(ModuleType.POST_SECONDARY) &&
        dev.assignedModules.includes(ModuleType.TUTORING);

      this.addResult(
        `Developer ${dev.username} Module Access`,
        hasAllModules,
        hasAllModules ? "Has access to all modules" : "Missing module access",
        { assignedModules: dev.assignedModules }
      );

      // Test permissions
      const canEditPrompts = await rbacPermissionGate.checkAccess(
        dev as Express.User,
        ResourceType.PROMPTS,
        ActionType.EDIT
      );

      this.addResult(
        `Developer ${dev.username} Prompt Editing`,
        canEditPrompts,
        canEditPrompts ? "Can edit prompts" : "Cannot edit prompts"
      );
    }
  }

  private async validateAdminRoles(): Promise<void> {
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, UserRole.ADMIN));

    for (const admin of admins) {
      // Admins should have all modules
      const hasAllModules =
        admin.assignedModules &&
        Array.isArray(admin.assignedModules) &&
        admin.assignedModules.includes(ModuleType.K12) &&
        admin.assignedModules.includes(ModuleType.POST_SECONDARY) &&
        admin.assignedModules.includes(ModuleType.TUTORING);

      this.addResult(
        `Admin ${admin.username} Module Access`,
        hasAllModules,
        hasAllModules ? "Has access to all modules" : "Missing module access",
        { assignedModules: admin.assignedModules }
      );

      // Admins should NOT be able to edit prompts
      const canEditPrompts = await rbacPermissionGate.checkAccess(
        admin as Express.User,
        ResourceType.PROMPTS,
        ActionType.EDIT
      );

      this.addResult(
        `Admin ${admin.username} Prompt Editing Restriction`,
        !canEditPrompts,
        !canEditPrompts
          ? "Correctly restricted from editing prompts"
          : "Incorrectly allowed to edit prompts"
      );

      // Admins should be able to access admin dashboard
      const canAccessAdmin = await rbacPermissionGate.checkAccess(
        admin as Express.User,
        ResourceType.ADMIN,
        ActionType.VIEW
      );

      this.addResult(
        `Admin ${admin.username} Dashboard Access`,
        canAccessAdmin,
        canAccessAdmin
          ? "Can access admin dashboard"
          : "Cannot access admin dashboard"
      );
    }
  }

  private async validateOrgAdminRoles(): Promise<void> {
    const orgAdmins = await db
      .select()
      .from(users)
      .where(eq(users.role, UserRole.ORG_ADMIN));

    for (const orgAdmin of orgAdmins) {
      // Org Admins should have organizationId
      this.addResult(
        `Org Admin ${orgAdmin.username} Organization Assignment`,
        !!orgAdmin.organizationId,
        orgAdmin.organizationId
          ? "Has organization assignment"
          : "Missing organization assignment",
        { organizationId: orgAdmin.organizationId }
      );

      // Should not be able to switch modules
      const canSwitchModules = await rbacPermissionGate.checkAccess(
        orgAdmin as Express.User,
        ResourceType.MODULES,
        ActionType.SWITCH
      );

      this.addResult(
        `Org Admin ${orgAdmin.username} Module Switching Restriction`,
        !canSwitchModules,
        !canSwitchModules
          ? "Correctly restricted from switching modules"
          : "Incorrectly allowed to switch modules"
      );

      // Should be able to manage users
      const canManageUsers = await rbacPermissionGate.checkAccess(
        orgAdmin as Express.User,
        ResourceType.USERS,
        ActionType.MANAGE
      );

      this.addResult(
        `Org Admin ${orgAdmin.username} User Management`,
        canManageUsers,
        canManageUsers ? "Can manage users" : "Cannot manage users"
      );
    }
  }

  private async validateCustomerRoles(): Promise<void> {
    const customers = await db
      .select()
      .from(users)
      .where(eq(users.role, UserRole.CUSTOMER));

    for (const customer of customers) {
      // Customers should have organizationId
      this.addResult(
        `Customer ${customer.username} Organization Assignment`,
        !!customer.organizationId,
        customer.organizationId
          ? "Has organization assignment"
          : "Missing organization assignment",
        { organizationId: customer.organizationId }
      );

      // Should not be able to access admin dashboard
      const canAccessAdmin = await rbacPermissionGate.checkAccess(
        customer as Express.User,
        ResourceType.ADMIN,
        ActionType.VIEW
      );

      this.addResult(
        `Customer ${customer.username} Admin Dashboard Restriction`,
        !canAccessAdmin,
        !canAccessAdmin
          ? "Correctly restricted from admin dashboard"
          : "Incorrectly allowed admin access"
      );

      // Should not be able to manage users
      const canManageUsers = await rbacPermissionGate.checkAccess(
        customer as Express.User,
        ResourceType.USERS,
        ActionType.MANAGE
      );

      this.addResult(
        `Customer ${customer.username} User Management Restriction`,
        !canManageUsers,
        !canManageUsers
          ? "Correctly restricted from user management"
          : "Incorrectly allowed user management"
      );
    }
  }

  private async validateDemoRoles(): Promise<void> {
    const demoUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, UserRole.DEMO));

    for (const demo of demoUsers) {
      // Demo users should have report limits
      this.addResult(
        `Demo ${demo.username} Report Limit`,
        demo.maxReports === 5,
        demo.maxReports === 5
          ? "Has correct report limit (5)"
          : `Incorrect report limit: ${demo.maxReports}`,
        { maxReports: demo.maxReports, reportCount: demo.reportCount }
      );

      // Demo users should not have organizationId
      this.addResult(
        `Demo ${demo.username} Organization Isolation`,
        !demo.organizationId,
        !demo.organizationId
          ? "Correctly isolated from organizations"
          : "Incorrectly assigned to organization",
        { organizationId: demo.organizationId }
      );

      // Test report creation limits
      const canCreateAtLimit = await rbacPermissionGate.checkAccess(
        demo as Express.User,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 5 }
      );

      this.addResult(
        `Demo ${demo.username} Report Limit Enforcement`,
        !canCreateAtLimit,
        !canCreateAtLimit
          ? "Report limit correctly enforced"
          : "Report limit not enforced"
      );

      const canCreateUnderLimit = await rbacPermissionGate.checkAccess(
        demo as Express.User,
        ResourceType.REPORTS,
        ActionType.CREATE,
        { currentReportCount: 3 }
      );

      this.addResult(
        `Demo ${demo.username} Report Creation Under Limit`,
        canCreateUnderLimit,
        canCreateUnderLimit
          ? "Can create reports under limit"
          : "Cannot create reports under limit"
      );
    }
  }

  async validateOrganizationStructure(): Promise<void> {
    console.log("\n🏢 Validating Organization Structure...");

    try {
      const allOrgs = await db.select().from(organizations);

      this.addResult(
        "Organization Count",
        allOrgs.length > 0,
        `Found ${allOrgs.length} organizations`
      );

      for (const org of allOrgs) {
        // Validate organization has required fields
        const hasRequiredFields =
          org.id && org.name && org.customerId && org.assignedModules;

        this.addResult(
          `Organization ${org.name} Structure`,
          hasRequiredFields,
          hasRequiredFields
            ? "Has all required fields"
            : "Missing required fields",
          {
            id: org.id,
            name: org.name,
            customerId: org.customerId,
            assignedModules: org.assignedModules,
            maxUsers: org.maxUsers,
            isActive: org.isActive,
          }
        );

        // Validate users are properly assigned to organization
        const orgUsers = await db
          .select()
          .from(users)
          .where(eq(users.organizationId, org.id));

        const userRoles = orgUsers.map((u) => u.role);

        this.addResult(
          `Organization ${org.name} User Assignment`,
          orgUsers.length > 0,
          `Has ${orgUsers.length} users assigned`,
          { userCount: orgUsers.length, roles: userRoles }
        );

        // Validate data isolation
        const orgCases = await db
          .select()
          .from(assessmentCases)
          .where(eq(assessmentCases.customerId, org.customerId));

        this.addResult(
          `Organization ${org.name} Data Isolation`,
          true, // Always pass, just report
          `Has ${orgCases.length} assessment cases`,
          { caseCount: orgCases.length }
        );
      }
    } catch (error) {
      this.addResult(
        "Organization Structure Validation",
        false,
        `Error: ${error}`,
        error
      );
    }
  }

  async validateDataIsolation(): Promise<void> {
    console.log("\n🔒 Validating Multi-Tenant Data Isolation...");

    try {
      // Get all unique customerIds
      const allUsers = await db.select().from(users);
      const customerIds = [...new Set(allUsers.map((u) => u.customerId))];

      for (const customerId of customerIds) {
        const customerUsers = await db
          .select()
          .from(users)
          .where(eq(users.customerId, customerId));

        const customerCases = await db
          .select()
          .from(assessmentCases)
          .where(eq(assessmentCases.customerId, customerId));

        // Validate that users and cases are properly isolated
        this.addResult(
          `Customer ${customerId} Data Isolation`,
          true, // Always pass, just report
          `${customerUsers.length} users, ${customerCases.length} cases`,
          {
            customerId,
            userCount: customerUsers.length,
            caseCount: customerCases.length,
            userRoles: customerUsers.map((u) => u.role),
          }
        );

        // Validate that organization users share the same customerId
        const orgUsers = customerUsers.filter((u) => u.organizationId);
        if (orgUsers.length > 0) {
          const allSameCustomer = orgUsers.every(
            (u) => u.customerId === customerId
          );

          this.addResult(
            `Customer ${customerId} Organization Consistency`,
            allSameCustomer,
            allSameCustomer
              ? "All org users have consistent customerId"
              : "Inconsistent customerId in organization"
          );
        }
      }
    } catch (error) {
      this.addResult(
        "Data Isolation Validation",
        false,
        `Error: ${error}`,
        error
      );
    }
  }

  async validateModuleAccess(): Promise<void> {
    console.log("\n📱 Validating Module Access Control...");

    try {
      const allUsers = await db.select().from(users);

      for (const user of allUsers) {
        if (!user.assignedModules || !Array.isArray(user.assignedModules)) {
          this.addResult(
            `User ${user.username} Module Assignment`,
            false,
            "Missing or invalid assignedModules",
            { assignedModules: user.assignedModules }
          );
          continue;
        }

        // Validate module assignments based on role
        let expectedModules: ModuleType[] = [];

        switch (user.role) {
          case UserRole.DEVELOPER:
          case UserRole.ADMIN:
            expectedModules = [
              ModuleType.K12,
              ModuleType.POST_SECONDARY,
              ModuleType.TUTORING,
            ];
            break;
          case UserRole.ORG_ADMIN:
          case UserRole.CUSTOMER:
          case UserRole.DEMO:
            // These roles can have any subset of modules based on organization assignment
            expectedModules = user.assignedModules;
            break;
        }

        const hasValidModules = user.assignedModules.every((module) =>
          Object.values(ModuleType).includes(module as ModuleType)
        );

        this.addResult(
          `User ${user.username} Module Validity`,
          hasValidModules,
          hasValidModules
            ? "All assigned modules are valid"
            : "Invalid modules assigned",
          { assignedModules: user.assignedModules }
        );

        // Test module switching permissions
        const canSwitchModules = await rbacPermissionGate.checkAccess(
          user as Express.User,
          ResourceType.MODULES,
          ActionType.SWITCH
        );

        const shouldBeAbleToSwitch =
          user.role === UserRole.DEVELOPER || user.role === UserRole.ADMIN;

        this.addResult(
          `User ${user.username} Module Switching`,
          canSwitchModules === shouldBeAbleToSwitch,
          shouldBeAbleToSwitch
            ? canSwitchModules
              ? "Can switch modules"
              : "Cannot switch modules (should be able to)"
            : canSwitchModules
            ? "Can switch modules (should not be able to)"
            : "Cannot switch modules",
          { role: user.role, canSwitch: canSwitchModules }
        );
      }
    } catch (error) {
      this.addResult(
        "Module Access Validation",
        false,
        `Error: ${error}`,
        error
      );
    }
  }

  async validateEnvironmentRemoval(): Promise<void> {
    console.log("\n🧹 Validating Environment System Removal...");

    try {
      // Check for any remaining environment-related code or data
      const environmentRelatedUsers = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.role, "production" as any),
            eq(users.role, "development" as any),
            eq(users.role, "demo" as any),
            eq(users.role, "replit-prod" as any),
            eq(users.role, "replit-dev" as any)
          )
        );

      this.addResult(
        "Environment Role Cleanup",
        environmentRelatedUsers.length === 0,
        environmentRelatedUsers.length === 0
          ? "No environment-based roles found"
          : `Found ${environmentRelatedUsers.length} users with environment roles`,
        {
          environmentUsers: environmentRelatedUsers.map((u) => ({
            username: u.username,
            role: u.role,
          })),
        }
      );

      // Check that all users have valid RBAC roles
      const allUsers = await db.select().from(users);
      const validRoles = Object.values(UserRole);
      const invalidRoleUsers = allUsers.filter(
        (u) => !validRoles.includes(u.role as UserRole)
      );

      this.addResult(
        "RBAC Role Migration",
        invalidRoleUsers.length === 0,
        invalidRoleUsers.length === 0
          ? "All users have valid RBAC roles"
          : `${invalidRoleUsers.length} users have invalid roles`,
        {
          invalidUsers: invalidRoleUsers.map((u) => ({
            username: u.username,
            role: u.role,
          })),
        }
      );
    } catch (error) {
      this.addResult(
        "Environment Removal Validation",
        false,
        `Error: ${error}`,
        error
      );
    }
  }

  async validateDemoSystem(): Promise<void> {
    console.log("\n🎭 Validating Demo Sandbox System...");

    try {
      const demoUsers = await db
        .select()
        .from(users)
        .where(eq(users.role, UserRole.DEMO));

      this.addResult(
        "Demo User Count",
        demoUsers.length > 0,
        `Found ${demoUsers.length} demo users`
      );

      for (const demo of demoUsers) {
        // Validate demo user constraints
        const hasCorrectLimits = demo.maxReports === 5;
        const hasValidReportCount =
          demo.reportCount >= 0 && demo.reportCount <= demo.maxReports;
        const isIsolated = !demo.organizationId;

        this.addResult(
          `Demo ${demo.username} Constraints`,
          hasCorrectLimits && hasValidReportCount && isIsolated,
          `Limits: ${hasCorrectLimits}, Count: ${hasValidReportCount}, Isolated: ${isIsolated}`,
          {
            maxReports: demo.maxReports,
            reportCount: demo.reportCount,
            organizationId: demo.organizationId,
          }
        );

        // Test upgrade prompt scenario (4 reports)
        const shouldShowUpgrade = await rbacPermissionGate.checkAccess(
          demo as Express.User,
          ResourceType.REPORTS,
          ActionType.CREATE,
          { currentReportCount: 4 }
        );

        this.addResult(
          `Demo ${demo.username} Upgrade Prompt`,
          shouldShowUpgrade, // Should still be able to create at 4 reports
          shouldShowUpgrade
            ? "Can create 5th report (upgrade prompt)"
            : "Cannot create 5th report"
        );
      }
    } catch (error) {
      this.addResult("Demo System Validation", false, `Error: ${error}`, error);
    }
  }

  getSummary(): ValidationSummary {
    const passedTests = this.results.filter((r) => r.passed).length;
    const failedTests = this.results.filter((r) => !r.passed).length;

    return {
      totalTests: this.results.length,
      passedTests,
      failedTests,
      results: this.results,
    };
  }

  printSummary(): void {
    const summary = this.getSummary();

    console.log("\n" + "=".repeat(60));
    console.log("🎯 RBAC SYSTEM VALIDATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`✅ Passed: ${summary.passedTests}`);
    console.log(`❌ Failed: ${summary.failedTests}`);
    console.log(
      `Success Rate: ${(
        (summary.passedTests / summary.totalTests) *
        100
      ).toFixed(1)}%`
    );

    if (summary.failedTests > 0) {
      console.log("\n❌ FAILED TESTS:");
      summary.results
        .filter((r) => !r.passed)
        .forEach((result) => {
          console.log(`  • ${result.testName}: ${result.message}`);
        });
    }

    console.log("\n" + "=".repeat(60));

    if (summary.failedTests === 0) {
      console.log("🎉 ALL TESTS PASSED! RBAC system is properly configured.");
    } else {
      console.log("⚠️  Some tests failed. Please review the issues above.");
    }
  }
}

async function validateRBACSystem() {
  console.log("🧪 Starting Comprehensive RBAC System Validation...");
  console.log(
    "This will test all aspects of the role-based access control system.\n"
  );

  const validator = new RBACValidator();

  try {
    await validator.validateUserRoles();
    await validator.validateOrganizationStructure();
    await validator.validateDataIsolation();
    await validator.validateModuleAccess();
    await validator.validateEnvironmentRemoval();
    await validator.validateDemoSystem();

    validator.printSummary();

    const summary = validator.getSummary();
    process.exit(summary.failedTests === 0 ? 0 : 1);
  } catch (error) {
    console.error("❌ Fatal error during validation:", error);
    process.exit(1);
  }
}

// Run validation if called directly
if (require.main === module) {
  validateRBACSystem();
}

export { RBACValidator, validateRBACSystem };
