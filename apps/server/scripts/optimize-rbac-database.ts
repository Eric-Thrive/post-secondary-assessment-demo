#!/usr/bin/env node

/**
 * Comprehensive RBAC database optimization script
 * Task 10.1: Optimize database performance for RBAC system
 */

import { applyRBACIndexes } from "./apply-rbac-indexes";
import { RBACPerformanceTester } from "./test-rbac-performance";
import { DatabasePerformanceService } from "../services/database-performance";

async function optimizeRBACDatabase() {
  console.log("🚀 Starting comprehensive RBAC database optimization...\n");

  try {
    // Step 1: Apply performance indexes
    console.log("📋 Step 1: Applying RBAC performance indexes");
    console.log("============================================");
    await applyRBACIndexes();
    console.log("✅ Indexes applied successfully\n");

    // Step 2: Run database optimization
    console.log("📋 Step 2: Running database optimization");
    console.log("=======================================");
    const optimizationResults =
      await DatabasePerformanceService.optimizeForRBAC();

    console.log("🔧 Optimization results:");
    optimizationResults.optimizations.forEach((opt) => {
      console.log(`  ✅ ${opt}`);
    });

    if (optimizationResults.missingIndexes.length > 0) {
      console.log("\n⚠️  Missing indexes detected:");
      optimizationResults.missingIndexes.forEach((index) => {
        console.log(`  - ${index}`);
      });
    }

    if (optimizationResults.tablesNeedingVacuum.length > 0) {
      console.log("\n🧹 Tables that may benefit from VACUUM:");
      optimizationResults.tablesNeedingVacuum.forEach((table: any) => {
        console.log(
          `  - ${table.tablename} (${table.dead_tuple_percent.toFixed(
            1
          )}% dead tuples)`
        );
      });
    }

    console.log("✅ Database optimization completed\n");

    // Step 3: Analyze query performance
    console.log("📋 Step 3: Analyzing RBAC query performance");
    console.log("==========================================");
    const queryAnalysis =
      await DatabasePerformanceService.analyzeRBACQueryPerformance();

    console.log("📊 Query analysis results:");
    queryAnalysis.forEach((result) => {
      if (result.error) {
        console.log(`  ❌ ${result.name}: ${result.error}`);
      } else {
        console.log(`  ✅ ${result.name}: ${result.duration}ms`);
      }
    });

    console.log("✅ Query analysis completed\n");

    // Step 4: Run performance tests
    console.log("📋 Step 4: Running RBAC performance tests");
    console.log("=========================================");
    const tester = new RBACPerformanceTester();
    await tester.runAllTests();
    tester.generateReport();

    // Step 5: Get database metrics
    console.log("📋 Step 5: Collecting database metrics");
    console.log("=====================================");
    const metrics = await DatabasePerformanceService.getDatabaseMetrics();

    console.log("📊 Database metrics:");
    console.log(`  Query duration: ${metrics.queryDuration}ms`);
    console.log(
      `  Cache size: ${metrics.cacheStats.size}/${metrics.cacheStats.maxSize}`
    );
    console.log(
      `  Cache hit rate: ${(metrics.cacheStats.hitRate * 100).toFixed(1)}%`
    );

    if (metrics.tableStats.length > 0) {
      console.log("\n📈 Top tables by activity:");
      metrics.tableStats.slice(0, 5).forEach((table: any) => {
        console.log(`  - ${table.tablename}: ${table.live_tuples} live tuples`);
      });
    }

    if (metrics.indexStats.length > 0) {
      console.log("\n🔍 Most used indexes:");
      metrics.indexStats.slice(0, 5).forEach((index: any) => {
        console.log(`  - ${index.indexname}: ${index.idx_scan} scans`);
      });
    }

    // Step 6: Connection pool statistics
    console.log("\n📋 Step 6: Connection pool statistics");
    console.log("====================================");
    const poolStats = await DatabasePerformanceService.getConnectionPoolStats();

    console.log("🏊 Connection pool status:");
    console.log(
      `  Total connections: ${poolStats.totalConnections}/${poolStats.maxConnections}`
    );
    console.log(`  Idle connections: ${poolStats.idleConnections}`);
    console.log(`  Waiting clients: ${poolStats.waitingClients}`);

    const poolUtilization =
      (poolStats.totalConnections / poolStats.maxConnections) * 100;
    console.log(`  Pool utilization: ${poolUtilization.toFixed(1)}%`);

    if (poolUtilization > 80) {
      console.log(
        "  ⚠️  High pool utilization - consider increasing max connections"
      );
    } else if (poolUtilization < 20) {
      console.log("  ✅ Pool utilization is healthy");
    }

    // Final recommendations
    console.log("\n💡 Final Optimization Recommendations");
    console.log("====================================");

    const recommendations = [];

    if (optimizationResults.missingIndexes.length > 0) {
      recommendations.push(
        "Create missing indexes for optimal query performance"
      );
    }

    if (optimizationResults.tablesNeedingVacuum.length > 0) {
      recommendations.push(
        "Schedule VACUUM ANALYZE for tables with high dead tuple ratios"
      );
    }

    if (poolUtilization > 80) {
      recommendations.push("Consider increasing database connection pool size");
    }

    if (metrics.cacheStats.hitRate < 0.8) {
      recommendations.push("Optimize query caching to improve cache hit rate");
    }

    if (recommendations.length === 0) {
      console.log("✅ Database is well optimized for RBAC workload");
    } else {
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    console.log("\n🎉 RBAC database optimization completed successfully!");
  } catch (error) {
    console.error("💥 RBAC database optimization failed:", error);
    process.exit(1);
  }
}

// Run the optimization if called directly
if (require.main === module) {
  optimizeRBACDatabase()
    .then(() => {
      console.log("✅ Optimization script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Optimization script failed:", error);
      process.exit(1);
    });
}

export { optimizeRBACDatabase };
