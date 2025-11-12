import pg from "pg";
import "dotenv/config";

const { Client } = pg;

async function fixTutoringMarkdownSections() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("🔧 Updating tutoring markdown template section names...\n");

    // Get current template
    const result = await client.query(
      `SELECT content FROM prompt_sections 
       WHERE module_type = 'tutoring' AND section_key = 'markdown_report_template_tutoring'`
    );

    if (result.rows.length === 0) {
      console.log("❌ Template not found");
      return;
    }

    let content = result.rows[0].content;

    // Replace section headers to match unified viewer expectations
    content = content.replace(/## Strengths\b/g, "## Student's Strengths");
    content = content.replace(
      /## Challenges \/ Areas of Need/g,
      "## Student's Challenges"
    );

    // Add Case Information section at the top (after the title)
    const caseInfoSection = `\n\n## Case Information\n\n**Student:** {{student_name}}  \n**Grade:** {{grade}}  \n**School Year:** {{school_year}}  \n**Date Created:** {{generated_at}}  \n\n---\n`;

    // Insert Case Information after the title and before Documents Reviewed
    content = content.replace(
      /(# Student Support Report.*?\n\n)/,
      `$1${caseInfoSection}`
    );

    // Update the template
    await client.query(
      `UPDATE prompt_sections 
       SET content = $1, last_updated = NOW()
       WHERE module_type = 'tutoring' AND section_key = 'markdown_report_template_tutoring'`,
      [content]
    );

    console.log("✅ Updated section names:");
    console.log('  - Added "Case Information" section');
    console.log('  - Changed "Strengths" → "Student\'s Strengths"');
    console.log(
      '  - Changed "Challenges / Areas of Need" → "Student\'s Challenges"'
    );
    console.log(
      "\n✨ Tutoring reports will now use the unified viewer format!"
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

fixTutoringMarkdownSections();
