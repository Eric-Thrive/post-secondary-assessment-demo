import pg from "pg";
import "dotenv/config";

const { Client } = pg;

async function checkTutoringPrompts() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("🔍 Checking tutoring prompts in database...\n");

    const result = await client.query(
      `SELECT section_key, prompt_type, module_type, 
              LENGTH(content) as content_length
       FROM prompt_sections 
       WHERE module_type = 'tutoring'
       ORDER BY section_key`
    );

    console.log(`📊 Found ${result.rows.length} tutoring prompts:\n`);

    if (result.rows.length === 0) {
      console.log("❌ No tutoring prompts found!");
    } else {
      result.rows.forEach((row) => {
        console.log(`  📝 ${row.section_key}`);
        console.log(`     Type: ${row.prompt_type}`);
        console.log(`     Module: ${row.module_type}`);
        console.log(`     Content length: ${row.content_length} chars\n`);
      });
    }

    // Check other modules for comparison
    console.log("\n📊 All prompts by module:\n");
    const allPrompts = await client.query(
      `SELECT module_type, section_key, prompt_type
       FROM prompt_sections 
       ORDER BY module_type, section_key`
    );

    const byModule = {};
    allPrompts.rows.forEach((row) => {
      if (!byModule[row.module_type]) {
        byModule[row.module_type] = [];
      }
      byModule[row.module_type].push(`${row.section_key} (${row.prompt_type})`);
    });

    Object.entries(byModule).forEach(([module, prompts]) => {
      console.log(`  ${module}: ${prompts.length} prompts`);
      prompts.forEach((p) => console.log(`    - ${p}`));
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

checkTutoringPrompts();
