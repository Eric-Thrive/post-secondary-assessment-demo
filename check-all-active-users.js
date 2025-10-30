import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function checkAllUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database\n");

    // Get all users with their report counts
    const users = await client.query(
      `SELECT u.id, u.username, u.email, u.role, u.customer_id, u.organization_id, 
              u.assigned_modules, u.is_active, u.created_at,
              COUNT(ac.id) as actual_report_count
       FROM users u
       LEFT JOIN assessment_cases ac ON ac.created_by_user_id = u.id
       WHERE u.is_active = true
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    console.log(`Total Active Users: ${users.rows.length}\n`);
    console.log("=".repeat(80));

    users.rows.forEach((user) => {
      console.log(`\n${user.username} (${user.role})`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Customer ID: ${user.customer_id}`);
      console.log(`  Organization ID: ${user.organization_id || "None"}`);
      console.log(`  Modules: ${JSON.stringify(user.assigned_modules)}`);
      console.log(`  Reports Created: ${user.actual_report_count}`);
      console.log(`  Created: ${user.created_at.toISOString().split("T")[0]}`);
    });

    console.log("\n" + "=".repeat(80));
    console.log("\nReport Distribution by customer_id:\n");

    const reportsByCustomer = await client.query(
      `SELECT customer_id, module_type, COUNT(*) as count
       FROM assessment_cases
       GROUP BY customer_id, module_type
       ORDER BY customer_id, module_type`
    );

    reportsByCustomer.rows.forEach((row) => {
      console.log(
        `  ${row.customer_id} (${row.module_type}): ${row.count} reports`
      );
    });

    console.log("\n" + "=".repeat(80));
    console.log("\nOrganizations:\n");

    const orgs = await client.query(
      `SELECT id, name, customer_id, assigned_modules, max_users, is_active
       FROM organizations
       ORDER BY created_at DESC`
    );

    if (orgs.rows.length === 0) {
      console.log("  No organizations found");
    } else {
      orgs.rows.forEach((org) => {
        console.log(`  ${org.name} (${org.id})`);
        console.log(`    Customer ID: ${org.customer_id}`);
        console.log(`    Modules: ${JSON.stringify(org.assigned_modules)}`);
        console.log(`    Max Users: ${org.max_users}`);
        console.log(`    Active: ${org.is_active}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

checkAllUsers();
