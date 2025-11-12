import pg from "pg";
import "dotenv/config";

const { Client } = pg;

async function checkPromptContent() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    const result = await client.query(
      `SELECT section_key, prompt_type, 
              SUBSTRING(content, 1, 500) as content_preview
       FROM prompt_sections 
       WHERE module_type = 'tutoring' AND section_key = 'system_instructions_tutoring'`
    );

    if (result.rows.length === 0) {
      console.log("❌ system_instructions_tutoring not found!");
      return;
    }

    const prompt = result.rows[0];
    console.log("📝 system_instructions_tutoring preview:\n");
    console.log(prompt.content_preview);
    console.log("\n...(truncated)");

    // Check if it mentions JSON structure
    const fullResult = await client.query(
      `SELECT content FROM prompt_sections 
       WHERE module_type = 'tutoring' AND section_key = 'system_instructions_tutoring'`
    );

    const content = fullResult.rows[0].content;
    const hasMetaSection = content.includes('"meta"');
    const hasStudentOverview = content.includes('"student_overview"');
    const hasKeySupport = content.includes('"key_support_strategies"');
    const hasStrengths = content.includes('"strengths"');
    const hasChallenges = content.includes('"challenges"');

    console.log("\n✅ Required JSON sections mentioned in prompt:");
    console.log(`  - meta: ${hasMetaSection ? "✓" : "✗"}`);
    console.log(`  - student_overview: ${hasStudentOverview ? "✓" : "✗"}`);
    console.log(`  - key_support_strategies: ${hasKeySupport ? "✓" : "✗"}`);
    console.log(`  - strengths: ${hasStrengths ? "✓" : "✗"}`);
    console.log(`  - challenges: ${hasChallenges ? "✓" : "✗"}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

checkPromptContent();
