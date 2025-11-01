import { db, pool } from "./apps/server/db";
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
      process.exit(1);
    }

    console.log("Found user:", user.username);
    console.log("Email:", user.email);
    console.log("Email Verified:", user.emailVerified);
    console.log("Active:", user.isActive);

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

    console.log("Email verified successfully!");
    console.log("\nPippa can now log in with:");
    console.log("Username:", user.username);
    console.log("Password: 77Emily#77");

    await pool.end();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

verifyPippaEmail();
