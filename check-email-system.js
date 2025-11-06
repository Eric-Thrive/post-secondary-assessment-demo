import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function checkEmailSystem() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("🔍 Checking system configuration...\n");

    // Check SendGrid configuration
    console.log("📧 SendGrid Configuration:");
    console.log(
      "  API Key:",
      process.env.SENDGRID_API_KEY ? "✅ Set" : "❌ Not set"
    );
    console.log(
      "  From Email:",
      process.env.SENDGRID_FROM_EMAIL || "❌ Not set"
    );
    console.log("");

    // Check for system admins
    console.log("👤 System Administrators:");
    const adminsResult = await client.query(
      `SELECT id, username, email, role FROM users WHERE role = 'system_admin'`
    );

    if (adminsResult.rows.length === 0) {
      console.log("  ❌ No system admins found!");
      console.log("  This means admin notifications cannot be sent.");
    } else {
      console.log(`  ✅ Found ${adminsResult.rows.length} system admin(s):`);
      adminsResult.rows.forEach((admin) => {
        console.log(`     - ${admin.username} (${admin.email})`);
      });
    }
    console.log("");

    // Check MV user
    console.log("🔍 Checking MV user:");
    const mvResult = await client.query(
      `SELECT username, email, email_verified, email_verification_token IS NOT NULL as has_token, role 
       FROM users WHERE username = 'MV'`
    );

    if (mvResult.rows.length === 0) {
      console.log("  ❌ MV user not found");
    } else {
      const mv = mvResult.rows[0];
      console.log(`  Username: ${mv.username}`);
      console.log(`  Email: ${mv.email}`);
      console.log(
        `  Email Verified: ${mv.email_verified ? "✅ Yes" : "❌ No"}`
      );
      console.log(
        `  Has Verification Token: ${mv.has_token ? "✅ Yes" : "❌ No"}`
      );
      console.log(`  Role: ${mv.role}`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

checkEmailSystem();
