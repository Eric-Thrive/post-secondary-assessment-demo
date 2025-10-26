import pg from "pg";
const { Pool } = pg;

async function updateTemplateHighlighting() {
  console.log(
    "🔧 Adding highlighting instructions to post-secondary template...\n"
  );

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Get the current template
    const result = await pool.query(`
      SELECT content 
      FROM prompt_sections 
      WHERE section_key = 'markdown_report_template_post_secondary_format'
    `);

    if (result.rows.length === 0) {
      console.error("❌ Template not found");
      return;
    }

    let currentTemplate = result.rows[0].content;
    console.log(
      "📋 Current template length:",
      currentTemplate.length,
      "characters"
    );

    // Add highlighting instruction to the template
    const highlightingInstruction = `

IMPORTANT FORMATTING RULE: 
- Wrap each accommodation description in <mark></mark> tags for highlighting
- Example: 1. <mark>Extended time for exams and assignments</mark>
- Do NOT highlight the numbers, only highlight the accommodation text itself

`;

    // Check if instruction already exists
    if (
      currentTemplate.includes("<mark>") ||
      currentTemplate.includes("FORMATTING RULE")
    ) {
      console.log("⚠️  Template already has highlighting instructions");
      return;
    }

    // Add the instruction to the template
    const updatedTemplate = currentTemplate + highlightingInstruction;

    // Update the database
    await pool.query(
      `
      UPDATE prompt_sections 
      SET content = $1, 
          last_updated = NOW()
      WHERE section_key = 'markdown_report_template_post_secondary_format'
    `,
      [updatedTemplate]
    );

    console.log("✅ Template updated successfully!");
    console.log(
      "📋 New template length:",
      updatedTemplate.length,
      "characters"
    );
    console.log("📝 Added highlighting instructions for AI");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

updateTemplateHighlighting();
