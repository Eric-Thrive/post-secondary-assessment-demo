#!/usr/bin/env node

/**
 * Test Result Reporter and Failure Analysis System
 *
 * This script analyzes test results from Jest, Vitest, and Playwright
 * and provides detailed reporting and failure analysis.
 */

const fs = require("fs");
const path = require("path");

class TestReporter {
  constructor() {
    this.results = {
      unit: null,
      component: null,
      e2e: null,
      coverage: null,
    };
    this.failures = [];
    this.summary = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      coverage: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    };
  }

  async loadTestResults() {
    console.log("📊 Loading test results...");

    // Load Jest results (server unit tests)
    await this.loadJestResults();

    // Load Vitest results (web component tests)
    await this.loadVitestResults();

    // Load Playwright results (E2E tests)
    await this.loadPlaywrightResults();

    // Load coverage results
    await this.loadCoverageResults();
  }

  async loadJestResults() {
    const jestResultsPath = path.join(
      __dirname,
      "../apps/server/coverage/test-results.json"
    );

    if (fs.existsSync(jestResultsPath)) {
      try {
        const results = JSON.parse(fs.readFileSync(jestResultsPath, "utf8"));
        this.results.unit = results;

        this.summary.totalTests += results.numTotalTests || 0;
        this.summary.passedTests += results.numPassedTests || 0;
        this.summary.failedTests += results.numFailedTests || 0;
        this.summary.skippedTests += results.numPendingTests || 0;

        if (results.testResults) {
          results.testResults.forEach((testFile) => {
            if (testFile.status === "failed") {
              testFile.assertionResults.forEach((test) => {
                if (test.status === "failed") {
                  this.failures.push({
                    type: "unit",
                    file: testFile.name,
                    test: test.title,
                    error: test.failureMessages?.[0] || "Unknown error",
                  });
                }
              });
            }
          });
        }

        console.log("✅ Jest results loaded");
      } catch (error) {
        console.warn("⚠️  Could not load Jest results:", error.message);
      }
    } else {
      console.warn("⚠️  Jest results file not found");
    }
  }

  async loadVitestResults() {
    const vitestResultsPath = path.join(
      __dirname,
      "../apps/web/coverage/test-results.json"
    );

    if (fs.existsSync(vitestResultsPath)) {
      try {
        const results = JSON.parse(fs.readFileSync(vitestResultsPath, "utf8"));
        this.results.component = results;

        // Vitest results structure may vary, adapt as needed
        console.log("✅ Vitest results loaded");
      } catch (error) {
        console.warn("⚠️  Could not load Vitest results:", error.message);
      }
    } else {
      console.warn("⚠️  Vitest results file not found");
    }
  }

  async loadPlaywrightResults() {
    const playwrightResultsPath = path.join(
      __dirname,
      "../test-results/results.json"
    );

    if (fs.existsSync(playwrightResultsPath)) {
      try {
        const results = JSON.parse(
          fs.readFileSync(playwrightResultsPath, "utf8")
        );
        this.results.e2e = results;

        if (results.suites) {
          results.suites.forEach((suite) => {
            suite.specs?.forEach((spec) => {
              this.summary.totalTests += spec.tests?.length || 0;

              spec.tests?.forEach((test) => {
                if (test.results?.[0]?.status === "passed") {
                  this.summary.passedTests++;
                } else if (test.results?.[0]?.status === "failed") {
                  this.summary.failedTests++;
                  this.failures.push({
                    type: "e2e",
                    file: spec.file,
                    test: test.title,
                    error:
                      test.results?.[0]?.error?.message || "E2E test failed",
                  });
                } else {
                  this.summary.skippedTests++;
                }
              });
            });
          });
        }

        console.log("✅ Playwright results loaded");
      } catch (error) {
        console.warn("⚠️  Could not load Playwright results:", error.message);
      }
    } else {
      console.warn("⚠️  Playwright results file not found");
    }
  }

  async loadCoverageResults() {
    // Load server coverage
    const serverCoveragePath = path.join(
      __dirname,
      "../apps/server/coverage/coverage-summary.json"
    );
    if (fs.existsSync(serverCoveragePath)) {
      try {
        const coverage = JSON.parse(
          fs.readFileSync(serverCoveragePath, "utf8")
        );
        if (coverage.total) {
          this.summary.coverage.lines = Math.max(
            this.summary.coverage.lines,
            coverage.total.lines.pct || 0
          );
          this.summary.coverage.functions = Math.max(
            this.summary.coverage.functions,
            coverage.total.functions.pct || 0
          );
          this.summary.coverage.branches = Math.max(
            this.summary.coverage.branches,
            coverage.total.branches.pct || 0
          );
          this.summary.coverage.statements = Math.max(
            this.summary.coverage.statements,
            coverage.total.statements.pct || 0
          );
        }
        console.log("✅ Server coverage loaded");
      } catch (error) {
        console.warn("⚠️  Could not load server coverage:", error.message);
      }
    }

    // Load web coverage
    const webCoveragePath = path.join(
      __dirname,
      "../apps/web/coverage/coverage-summary.json"
    );
    if (fs.existsSync(webCoveragePath)) {
      try {
        const coverage = JSON.parse(fs.readFileSync(webCoveragePath, "utf8"));
        if (coverage.total) {
          // Average the coverage between server and web
          this.summary.coverage.lines =
            (this.summary.coverage.lines + (coverage.total.lines.pct || 0)) / 2;
          this.summary.coverage.functions =
            (this.summary.coverage.functions +
              (coverage.total.functions.pct || 0)) /
            2;
          this.summary.coverage.branches =
            (this.summary.coverage.branches +
              (coverage.total.branches.pct || 0)) /
            2;
          this.summary.coverage.statements =
            (this.summary.coverage.statements +
              (coverage.total.statements.pct || 0)) /
            2;
        }
        console.log("✅ Web coverage loaded");
      } catch (error) {
        console.warn("⚠️  Could not load web coverage:", error.message);
      }
    }
  }

  generateReport() {
    console.log("\n📋 TEST RESULTS SUMMARY");
    console.log("========================");

    console.log(`Total Tests: ${this.summary.totalTests}`);
    console.log(`✅ Passed: ${this.summary.passedTests}`);
    console.log(`❌ Failed: ${this.summary.failedTests}`);
    console.log(`⏭️  Skipped: ${this.summary.skippedTests}`);

    console.log("\n📊 COVERAGE SUMMARY");
    console.log("===================");
    console.log(`Lines: ${this.summary.coverage.lines.toFixed(2)}%`);
    console.log(`Functions: ${this.summary.coverage.functions.toFixed(2)}%`);
    console.log(`Branches: ${this.summary.coverage.branches.toFixed(2)}%`);
    console.log(`Statements: ${this.summary.coverage.statements.toFixed(2)}%`);

    // Check coverage thresholds
    const coverageThreshold = 80;
    const coverageIssues = [];

    if (this.summary.coverage.lines < coverageThreshold) {
      coverageIssues.push(
        `Lines: ${this.summary.coverage.lines.toFixed(
          2
        )}% (required: ${coverageThreshold}%)`
      );
    }
    if (this.summary.coverage.functions < coverageThreshold) {
      coverageIssues.push(
        `Functions: ${this.summary.coverage.functions.toFixed(
          2
        )}% (required: ${coverageThreshold}%)`
      );
    }
    if (this.summary.coverage.branches < coverageThreshold) {
      coverageIssues.push(
        `Branches: ${this.summary.coverage.branches.toFixed(
          2
        )}% (required: ${coverageThreshold}%)`
      );
    }
    if (this.summary.coverage.statements < coverageThreshold) {
      coverageIssues.push(
        `Statements: ${this.summary.coverage.statements.toFixed(
          2
        )}% (required: ${coverageThreshold}%)`
      );
    }

    if (coverageIssues.length > 0) {
      console.log("\n⚠️  COVERAGE ISSUES");
      console.log("==================");
      coverageIssues.forEach((issue) => console.log(`❌ ${issue}`));
    }

    if (this.failures.length > 0) {
      console.log("\n🔍 FAILURE ANALYSIS");
      console.log("===================");

      this.failures.forEach((failure, index) => {
        console.log(
          `\n${index + 1}. ${failure.type.toUpperCase()} TEST FAILURE`
        );
        console.log(`   File: ${failure.file}`);
        console.log(`   Test: ${failure.test}`);
        console.log(`   Error: ${failure.error.split("\n")[0]}`);
      });

      console.log("\n💡 FAILURE RECOMMENDATIONS");
      console.log("==========================");
      this.generateFailureRecommendations();
    }

    const success =
      this.summary.failedTests === 0 && coverageIssues.length === 0;

    if (success) {
      console.log("\n🎉 ALL TESTS PASSED WITH ADEQUATE COVERAGE!");
    } else {
      console.log("\n❌ TESTS FAILED OR COVERAGE INSUFFICIENT");
    }

    return success;
  }

  generateFailureRecommendations() {
    const unitFailures = this.failures.filter((f) => f.type === "unit").length;
    const componentFailures = this.failures.filter(
      (f) => f.type === "component"
    ).length;
    const e2eFailures = this.failures.filter((f) => f.type === "e2e").length;

    if (unitFailures > 0) {
      console.log("🔧 Unit Test Failures:");
      console.log("   - Check business logic implementation");
      console.log("   - Verify mock configurations in jest.setup.js");
      console.log("   - Review test assertions and expected values");
    }

    if (componentFailures > 0) {
      console.log("🔧 Component Test Failures:");
      console.log("   - Check component rendering and props");
      console.log("   - Verify React Testing Library queries");
      console.log("   - Review component mocks and context providers");
    }

    if (e2eFailures > 0) {
      console.log("🔧 E2E Test Failures:");
      console.log("   - Check if application is running correctly");
      console.log("   - Verify page load times and network conditions");
      console.log("   - Review selector strategies and wait conditions");
    }
  }

  async saveReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: this.summary,
      failures: this.failures,
      results: this.results,
    };

    const reportPath = path.join(__dirname, "../test-results/test-report.json");

    // Ensure directory exists
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

async function main() {
  const reporter = new TestReporter();

  try {
    await reporter.loadTestResults();
    const success = reporter.generateReport();
    await reporter.saveReport();

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error("❌ Test reporting failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { TestReporter };
