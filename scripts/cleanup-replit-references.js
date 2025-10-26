#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

/**
 * Comprehensive Replit Reference Cleanup Tool
 *
 * This script systematically removes all Replit-specific references from the codebase
 * and updates them with production-ready equivalents.
 */

class ReplitCleanupTool {
  constructor() {
    this.cleanupActions = [];
    this.errors = [];
  }

  async run() {
    console.log("🧹 Starting comprehensive Replit cleanup...\n");

    try {
      // 1. Update environment references
      await this.updateEnvironmentReferences();

      // 2. Update database provider logic
      await this.updateDatabaseProviders();

      // 3. Update server configuration
      await this.updateServerConfiguration();

      // 4. Update client-side environment handling
      await this.updateClientEnvironmentHandling();

      // 5. Clean up documentation files
      await this.cleanupDocumentation();

      // 6. Remove obsolete configuration files
      await this.removeObsoleteFiles();

      // 7. Update deployment scripts
      await this.updateDeploymentScripts();

      this.generateReport();

      console.log("\n✅ Replit cleanup completed successfully!");
      console.log(`📋 ${this.cleanupActions.length} actions performed`);

      if (this.errors.length > 0) {
        console.log(`⚠️  ${this.errors.length} errors encountered`);
        this.errors.forEach((error) => console.log(`   - ${error}`));
      }
    } catch (error) {
      console.error("❌ Cleanup failed:", error.message);
      process.exit(1);
    }
  }

  async updateEnvironmentReferences() {
    console.log("🔄 Updating environment references...");

    const filesToUpdate = [
      "apps/server/routes/ai-handler.ts",
      "apps/server/routes/environment.ts",
      "apps/server/routes/report-generator.ts",
      "apps/server/routes/tutoring-report-generator.ts",
      "apps/web/src/components/EnvironmentProvider.tsx",
      "apps/web/src/components/EnvironmentSwitcher.tsx",
      "apps/web/src/components/HomePage.tsx",
      "apps/web/src/components/ReportViewer.tsx",
      "apps/web/src/utils/environment.ts",
    ];

    for (const filePath of filesToUpdate) {
      const fullPath = path.join(rootDir, filePath);
      if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, "utf8");
        const originalContent = content;

        // Replace replit-prod with production
        content = content.replace(/['"]replit-prod['"]/g, "'production'");
        content = content.replace(/replit-prod/g, "production");

        // Replace replit-dev with development
        content = content.replace(/['"]replit-dev['"]/g, "'development'");
        content = content.replace(/replit-dev/g, "development");

        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content);
          this.cleanupActions.push(
            `Updated environment references in ${filePath}`
          );
        }
      }
    }
  }

  async updateDatabaseProviders() {
    console.log("🔄 Updating database provider logic...");

    const dbProviderPath = path.join(
      rootDir,
      "apps/server/database-providers.ts"
    );
    if (fs.existsSync(dbProviderPath)) {
      let content = fs.readFileSync(dbProviderPath, "utf8");
      const originalContent = content;

      // Remove replit provider type and logic
      content = content.replace(
        /export type DatabaseProvider = 'replit' \| 'neon' \| 'local';/,
        "export type DatabaseProvider = 'neon' | 'local';"
      );

      // Update provider detection logic
      content = content.replace(
        /} else if \(databaseUrl\.includes\('replit'\) \|\| process\.env\.REPL_ID\) {\s*provider = 'replit';/g,
        ""
      );

      // Remove replit-specific comments and references
      content = content.replace(
        /\/\/ Always use neon provider for Replit PostgreSQL/,
        "// Use neon provider for PostgreSQL"
      );

      if (content !== originalContent) {
        fs.writeFileSync(dbProviderPath, content);
        this.cleanupActions.push("Updated database provider logic");
      }
    }
  }

  async updateServerConfiguration() {
    console.log("🔄 Updating server configuration...");

    const configPath = path.join(rootDir, "apps/server/config/environment.ts");
    if (fs.existsSync(configPath)) {
      let content = fs.readFileSync(configPath, "utf8");
      const originalContent = content;

      // Update comments
      content = content.replace(
        /\/\/ Always use neon provider for Replit PostgreSQL/,
        "// Use neon provider for PostgreSQL"
      );

      if (content !== originalContent) {
        fs.writeFileSync(configPath, content);
        this.cleanupActions.push("Updated server configuration");
      }
    }

    // Update storage.ts
    const storagePath = path.join(rootDir, "apps/server/storage.ts");
    if (fs.existsSync(storagePath)) {
      let content = fs.readFileSync(storagePath, "utf8");
      const originalContent = content;

      // Update comments
      content = content.replace(
        /\/\/ DatabaseStorage class using Neon PostgreSQL \(Replit standard\)/,
        "// DatabaseStorage class using Neon PostgreSQL"
      );

      if (content !== originalContent) {
        fs.writeFileSync(storagePath, content);
        this.cleanupActions.push("Updated storage configuration");
      }
    }
  }

  async updateClientEnvironmentHandling() {
    console.log("🔄 Updating client-side environment handling...");

    // Update environment icons mapping
    const iconsPath = path.join(
      rootDir,
      "apps/web/src/utils/environment-icons.tsx"
    );
    if (fs.existsSync(iconsPath)) {
      let content = fs.readFileSync(iconsPath, "utf8");
      const originalContent = content;

      // Replace replit environment mappings
      content = content.replace(
        /'replit-prod': Server,/,
        "'production': Server,"
      );
      content = content.replace(/'replit-dev': Code,/, "'development': Code,");

      if (content !== originalContent) {
        fs.writeFileSync(iconsPath, content);
        this.cleanupActions.push("Updated environment icons mapping");
      }
    }

    // Update environment types
    const typesPath = path.join(rootDir, "apps/web/src/types/environment.ts");
    if (fs.existsSync(typesPath)) {
      let content = fs.readFileSync(typesPath, "utf8");
      const originalContent = content;

      // Update environment type definitions
      content = content.replace(/\| 'replit-prod'/, "");
      content = content.replace(/\| 'replit-dev'/, "");

      // Clean up any remaining references
      content = content.replace(/id: 'replit-prod',/, "id: 'production',");
      content = content.replace(/id: 'replit-dev',/, "id: 'development',");

      if (content !== originalContent) {
        fs.writeFileSync(typesPath, content);
        this.cleanupActions.push("Updated environment type definitions");
      }
    }
  }

  async cleanupDocumentation() {
    console.log("🔄 Cleaning up documentation...");

    const docFiles = [
      "README.md",
      "PI_REDACTOR_SETUP.md",
      "k12-demo-setup.md",
      "backup_database.sh",
      "replit.md",
    ];

    for (const docFile of docFiles) {
      const filePath = path.join(rootDir, docFile);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, "utf8");
        const originalContent = content;

        // Update repository references
        content = content.replace(
          /replit-accommodation-engine/g,
          "post-secondary-assessment-demo"
        );

        // Update environment references in documentation
        content = content.replace(/replit-prod/g, "production");
        content = content.replace(/replit-dev/g, "development");

        // Update Replit-specific instructions
        content = content.replace(/Replit PostgreSQL/g, "PostgreSQL");
        content = content.replace(/Replit Secrets/g, "Environment Variables");
        content = content.replace(/Replit domain/g, "application domain");

        if (content !== originalContent) {
          fs.writeFileSync(filePath, content);
          this.cleanupActions.push(`Updated documentation in ${docFile}`);
        }
      }
    }
  }

  async removeObsoleteFiles() {
    console.log("🔄 Removing obsolete configuration files...");

    const filesToRemove = [".replit", ".env.replit", "replit.nix"];

    for (const fileName of filesToRemove) {
      const filePath = path.join(rootDir, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.cleanupActions.push(`Removed obsolete file: ${fileName}`);
      }
    }
  }

  async updateDeploymentScripts() {
    console.log("🔄 Updating deployment scripts...");

    const scriptFiles = [
      "scripts/auto-backup.js",
      "scripts/check-k12-prompts.ts",
      "scripts/migrate-database.ts",
      "test-ai-handler.sh",
      "setup_instructions.txt",
    ];

    for (const scriptFile of scriptFiles) {
      const filePath = path.join(rootDir, scriptFile);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, "utf8");
        const originalContent = content;

        // Update script references
        content = content.replace(/Replit/g, "Production");
        content = content.replace(
          /replit-accommodation-engine/g,
          "post-secondary-assessment-demo"
        );
        content = content.replace(/replit-prod/g, "production");
        content = content.replace(/replit-dev/g, "development");

        if (content !== originalContent) {
          fs.writeFileSync(filePath, content);
          this.cleanupActions.push(`Updated deployment script: ${scriptFile}`);
        }
      }
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      actionsPerformed: this.cleanupActions,
      errorsEncountered: this.errors,
      summary: {
        totalActions: this.cleanupActions.length,
        totalErrors: this.errors.length,
        status: this.errors.length === 0 ? "SUCCESS" : "PARTIAL_SUCCESS",
      },
    };

    const reportPath = path.join(rootDir, "replit-cleanup-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📋 Cleanup report saved to: replit-cleanup-report.json`);
  }
}

// Run the cleanup tool if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tool = new ReplitCleanupTool();
  tool.run().catch((error) => {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  });
}

export default ReplitCleanupTool;
