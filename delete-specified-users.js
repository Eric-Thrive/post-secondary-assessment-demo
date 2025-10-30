import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function deleteUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database\n");

    const usersToDelete = [
      "admin",
      "superadmin",
      "Milk",
      "Snack",
      "Boomer",
      "testk12user",
      "ekm172",
      "testuser_5h56lD",
    ];

    console.log("Users to delete:");
    usersToDelete.forEach((username, idx) => {
      console.log(`  ${idx + 1}. ${username}`);
    });
    console.log("");

    for (const username of usersToDelete) {
      // Get user info first
      const userInfo = await client.query(
        "SELECT id, username, email FROM users WHERE username = $1",
        [username]
      );

      if (userInfo.rows.length === 0) {
        console.log(`⏭️  User "${username}" not found, skipping`);
        continue;
      }

      const user = userInfo.rows[0];

      // Delete reports created by this user
      const deleteReports = await client.query(
        "DELETE FROM assessment_cases WHERE created_by_user_id = $1",
        [user.id]
      );

      // Delete the user
      const deleteUser = await client.query("DELETE FROM users WHERE id = $1", [
        user.id,
      ]);

      console.log(`✅ Deleted ${username} (${user.email})`);
      console.log(`   Removed ${deleteReports.rowCount} report(s)`);
    }

    // Show remaining users
    console.log("\n" + "=".repeat(80));
    console.log("Remaining active users:\n");

    const remaining = await client.query(
      `SELECT username, email, role, 
              (SELECT COUNT(*) FROM assessment_cases WHERE created_by_user_id = users.id) as report_count
       FROM users 
       WHERE is_active = true
       ORDER BY created_at DESC`
    );

    remaining.rows.forEach((user, idx) => {
      console.log(
        `${idx + 1}. ${user.username} (${user.role}) - ${user.email} - ${
          user.report_count
        } reports`
      );
    });

    console.log(`\nTotal remaining users: ${remaining.rows.length}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

deleteUsers();
