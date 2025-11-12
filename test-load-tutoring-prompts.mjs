import pg from "pg";
import "dotenv/config";

const { Client } = pg;

async function testLoadPrompts() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Testing tutoring prompt loading...\n");

    // Check what the code looks for
    const candidateKeys = [
      "system_instructions_tutoring_json",
      "system_instructions_tutoring_json_report",
      "system_instructions_tutoring_json_generation",
      "json_report_system_prompt_tutoring",
      "system_instructions_tutoring",
    ];

    console.log("Looking for these keys in order:");
    candidateKeys.forEach((key, i) => console.log(`  ${i + 1}. ${key}`));
    console.log("");

    // Check system prompts
    const systemResult = await client.query(
      `SELECT section_key, prompt_type, pathway_type, LENGTH(content) as len
       FROM prompt_sections 
       WHERE module_type = 'tutoring' AND prompt_type = 'system'
       ORDER BY section_key`
    );

    console.log(
      `Found ${systemResult.rows.length} system prompts for tutoring:`
    );
    systemResult.rows.forEach((row) => {
      const match = candidateKeys.includes(row.section_key);
      console.log(
        `  ${match ? "✅" : "❌"} ${row.section_key} (${
          row.len
        } chars, pathway: ${row.pathway_type || "null"})`
      );
    });

    // Check report format prompts
    console.log("\nReport format prompts:");
    const formatResult = await client.query(
      `SELECT section_key, LENGTH(content) as len
       FROM prompt_sections 
       WHERE module_type = 'tutoring' AND prompt_type = 'report_format'`
    );

    formatResult.rows.forEach((row) => {
      console.log(`  - ${row.section_key} (${row.len} chars)`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

testLoadPrompts();
