#!/usr/bin/env tsx

/**
 * Environment System Removal Validation Script
 * Validates that all environment-related code has been properly removed
 */

import { db } from "../apps/server/db";
import { users, UserRole } from "../packages/db/schema";
import { eq, or } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

interface ValidationResult {
  category: string;
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

class EnvironmentRemovalValidator {
  private results: ValidationResult[] = [];

  private addResult(
    category: string,
    testName: string,
    passed: boolean,
    message: string,
    details?: any
  ) {
    this.results.push({ category, testName, passed, message, details });
    const status = passed ? "✅" : "❌";
    console.log(`  ${status} ${testName}: ${message}`);
    if (details && !passed) {
      console.log(`     Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async validateDatabaseCleanup(): Promise<void> {
    console.log("\n🗄️  Validating Database Cleanup...");

    try {
      // Check for legacy environment roles in database
      const legacyRoles = [
        "production",
        "development",
        "demo",
        "replit-prod",
        "replit-dev",
        "staging",
        "test",
      ];

      let totalLegacyUsers = 0;
      const legacyUsersByRole: { [role: string]: number } = {};

      for (const role of legacyRoles) {
        const usersWithRole = await db
          .select()
          .from(users)
          .where(eq(users.role, role as any));

        if (usersWithRole.length > 0) {
          legacyUsersByRole[role] = usersWithRole.length;
          totalLegacyUsers += usersWithRole.length;
        }
      }

      this.addResult(
        "Database",
        "Legacy Role Cleanup",
        totalLegacyUsers === 0,
        totalLegacyUsers === 0
          ? "No legacy environment roles found in database"
          : `Found ${totalLegacyUsers} users with legacy roles`,
        legacyUsersByRole
      );

      // Validate all users have valid RBAC roles
      const allUsers = await db.select().from(users);
      const validRoles = Object.values(UserRole);
      const invalidRoleUsers = allUsers.filter(
        (user) => !validRoles.includes(user.role as UserRole)
      );

      this.addResult(
        "Database",
        "RBAC Role Validation",
        invalidRoleUsers.length === 0,
        invalidRoleUsers.length === 0
          ? `All ${allUsers.length} users have valid RBAC roles`
          : `${invalidRoleUsers.length} users have invalid roles`,
        invalidRoleUsers.map((u) => ({ username: u.username, role: u.role }))
      );

      // Check for environment-related fields that should be removed
      const usersWithDemoPermissions = allUsers.filter(
        (user) =>
          user.demoPermissions &&
          Object.keys(user.demoPermissions as any).length > 0 &&
          user.role !== UserRole.DEMO
      );

      this.addResult(
        "Database",
        "Demo Permissions Cleanup",
        usersWithDemoPermissions.length === 0,
        usersWithDemoPermissions.length === 0
          ? "No non-demo users have demo permissions"
          : `${usersWithDemoPermissions.length} non-demo users still have demo permissions`,
        usersWithDemoPermissions.map((u) => ({
          username: u.username,
          role: u.role,
          demoPermissions: u.demoPermissions,
        }))
      );
    } catch (error) {
      this.addResult(
        "Database",
        "Database Validation",
        false,
        `Error: ${error}`,
        error
      );
    }
  }

  async validateCodebaseCleanup(): Promise<void> {
    console.log("\n📁 Validating Codebase Cleanup...");

    try {
      // Search for environment-related code patterns
      const searchPatterns = [
        {
          pattern: /environment.*===.*["']production["']/gi,
          description: "Production environment checks",
        },
        {
          pattern: /environment.*===.*["']development["']/gi,
          description: "Development environment checks",
        },
        {
          pattern: /environment.*===.*["']demo["']/gi,
          description: "Demo environment checks",
        },
        {
          pattern: /environment.*===.*["']replit["']/gi,
          description: "Replit environment checks",
        },
        {
          pattern: /APP_ENVIRONMENT/gi,
          description: "APP_ENVIRONMENT references",
        },
        {
          pattern: /process\.env\.ENVIRONMENT/gi,
          description: "Process environment references",
        },
        {
          pattern: /getEnvironment\(\)/gi,
          description: "getEnvironment function calls",
        },
        {
          pattern: /isProduction\(\)/gi,
          description: "isProduction function calls",
        },
        {
          pattern: /isDevelopment\(\)/gi,
          description: "isDevelopment function calls",
        },
        { pattern: /isDemo\(\)/gi, description: "isDemo function calls" },
        {
          pattern: /role.*===.*["']production["']/gi,
          description: "Production role checks",
        },
        {
          pattern: /role.*===.*["']development["']/gi,
          description: "Development role checks",
        },
        {
          pattern: /role.*===.*["']replit-prod["']/gi,
          description: "Replit production role checks",
        },
        {
          pattern: /role.*===.*["']replit-dev["']/gi,
          description: "Replit development role checks",
        },
      ];

      const filesToSearch = await this.getFilesToSearch();
      const foundPatterns: { [pattern: string]: string[] } = {};

      for (const filePath of filesToSearch) {
        try {
          const content = await fs.readFile(filePath, "utf-8");

          for (const { pattern, description } of searchPatterns) {
            const matches = content.match(pattern);
            if (matches) {
              if (!foundPatterns[description]) {
                foundPatterns[description] = [];
              }
              foundPatterns[description].push(filePath);
            }
          }
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }

      const totalPatterns = Object.keys(foundPatterns).length;
      this.addResult(
        "Codebase",
        "Environment Code Cleanup",
        totalPatterns === 0,
        totalPatterns === 0
          ? `No environment-related code patterns found in ${filesToSearch.length} files`
          : `Found ${totalPatterns} types of environment patterns`,
        foundPatterns
      );

      // Check for specific files that should be removed or updated
      const environmentFiles = [
        "apps/server/utils/environment.ts",
        "apps/server/utils/getEnvironment.ts",
        "apps/server/middleware/environment.ts",
        "packages/shared/environment.ts",
      ];

      const existingEnvFiles = [];
      for (const filePath of environmentFiles) {
        try {
          await fs.access(filePath);
          existingEnvFiles.push(filePath);
        } catch {
          // File doesn't exist, which is good
        }
      }

      this.addResult(
        "Codebase",
        "Environment File Cleanup",
        existingEnvFiles.length === 0,
        existingEnvFiles.length === 0
          ? "No environment-specific files found"
          : `Found ${existingEnvFiles.length} environment files that should be removed`,
        existingEnvFiles
      );
    } catch (error) {
      this.addResult(
        "Codebase",
        "Codebase Validation",
        false,
        `Error: ${error}`,
        error
      );
    }
  }

  async validateConfigurationCleanup(): Promise<void> {
    console.log("\n⚙️  Validating Configuration Cleanup...");

    try {
      // Check environment variables and configuration files
      const configFiles = [
        ".env",
        ".env.local",
        ".env.production",
        ".env.development",
        "apps/server/.env",
        "apps/web/.env",
      ];

      const envVarIssues = [];
      for (const configFile of configFiles) {
        try {
          const content = await fs.readFile(configFile, "utf-8");

          // Check for environment-related variables
          const environmentVars = [
            /APP_ENVIRONMENT=/gi,
            /ENVIRONMENT=/gi,
            /NODE_ENV=production/gi,
            /NODE_ENV=development/gi,
          ];

          for (const pattern of environmentVars) {
            if (pattern.test(content)) {
              envVarIssues.push(
                `${configFile}: Found environment variable pattern`
              );
            }
          }
        } catch {
          // File doesn't exist or can't be read
          continue;
        }
      }

      this.addResult(
        "Configuration",
        "Environment Variable Cleanup",
        envVarIssues.length === 0,
        envVarIssues.length === 0
          ? "No problematic environment variables found"
          : `Found ${envVarIssues.length} environment variable issues`,
        envVarIssues
      );

      // Check package.json scripts for environment-specific commands
      try {
        const packageJsonContent = await fs.readFile("package.json", "utf-8");
        const packageJson = JSON.parse(packageJsonContent);

        const environmentScripts = [];
        if (packageJson.scripts) {
          for (const [scriptName, scriptCommand] of Object.entries(
            packageJson.scripts
          )) {
            const command = scriptCommand as string;
            if (
              command.includes("NODE_ENV=production") ||
              command.includes("NODE_ENV=development") ||
              command.includes("APP_ENVIRONMENT=") ||
              command.includes("ENVIRONMENT=")
            ) {
              environmentScripts.push(`${scriptName}: ${command}`);
            }
          }
        }

        this.addResult(
          "Configuration",
          "Package.json Script Cleanup",
          environmentScripts.length === 0,
          environmentScripts.length === 0
            ? "No environment-specific scripts found"
            : `Found ${environmentScripts.length} environment-specific scripts`,
          environmentScripts
        );
      } catch (error) {
        this.addResult(
          "Configuration",
          "Package.json Validation",
          false,
          `Error reading package.json: ${error}`
        );
      }
    } catch (error) {
      this.addResult(
        "Configuration",
        "Configuration Validation",
        false,
        `Error: ${error}`,
        error
      );
    }
  }

  async validatePermissionSystemIntegrity(): Promise<void> {
    console.log("\n🔐 Validating Permission System Integrity...");

    try {
      // Test that permission system works without environment dependencies
      const testUsers = await db.select().from(users).limit(5);

      let permissionTestsPassed = 0;
      let permissionTestsFailed = 0;

      for (const user of testUsers) {
        try {
          // Import and test permission gate
          const { rbacPermissionGate } = await import(
            "../apps/server/permissions/rbac-permission-gate"
          );

          // Test basic permission check
          const permissions = rbacPermissionGate.getUserPermissions(
            user.role as UserRole,
            user.assignedModules as any,
            user.maxReports
          );

          if (
            permissions &&
            typeof permissions.canCreateReports === "boolean"
          ) {
            permissionTestsPassed++;
          } else {
            permissionTestsFailed++;
          }
        } catch (error) {
          permissionTestsFailed++;
        }
      }

      this.addResult(
        "Permissions",
        "Permission System Functionality",
        permissionTestsFailed === 0,
        permissionTestsFailed === 0
          ? `All ${permissionTestsPassed} permission tests passed`
          : `${permissionTestsFailed} permission tests failed`,
        { passed: permissionTestsPassed, failed: permissionTestsFailed }
      );

      // Validate that all roles have proper permission definitions
      const validRoles = Object.values(UserRole);
      const rolePermissionTests = [];

      for (const role of validRoles) {
        try {
          const { rbacPermissionGate } = await import(
            "../apps/server/permissions/rbac-permission-gate"
          );
          const permissions = rbacPermissionGate.getUserPermissions(
            role,
            [],
            -1
          );

          if (
            permissions &&
            typeof permissions.canCreateReports === "boolean"
          ) {
            rolePermissionTests.push({ role, status: "valid" });
          } else {
            rolePermissionTests.push({ role, status: "invalid" });
          }
        } catch (error) {
          rolePermissionTests.push({
            role,
            status: "error",
            error: error.message,
          });
        }
      }

      const invalidRoles = rolePermissionTests.filter(
        (test) => test.status !== "valid"
      );

      this.addResult(
        "Permissions",
        "Role Permission Definitions",
        invalidRoles.length === 0,
        invalidRoles.length === 0
          ? `All ${validRoles.length} roles have valid permission definitions`
          : `${invalidRoles.length} roles have invalid permission definitions`,
        invalidRoles
      );
    } catch (error) {
      this.addResult(
        "Permissions",
        "Permission System Validation",
        false,
        `Error: ${error}`,
        error
      );
    }
  }

  private async getFilesToSearch(): Promise<string[]> {
    const filesToSearch: string[] = [];

    const searchDirectories = [
      "apps/server",
      "apps/web",
      "packages",
      "scripts",
    ];

    for (const dir of searchDirectories) {
      try {
        await this.addFilesFromDirectory(dir, filesToSearch);
      } catch {
        // Directory doesn't exist or can't be read
        continue;
      }
    }

    return filesToSearch;
  }

  private async addFilesFromDirectory(
    dirPath: string,
    fileList: string[]
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules and other irrelevant directories
          if (
            !["node_modules", ".git", "dist", "build", ".next"].includes(
              entry.name
            )
          ) {
            await this.addFilesFromDirectory(fullPath, fileList);
          }
        } else if (entry.isFile()) {
          // Only search relevant file types
          const ext = path.extname(entry.name).toLowerCase();
          if ([".ts", ".tsx", ".js", ".jsx", ".json"].includes(ext)) {
            fileList.push(fullPath);
          }
        }
      }
    } catch {
      // Skip directories that can't be read
    }
  }

  getSummary(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    results: ValidationResult[];
  } {
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
    console.log("🧹 ENVIRONMENT SYSTEM REMOVAL VALIDATION SUMMARY");
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
      const failedByCategory: { [category: string]: ValidationResult[] } = {};

      summary.results
        .filter((r) => !r.passed)
        .forEach((result) => {
          if (!failedByCategory[result.category]) {
            failedByCategory[result.category] = [];
          }
          failedByCategory[result.category].push(result);
        });

      for (const [category, failures] of Object.entries(failedByCategory)) {
        console.log(`\n  ${category}:`);
        failures.forEach((failure) => {
          console.log(`    • ${failure.testName}: ${failure.message}`);
        });
      }
    }

    console.log("\n" + "=".repeat(60));

    if (summary.failedTests === 0) {
      console.log(
        "🎉 ALL TESTS PASSED! Environment system has been completely removed."
      );
    } else {
      console.log(
        "⚠️  Some tests failed. Please review and fix the issues above."
      );
    }
  }
}

async function validateEnvironmentRemoval() {
  console.log("🧪 Starting Environment System Removal Validation...");
  console.log(
    "This will validate that all environment-related code has been properly removed.\n"
  );

  const validator = new EnvironmentRemovalValidator();

  try {
    await validator.validateDatabaseCleanup();
    await validator.validateCodebaseCleanup();
    await validator.validateConfigurationCleanup();
    await validator.validatePermissionSystemIntegrity();

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
  validateEnvironmentRemoval();
}

export { EnvironmentRemovalValidator, validateEnvironmentRemoval };
