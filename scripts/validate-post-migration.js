#!/usr/bin/env node

/**
 * Post-Migration Validation Script
 *
 * This script validates that all functionality works correctly after
 * the Replit migration cleanup. It performs comprehensive checks on
 * the application architecture, environment configurations, and core features.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

class PostMigrationValidator {
  constructor() {
    this.validationResults = [];
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Main validation execution
   */
  async run() {
    console.log("🔍 Starting post-migration validation...\n");

    try {
      // Core validation checks
      await this.validateEnvironmentConfiguration();
      await this.validateDatabaseConfiguration();
      await this.validateApplicationStructure();
      await this.validateDependencies();
      await this.validateDocumentation();
      await this.validateBuildProcess();

      // Report results
      this.generateReport();
    } catch (error) {
      console.error("❌ Validation failed:", error);
      process.exit(1);
    }
  }

  /**
   * Validate environment configuration
   */
  async validateEnvironmentConfiguration() {
    console.log("🌍 Validating environment configuration...");

    // Check environment type definitions
    const envTypesPath = path.join(rootDir, "packages/db/environment.ts");
    if (fs.existsSync(envTypesPath)) {
      const content = fs.readFileSync(envTypesPath, "utf8");

      if (content.includes("replit-prod") || content.includes("replit-dev")) {
        this.errors.push("Environment types still contain Replit references");
      } else {
        this.validationResults.push(
          "✅ Environment types cleaned of Replit references"
        );
      }

      if (
        (content.includes("'production'") ||
          content.includes('"production"')) &&
        (content.includes("'development'") || content.includes('"development"'))
      ) {
        this.validationResults.push(
          "✅ Standard production/development environments defined"
        );
      } else {
        this.errors.push(
          "Missing standard production/development environment types"
        );
      }
    } else {
      this.errors.push("Environment types file not found");
    }

    // Check deployment configuration
    const deploymentPath = path.join(
      rootDir,
      "apps/web/src/config/deployment.ts"
    );
    if (fs.existsSync(deploymentPath)) {
      const content = fs.readFileSync(deploymentPath, "utf8");

      if (content.includes("replit-prod")) {
        this.errors.push("Deployment config still contains Replit references");
      } else {
        this.validationResults.push("✅ Deployment configuration cleaned");
      }
    }

    // Check environment context
    const contextPath = path.join(
      rootDir,
      "apps/web/src/contexts/EnvironmentContext.tsx"
    );
    if (fs.existsSync(contextPath)) {
      const content = fs.readFileSync(contextPath, "utf8");

      if (content.includes("replit-prod")) {
        this.errors.push(
          "Environment context still contains Replit references"
        );
      } else {
        this.validationResults.push("✅ Environment context cleaned");
      }
    }
  }

  /**
   * Validate database configuration
   */
  async validateDatabaseConfiguration() {
    console.log("🗄️  Validating database configuration...");

    // Check database constants
    const constantsPath = path.join(
      rootDir,
      "packages/db/constants/environments.ts"
    );
    if (fs.existsSync(constantsPath)) {
      const content = fs.readFileSync(constantsPath, "utf8");

      if (content.includes("replit-prod") || content.includes("replit-dev")) {
        this.errors.push("Database constants still contain Replit references");
      } else {
        this.validationResults.push("✅ Database constants cleaned");
      }
    }

    // Check server routes for database references
    const routeFiles = [
      "apps/server/routes/analysis-routes.ts",
      "apps/server/routes/assessment-case-routes.ts",
      "apps/server/routes/config-routes.ts",
      "apps/server/storage.ts",
    ];

    for (const routeFile of routeFiles) {
      const filePath = path.join(rootDir, routeFile);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");

        if (content.includes("replit-prod") || content.includes("replit-dev")) {
          this.errors.push(`${routeFile} still contains Replit references`);
        } else {
          this.validationResults.push(`✅ ${routeFile} cleaned`);
        }
      }
    }
  }

  /**
   * Validate application structure
   */
  async validateApplicationStructure() {
    console.log("🏗️  Validating application structure...");

    // Check that .replit file was removed
    const replitFile = path.join(rootDir, ".replit");
    if (fs.existsSync(replitFile)) {
      this.errors.push(".replit configuration file still exists");
    } else {
      this.validationResults.push("✅ .replit configuration file removed");
    }

    // Check essential directories exist
    const essentialDirs = ["apps/server", "apps/web", "packages/db", "scripts"];

    for (const dir of essentialDirs) {
      const dirPath = path.join(rootDir, dir);
      if (fs.existsSync(dirPath)) {
        this.validationResults.push(`✅ ${dir} directory exists`);
      } else {
        this.errors.push(`Missing essential directory: ${dir}`);
      }
    }

    // Check package.json structure
    const rootPackage = path.join(rootDir, "package.json");
    if (fs.existsSync(rootPackage)) {
      const content = JSON.parse(fs.readFileSync(rootPackage, "utf8"));

      if (content.workspaces && content.workspaces.includes("apps/*")) {
        this.validationResults.push("✅ Workspace configuration valid");
      } else {
        this.errors.push("Invalid workspace configuration");
      }
    }
  }

  /**
   * Validate dependencies
   */
  async validateDependencies() {
    console.log("📦 Validating dependencies...");

    // Check for Replit-specific dependencies
    const packageFiles = [
      "package.json",
      "apps/server/package.json",
      "apps/web/package.json",
    ];

    for (const packageFile of packageFiles) {
      const filePath = path.join(rootDir, packageFile);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");

        if (content.includes("@replit/")) {
          this.errors.push(
            `${packageFile} contains Replit-specific dependencies`
          );
        } else {
          this.validationResults.push(
            `✅ ${packageFile} clean of Replit dependencies`
          );
        }
      }
    }

    // Check for essential production dependencies
    const serverPackage = path.join(rootDir, "apps/server/package.json");
    if (fs.existsSync(serverPackage)) {
      const content = JSON.parse(fs.readFileSync(serverPackage, "utf8"));
      const deps = content.dependencies || {};

      const essentialDeps = ["express", "openai", "@google-cloud/storage"];
      for (const dep of essentialDeps) {
        if (deps[dep]) {
          this.validationResults.push(`✅ Essential dependency ${dep} present`);
        } else {
          this.errors.push(`Missing essential dependency: ${dep}`);
        }
      }
    }
  }

  /**
   * Validate documentation
   */
  async validateDocumentation() {
    console.log("📚 Validating documentation...");

    const docFiles = ["README.md", "LOCAL_SETUP.md", "claude.md"];

    for (const docFile of docFiles) {
      const filePath = path.join(rootDir, docFile);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");

        // Check for updated references
        if (
          content.includes("Production Hosting") ||
          content.includes("production environment")
        ) {
          this.validationResults.push(
            `✅ ${docFile} updated with production references`
          );
        }

        // Check for remaining Replit references (some may be intentional in migration docs)
        const replitCount = (content.match(/replit/gi) || []).length;
        if (replitCount > 0) {
          this.warnings.push(
            `${docFile} contains ${replitCount} Replit references (may be intentional)`
          );
        }
      } else {
        this.warnings.push(`Documentation file ${docFile} not found`);
      }
    }
  }

  /**
   * Validate build process
   */
  async validateBuildProcess() {
    console.log("🔨 Validating build process...");

    try {
      // Check if dependencies can be installed
      console.log("   Installing dependencies...");
      execSync("npm install", { cwd: rootDir, stdio: "pipe" });
      this.validationResults.push("✅ Dependencies install successfully");

      // Check if TypeScript compiles
      console.log("   Checking TypeScript compilation...");
      execSync("npm run check", { cwd: rootDir, stdio: "pipe" });
      this.validationResults.push("✅ TypeScript compilation successful");

      // Check if build process works
      console.log("   Testing build process...");
      execSync("npm run build", { cwd: rootDir, stdio: "pipe" });
      this.validationResults.push("✅ Build process successful");
    } catch (error) {
      this.errors.push(`Build process failed: ${error.message}`);
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    console.log("\n📋 Post-Migration Validation Report");
    console.log("=====================================\n");

    // Summary
    console.log(`🎯 Summary:`);
    console.log(`   - Validations passed: ${this.validationResults.length}`);
    console.log(`   - Errors found: ${this.errors.length}`);
    console.log(`   - Warnings: ${this.warnings.length}\n`);

    // Successful validations
    if (this.validationResults.length > 0) {
      console.log("✅ Successful Validations:");
      this.validationResults.forEach((result) => {
        console.log(`   ${result}`);
      });
      console.log("");
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log("⚠️  Warnings:");
      this.warnings.forEach((warning) => {
        console.log(`   ${warning}`);
      });
      console.log("");
    }

    // Errors
    if (this.errors.length > 0) {
      console.log("❌ Errors Found:");
      this.errors.forEach((error) => {
        console.log(`   ${error}`);
      });
      console.log("");
    }

    // Overall result
    if (this.errors.length === 0) {
      console.log("🎉 Post-migration validation PASSED!");
      console.log("   The application is ready for production deployment.");
    } else {
      console.log("💥 Post-migration validation FAILED!");
      console.log("   Please address the errors above before proceeding.");
      process.exit(1);
    }

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.validationResults.length,
        errors: this.errors.length,
        warnings: this.warnings.length,
      },
      validations: this.validationResults,
      errors: this.errors,
      warnings: this.warnings,
    };

    const reportPath = path.join(
      rootDir,
      "post-migration-validation-report.json"
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(
      `\n📄 Detailed report saved to: post-migration-validation-report.json`
    );
  }
}

// Run the validator
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new PostMigrationValidator();
  validator.run().catch((error) => {
    console.error("❌ Validation error:", error);
    process.exit(1);
  });
}

export default PostMigrationValidator;
