import { db } from "./apps/server/db";
import { users } from "./packages/db/schema";
import { eq } from "drizzle-orm";

async function checkCurrentUserRole() {
  console.log("🔍 Checking user roles in database...\n");

  // Get all users to see what roles exist
  const allUsers = await db.select().from(users);

  console.log(`📊 Found ${allUsers.length} users:\n`);

  allUsers.forEach((user) => {
    console.log(`  👤 ${user.username}`);
    console.log(`     Email: ${user.email}`);
    console.log(`     Role: ${user.role}`);
    console.log(`     Active: ${user.isActive}`);
    console.log(`     Modules: ${JSON.stringify(user.assignedModules)}`);
    console.log();
  });

  // Check for tutoring prompts
  const { promptSections } = await import("./packages/db/schema");
  const tutoringPrompts = await db
    .select()
    .from(promptSections)
    .where(eq(promptSections.moduleType, "tutoring"));

  console.log(`\n📝 Tutoring prompts: ${tutoringPrompts.length} found`);

  process.exit(0);
}

checkCurrentUserRole().catch(console.error);
