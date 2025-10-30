import { db } from "./apps/server/db";
import { users, assessmentCases } from "./packages/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createPostSecDemo() {
  try {
    const username = "postsec-demo";
    const password = "Demo123!";
    const email = "postsec-demo@localhost.com";

    console.log("Creating/updating post-secondary demo user...");

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    const hashedPassword = await bcrypt.hash(password, 12);

    let userId: number;

    if (existingUser) {
      console.log("Demo user exists, updating password and settings...");

      await db
        .update(users)
        .set({
          password: hashedPassword,
          role: "customer",
          assignedModules: ["post_secondary"],
          isActive: true,
          maxReports: 10,
        })
        .where(eq(users.username, username));

      userId = existingUser.id;
      console.log("✅ Demo user updated successfully!");
    } else {
      console.log("Creating new demo user...");

      const [newUser] = await db
        .insert(users)
        .values({
          username: username,
          password: hashedPassword,
          email: email,
          role: "customer",
          assignedModules: ["post_secondary"],
          customerId: "demo-postsec",
          customerName: "Post-Secondary Demo User",
          isActive: true,
          reportCount: 0,
          maxReports: 10,
        })
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
        });

      userId = newUser.id;
      console.log("✅ Demo user created successfully!");
      console.log("User details:", newUser);
    }

    console.log(`
🎓 Post-Secondary Demo User Ready!
   
   Login Credentials:
   Username: ${username}
   Password: ${password}
   Email: ${email}
   Role: customer
   Module: post_secondary
   Max Reports: 10
   
   You can now login and test the post-secondary pathway!
`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating demo user:", error);
    process.exit(1);
  }
}

createPostSecDemo();
