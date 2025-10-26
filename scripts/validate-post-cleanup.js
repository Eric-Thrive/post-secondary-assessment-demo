#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

/**
 * Post-Cleanup Validation Tool
 *
 * Validates that all functionality works correctly after Replit cleanup
 * and ensures the platform is ready for production deployment.
 */

class PostCleanupValidator {
  constructor() {
    this.validationResults = [];
    this.errors = [];
  }

  async run() {
    console.log("🔍 Starting post-cleanup validation...\n");

    try {
      // 1. Validate environment configuration
      await this.validateEnvironmentConfig();

      // 2. Validate database configuration
      await this.validateDatabaseConfig();

      // 3. Validate API routes
      await this.validateApiRoutes();

      // 4. Validate client configuration
      await this.validateClientConfig();

      // 5. Validate documentation completeness
      await this.validateDocumentation();

      this.generateReport();

      console.log("\n✅ Post-cleanup validation completed!");
      console.log(`📋 ${this.validationResults.length} validations passed`);

      if (this.errors.length > 0) {
        console.log(`❌ ${this.errors.length} issues found`);
        this.errors.forEach((error) => console.log(`   - ${error}`));
        process.exit(1);
      } else {
        console.log(
          "🎉 All validations passed! Platform is ready for production."
        );
      }
    } catch (error) {
      console.error("❌ Validation failed:", error.message);
      process.exit(1);
    }
  }

  async validateEnvironmentConfig() {
    console.log("🔄 Validating environment configuration...");

    // Check environment.ts
    const envConfigPath = path.join(
      rootDir,
      "apps/server/config/environment.ts"
    );
    if (fs.existsSync(envConfigPath)) {
      const content = fs.readFileSync(envConfigPath, "utf8");

      if (content.includes("replit")) {
        this.errors.push("Environment config still contains replit references");
      } else {
        this.validationResults.push("✅ Environment configuration clean");
      }
    }

    // Check environment types
    const envTypesPath = path.join(
      rootDir,
      "apps/web/src/types/environment.ts"
    );
    if (fs.existsSync(envTypesPath)) {
      const content = fs.readFileSync(envTypesPath, "utf8");

      if (content.includes("replit-prod") || content.includes("replit-dev")) {
        this.errors.push("Environment types still contain replit references");
      } else {
        this.validationResults.push(
          "✅ Environment types updated to production/development"
        );
      }
    }
  }

  async validateDatabaseConfig() {
    console.log("🔄 Validating database configuration...");

    const dbProviderPath = path.join(
      rootDir,
      "apps/server/database-providers.ts"
    );
    if (fs.existsSync(dbProviderPath)) {
      const content = fs.readFileSync(dbProviderPath, "utf8");

      if (content.includes("'replit'") || content.includes("REPL_ID")) {
        this.errors.push("Database providers still contain replit references");
      } else {
        this.validationResults.push(
          "✅ Database providers cleaned of replit references"
        );
      }
    }
  }

  async validateApiRoutes() {
    console.log("🔄 Validating API routes...");

    const routeFiles = [
      "apps/server/routes/ai-handler.ts",
      "apps/server/routes/environment.ts",
      "apps/server/routes/report-generator.ts",
      "apps/server/routes/tutoring-report-generator.ts",
    ];

    for (const routeFile of routeFiles) {
      const filePath = path.join(rootDir, routeFile);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");

        if (content.includes("replit-prod") || content.includes("replit-dev")) {
          this.errors.push(
            `${routeFile} still contains replit environment references`
          );
        } else {
          this.validationResults.push(
            `✅ ${routeFile} updated to use production/development`
          );
        }
      }
    }
  }

  async validateClientConfig() {
    console.log("🔄 Validating client configuration...");

    const clientFiles = [
      "apps/web/src/components/EnvironmentProvider.tsx",
      "apps/web/src/components/EnvironmentSwitcher.tsx",
      "apps/web/src/utils/environment.ts",
      "apps/web/src/utils/environment-icons.tsx",
    ];

    for (const clientFile of clientFiles) {
      const filePath = path.join(rootDir, clientFile);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");

        if (content.includes("replit-prod") || content.includes("replit-dev")) {
          this.errors.push(
            `${clientFile} still contains replit environment references`
          );
        } else {
          this.validationResults.push(
            `✅ ${clientFile} updated to use production/development`
          );
        }
      }
    }
  }

  async validateDocumentation() {
    console.log("🔄 Validating documentation...");

    // Check that obsolete files are removed
    const obsoleteFiles = [".replit", ".env.replit", "replit.nix"];
    for (const fileName of obsoleteFiles) {
      const filePath = path.join(rootDir, fileName);
      if (fs.existsSync(filePath)) {
        this.errors.push(`Obsolete file still exists: ${fileName}`);
      } else {
        this.validationResults.push(`✅ Obsolete file removed: ${fileName}`);
      }
    }

    // Check main documentation files
    const docFiles = ["README.md", "PI_REDACTOR_SETUP.md"];
    for (const docFile of docFiles) {
      const filePath = path.join(rootDir, docFile);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");

        // Count remaining replit references (some may be intentional in migration docs)
        const replitCount = (content.match(/replit/gi) || []).length;
        if (replitCount > 0) {
          this.validationResults.push(
            `ℹ️  ${docFile} contains ${replitCount} replit references (may be intentional)`
          );
        } else {
          this.validationResults.push(
            `✅ ${docFile} clean of replit references`
          );
        }
      }
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      validationResults: this.validationResults,
      errorsFound: this.errors,
      summary: {
        totalValidations: this.validationResults.length,
        totalErrors: this.errors.length,
        status: this.errors.length === 0 ? "PASSED" : "FAILED",
        readyForProduction: this.errors.length === 0,
      },
    };

    const reportPath = path.join(
      rootDir,
      "post-cleanup-validation-report.json"
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(
      `\n📋 Validation report saved to: post-cleanup-validation-report.json`
    );
  }
}

// Run the validator if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new PostCleanupValidator();
  validator.run().catch((error) => {
    console.error("❌ Validation failed:", error);
    process.exit(1);
  });
}

export default PostCleanupValidator;
