import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function deleteReports() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database\n");

    // Count first
    const count = await client.query(
      `SELECT COUNT(*) as count FROM assessment_cases WHERE customer_id = 'demo-customer'`
    );
    console.log(
      `Found ${count.rows[0].count} reports with customer_id 'demo-customer'\n`
    );

    // Delete them
    const result = await client.query(
      `DELETE FROM assessment_cases WHERE customer_id = 'demo-customer'`
    );

    console.log(`✅ Deleted ${result.rowCount} reports`);

    // Verify
    const verify = await client.query(
      `SELECT COUNT(*) as count FROM assessment_cases WHERE customer_id = 'demo-customer'`
    );
    console.log(`\n✅ Remaining reports: ${verify.rows[0].count}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

deleteReports();
