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
    console.log("Connected to database\n");

    // Delete assessment cases first
    const deleteCases = await client.query(
      "DELETE FROM assessment_cases WHERE created_by_user_id = 5"
    );
    console.log(`✅ Deleted ${deleteCases.rowCount} assessment case(s)`);

    // Delete the user (case-sensitive)
    const deleteUser = await client.query(
      "DELETE FROM users WHERE username = $1 RETURNING id, username, email",
      ["Milk"]
    );

    if (deleteUser.rowCount > 0) {
      console.log(`✅ Deleted user: ${deleteUser.rows[0].username}`);
      console.log(`   Email: ${deleteUser.rows[0].email}`);
      console.log(`   ID: ${deleteUser.rows[0].id}`);
    } else {
      console.log("❌ User not found");
    }

    // Verify deletion
    const verify = await client.query(
      "SELECT COUNT(*) as count FROM users WHERE LOWER(username) = LOWER($1)",
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

deleteUser();
