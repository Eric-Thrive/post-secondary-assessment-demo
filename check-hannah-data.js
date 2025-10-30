import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function checkHannahData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database\n");

    // Find Hannah user
    const hannahUser = await client.query(
      `SELECT id, username, email, role, customer_id, organization_id, assigned_modules, 
              report_count, max_reports, is_active, created_at
       FROM users 
       WHERE LOWER(username) LIKE '%hannah%' OR LOWER(email) LIKE '%hannah%'`
    );

    if (hannahUser.rows.length === 0) {
      console.log('❌ No user found matching "hannah"\n');

      // Show all active customer users
      const customers = await client.query(
        `SELECT id, username, email, role, customer_id, organization_id, report_count
         FROM users 
         WHERE role = 'customer' AND is_active = true
         ORDER BY created_at DESC
         LIMIT 10`
      );

      console.log("Active customer users:");
      customers.rows.forEach((user) => {
        console.log(
          `  - ${user.username} (${user.email}) - ${user.report_count} reports - customer_id: ${user.customer_id}`
        );
      });
    } else {
      console.log("Found Hannah user(s):\n");
      hannahUser.rows.forEach((user) => {
        console.log(`Username: ${user.username}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Customer ID: ${user.customer_id}`);
        console.log(`Organization ID: ${user.organization_id}`);
        console.log(
          `Assigned Modules: ${JSON.stringify(user.assigned_modules)}`
        );
        console.log(`Report Count: ${user.report_count}`);
        console.log(`Max Reports: ${user.max_reports}`);
        console.log(`Active: ${user.is_active}`);
        console.log(`Created: ${user.created_at}`);
        console.log("");
      });

      // Check Hannah's reports
      const hannahReports = await client.query(
        `SELECT case_id, display_name, module_type, status, customer_id, 
                created_by_user_id, created_date
         FROM assessment_cases 
         WHERE created_by_user_id = $1 OR customer_id = $2
         ORDER BY created_date DESC`,
        [hannahUser.rows[0].id, hannahUser.rows[0].customer_id]
      );

      console.log(`\nHannah's Reports (${hannahReports.rows.length} total):\n`);
      hannahReports.rows.forEach((report, idx) => {
        console.log(`${idx + 1}. ${report.display_name}`);
        console.log(`   Case ID: ${report.case_id}`);
        console.log(`   Module: ${report.module_type}`);
        console.log(`   Status: ${report.status}`);
        console.log(`   Customer ID: ${report.customer_id}`);
        console.log(`   Created By User ID: ${report.created_by_user_id}`);
        console.log(`   Date: ${report.created_date}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

checkHannahData();
