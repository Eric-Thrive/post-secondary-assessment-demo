#!/usr/bin/env node

/**
 * Script to run RBAC migration scripts in order
 * This script applies the database schema changes for the RBAC system
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const MIGRATIONS_DIR = path.join(__dirname, "../packages/db/migrations");

// Migration files in order
const migrations = [
  "0002_add_organizations_table.sql",
  "0003_update_users_table_rbac.sql",
  "0004_migrate_users_to_rbac.sql",
];

async function runMigrations() {
  console.log("🚀 Starting RBAC migrations...\n");

  for (const migration of migrations) {
    const migrationPath = path.join(MIGRATIONS_DIR, migration);

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migration}`);
      process.exit(1);
    }

    console.log(`📄 Running migration: ${migration}`);

    try {
      // Read the SQL file
      const sql = fs.readFileSync(migrationPath, "utf8");

      // Run the migration using psql (requires DATABASE_URL environment variable)
      if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL environment variable is required");
        process.exit(1);
      }

      execSync(
        `psql "${process.env.DATABASE_URL}" -c "${sql.replace(/"/g, '\\"')}"`,
        {
          stdio: "inherit",
        }
      );

      console.log(`✅ Migration completed: ${migration}\n`);
    } catch (error) {
      console.error(`❌ Migration failed: ${migration}`);
      console.error(error.message);
      process.exit(1);
    }
  }

  console.log("🎉 All RBAC migrations completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Verify the schema changes in your database");
  console.log("2. Test user authentication with new roles");
  console.log("3. Implement permission gates and middleware");
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations().catch(console.error);
}

module.exports = { runMigrations };
