import { db } from "./apps/server/db.js";
import { promptSections } from "./packages/shared/src/schema.js";
import { eq } from "drizzle-orm";

async function checkTutoringPrompts() {
  console.log("🔍 Checking tutoring prompts in database...");

  const tutoringPrompts = await db
    .select()
    .from(promptSections)
    .where(eq(promptSections.moduleType, "tutoring"));

  console.log(`\n📊 Found ${tutoringPrompts.length} tutoring prompts:`);

  if (tutoringPrompts.length === 0) {
    console.log("❌ No tutoring prompts found in database!");
    console.log("\n🔧 This is why the tutoring AI analysis is failing.");
    console.log("   The system needs these templates:");
    console.log("   - markdown_report_template_tutoring (report_format)");
    console.log("   - system_instructions_tutoring (system)");
  } else {
    tutoringPrompts.forEach((prompt) => {
      console.log(`\n  📝 ${prompt.sectionKey}`);
      console.log(`     Type: ${prompt.promptType}`);
      console.log(`     Module: ${prompt.moduleType}`);
      console.log(`     Content length: ${prompt.content?.length || 0} chars`);
    });
  }

  // Check what other modules have
  console.log("\n\n📊 Checking other modules for comparison:");

  const allPrompts = await db
    .select({
      moduleType: promptSections.moduleType,
      promptType: promptSections.promptType,
      sectionKey: promptSections.sectionKey,
    })
    .from(promptSections);

  const byModule = allPrompts.reduce((acc, p) => {
    if (!acc[p.moduleType]) acc[p.moduleType] = [];
    acc[p.moduleType].push(`${p.sectionKey} (${p.promptType})`);
    return acc;
  }, {} as Record<string, string[]>);

  Object.entries(byModule).forEach(([module, prompts]) => {
    console.log(`\n  ${module}: ${prompts.length} prompts`);
    prompts.forEach((p) => console.log(`    - ${p}`));
  });

  process.exit(0);
}

checkTutoringPrompts().catch(console.error);
