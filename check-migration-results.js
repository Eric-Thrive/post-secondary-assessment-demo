import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function checkResults() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database\n");

    // Check organizations created
    console.log("=".repeat(80));
    console.log("ORGANIZATIONS CREATED:\n");
    const orgs = await client.query(`
      SELECT id, name, customer_id, assigned_modules, max_users
      FROM organizations
      ORDER BY created_at DESC
    `);

    orgs.rows.forEach((org) => {
      console.log(`${org.name}`);
      console.log(`  ID: ${org.id}`);
      console.log(`  Customer ID: ${org.customer_id}`);
      console.log(`  Modules: ${JSON.stringify(org.assigned_modules)}`);
      console.log(`  Max Users: ${org.max_users}`);
      console.log("");
    });

    // Check users and their organizations
    console.log("=".repeat(80));
    console.log("USERS AND ORGANIZATIONS:\n");
    const users = await client.query(`
      SELECT u.username, u.role, u.organization_id, u.assigned_modules,
             o.name as org_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.is_active = true
      ORDER BY u.created_at DESC
    `);

    users.rows.forEach((user) => {
      console.log(`${user.username} (${user.role})`);
      console.log(`  Organization: ${user.org_name || "None"}`);
      console.log(`  Org ID: ${user.organization_id || "None"}`);
      console.log(`  Modules: ${JSON.stringify(user.assigned_modules)}`);
      console.log("");
    });

    // Check orphaned reports
    console.log("=".repeat(80));
    console.log("ORPHANED REPORTS:\n");
    const orphaned = await client.query(`
      SELECT case_id, display_name, customer_id, created_by_user_id, 
             module_type, organization_id
      FROM assessment_cases
      WHERE organization_id IS NULL
      ORDER BY created_date DESC
    `);

    console.log(`Total orphaned: ${orphaned.rows.length}\n`);
    orphaned.rows.forEach((report) => {
      console.log(`${report.display_name} (${report.case_id})`);
      console.log(`  Customer ID: ${report.customer_id}`);
      console.log(`  Created By User ID: ${report.created_by_user_id}`);
      console.log(`  Module: ${report.module_type}`);
      console.log("");
    });

    // Check linked reports
    console.log("=".repeat(80));
    console.log("LINKED REPORTS:\n");
    const linked = await client.query(`
      SELECT ac.case_id, ac.display_name, ac.organization_id,
             o.name as org_name, ac.created_by_user_id,
             u.username as created_by
      FROM assessment_cases ac
      LEFT JOIN organizations o ON ac.organization_id = o.id
      LEFT JOIN users u ON ac.created_by_user_id = u.id
      WHERE ac.organization_id IS NOT NULL
      ORDER BY ac.created_date DESC
    `);

    console.log(`Total linked: ${linked.rows.length}\n`);
    linked.rows.forEach((report) => {
      console.log(`${report.display_name}`);
      console.log(`  Organization: ${report.org_name}`);
      console.log(`  Created By: ${report.created_by || "Unknown"}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

checkResults();
