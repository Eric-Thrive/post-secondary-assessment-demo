#!/usr/bin/env node

/**
 * Performance testing script for RBAC system
 * Task 10.1: Test database performance with multi-tenant data isolation
 */

import { db } from "../db";
import { users, organizations, assessmentCases } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { OptimizedQueries } from "../services/optimized-queries";
import { DatabasePerformanceService } from "../services/database-performance";
import { UserRole, ModuleType } from "@shared/schema";

interface PerformanceTestResult {
  testName: string;
  duration: number;
  recordsProcessed: number;
  recordsPerSecond: number;
  success: boolean;
  error?: string;
}

class RBACPerformanceTester {
  private results: PerformanceTestResult[] = [];

  /**
   * Run all RBAC performance tests
   */
  public async runAllTests(): Promise<PerformanceTestResult[]> {
    console.log("🚀 Starting RBAC Performance Tests...\n");

    // Test 1: User authentication query performance
    await this.testUserAuthentication();

    // Test 2: Organization-based user filtering
    await this.testOrganizationUserFiltering();

    // Test 3: Multi-tenant assessment case queries
    await this.testMultiTenantAssessmentQueries();

    // Test 4: Role-based permission checking
    await this.testRoleBasedPermissionChecking();

    // Test 5: Demo user report limit queries
    await this.testDemoUserQueries();

    // Test 6: Module-based prompt loading
    await this.testModuleBasedPromptLoading();

    // Test 7: Bulk operations performance
    await this.testBulkOperations();

    // Test 8: Complex RBAC queries
    await this.testComplexRBACQueries();

    return this.results;
  }

  /**
   * Test user authentication query performance
   */
  private async testUserAuthentication(): Promise<void> {
    const testName = "User Authentication Query";
    console.log(`🔍 Testing: ${testName}`);

    try {
      const startTime = Date.now();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        await OptimizedQueries.getUserWithOrganization(1);
      }

      const duration = Date.now() - startTime;
      const recordsPerSecond = (iterations * 1000) / duration;

      this.results.push({
        testName,
        duration,
        recordsProcessed: iterations,
        recordsPerSecond,
        success: true,
      });

      console.log(
        `✅ ${testName}: ${duration}ms for ${iterations} queries (${recordsPerSecond.toFixed(
          2
        )} queries/sec)\n`
      );
    } catch (error: any) {
      this.results.push({
        testName,
        duration: 0,
        recordsProcessed: 0,
        recordsPerSecond: 0,
        success: false,
        error: error.message,
      });

      console.log(`❌ ${testName}: Failed - ${error.message}\n`);
    }
  }

  /**
   * Test organization-based user filtering
   */
  private async testOrganizationUserFiltering(): Promise<void> {
    const testName = "Organization User Filtering";
    console.log(`🔍 Testing: ${testName}`);

    try {
      const startTime = Date.now();
      const iterations = 50;

      // Get a sample organization ID
      const [sampleOrg] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .limit(1);

      if (!sampleOrg) {
        throw new Error("No organizations found for testing");
      }

      for (let i = 0; i < iterations; i++) {
        await OptimizedQueries.getUsersByOrganization(sampleOrg.id);
      }

      const duration = Date.now() - startTime;
      const recordsPerSecond = (iterations * 1000) / duration;

      this.results.push({
        testName,
        duration,
        recordsProcessed: iterations,
        recordsPerSecond,
        success: true,
      });

      console.log(
        `✅ ${testName}: ${duration}ms for ${iterations} queries (${recordsPerSecond.toFixed(
          2
        )} queries/sec)\n`
      );
    } catch (error: any) {
      this.results.push({
        testName,
        duration: 0,
        recordsProcessed: 0,
        recordsPerSecond: 0,
        success: false,
        error: error.message,
      });

      console.log(`❌ ${testName}: Failed - ${error.message}\n`);
    }
  }

  /**
   * Test multi-tenant assessment case queries
   */
  private async testMultiTenantAssessmentQueries(): Promise<void> {
    const testName = "Multi-Tenant Assessment Queries";
    console.log(`🔍 Testing: ${testName}`);

    try {
      const startTime = Date.now();
      const iterations = 30;

      // Get sample organization IDs
      const orgs = await db
        .select({ id: organizations.id })
        .from(organizations)
        .limit(5);

      if (orgs.length === 0) {
        throw new Error("No organizations found for testing");
      }

      for (let i = 0; i < iterations; i++) {
        const orgId = orgs[i % orgs.length].id;
        await OptimizedQueries.getAssessmentCasesByOrganization(
          orgId,
          ModuleType.POST_SECONDARY
        );
      }

      const duration = Date.now() - startTime;
      const recordsPerSecond = (iterations * 1000) / duration;

      this.results.push({
        testName,
        duration,
        recordsProcessed: iterations,
        recordsPerSecond,
        success: true,
      });

      console.log(
        `✅ ${testName}: ${duration}ms for ${iterations} queries (${recordsPerSecond.toFixed(
          2
        )} queries/sec)\n`
      );
    } catch (error: any) {
      this.results.push({
        testName,
        duration: 0,
        recordsProcessed: 0,
        recordsPerSecond: 0,
        success: false,
        error: error.message,
      });

      console.log(`❌ ${testName}: Failed - ${error.message}\n`);
    }
  }

  /**
   * Test role-based permission checking performance
   */
  private async testRoleBasedPermissionChecking(): Promise<void> {
    const testName = "Role-Based Permission Checking";
    console.log(`🔍 Testing: ${testName}`);

    try {
      const startTime = Date.now();
      const iterations = 200;

      // Test different role-based queries
      const roles = [
        UserRole.ADMIN,
        UserRole.CUSTOMER,
        UserRole.DEMO,
        UserRole.ORG_ADMIN,
      ];

      for (let i = 0; i < iterations; i++) {
        const role = roles[i % roles.length];
        await db
          .select({
            id: users.id,
            username: users.username,
            role: users.role,
            assignedModules: users.assignedModules,
          })
          .from(users)
          .where(and(eq(users.role, role), eq(users.isActive, true)))
          .limit(10);
      }

      const duration = Date.now() - startTime;
      const recordsPerSecond = (iterations * 1000) / duration;

      this.results.push({
        testName,
        duration,
        recordsProcessed: iterations,
        recordsPerSecond,
        success: true,
      });

      console.log(
        `✅ ${testName}: ${duration}ms for ${iterations} queries (${recordsPerSecond.toFixed(
          2
        )} queries/sec)\n`
      );
    } catch (error: any) {
      this.results.push({
        testName,
        duration: 0,
        recordsProcessed: 0,
        recordsPerSecond: 0,
        success: false,
        error: error.message,
      });

      console.log(`❌ ${testName}: Failed - ${error.message}\n`);
    }
  }

  /**
   * Test demo user queries performance
   */
  private async testDemoUserQueries(): Promise<void> {
    const testName = "Demo User Queries";
    console.log(`🔍 Testing: ${testName}`);

    try {
      const startTime = Date.now();
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        // Test demo users near limit
        await OptimizedQueries.getDemoUsersNearLimit(4);

        // Test expired demo users
        await OptimizedQueries.getExpiredDemoUsers(30);
      }

      const duration = Date.now() - startTime;
      const recordsPerSecond = (iterations * 2 * 1000) / duration; // 2 queries per iteration

      this.results.push({
        testName,
        duration,
        recordsProcessed: iterations * 2,
        recordsPerSecond,
        success: true,
      });

      console.log(
        `✅ ${testName}: ${duration}ms for ${
          iterations * 2
        } queries (${recordsPerSecond.toFixed(2)} queries/sec)\n`
      );
    } catch (error: any) {
      this.results.push({
        testName,
        duration: 0,
        recordsProcessed: 0,
        recordsPerSecond: 0,
        success: false,
        error: error.message,
      });

      console.log(`❌ ${testName}: Failed - ${error.message}\n`);
    }
  }

  /**
   * Test module-based prompt loading performance
   */
  private async testModuleBasedPromptLoading(): Promise<void> {
    const testName = "Module-Based Prompt Loading";
    console.log(`🔍 Testing: ${testName}`);

    try {
      const startTime = Date.now();
      const iterations = 100;

      const modules = [
        ModuleType.K12,
        ModuleType.POST_SECONDARY,
        ModuleType.TUTORING,
      ];

      for (let i = 0; i < iterations; i++) {
        const moduleType = modules[i % modules.length];
        await OptimizedQueries.getPromptSections(
          moduleType,
          "system",
          "simple"
        );
      }

      const duration = Date.now() - startTime;
      const recordsPerSecond = (iterations * 1000) / duration;

      this.results.push({
        testName,
        duration,
        recordsProcessed: iterations,
        recordsPerSecond,
        success: true,
      });

      console.log(
        `✅ ${testName}: ${duration}ms for ${iterations} queries (${recordsPerSecond.toFixed(
          2
        )} queries/sec)\n`
      );
    } catch (error: any) {
      this.results.push({
        testName,
        duration: 0,
        recordsProcessed: 0,
        recordsPerSecond: 0,
        success: false,
        error: error.message,
      });

      console.log(`❌ ${testName}: Failed - ${error.message}\n`);
    }
  }

  /**
   * Test bulk operations performance
   */
  private async testBulkOperations(): Promise<void> {
    const testName = "Bulk Operations";
    console.log(`🔍 Testing: ${testName}`);

    try {
      const startTime = Date.now();

      // Test organization statistics (complex aggregation)
      await OptimizedQueries.getOrganizationStats();

      // Test system metrics (multiple table aggregations)
      await OptimizedQueries.getSystemMetrics();

      const duration = Date.now() - startTime;

      this.results.push({
        testName,
        duration,
        recordsProcessed: 2,
        recordsPerSecond: (2 * 1000) / duration,
        success: true,
      });

      console.log(
        `✅ ${testName}: ${duration}ms for complex aggregation queries\n`
      );
    } catch (error: any) {
      this.results.push({
        testName,
        duration: 0,
        recordsProcessed: 0,
        recordsPerSecond: 0,
        success: false,
        error: error.message,
      });

      console.log(`❌ ${testName}: Failed - ${error.message}\n`);
    }
  }

  /**
   * Test complex RBAC queries with multiple joins
   */
  private async testComplexRBACQueries(): Promise<void> {
    const testName = "Complex RBAC Queries";
    console.log(`🔍 Testing: ${testName}`);

    try {
      const startTime = Date.now();
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        // Complex query with multiple joins and filters
        await db
          .select({
            userId: users.id,
            username: users.username,
            userRole: users.role,
            orgName: organizations.name,
            orgModules: organizations.assignedModules,
            caseCount: sql<number>`count(${assessmentCases.id})`,
          })
          .from(users)
          .leftJoin(organizations, eq(users.organizationId, organizations.id))
          .leftJoin(
            assessmentCases,
            eq(users.id, assessmentCases.createdByUserId)
          )
          .where(
            and(eq(users.isActive, true), eq(organizations.isActive, true))
          )
          .groupBy(
            users.id,
            users.username,
            users.role,
            organizations.name,
            organizations.assignedModules
          )
          .limit(50);
      }

      const duration = Date.now() - startTime;
      const recordsPerSecond = (iterations * 1000) / duration;

      this.results.push({
        testName,
        duration,
        recordsProcessed: iterations,
        recordsPerSecond,
        success: true,
      });

      console.log(
        `✅ ${testName}: ${duration}ms for ${iterations} complex queries (${recordsPerSecond.toFixed(
          2
        )} queries/sec)\n`
      );
    } catch (error: any) {
      this.results.push({
        testName,
        duration: 0,
        recordsProcessed: 0,
        recordsPerSecond: 0,
        success: false,
        error: error.message,
      });

      console.log(`❌ ${testName}: Failed - ${error.message}\n`);
    }
  }

  /**
   * Generate performance report
   */
  public generateReport(): void {
    console.log("📊 RBAC Performance Test Report");
    console.log("================================\n");

    const successfulTests = this.results.filter((r) => r.success);
    const failedTests = this.results.filter((r) => !r.success);

    console.log(`✅ Successful tests: ${successfulTests.length}`);
    console.log(`❌ Failed tests: ${failedTests.length}`);
    console.log(`📈 Total tests: ${this.results.length}\n`);

    if (successfulTests.length > 0) {
      console.log("🏆 Performance Results:");
      console.log("----------------------");

      successfulTests.forEach((result) => {
        console.log(`${result.testName}:`);
        console.log(`  Duration: ${result.duration}ms`);
        console.log(`  Records: ${result.recordsProcessed}`);
        console.log(`  Rate: ${result.recordsPerSecond.toFixed(2)} ops/sec`);
        console.log("");
      });

      // Calculate averages
      const avgDuration =
        successfulTests.reduce((sum, r) => sum + r.duration, 0) /
        successfulTests.length;
      const avgRate =
        successfulTests.reduce((sum, r) => sum + r.recordsPerSecond, 0) /
        successfulTests.length;

      console.log("📊 Summary Statistics:");
      console.log(`  Average Duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Average Rate: ${avgRate.toFixed(2)} ops/sec`);
      console.log("");
    }

    if (failedTests.length > 0) {
      console.log("❌ Failed Tests:");
      console.log("---------------");

      failedTests.forEach((result) => {
        console.log(`${result.testName}: ${result.error}`);
      });
      console.log("");
    }

    // Performance recommendations
    console.log("💡 Performance Recommendations:");
    console.log("------------------------------");

    const slowTests = successfulTests.filter((r) => r.recordsPerSecond < 10);
    if (slowTests.length > 0) {
      console.log("⚠️  Slow queries detected:");
      slowTests.forEach((test) => {
        console.log(
          `  - ${test.testName}: ${test.recordsPerSecond.toFixed(2)} ops/sec`
        );
      });
    } else {
      console.log("✅ All queries performing within acceptable limits");
    }

    console.log("\n🎯 Optimization targets:");
    console.log("  - User authentication: >100 ops/sec");
    console.log("  - Organization filtering: >50 ops/sec");
    console.log("  - Role-based queries: >100 ops/sec");
    console.log("  - Complex queries: >10 ops/sec");
  }
}

// Run the performance tests if called directly
if (require.main === module) {
  const tester = new RBACPerformanceTester();

  tester
    .runAllTests()
    .then(() => {
      tester.generateReport();
      console.log("✅ Performance testing completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Performance testing failed:", error);
      process.exit(1);
    });
}

export { RBACPerformanceTester };
