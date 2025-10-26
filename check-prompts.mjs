import pg from "pg";
const { Pool } = pg;

async function checkPrompts() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("🔍 Checking post-secondary prompts in database...\n");

    const result = await pool.query(`
      SELECT section_key, section_name, module_type, 
             LENGTH(content) as content_length,
             prompt_type
      FROM prompt_sections 
      WHERE module_type = 'post_secondary' 
      ORDER BY section_key
    `);

    console.log(`Found ${result.rows.length} post-secondary prompts:\n`);

    result.rows.forEach((row) => {
      console.log(`📋 ${row.section_key}`);
      console.log(`   Name: ${row.section_name}`);
      console.log(`   Type: ${row.prompt_type || "not set"}`);
      console.log(`   Content Length: ${row.content_length} characters`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkPrompts();
