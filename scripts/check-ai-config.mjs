import db from "../apps/server/db.ts";
const { pool } = db;

async function checkAIConfig() {
  try {
    console.log("🔍 Checking AI configuration in database...\n");

    const result = await pool.query(`
      SELECT 
        config_key,
        model_name,
        temperature,
        max_tokens,
        created_at,
        updated_at
      FROM ai_config
      ORDER BY config_key
    `);

    console.log(`Found ${result.rows.length} AI configurations:\n`);

    for (const row of result.rows) {
      console.log(`📊 ${row.config_key}`);
      console.log(`   Model: ${row.model_name}`);
      console.log(`   Temperature: ${row.temperature}`);
      console.log(`   Max Tokens: ${row.max_tokens}`);
      console.log(`   Updated: ${row.updated_at}`);
      console.log("");
    }

    await pool.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkAIConfig();
