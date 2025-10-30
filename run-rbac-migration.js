import pg from "pg";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const { Client } = pg;

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("🔌 Connected to database\n");

    // Read the migration SQL file
    const migrationSQL = fs.readFileSync("migrate-to-proper-rbac.sql", "utf8");

    console.log("📋 Running RBAC migration...\n");
    console.log("=".repeat(80));

    // Execute the migration
    const result = await client.query(migrationSQL);

    console.log("\n✅ Migration completed successfully!\n");

    // Show summary
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
        (SELECT COUNT(*) FROM organizations WHERE is_active = true) as organizations,
        (SELECT COUNT(*) FROM assessment_cases) as total_reports,
        (SELECT COUNT(*) FROM assessment_cases WHERE organization_id IS NOT NULL) as linked_reports
    `);

    const stats = summary.rows[0];
    console.log("📊 Migration Summary:");
    console.log(`   Active Users: ${stats.active_users}`);
    console.log(`   Organizations: ${stats.organizations}`);
    console.log(`   Total Reports: ${stats.total_reports}`);
    console.log(`   Reports Linked to Orgs: ${stats.linked_reports}`);
    console.log(
      `   Orphaned Reports: ${stats.total_reports - stats.linked_reports}`
    );

    // Check for orphaned reports
    if (stats.total_reports - stats.linked_reports > 0) {
      console.log(
        "\n⚠️  Warning: Some reports are not linked to organizations"
      );
      const orphaned = await client.query(`
        SELECT case_id, display_name, customer_id, created_by_user_id, module_type
        FROM assessment_cases
        WHERE organization_id IS NULL
        LIMIT 5
      `);
      console.log("\nOrphaned reports:");
      orphaned.rows.forEach((report) => {
        console.log(`  - ${report.display_name} (${report.case_id})`);
        console.log(
          `    customer_id: ${report.customer_id}, created_by: ${report.created_by_user_id}`
        );
      });
    }

    console.log("\n✅ Migration complete!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

console.log("🚀 Starting RBAC Database Migration");
console.log("=".repeat(80));
console.log("\nThis will:");
console.log("  1. Add organization_id to assessment_cases");
console.log("  2. Create organizations for existing users");
console.log("  3. Link users to their organizations");
console.log("  4. Migrate reports to use organization_id");
console.log("  5. Add foreign key constraints");
console.log("\n⚠️  Make sure you have a database backup before proceeding!");
console.log("=".repeat(80));
console.log("\nPress Ctrl+C to cancel, or wait 3 seconds to continue...\n");

setTimeout(() => {
  runMigration();
}, 3000);
