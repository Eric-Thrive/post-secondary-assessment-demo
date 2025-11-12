import pg from "pg";
import "dotenv/config";

const { Client } = pg;

async function fixPippaRole() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database\n");

    // Check current role
    const checkResult = await client.query(
      "SELECT id, username, email, role FROM users WHERE username = $1",
      ["Pippa"]
    );

    if (checkResult.rows.length === 0) {
      console.log("❌ User Pippa not found");
      return;
    }

    const user = checkResult.rows[0];
    console.log("Current role:", user.role);

    if (user.role === "system_admin") {
      console.log("✅ Role is already correct!");
      return;
    }

    console.log('Updating role from "admin" to "system_admin"...\n');

    await client.query("UPDATE users SET role = $1 WHERE username = $2", [
      "system_admin",
      "Pippa",
    ]);

    console.log("✅ Role updated successfully!");
    console.log("\nPippa can now log in with:");
    console.log("Username: Pippa");
    console.log("Password: 77Emily#77");
    console.log("Role: system_admin (full access to all modules)");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

fixPippaRole();
