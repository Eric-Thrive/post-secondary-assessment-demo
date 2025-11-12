import pg from "pg";
import "dotenv/config";

const { Client } = pg;

async function checkMilkUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("🔍 Checking Milk user...\n");

    const result = await client.query(
      `SELECT id, username, email, role, assigned_modules, organization_id, is_active
       FROM users 
       WHERE username = $1`,
      ["Milk"]
    );

    if (result.rows.length === 0) {
      console.log('❌ User "Milk" not found');

      // Check for similar usernames
      const allUsers = await client.query(
        `SELECT username, role, assigned_modules FROM users ORDER BY username`
      );
      console.log("\n📋 All users:");
      allUsers.rows.forEach((u) => {
        console.log(
          `  - ${u.username} (${u.role}) - modules: ${JSON.stringify(
            u.assigned_modules
          )}`
        );
      });
    } else {
      const user = result.rows[0];
      console.log("✅ Found Milk user:\n");
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(
        `  Assigned Modules: ${JSON.stringify(user.assigned_modules)}`
      );
      console.log(`  Organization ID: ${user.organization_id || "none"}`);
      console.log(`  Is Active: ${user.is_active}`);

      // Check what modules are available
      console.log("\n📦 Module Access:");
      const modules = user.assigned_modules || [];
      if (modules.includes("tutoring")) {
        console.log("  ✅ tutoring");
      } else {
        console.log("  ❌ tutoring");
      }
      if (modules.includes("post_secondary")) {
        console.log("  ✅ post_secondary");
      } else {
        console.log("  ❌ post_secondary");
      }
      if (modules.includes("k12")) {
        console.log("  ✅ k12");
      } else {
        console.log("  ❌ k12");
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

checkMilkUser();
