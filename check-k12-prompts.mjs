// Quick diagnostic script to check K-12 prompts in database
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const { Pool } = pg;

async function checkK12Prompts() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("🔍 Checking K-12 prompts in database...\n");

    // Check for specific demo prompts
    const demoPrompts = await pool.query(`
      SELECT section_key, version, prompt_type,
             LENGTH(content) as content_length,
             SUBSTRING(content, 1, 100) as preview
      FROM prompt_sections 
      WHERE module_type = 'k12' 
        AND section_key IN ('system_instructions_k12_demo', 'markdown_report_template_k12_demo')
      ORDER BY section_key
    `);

    console.log("📋 Required K-12 Demo Prompts:\n");

    const requiredKeys = [
      "system_instructions_k12_demo",
      "markdown_report_template_k12_demo",
    ];

    for (const key of requiredKeys) {
      const found = demoPrompts.rows.find((r) => r.section_key === key);
      if (found) {
        console.log(`✅ ${key}`);
        console.log(`   Version: ${found.version || "unknown"}`);
        console.log(`   Type: ${found.prompt_type || "not set"}`);
        console.log(`   Length: ${found.content_length} characters`);
        console.log(`   Preview: ${found.preview}...`);
      } else {
        console.log(`❌ ${key} - NOT FOUND`);
      }
      console.log("");
    }

    // Show all K-12 prompts
    const allK12 = await pool.query(`
      SELECT section_key, version, prompt_type,
             LENGTH(content) as content_length
      FROM prompt_sections 
      WHERE module_type = 'k12'
      ORDER BY section_key
    `);

    console.log(
      `\n📊 All K-12 prompts in database (${allK12.rows.length} total):\n`
    );

    if (allK12.rows.length === 0) {
      console.log("   ⚠️  No K-12 prompts found in database!");
    } else {
      allK12.rows.forEach((row) => {
        console.log(`   - ${row.section_key}`);
        console.log(`     Type: ${row.prompt_type || "not set"}`);
        console.log(`     Version: ${row.version || "unknown"}`);
        console.log(`     Length: ${row.content_length} characters`);
        console.log("");
      });
    }

    await pool.end();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkK12Prompts();
