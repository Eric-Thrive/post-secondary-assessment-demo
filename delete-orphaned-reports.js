import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function deleteOrphanedReports() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database\n");

    // Count orphaned reports
    const count = await client.query(`
      SELECT COUNT(*) as count 
      FROM assessment_cases 
      WHERE organization_id IS NULL
    `);

    console.log(`Found ${count.rows[0].count} orphaned reports\n`);

    // Delete them
    const result = await client.query(`
      DELETE FROM assessment_cases 
      WHERE organization_id IS NULL
      RETURNING case_id, display_name
    `);

    console.log(`✅ Deleted ${result.rowCount} orphaned reports:\n`);
    result.rows.forEach((report, idx) => {
      console.log(`  ${idx + 1}. ${report.display_name} (${report.case_id})`);
    });

    // Verify
    const verify = await client.query(`
      SELECT COUNT(*) as count 
      FROM assessment_cases
    `);

    console.log(`\n✅ Remaining reports: ${verify.rows[0].count}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

deleteOrphanedReports();
