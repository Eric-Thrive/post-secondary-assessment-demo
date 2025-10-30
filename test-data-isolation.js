import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function testDataIsolation() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("🔍 Testing Data Isolation\n");

    // Get total assessment cases
    const totalCases = await client.query(
      "SELECT COUNT(*) as count FROM assessment_cases"
    );
    console.log(
      `📊 Total assessment cases in database: ${totalCases.rows[0].count}\n`
    );

    // Get cases by customer
    const casesByCustomer = await client.query(
      `SELECT customer_id, COUNT(*) as count 
       FROM assessment_cases 
       GROUP BY customer_id 
       ORDER BY count DESC`
    );

    console.log("📋 Cases by customer:");
    casesByCustomer.rows.forEach((row) => {
      console.log(`   ${row.customer_id}: ${row.count} cases`);
    });
    console.log("");

    // Get users and their customer IDs
    const users = await client.query(
      `SELECT username, email, role, customer_id, assigned_modules 
       FROM users 
       WHERE role = 'customer' 
       ORDER BY username`
    );

    console.log("👥 Customer users:");
    users.rows.forEach((user) => {
      console.log(`   ${user.username} (${user.customer_id})`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Modules: ${JSON.stringify(user.assigned_modules)}`);
    });
    console.log("");

    // Check for cases without proper customer assignment
    const orphanedCases = await client.query(
      `SELECT COUNT(*) as count 
       FROM assessment_cases 
       WHERE customer_id IS NULL OR customer_id = ''`
    );

    if (parseInt(orphanedCases.rows[0].count) > 0) {
      console.log(
        `⚠️  WARNING: ${orphanedCases.rows[0].count} cases without customer assignment!`
      );
    } else {
      console.log("✅ All cases have proper customer assignment");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

testDataIsolation();
