import pg from "pg";

const { Pool } = pg;

/**
 * Script to check what K-12 markdown template is actually in the database
 */
async function checkK12Template() {
  console.log("🔍 Checking K-12 markdown template in database...\n");

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ No DATABASE_URL found");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Query for K-12 markdown templates
    const result = await pool.query(`
      SELECT 
        section_key,
        section_name,
        module_type,
        version,
        LENGTH(content) as content_length,
        LEFT(content, 500) as content_preview,
        last_updated
      FROM prompt_sections 
      WHERE section_key LIKE '%markdown_report_template_k12%'
      ORDER BY section_key
    `);

    if (result.rows.length === 0) {
      console.log("❌ No K-12 markdown templates found in database");
      return;
    }

    console.log(`✅ Found ${result.rows.length} K-12 markdown template(s):\n`);

    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.section_key}`);
      console.log(`   Name: ${row.section_name}`);
      console.log(`   Module: ${row.module_type}`);
      console.log(`   Version: ${row.version}`);
      console.log(`   Length: ${row.content_length} characters`);
      console.log(`   Last Updated: ${row.last_updated}`);
      console.log(`   Preview (first 500 chars):`);
      console.log(`   ${"-".repeat(60)}`);
      console.log(`   ${row.content_preview}`);
      console.log(`   ${"-".repeat(60)}\n`);
    });

    // Get the full content of the main template
    const mainTemplate = await pool.query(`
      SELECT content
      FROM prompt_sections 
      WHERE section_key = 'markdown_report_template_k12'
    `);

    if (mainTemplate.rows.length > 0) {
      console.log("\n📄 Full content of markdown_report_template_k12:");
      console.log("=".repeat(80));
      console.log(mainTemplate.rows[0].content);
      console.log("=".repeat(80));
    }
  } catch (error) {
    console.error("❌ Error querying database:", error);
  } finally {
    await pool.end();
  }
}

checkK12Template();
