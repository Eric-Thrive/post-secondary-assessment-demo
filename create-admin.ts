import { db } from "./apps/server/db";
import { users } from "./packages/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createAdmin() {
  try {
    const username = "admin";
    const password = "Admin123!";
    const email = "admin@localhost.com";

    console.log("Creating/updating admin user...");

    // Check if admin already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    const hashedPassword = await bcrypt.hash(password, 12);

    if (existingUser) {
      console.log("Admin user exists, updating password and role...");

      await db
        .update(users)
        .set({
          password: hashedPassword,
          role: "system_admin",
          isActive: true,
          maxReports: 999,
        })
        .where(eq(users.username, username));

      console.log("✅ Admin user updated successfully!");
    } else {
      console.log("Creating new admin user...");

      const [newUser] = await db
        .insert(users)
        .values({
          username: username,
          password: hashedPassword,
          email: email,
          role: "system_admin",
          customerId: "system",
          customerName: "System Administrator",
          isActive: true,
          reportCount: 0,
          maxReports: 999,
        })
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
        });

      console.log("✅ Admin user created successfully!");
      console.log("User details:", newUser);
    }

    console.log(`
🔑 Admin Login Credentials:
   Username: ${username}
   Password: ${password}
   Email: ${email}
   Role: system_admin
`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

createAdmin();
