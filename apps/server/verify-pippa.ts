import { db, pool } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function verifyPippaEmail() {
  try {
    console.log("Looking for Pippa user...");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, "Pippa"));

    if (!user) {
      console.log("User 'Pippa' not found in database");
      console.log("\nAvailable users:");
      const allUsers = await db
        .select({
          username: users.username,
          email: users.email,
          emailVerified: users.emailVerified,
        })
        .from(users);
      console.table(allUsers);
      await pool.end();
      process.exit(1);
    }

    console.log("Found user:", user.username);
    console.log("Email:", user.email);
    console.log("Email Verified:", user.emailVerified);

    if (user.emailVerified) {
      console.log("\n✅ Email is already verified!");
      await pool.end();
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

verifyPippaEmail();
