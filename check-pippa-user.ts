import { db } from "./apps/server/db";
import { users } from "./packages/db/schema";
import { eq } from "drizzle-orm";

async function checkPippaUser() {
  console.log("🔍 Checking Pippa's user record...\n");

  try {
    const pippaUser = await db
      .select()
      .from(users)
      .where(eq(users.username, "pippa"));

    if (pippaUser.length === 0) {
      console.log("❌ No user found with username 'pippa'");

      // Check for similar usernames
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
        })
        .from(users);

      console.log("\n📋 All users in database:");
      allUsers.forEach((u) => {
        console.log(`  - ${u.username} (${u.email}) - role: ${u.role}`);
      });
    } else {
      const user = pippaUser[0];
      console.log("✅ Found Pippa's user record:\n");
      console.log(`  ID: ${user.id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(
        `  Assigned Modules: ${JSON.stringify(user.assignedModules)}`
      );
      console.log(`  Organization ID: ${user.organizationId}`);
      console.log(`  Is Active: ${user.isActive}`);
      console.log(`  Email Verified: ${user.emailVerified}`);

      // Check if role is valid
      const validRoles = [
        "developer",
        "system_admin",
        "org_admin",
        "customer",
        "demo",
      ];
      if (!validRoles.includes(user.role)) {
        console.log(`\n❌ INVALID ROLE: "${user.role}"`);
        console.log(`   Valid roles are: ${validRoles.join(", ")}`);
      } else {
        console.log(`\n✅ Role is valid`);
      }

      // Check assignedModules format
      if (user.assignedModules) {
        console.log(
          `\n📦 Assigned Modules Type: ${typeof user.assignedModules}`
        );
        console.log(`   Value: ${JSON.stringify(user.assignedModules)}`);
      }
    }
  } catch (error) {
    console.error("❌ Error checking user:", error);
  }

  process.exit(0);
}

checkPippaUser().catch(console.error);
