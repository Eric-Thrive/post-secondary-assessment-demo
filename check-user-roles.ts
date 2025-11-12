import { db } from "./apps/server/db";
import { users } from "./packages/db/schema";

async function checkUserRoles() {
  console.log("🔍 Checking user roles in database...\n");

  const allUsers = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      email: users.email,
    })
    .from(users);

  console.log(`Found ${allUsers.length} users:\n`);

  allUsers.forEach((user) => {
    console.log(`  ID: ${user.id}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  ---`);
  });

  // Valid roles according to schema
  const validRoles = [
    "developer",
    "system_admin",
    "org_admin",
    "customer",
    "demo",
  ];
  console.log(`\n✅ Valid roles: ${validRoles.join(", ")}`);

  // Check for invalid roles
  const invalidUsers = allUsers.filter((u) => !validRoles.includes(u.role));
  if (invalidUsers.length > 0) {
    console.log(`\n❌ Found ${invalidUsers.length} users with invalid roles:`);
    invalidUsers.forEach((u) => {
      console.log(`  - ${u.username}: "${u.role}"`);
    });
  }

  process.exit(0);
}

checkUserRoles().catch(console.error);
