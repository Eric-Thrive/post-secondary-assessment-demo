import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const newTemplate = `# Student Support Report — Tutor Orientation

## Documents Reviewed
{{#each documents_reviewed.documents}}
- **{{this.filename}}** ({{this.document_type}})
{{/each}}

---

## Student Overview

{{student_overview.paragraph.full}}

---

## Key Support Strategies

**Use strengths:** {{key_support_strategies.paragraph.use_strengths_line}}

**Support challenges:** {{key_support_strategies.paragraph.support_challenges_line}}

**Small changes go far:** {{key_support_strategies.paragraph.small_changes_line}}

**Don't underestimate [him/her/them]:** {{key_support_strategies.paragraph.dont_underestimate_line}}

---

## Strengths

| Strength | What You See | What to Do |
|----------|--------------|------------|
{{#each strengths}}
{{#if (lt @index 3)}}
| **{{this.title}}** | {{this.what_you_see}} | ✔ {{this.do}} |
| | | ✘ {{this.avoid}} |
{{/if}}
{{/each}}

---

## Challenges / Areas of Need

| Challenge | What You See | What to Do |
|-----------|--------------|------------|
{{#each challenges}}
{{#if (lt @index 4)}}
| **{{this.title}}** | {{this.what_you_see}} | ✔ {{this.do}} |
| | | ✘ {{this.avoid}} |
{{/if}}
{{/each}}

{{#if additional_notes}}
**Additional Notes:**

{{additional_notes}}
{{/if}}`;

async function updateTutoringPrompt() {
  try {
    console.log("🔧 Updating tutoring markdown report template...\n");

    // First, check what tutoring prompts exist
    const checkResult = await pool.query(
      `SELECT id, section_key, prompt_type, section_name 
       FROM prompt_sections 
       WHERE module_type = 'tutoring'`
    );

    console.log(`📊 Found ${checkResult.rows.length} tutoring prompts:`);
    checkResult.rows.forEach((row) => {
      console.log(`   - ${row.section_key} (${row.prompt_type})`);
    });
    console.log("");

    // Update all markdown report templates for tutoring
    const updateResult = await pool.query(
      `UPDATE prompt_sections
       SET content = $1, last_updated = NOW()
       WHERE module_type = 'tutoring'
         AND (section_key LIKE '%markdown%' OR prompt_type = 'markdown_report')
       RETURNING id, section_key`,
      [newTemplate]
    );

    console.log(`✅ Updated ${updateResult.rows.length} prompt(s):`);
    updateResult.rows.forEach((row) => {
      console.log(`   - ${row.section_key}`);
    });
    console.log("");

    console.log("📝 Key changes:");
    console.log("   - Key Support Strategies now uses bold labels");
    console.log("   - Format: **Use strengths:** [content]");
    console.log("   - Format: **Support challenges:** [content]");
    console.log("   - Format: **Small changes go far:** [content]");
    console.log("   - Format: **Don't underestimate:** [content]\n");

    await pool.end();
    console.log("✨ Update complete!");
  } catch (error) {
    console.error("❌ Error:", error);
    await pool.end();
    process.exit(1);
  }
}

updateTutoringPrompt();
