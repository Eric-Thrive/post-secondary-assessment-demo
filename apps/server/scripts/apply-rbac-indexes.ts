#!/usr/bin/env node

/**
 * Script to apply RBAC performance indexes
 * Task 10.1: Add proper indexes for role-based queries and organization filtering
 */

import { readFileSync } from "fs";
import { join } from "path";
import { db } from "../db";
import { sql } from "drizzle-orm";

async function applyRBACIndexes() {
  console.log("🚀 Starting RBAC performance index creation...");

  try {
    // Read the SQL migration file
    const migrationPath = join(
      __dirname,
      "../migrations/add-rbac-performance-indexes.sql"
    );
    const migrationSQL = readFileSync(migrationPath, "utf8");

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        // Skip comments and empty statements
        if (statement.startsWith("--") || statement.trim().length === 0) {
          continue;
        }

        console.log(`⚡ Executing: ${statement.substring(0, 80)}...`);

        await db.execute(sql.raw(statement));
        successCount++;

        // Add a small delay between index creations to reduce load
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error: any) {
        if (error.message.includes("already exists")) {
          console.log(`⏭️  Index already exists, skipping...`);
          skipCount++;
        } else {
          console.error(`❌ Error executing statement: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log("\n📊 Index Creation Summary:");
    console.log(`✅ Successfully created: ${successCount} indexes`);
    console.log(`⏭️  Skipped (already exist): ${skipCount} indexes`);
    console.log(`❌ Errors: ${errorCount} indexes`);

    // Verify critical indexes were created
    console.log("\n🔍 Verifying critical RBAC indexes...");

    const criticalIndexes = [
      "idx_users_role_active",
      "idx_users_org_role",
      "idx_users_demo_reports",
      "idx_organizations_active_modules",
      "idx_assessment_cases_org_module",
      "idx_prompt_sections_module_type",
    ];

    const [existingIndexes] = await db.execute(sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname = ANY(${criticalIndexes})
    `);

    const existingIndexNames = existingIndexes.map((idx: any) => idx.indexname);

    console.log("✅ Verified indexes:");
    for (const indexName of criticalIndexes) {
      const exists = existingIndexNames.includes(indexName);
      console.log(`   ${exists ? "✅" : "❌"} ${indexName}`);
    }

    // Get index sizes for monitoring
    console.log("\n📏 Index sizes:");
    const [indexSizes] = await db.execute(sql`
      SELECT 
        indexname,
        pg_size_pretty(pg_relation_size(indexname::regclass)) as size
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY pg_relation_size(indexname::regclass) DESC
      LIMIT 10
    `);

    for (const indexSize of indexSizes) {
      console.log(
        `   ${(indexSize as any).indexname}: ${(indexSize as any).size}`
      );
    }

    console.log("\n🎉 RBAC performance indexes applied successfully!");
  } catch (error) {
    console.error("💥 Failed to apply RBAC indexes:", error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  applyRBACIndexes()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

export { applyRBACIndexes };
