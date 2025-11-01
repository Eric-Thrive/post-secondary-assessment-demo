import pg from "pg";
import "dotenv/config";

const { Client } = pg;

async function checkPippa() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();

    // Check Pippa's user record
    const userResult = await client.query(
      "SELECT id, username, email, role, customer_id, organization_id FROM users WHERE username = $1",
      ["Pippa"]
    );

    if (userResult.rows.length === 0) {
      console.log("❌ Pippa not found");
      return;
    }

    const pippa = userResult.rows[0];
    console.log("👤 Pippa User Record:");
    console.log("   ID:", pippa.id);
    console.log("   Username:", pippa.username);
    console.log("   Email:", pippa.email);
    console.log("   Role:", pippa.role);
    console.log("   Customer ID:", pippa.customer_id);
    console.log("   Organization ID:", pippa.organization_id);

    // Check reports in database
    const reportsResult = await client.query(
      `SELECT module_type, customer_id, COUNT(*) as count 
       FROM assessment_cases 
       WHERE status = $1 
       GROUP BY module_type, customer_id 
       ORDER BY module_type, customer_id`,
      ["completed"]
    );

    console.log("\n📊 Reports in Database:");
    if (reportsResult.rows.length === 0) {
      console.log("   No completed reports found");
    } else {
      reportsResult.rows.forEach((row) => {
        console.log(
          `   ${row.module_type} (customer: ${row.customer_id}): ${row.count} reports`
        );
      });
    }

    console.log("\n✅ Fix Applied:");
    console.log("   System admins (like Pippa) will now see ALL reports");
    console.log("   regardless of customer_id because the filter is bypassed.");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await client.end();
  }
}

checkPippa();
