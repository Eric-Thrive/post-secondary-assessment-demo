import pg from 'pg';

const { Pool } = pg;

/**
 * Script to add K-12 Demo-specific prompts to the database
 */

async function addK12DemoPrompts() {
  console.log('🚀 Adding K-12 Demo prompts to database...\n');

  // Use the shared database
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ No database URL found. Please set DATABASE_URL');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // 1. K-12 Demo System Instructions
    console.log('📝 Adding K-12 demo system instructions...');
    const k12DemoSystemInstructions = `You are a K-12 educational specialist tasked with creating a practical, strengths-based student report for parents and educators. Follow these guidelines:
Begin with a short overview describing the student's background, grade, and any relevant context (family input or student voice if available).

List observable strengths first. Describe what the student does well (skills, interests, learning habits, or positive traits).

List challenges/areas of need next. Use plain, non-clinical language to describe functional challenges. DO NOT use diagnostic labels.

For each challenge:

Clearly describe "What you see" (observable behaviors, struggles, or patterns in class, at home, or during assessment).

Cite evidence: Use brief, plain-language evidence—concise teacher/parent comments, classroom observations, or summary test results.

Explain the impact on learning in simple terms.

List "What to do": Provide actionable, realistic support strategies, accommodations, or classroom modifications.

List "What to avoid": Suggest actions to avoid that could increase frustration, anxiety, or hinder progress.

Ensure every challenge is directly linked to at least one support strategy.

Use a positive, encouraging tone throughout the report.

Avoid all medical, legal, or diagnostic statements.

Format the report using Markdown with clear section headings, bullet points, and tables for recommendations when appropriate.

Optional: Add a final "Additional Notes" section for extra context, unique needs, or patterns not covered above.

Your output should be understandable by any parent or educator.`;

    // First check if it exists
    const existingSystem = await pool.query(
      `SELECT id FROM prompt_sections WHERE section_key = 'system_instructions_k12_demo'`
    );

    if (existingSystem.rows.length > 0) {
      // Update existing
      await pool.query(`
        UPDATE prompt_sections 
        SET content = $1, 
            version = 'v1.0', 
            last_updated = CURRENT_TIMESTAMP
        WHERE section_key = 'system_instructions_k12_demo'
      `, [k12DemoSystemInstructions]);
    } else {
      // Insert new
      await pool.query(`
        INSERT INTO prompt_sections (section_key, section_name, module_type, content, version, prompt_type)
        VALUES ('system_instructions_k12_demo', 'K-12 Demo System Instructions', 'k12', $1, 'v1.0', 'system')
      `, [k12DemoSystemInstructions]);
    }
    console.log('✅ K-12 demo system instructions added');

    // 2. K-12 Demo Report Template
    console.log('\n📄 Adding K-12 demo report template...');
    const k12DemoReportTemplate = `# Student Support Report

## Student Overview
[Brief summary: name (or initials), grade, general background, relevant context. Include family input or student voice if available.]

## Strengths
- [Strength 1: clear, positive, observable]
- [Strength 2]
- [Add more as needed]

## Challenges / Areas of Need
- [Challenge 1: observable, plain language, no diagnosis]
  - **What you see:** [Specific, everyday behaviors or struggles]
  - **Evidence:** [Short teacher/parent comment, observation, or test result summary]
  - **Impact on learning:** [Brief, functional description—how it affects school tasks]
- [Challenge 2]
  - **What you see:** [...]
  - **Evidence:** [...]
  - **Impact on learning:** [...]

## Key Support Strategies & Accommodations

| Challenge         | What to Do (Support/Accommodation)              | What to Avoid                    |
|-------------------|------------------------------------------------|----------------------------------|
| [Challenge 1]     | [Practical, actionable support strategy]        | [Counterproductive action]       |
| [Challenge 2]     | [Practical, actionable support strategy]        | [Counterproductive action]       |

*Each challenge must have at least one specific support strategy and a "what to avoid" suggestion.*

## Additional Notes (Optional)
[Add any extra context, patterns, or unique needs.]

---

*ThriveIEP provides educational and advocacy services. This report is not legal or medical advice.*`;

    // First check if it exists
    const existingTemplate = await pool.query(
      `SELECT id FROM prompt_sections WHERE section_key = 'markdown_report_template_k12_demo'`
    );

    if (existingTemplate.rows.length > 0) {
      // Update existing
      await pool.query(`
        UPDATE prompt_sections 
        SET content = $1, 
            version = 'v1.0', 
            last_updated = CURRENT_TIMESTAMP
        WHERE section_key = 'markdown_report_template_k12_demo'
      `, [k12DemoReportTemplate]);
    } else {
      // Insert new
      await pool.query(`
        INSERT INTO prompt_sections (section_key, section_name, module_type, content, version, prompt_type)
        VALUES ('markdown_report_template_k12_demo', 'K-12 Demo Report Template', 'k12', $1, 'v1.0', 'report_format')
      `, [k12DemoReportTemplate]);
    }
    console.log('✅ K-12 demo report template added');

    // 3. Verify the prompts were added
    console.log('\n🔍 Verifying K-12 demo prompts...');
    const result = await pool.query(`
      SELECT section_key, module_type, prompt_type, 
             LEFT(content, 100) as content_preview,
             version
      FROM prompt_sections 
      WHERE section_key IN ('system_instructions_k12_demo', 'markdown_report_template_k12_demo')
      ORDER BY section_key
    `);

    console.log('\n📊 K-12 Demo prompts in database:');
    result.rows.forEach(row => {
      console.log(`  - ${row.section_key} (${row.prompt_type}, ${row.version})`);
      console.log(`    Preview: ${row.content_preview}...`);
    });

    console.log('\n🎉 K-12 Demo prompts added successfully!');
    console.log('\nNote: The system will need a code update to use these demo-specific prompts when in K-12 demo mode.');
    
  } catch (error) {
    console.error('❌ Error adding prompts:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
addK12DemoPrompts();

export { addK12DemoPrompts };