#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

/**
 * Documentation Update Tool
 *
 * Updates all documentation to reflect current production architecture
 * and removes any remaining Replit references from documentation files.
 */

class DocumentationUpdater {
  constructor() {
    this.updateActions = [];
    this.errors = [];
  }

  async run() {
    console.log("📚 Starting documentation update...\n");

    try {
      // 1. Update main README
      await this.updateMainReadme();

      // 2. Update setup and configuration docs
      await this.updateSetupDocs();

      // 3. Update architecture documentation
      await this.updateArchitectureDocs();

      // 4. Update deployment documentation
      await this.updateDeploymentDocs();

      // 5. Validate all functionality references
      await this.validateFunctionalityReferences();

      this.generateReport();

      console.log("\n✅ Documentation update completed successfully!");
      console.log(`📋 ${this.updateActions.length} updates performed`);

      if (this.errors.length > 0) {
        console.log(`⚠️  ${this.errors.length} errors encountered`);
        this.errors.forEach((error) => console.log(`   - ${error}`));
      }
    } catch (error) {
      console.error("❌ Documentation update failed:", error.message);
      process.exit(1);
    }
  }

  async updateMainReadme() {
    console.log("🔄 Updating main README...");

    const readmePath = path.join(rootDir, "README.md");
    if (fs.existsSync(readmePath)) {
      let content = fs.readFileSync(readmePath, "utf8");
      const originalContent = content;

      // Update project description to reflect production architecture
      content = content.replace(
        /AI-powered educational accessibility platform.*?running on Replit/gs,
        "AI-powered educational accessibility platform designed for production deployment"
      );

      // Update architecture references
      content = content.replace(
        /Built for Replit environment/g,
        "Built for production environment"
      );

      // Update deployment references
      content = content.replace(/Replit PostgreSQL/g, "PostgreSQL");

      // Update environment references
      content = content.replace(/replit-prod/g, "production");
      content = content.replace(/replit-dev/g, "development");

      if (content !== originalContent) {
        fs.writeFileSync(readmePath, content);
        this.updateActions.push("Updated main README.md");
      }
    }
  }

  async updateSetupDocs() {
    console.log("🔄 Updating setup documentation...");

    const setupFiles = [
      "LOCAL_SETUP.md",
      "k12-demo-setup.md",
      "PERFORMANCE_TIPS.md",
      "POST_SECONDARY_DEV_ROUTING.md",
    ];

    for (const fileName of setupFiles) {
      const filePath = path.join(rootDir, fileName);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, "utf8");
        const originalContent = content;

        // Update environment setup instructions
        content = content.replace(/Replit PostgreSQL/g, "PostgreSQL");

        // Update environment variable references
        content = content.replace(/Replit Secrets/g, "Environment Variables");

        // Update deployment references
        content = content.replace(/replit-prod/g, "production");
        content = content.replace(/replit-dev/g, "development");

        // Update hosting references
        content = content.replace(/Replit hosting/g, "Production hosting");

        if (content !== originalContent) {
          fs.writeFileSync(filePath, content);
          this.updateActions.push(`Updated ${fileName}`);
        }
      }
    }
  }

  async updateArchitectureDocs() {
    console.log("🔄 Updating architecture documentation...");

    const archFiles = ["SERVER_IMPROVEMENTS_SUMMARY.md", "BACKGROUND_JOBS.md"];

    for (const fileName of archFiles) {
      const filePath = path.join(rootDir, fileName);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, "utf8");
        const originalContent = content;

        // Update architecture descriptions
        content = content.replace(
          /Replit-based architecture/g,
          "Production architecture"
        );

        // Update database references
        content = content.replace(/Replit PostgreSQL/g, "PostgreSQL");

        // Update environment references
        content = content.replace(/replit-prod/g, "production");
        content = content.replace(/replit-dev/g, "development");

        // Update hosting platform references
        content = content.replace(/Replit platform/g, "Production platform");

        if (content !== originalContent) {
          fs.writeFileSync(filePath, content);
          this.updateActions.push(`Updated ${fileName}`);
        }
      }
    }
  }

  async updateDeploymentDocs() {
    console.log("🔄 Updating deployment documentation...");

    // Update backup script
    const backupScript = path.join(rootDir, "backup_database.sh");
    if (fs.existsSync(backupScript)) {
      let content = fs.readFileSync(backupScript, "utf8");
      const originalContent = content;

      // Update environment references
      content = content.replace(
        /Environment: Replit Production/g,
        "Environment: Production"
      );

      content = content.replace(/Replit PostgreSQL/g, "PostgreSQL");

      if (content !== originalContent) {
        fs.writeFileSync(backupScript, content);
        this.updateActions.push("Updated backup_database.sh");
      }
    }

    // Update migration documentation
    const migrationFiles = [
      "scripts/migrate-database.ts",
      "scripts/auto-backup.js",
    ];

    for (const fileName of migrationFiles) {
      const filePath = path.join(rootDir, fileName);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, "utf8");
        const originalContent = content;

        // Update migration comments
        content = content.replace(
          /Database Migration Script: Neon \(Replit\) → Railway/g,
          "Database Migration Script: Neon → Railway"
        );

        content = content.replace(/Replit Shell/g, "Production Shell");

        if (content !== originalContent) {
          fs.writeFileSync(filePath, content);
          this.updateActions.push(`Updated ${fileName}`);
        }
      }
    }
  }

  async validateFunctionalityReferences() {
    console.log("🔄 Validating functionality references...");

    // Check that all core functionality is properly documented
    const coreFiles = [
      "apps/server/routes/ai-handler.ts",
      "apps/server/routes/environment.ts",
      "apps/web/src/components/EnvironmentProvider.tsx",
    ];

    for (const fileName of coreFiles) {
      const filePath = path.join(rootDir, fileName);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");

        // Check for any remaining replit references
        if (content.includes("replit-prod") || content.includes("replit-dev")) {
          this.errors.push(
            `${fileName} still contains replit environment references`
          );
        } else {
          this.updateActions.push(
            `Validated ${fileName} - no replit references found`
          );
        }
      }
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      updatesPerformed: this.updateActions,
      errorsEncountered: this.errors,
      summary: {
        totalUpdates: this.updateActions.length,
        totalErrors: this.errors.length,
        status: this.errors.length === 0 ? "SUCCESS" : "PARTIAL_SUCCESS",
      },
    };

    const reportPath = path.join(rootDir, "documentation-update-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(
      `\n📋 Documentation update report saved to: documentation-update-report.json`
    );
  }
}

// Run the documentation updater if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const updater = new DocumentationUpdater();
  updater.run().catch((error) => {
    console.error("❌ Documentation update failed:", error);
    process.exit(1);
  });
}

export default DocumentationUpdater;
