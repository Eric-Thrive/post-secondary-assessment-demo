/**
 * Script to update tutoring markdown report prompt to use bold label format for strategies
 * This ensures strategies display properly in the accordion UI
 */

import { db } from "../apps/server/db";
import { promptSections } from "../packages/db/schema";
import { eq, and } from "drizzle-orm";

async function updateTutoringStrategiesFormat() {
  console.log("🔧 Updating tutoring markdown report prompt...\n");

  try {
    // Find the tutoring markdown report prompt
    const existingPrompt = await db
      .select()
      .from(promptSections)
      .where(
        and(
          eq(promptSections.moduleType, "tutoring"),
          eq(promptSections.promptType, "markdown_report")
        )
      )
      .limit(1);

    if (existingPrompt.length === 0) {
      console.log("❌ No tutoring markdown report prompt found in database");
      return;
    }

    const currentPrompt = existingPrompt[0];
    console.log("📄 Current prompt found:");
    console.log(`   Section Key: ${currentPrompt.sectionKey}`);
    console.log(`   Module: ${currentPrompt.moduleType}`);
    console.log(`   Type: ${currentPrompt.promptType}\n`);

    // Check if the prompt already has the correct format
    if (
      currentPrompt.promptText.includes("**Use strengths:**") ||
      currentPrompt.promptText.includes("**use_strengths_line:**")
    ) {
      console.log("✅ Prompt already contains bold label format instructions");
      console.log("   No update needed.\n");
      return;
    }

    // Find the key_support_strategies section in the prompt and update it
    const updatedPromptText = currentPrompt.promptText.replace(
      /key_support_strategies:\s*{[^}]*paragraph:\s*{[^}]*}/gs,
      `key_support_strategies: {
    use_strengths: string[];  // Array of strength-based strategies
    support_challenges: string[];  // Array of challenge-based strategies
    small_changes: string;  // Brief description of small impactful changes
    dont_underestimate: string;  // Encouraging concluding statement
    paragraph: {
      use_strengths_line: string;  // Format: "**Use strengths:** [comma-separated list]"
      support_challenges_line: string;  // Format: "**Support challenges:** [comma-separated list]"
      small_changes_line: string;  // Format: "**Small changes go far:** [description]"
      dont_underestimate_line: string;  // Format: "**Don't underestimate [pronoun]:** [statement]"
      full: string;  // All four lines combined with double newlines between each
    };
  }`
    );

    // Also add explicit formatting instructions if not present
    let finalPromptText = updatedPromptText;

    if (
      !updatedPromptText.includes(
        "CRITICAL: Key Support Strategies must use bold labels"
      )
    ) {
      finalPromptText = updatedPromptText.replace(
        /## Key Support Strategies/,
        `## Key Support Strategies

CRITICAL: Key Support Strategies must use bold labels in this exact format:

**Use strengths:** [comma-separated list of 2-4 strength-based strategies]

**Support challenges:** [comma-separated list of 2-4 challenge-based strategies]

**Small changes go far:** [brief description of small impactful changes]

**Don't underestimate [him/her/them]:** [encouraging concluding statement]

Each line must start with the bold label followed by a colon, then the content.
The paragraph.full field must contain all four lines with double newlines (\\n\\n) between each.

## Key Support Strategies`
      );
    }

    // Update the database
    await db
      .update(promptSections)
      .set({
        promptText: finalPromptText,
        updatedAt: new Date(),
      })
      .where(eq(promptSections.id, currentPrompt.id));

    console.log("✅ Successfully updated tutoring markdown report prompt");
    console.log(
      "   Added bold label format instructions for Key Support Strategies\n"
    );

    console.log("📝 Next steps:");
    console.log("   1. Generate a new tutoring report to test the format");
    console.log("   2. Verify strategies display in accordion UI");
    console.log("   3. Check that each strategy has a bold label\n");
  } catch (error) {
    console.error("❌ Error updating prompt:", error);
    throw error;
  }
}

updateTutoringStrategiesFormat()
  .then(() => {
    console.log("✨ Update complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to update prompt:", error);
    process.exit(1);
  });
