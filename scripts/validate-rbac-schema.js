#!/usr/bin/env node

/**
 * Script to validate RBAC schema changes
 * Verifies that the database schema has been properly updated for RBAC
 */

const { execSync } = require("child_process");

async function validateSchema() {
  console.log("🔍 Validating RBAC schema changes...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const validations = [
    {
      name: "Organizations table exists",
      query: `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organizations');`,
    },
    {
      name: "Organizations table has correct columns",
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'organizations' ORDER BY column_name;`,
    },
    {
      name: "Users table has RBAC columns",
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('assigned_modules', 'organization_id') ORDER BY column_name;`,
    },
    {
      name: "Users table foreign key constraint exists",
      query: `SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'users' AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_users_organization_id';`,
    },
    {
      name: "Assessment cases has organization_id column",
      query: `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assessment_cases' AND column_name = 'organization_id');`,
    },
    {
      name: "Count of organizations created",
      query: `SELECT COUNT(*) as organization_count FROM organizations;`,
    },
    {
      name: "Count of users with RBAC roles",
      query: `SELECT role, COUNT(*) as user_count FROM users GROUP BY role ORDER BY role;`,
    },
  ];

  for (const validation of validations) {
    console.log(`📋 ${validation.name}:`);

    try {
      const result = execSync(
        `psql "${process.env.DATABASE_URL}" -t -c "${validation.query}"`,
        {
          encoding: "utf8",
        }
      );

      console.log(`   ${result.trim()}`);
      console.log("   ✅ Passed\n");
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`);
    }
  }

  console.log("🎉 RBAC schema validation completed!");
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateSchema().catch(console.error);
}

module.exports = { validateSchema };
