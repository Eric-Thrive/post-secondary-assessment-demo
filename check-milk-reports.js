import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function checkReports() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database\n");

    // Check if Milk user exists
    const userCheck = await client.query(
      `SELECT id, username, email, customer_id FROM users WHERE LOWER(username) = LOWER($1)`,
      ["milk"]
    );

    if (userCheck.rows.length === 0) {
      console.log('❌ User "Milk" not found\n');
    } else {
      const user = userCheck.rows[0];
      console.log("Found user:");
      console.log(`  ID: ${user.id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Customer ID: ${user.customer_id}\n`);

      // Check reports by created_by_user_id
      const reportsByUser = await client.query(
        `SELECT COUNT(*) as count FROM assessment_cases WHERE created_by_user_id = $1`,
        [user.id]
      );
      console.log(
        `Reports created by user ID ${user.id}: ${reportsByUser.rows[0].count}`
      );

      // Check reports by customer_id
      const reportsByCustomer = await client.query(
        `SELECT COUNT(*) as count FROM assessment_cases WHERE customer_id = $1`,
        [user.customer_id]
      );
      console.log(
        `Reports with customer_id '${user.customer_id}': ${reportsByCustomer.rows[0].count}\n`
      );
    }

    // Check all reports with customer_id = 'demo-customer'
    const demoReports = await client.query(
      `SELECT case_id, display_name, created_by_user_id, customer_id, created_date 
       FROM assessment_cases 
       WHERE customer_id = 'demo-customer' 
       ORDER BY created_date DESC 
       LIMIT 10`
    );

    console.log(
      `\nSample reports with customer_id 'demo-customer' (showing 10 of ${demoReports.rows.length}):`
    );
    demoReports.rows.forEach((report, index) => {
      console.log(`${index + 1}. ${report.case_id}`);
      console.log(`   Display: ${report.display_name}`);
      console.log(`   Created by user ID: ${report.created_by_user_id}`);
      console.log(`   Customer ID: ${report.customer_id}`);
      console.log(`   Date: ${report.created_date}`);
      console.log("");
    });

    // Total count
    const totalDemo = await client.query(
      `SELECT COUNT(*) as count FROM assessment_cases WHERE customer_id = 'demo-customer'`
    );
    console.log(
      `\nTotal reports with customer_id 'demo-customer': ${totalDemo.rows[0].count}`
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

checkReports();
