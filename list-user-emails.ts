import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users } from "./packages/db/schema";

const { Pool } = pg;

async function listUserEmails() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    const allUsers = await db
      .select({
        email: users.email,
        username: users.username,
        emailVerified: users.emailVerified,
        role: users.role,
      })
      .from(users)
      .orderBy(users.email);

    console.log("\n=== Existing User Emails ===\n");

    if (allUsers.length === 0) {
      console.log("No users found in the database.");
    } else {
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Email Verified: ${user.emailVerified ? "✓" : "✗"}`);
        console.log("");
      });

      console.log(`Total users: ${allUsers.length}\n`);
    }
  } catch (error) {
    console.error("Error fetching user emails:", error);
    await pool.end();
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

listUserEmails();
