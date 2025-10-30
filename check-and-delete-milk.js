import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function checkAndDeleteUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database\n");

    // First, check if user exists
    const checkUser = await client.query(
      "SELECT id, username, email, role, created_at FROM users WHERE username = $1",
      ["milk"]
    );

    if (checkUser.rows.length === 0) {
      console.log('❌ User "milk" not found in database');
      return;
    }

    console.log("Found user:");
    console.log(checkUser.rows[0]);
    console.log("");

    const userId = checkUser.rows[0].id;

    // Check for assessment cases
    const checkCases = await client.query(
      "SELECT COUNT(*) as count FROM assessment_cases WHERE created_by_user_id = $1",
      [userId]
    );
    console.log(`User has ${checkCases.rows[0].count} assessment case(s)\n`);

    // Delete assessment cases first
    const deleteCases = await client.query(
      "DELETE FROM assessment_cases WHERE created_by_user_id = $1",
      [userId]
    );
    console.log(`✅ Deleted ${deleteCases.rowCount} assessment case(s)`);

    // Delete the user
    const deleteUser = await client.query(
      "DELETE FROM users WHERE username = $1 RETURNING id, username",
      ["milk"]
    );

    if (deleteUser.rowCount > 0) {
      console.log(
        `✅ Deleted user: ${deleteUser.rows[0].username} (ID: ${deleteUser.rows[0].id})`
      );
    }

    // Verify deletion
    const verify = await client.query(
      "SELECT COUNT(*) as count FROM users WHERE username = $1",
      ["milk"]
    );
    console.log(
      `\n✅ Verification: ${verify.rows[0].count} user(s) named "milk" remaining`
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

checkAndDeleteUser();
