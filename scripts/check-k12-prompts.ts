import { pool } from "../apps/server/db";

async function checkK12Prompts() {
  try {
    console.log("🔍 Checking K-12 prompts in database...\n");

    const result = await pool.query(`
      SELECT 
        section_key, 
        title, 
        prompt_type,
        pathway_type,
        LEFT(content, 300) as content_preview, 
        LENGTH(content) as content_length, 
        version,
        last_updated
      FROM prompt_sections 
      WHERE module_type = 'k12' 
      ORDER BY prompt_type, section_key
    `);

    console.log(`Found ${result.rows.length} K-12 prompts:\n`);

    for (const row of result.rows) {
      console.log(`📄 ${row.section_key}`);
      console.log(`   Title: ${row.title}`);
      console.log(`   Type: ${row.prompt_type}`);
      console.log(`   Pathway: ${row.pathway_type || "N/A"}`);
      console.log(`   Version: ${row.version}`);
      console.log(`   Length: ${row.content_length} chars`);
      console.log(`   Updated: ${row.last_updated}`);
      console.log(`   Preview: ${row.content_preview}...`);
      console.log("");
    }

    await pool.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkK12Prompts();
