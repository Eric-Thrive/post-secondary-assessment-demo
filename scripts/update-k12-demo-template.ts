import pg from 'pg';

const { Pool } = pg;

async function updateK12DemoTemplate() {
  console.log('🚀 Updating K-12 demo report template...\n');

  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ No DATABASE_URL found');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  // New K-12 demo report template
  const newTemplate = `Student Support Report
✔ = what to do (recommended strategies/supports)
✘ = what not to do (common mistakes/counterproductive actions)
Use plain, observable language—no medical or diagnostic terms.

Student Overview
[Brief summary: student's name or initials, grade, general background, relevant context. Include family input or student voice if available.]

Key Support Strategies
Use strengths: [List key student strengths—e.g., oral language, kindness, collaboration, conceptual understanding.]

Support challenges: [List key areas of need—e.g., anxiety, processing speed, transitions, decoding/fluency.]

Small changes go far: [E.g., shorter tasks, verbal guidance, prep time, patience.]

Don't underestimate the student: If the student seems to struggle, it doesn't mean they don't understand— they may just need a little more time to show what they know.

Strengths
[Strength 1 Title]
What You See:
[Short, specific description of this strength]
What to Do:
✔ [Action to support or leverage this strength]
✘ [Action to avoid that misunderstands this strength]

[Strength 2 Title]
What You See:
[Short, specific description of this strength]
What to Do:
✔ [Action to support or leverage this strength]
✘ [Action to avoid that misunderstands this strength]

(Add more strengths as needed)

Challenges / Areas of Need
[Challenge 1 Title]
What You See:
[Observable, everyday behaviors or struggles]
Evidence:
[Short teacher/parent comment, observation, or test summary—optional]
Impact on Learning:
[How it affects school tasks or participation]
What to Do:
✔ [Specific, actionable support/accommodation]
✔ [Another effective support, if applicable]
What to Avoid:
✘ [Counterproductive action or mistake]
✘ [Another "don't," if relevant]

[Challenge 2 Title]
What You See:
[Observable, everyday behaviors or struggles]
Evidence:
[Short teacher/parent comment, observation, or test summary—optional]
Impact on Learning:
[How it affects school tasks or participation]
What to Do:
✔ [Specific, actionable support/accommodation]
✔ [Another effective support, if applicable]
What to Avoid:
✘ [Counterproductive action or mistake]
✘ [Another "don't," if relevant]`;

  try {
    // Update K-12 demo report template
    console.log('📝 Updating K-12 demo report template...');
    console.log(`📏 New template length: ${newTemplate.length} characters`);
    
    const updateResult = await pool.query(`
      UPDATE prompt_sections 
      SET content = $1, 
          version = 'v2.0', 
          last_updated = CURRENT_TIMESTAMP
      WHERE section_key = 'markdown_report_template_k12_demo'
      RETURNING id
    `, [newTemplate]);
    
    if (updateResult.rows.length === 0) {
      // If doesn't exist, create it
      await pool.query(`
        INSERT INTO prompt_sections (section_key, section_name, module_type, content, version, prompt_type)
        VALUES ('markdown_report_template_k12_demo', 'K-12 Demo Markdown Report Template', 'k12', $1, 'v2.0', 'template')
      `, [newTemplate]);
      console.log('✅ Created new K-12 demo report template');
    } else {
      console.log('✅ Updated K-12 demo report template');
    }

    // Verify the update
    console.log('\n🔍 Verifying the update...');
    
    const verifyResult = await pool.query(`
      SELECT section_key, LENGTH(content) as content_length, version, last_updated 
      FROM prompt_sections 
      WHERE section_key = 'markdown_report_template_k12_demo'
    `);
    
    console.log('📊 Updated K-12 demo report template:');
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.section_key}: ${row.content_length} chars, version ${row.version}`);
    });

    console.log('\n✅ K-12 demo report template updated successfully!');
    console.log('🎯 The new template uses ✔/✘ symbols for clear visual guidance');

  } catch (error) {
    console.error('❌ Error updating template:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
updateK12DemoTemplate().catch(console.error);