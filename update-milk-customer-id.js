import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function updateCustomerId() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database\n");

    // Update Milk's customer_id to match the old reports
    const result = await client.query(
      `UPDATE users 
       SET customer_id = 'demo-customer' 
       WHERE LOWER(username) = LOWER($1)
       RETURNING id, username, customer_id`,
      ["milk"]
    );

    if (result.rowCount > 0) {
      console.log(`✅ Updated user: ${result.rows[0].username}`);
      console.log(`   New customer_id: ${result.rows[0].customer_id}`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

updateCustomerId();
