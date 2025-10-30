import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function deleteUserProperly(username) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log(`\n🗑️  Deleting user: ${username}\n`);

    // 1. Find the user
    const userResult = await client.query(
      `SELECT id, username, email, customer_id FROM users WHERE LOWER(username) = LOWER($1)`,
      [username]
    );

    if (userResult.rows.length === 0) {
      console.log("❌ User not found");
      return;
    }

    const user = userResult.rows[0];
    console.log("Found user:");
    console.log(`  ID: ${user.id}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Customer ID: ${user.customer_id}\n`);

    // 2. Delete reports created by this user
    const reportsByUser = await client.query(
      `DELETE FROM assessment_cases WHERE created_by_user_id = $1`,
      [user.id]
    );
    console.log(
      `✅ Deleted ${reportsByUser.rowCount} report(s) created by user`
    );

    // 3. Delete reports with matching customer_id (if not 'system')
    if (user.customer_id && user.customer_id !== "system") {
      const reportsByCustomer = await client.query(
        `DELETE FROM assessment_cases WHERE customer_id = $1`,
        [user.customer_id]
      );
      console.log(
        `✅ Deleted ${reportsByCustomer.rowCount} report(s) with customer_id '${user.customer_id}'`
      );
    }

    // 4. Delete the user
    const deleteUser = await client.query(
      `DELETE FROM users WHERE id = $1 RETURNING username`,
      [user.id]
    );
    console.log(`✅ Deleted user: ${deleteUser.rows[0].username}`);

    // 5. Verify
    const verify = await client.query(
      `SELECT COUNT(*) as count FROM users WHERE LOWER(username) = LOWER($1)`,
      [username]
    );
    console.log(
      `\n✅ Complete! ${verify.rows[0].count} user(s) named "${username}" remaining\n`
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

// Get username from command line argument
const username = process.argv[2];

if (!username) {
  console.log("Usage: node delete-user-properly.js <username>");
  console.log("Example: node delete-user-properly.js milk");
  process.exit(1);
}

deleteUserProperly(username);
