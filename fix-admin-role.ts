import { db } from "./apps/server/db";
import { users } from "./packages/db/schema";
import { eq } from "drizzle-orm";

async function fixAdminRole() {
  console.log("🔧 Fixing admin role...\n");

  // Find users with 'admin' role
  const adminUsers = await db
    .select()
    .from(users)
    .where(eq(users.role, "admin"));

  if (adminUsers.length === 0) {
    console.log("✅ No users with 'admin' role found. Checking all users...\n");

    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
      })
      .from(users);

    allUsers.forEach((u) => {
      console.log(`  ${u.username}: ${u.role}`);
    });

    process.exit(0);
  }

  console.log(`Found ${adminUsers.length} users with 'admin' role:\n`);
  adminUsers.forEach((u) => {
    console.log(`  - ${u.username} (${u.email})`);
  });

  console.log("\n🔄 Updating to 'system_admin'...\n");

  for (const user of adminUsers) {
    await db
      .update(users)
      .set({ role: "system_admin" })
      .where(eq(users.id, user.id));

    console.log(`✅ Updated ${user.username} to system_admin`);
  }

  console.log("\n✨ Done! You should now be able to run tutoring analysis.");
  process.exit(0);
}

fixAdminRole().catch(console.error);
