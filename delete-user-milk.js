import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function deleteUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Delete assessment cases first
    const deleteCases = await client.query(
      `DELETE FROM assessment_cases WHERE created_by_user_id = (
        SELECT id FROM users WHERE username = $1
      )`,
      ["milk"]
    );
    console.log(`Deleted ${deleteCases.rowCount} assessment cases`);

    // Delete the user
    const deleteUser = await client.query(
      "DELETE FROM users WHERE username = $1",
      ["milk"]
    );
    console.log(`Deleted ${deleteUser.rowCount} user(s)`);

    // Verify
    const verify = await client.query(
      "SELECT COUNT(*) as count FROM users WHERE username = $1",
      ["milk"]
    );
    console.log(`Remaining users named 'milk': ${verify.rows[0].count}`);

    console.log('✅ User "milk" deleted successfully!');
  } catch (error) {
    console.error("❌ Error deleting user:", error);
  } finally {
    await client.end();
  }
}

deleteUser();
