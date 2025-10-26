#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

/**
 * Automated scanning tool for Replit-specific code patterns
 * Scans the entire codebase for references to Replit and generates a report
 */

class ReplitScanner {
  constructor() {
    this.patterns = [
      // Direct Replit references
      /replit/gi,
      /\.replit/gi,

      // Replit-specific environment variables
      /REPL_ID/gi,
      /REPL_SLUG/gi,
      /REPL_OWNER/gi,
      /REPLIT_DB_URL/gi,
      /REPLIT_CLUSTER/gi,

      // Replit-specific domains and URLs
      /\.repl\.co/gi,
      /replit\.com/gi,
      /repl\.it/gi,

      // Replit-specific configuration patterns
      /replit\.nix/gi,
      /\.replit\.toml/gi,

      // Replit-specific deployment patterns
      /replit.*deploy/gi,
      /deploy.*replit/gi,
    ];

    this.excludePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /coverage/,
      /\.turbo/,
      /attached_assets/,
      /scripts\/scan-replit-references\.js/, // Exclude this scanner itself
      /scripts\/cleanup-replit-references\.js/, // Exclude cleanup tool
      /scripts\/validate-post-cleanup\.js/, // Exclude validation tool
      /scripts\/validate-post-migration\.js/, // Exclude migration validation
      /scripts\/update-documentation\.js/, // Exclude documentation updater
      /replit-.*\.json$/, // Exclude all replit report files
      /post-.*-validation-report\.json$/, // Exclude validation reports
      /documentation-update-report\.json$/, // Exclude documentation reports
      /\.kiro\/specs\/.*\.(md|json)$/, // Exclude spec files (they contain intentional references)
      /replit\.md$/, // Exclude replit.md (migration documentation)
      /claude\.md$/, // Exclude claude.md (may contain migration notes)
      /\.claude\/SESSION_HISTORY\.md$/, // Exclude session history (historical documentation)
    ];

    this.results = [];
  }

  shouldExcludeFile(filePath) {
    return this.excludePatterns.some((pattern) => pattern.test(filePath));
  }

  scanFile(filePath) {
    if (this.shouldExcludeFile(filePath)) {
      return;
    }

    try {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      lines.forEach((line, lineNumber) => {
        this.patterns.forEach((pattern) => {
          const matches = line.match(pattern);
          if (matches) {
            matches.forEach((match) => {
              this.results.push({
                file: filePath,
                line: lineNumber + 1,
                match: match,
                context: line.trim(),
                pattern: pattern.toString(),
              });
            });
          }
        });
      });
    } catch (error) {
      console.warn(
        `Warning: Could not read file ${filePath}: ${error.message}`
      );
    }
  }

  scanDirectory(dirPath) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      entries.forEach((entry) => {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          this.scanDirectory(fullPath);
        } else if (entry.isFile()) {
          this.scanFile(fullPath);
        }
      });
    } catch (error) {
      console.warn(
        `Warning: Could not read directory ${dirPath}: ${error.message}`
      );
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalMatches: this.results.length,
      fileCount: new Set(this.results.map((r) => r.file)).size,
      results: this.results,
      summary: this.generateSummary(),
    };

    return report;
  }

  generateSummary() {
    const fileGroups = {};
    const patternGroups = {};

    this.results.forEach((result) => {
      // Group by file
      if (!fileGroups[result.file]) {
        fileGroups[result.file] = 0;
      }
      fileGroups[result.file]++;

      // Group by pattern type
      const patternKey = result.pattern;
      if (!patternGroups[patternKey]) {
        patternGroups[patternKey] = 0;
      }
      patternGroups[patternKey]++;
    });

    return {
      fileGroups: Object.entries(fileGroups)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10), // Top 10 files with most matches
      patternGroups: Object.entries(patternGroups).sort(
        ([, a], [, b]) => b - a
      ),
    };
  }

  printReport(report) {
    console.log("\n=== REPLIT REFERENCE SCAN REPORT ===");
    console.log(`Scan completed at: ${report.timestamp}`);
    console.log(`Total matches found: ${report.totalMatches}`);
    console.log(`Files affected: ${report.fileCount}`);

    if (report.totalMatches === 0) {
      console.log("\n✅ No Replit references found in the codebase!");
      return;
    }

    console.log("\n--- TOP FILES WITH REPLIT REFERENCES ---");
    report.summary.fileGroups.forEach(([file, count]) => {
      console.log(`${file}: ${count} matches`);
    });

    console.log("\n--- PATTERN BREAKDOWN ---");
    report.summary.patternGroups.forEach(([pattern, count]) => {
      console.log(`${pattern}: ${count} matches`);
    });

    console.log("\n--- DETAILED RESULTS ---");
    report.results.forEach((result) => {
      console.log(`${result.file}:${result.line} - "${result.match}"`);
      console.log(`  Context: ${result.context}`);
      console.log("");
    });

    console.log("\n--- RECOMMENDED ACTIONS ---");
    console.log(
      "1. Review each match to determine if it needs to be removed or updated"
    );
    console.log(
      "2. Update environment variables to use production equivalents"
    );
    console.log("3. Remove obsolete configuration files");
    console.log("4. Update deployment scripts and CI/CD pipelines");
    console.log("5. Update documentation references");
  }

  saveReport(report, outputPath = "replit-scan-report.json") {
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${outputPath}`);
  }

  run() {
    console.log("Starting Replit reference scan...");
    console.log("Scanning directory:", process.cwd());

    this.scanDirectory(".");

    const report = this.generateReport();
    this.printReport(report);
    this.saveReport(report);

    return report;
  }
}

// Run the scanner if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const scanner = new ReplitScanner();
  const report = scanner.run();

  // Exit with error code if Replit references are found
  process.exit(report.totalMatches > 0 ? 1 : 0);
}

export default ReplitScanner;
