/**
 * Script to fix tutoring Key Support Strategies format in the database
 * Updates the markdown report prompt to use bold labels
 */

import { db } from "../apps/server/db";
import { promptSections } from "../packages/db/schema";
import { eq, and } from "drizzle-orm";

async function fixTutoringStrategiesFormat() {
  console.log("🔧 Fixing tutoring Key Support Strategies format...\n");

  try {
    // Find the tutoring markdown report prompt
    const prompts = await db
      .select()
      .from(promptSections)
      .where(eq(promptSections.moduleType, "tutoring"));

    console.log(`📊 Found ${prompts.length} tutoring prompts\n`);

    // Find the markdown report template
    const markdownPrompt = prompts.find(
      (p) =>
        p.sectionKey === "markdown_report_template_tutoring" ||
        p.sectionKey === "markdown_report_tutoring" ||
        p.promptType === "markdown_report"
    );

    if (!markdownPrompt) {
      console.log("❌ No tutoring markdown report prompt found");
      console.log("Available prompts:");
      prompts.forEach((p) => {
        console.log(`   - ${p.sectionKey} (${p.promptType})`);
      });
      return;
    }

    console.log("✅ Found markdown report prompt:");
    console.log(`   ID: ${markdownPrompt.id}`);
    console.log(`   Key: ${markdownPrompt.sectionKey}`);
    console.log(`   Type: ${markdownPrompt.promptType}\n`);

    // Check if it already has the correct format
    const hasCorrectFormat =
      markdownPrompt.promptText.includes("**Use strengths:**") ||
      markdownPrompt.promptText.includes("**use_strengths_line:**");

    if (hasCorrectFormat) {
      console.log("✅ Prompt already has bold label format");
      console.log("   No update needed.\n");
      return;
    }

    // Add instructions for bold label format
    const updatedPromptText = markdownPrompt.promptText.replace(
      /key_support_strategies:\s*{/,
      `key_support_strategies: {
    // IMPORTANT: Format each line with bold labels like this:
    // **Use strengths:** [comma-separated list]
    // **Support challenges:** [comma-separated list]
    // **Small changes go far:** [description]
    // **Don't underestimate [him/her/them]:** [statement]
    `
    );

    // Also add explicit formatting note if there's a paragraph section
    let finalPromptText = updatedPromptText;
    if (updatedPromptText.includes("paragraph:")) {
      finalPromptText = updatedPromptText.replace(
        /paragraph:\s*{/,
        `paragraph: {
      // Each line MUST start with bold label followed by colon
      // Example: "**Use strengths:** visual thinking, creative problem-solving"
      `
      );
    }

    // Update the database
    await db
      .update(promptSections)
      .set({
        promptText: finalPromptText,
        updatedAt: new Date(),
      })
      .where(eq(promptSections.id, markdownPrompt.id));

    console.log("✅ Successfully updated tutoring markdown report prompt");
    console.log("   Added bold label format instructions\n");

    console.log("📝 Next steps:");
    console.log("   1. Generate a new tutoring report to test");
    console.log("   2. Check that strategies display with bold labels");
    console.log("   3. Verify accordion UI shows all 4 strategies\n");
  } catch (error) {
    console.error("❌ Error updating prompt:", error);
    throw error;
  }
}

fixTutoringStrategiesFormat()
  .then(() => {
    console.log("✨ Update complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to update prompt:", error);
    process.exit(1);
  });
