import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { users } from "./packages/shared/dist/index.js";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function testEmailSystem() {
  try {
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
    const admins = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.role, "system_admin"));

    if (admins.length === 0) {
      console.log("  ❌ No system admins found!");
      console.log("  This means admin notifications cannot be sent.");
    } else {
      console.log(`  ✅ Found ${admins.length} system admin(s):`);
      admins.forEach((admin) => {
        console.log(`     - ${admin.username} (${admin.email})`);
      });
    }
    console.log("");

    // Check MV user
    console.log("🔍 Checking MV user:");
    const mvUsers = await db
      .select({
        username: users.username,
        email: users.email,
        emailVerified: users.emailVerified,
        hasToken: users.emailVerificationToken,
        role: users.role,
      })
      .from(users)
      .where(eq(users.username, "MV"));

    if (mvUsers.length === 0) {
      console.log("  ❌ MV user not found");
    } else {
      const mv = mvUsers[0];
      console.log(`  Username: ${mv.username}`);
      console.log(`  Email: ${mv.email}`);
      console.log(`  Email Verified: ${mv.emailVerified ? "✅ Yes" : "❌ No"}`);
      console.log(
        `  Has Verification Token: ${mv.hasToken ? "✅ Yes" : "❌ No"}`
      );
      console.log(`  Role: ${mv.role}`);
    }

    await pool.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testEmailSystem();
