import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users } from "./packages/db/schema.ts";
import { eq } from "drizzle-orm";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function verifyEmail() {
  try {
    console.log("Looking for Pippa user...");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, "Pippa"));

    if (!user) {
      console.log("User 'Pippa' not found");
      process.exit(1);
    }

    console.log("Found user:", user.username);
    console.log("Email:", user.email);
    console.log("Email Verified:", user.emailVerified);

    if (user.emailVerified) {
      console.log("\nEmail is already verified!");
      process.exit(0);
    }

    console.log("\nVerifying email...");

    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      })
      .where(eq(users.id, user.id));

    console.log("✅ Email verified successfully!");
    console.log(
      "\nYou can now log in without being redirected to the verification page."
    );

    await pool.end();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

verifyEmail();
