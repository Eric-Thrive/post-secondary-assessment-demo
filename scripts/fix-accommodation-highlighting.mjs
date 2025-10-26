import pg from "pg";
const { Pool } = pg;

async function fixAccommodationHighlighting() {
  console.log(
    "🔧 Fixing accommodation highlighting in post-secondary template...\n"
  );

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // First, get the current template
    const currentResult = await pool.query(`
      SELECT content 
      FROM prompt_sections 
      WHERE section_key = 'markdown_report_template_post_secondary_format'
    `);

    if (currentResult.rows.length === 0) {
      console.error(
        "❌ Template not found: markdown_report_template_post_secondary_format"
      );
      return;
    }

    const currentTemplate = currentResult.rows[0].content;
    console.log(
      "📋 Current template length:",
      currentTemplate.length,
      "characters"
    );

    // Update the template to highlight accommodation text instead of numbers
    // The template should instruct the AI to wrap accommodations in <mark> tags
    const updatedTemplate = currentTemplate.replace(
      /(\d+\.\s*)([^*\n]+)(\s*\*[^*]+\*)/g,
      "$1<mark>$2</mark>$3"
    );

    // Also update any instructions in the template about formatting
    const finalTemplate = updatedTemplate.includes("<mark>")
      ? updatedTemplate
      : currentTemplate +
        "\n\n<!-- FORMATTING INSTRUCTION: Wrap each accommodation description in <mark></mark> tags for highlighting -->";

    // Update the database
    await pool.query(
      `
      UPDATE prompt_sections 
      SET content = $1, 
          last_updated = NOW()
      WHERE section_key = 'markdown_report_template_post_secondary_format'
    `,
      [finalTemplate]
    );

    console.log("✅ Template updated successfully!");
    console.log("📋 New template length:", finalTemplate.length, "characters");

    // Show a preview of the changes
    if (finalTemplate !== currentTemplate) {
      console.log("\n📝 Changes made:");
      console.log("- Added <mark> tags around accommodation text");
      console.log("- Added formatting instruction for AI");
    } else {
      console.log(
        "\n⚠️  No changes were needed - template already has highlighting"
      );
    }
  } catch (error) {
    console.error("❌ Error updating template:", error.message);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixAccommodationHighlighting();
