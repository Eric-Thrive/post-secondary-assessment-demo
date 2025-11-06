// Detailed check of K-12 prompts
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

async function checkK12PromptsDetailed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("🔍 Detailed K-12 Prompt Check\n");

    // Get full content of both prompts
    const result = await pool.query(`
      SELECT section_key, version, prompt_type,
             LENGTH(content) as content_length,
             content,
             last_updated
      FROM prompt_sections 
      WHERE module_type = 'k12' 
        AND section_key IN ('system_instructions_k12_demo', 'markdown_report_template_k12_demo')
      ORDER BY section_key
    `);

    for (const row of result.rows) {
      console.log("=".repeat(80));
      console.log(`📋 ${row.section_key}`);
      console.log("=".repeat(80));
      console.log(`Version: ${row.version || "unknown"}`);
      console.log(`Type: ${row.prompt_type || "not set"}`);
      console.log(`Length: ${row.content_length} characters`);
      console.log(`Last Updated: ${row.last_updated || "unknown"}`);
      console.log("\nFull Content:");
      console.log("-".repeat(80));
      console.log(row.content);
      console.log("-".repeat(80));
      console.log("\n");
    }

    await pool.end();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkK12PromptsDetailed();
