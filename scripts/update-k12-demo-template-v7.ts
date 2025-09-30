import pg from 'pg';

const { Pool } = pg;

/**
 * Script to update K-12 Demo report template to v7.0 with checkmarks and X's
 * ✔ = what to do (recommended strategies/supports)
 * ✘ = what not to do (common mistakes/counterproductive actions)
 */

async function updateK12DemoTemplateV7() {
  console.log('🚀 Updating K-12 Demo report template to v7.0...\n');

  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ No DATABASE_URL found');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  // New template with checkmarks and X's and updated table headings
  const newTemplate = `# Student Support Report

✔ = what to do (recommended strategies/supports)
✘ = what not to do (common mistakes/counterproductive actions)

Use plain, observable language—no medical or diagnostic terms.

---

## Student Overview

[Brief summary: student's name or initials, grade, general background, relevant context. Include family input or student voice if available.]

---

## Key Support Strategies

**Use strengths:** [List key student strengths—e.g., oral language, kindness, collaboration, conceptual understanding.]

**Support challenges:** [List key areas of need—e.g., anxiety, processing speed, transitions, decoding/fluency.]

**Small changes go far:** [E.g., shorter tasks, verbal guidance, prep time, patience.]

**Don't underestimate the student:** If the student seems to struggle, it doesn't mean they don't understand— they may just need a little more time to show what they know.

---

## Strengths

| Strength | What You See | What to Do |
|----------|--------------|------------|
| **[Strength 1 Title]** | [Short, specific description of this strength] | ✔ [Action to support or leverage this strength]<br>✘ [Action to avoid that misunderstands this strength] |
| **[Strength 2 Title]** | [Short, specific description of this strength] | ✔ [Action to support or leverage this strength]<br>✘ [Action to avoid that misunderstands this strength] |
| *(Add more rows as needed)* | | |

---

## Challenges / Areas of Need

| Challenge | What You See | What to Do |
|-----------|--------------|------------|
| **[Challenge 1 Title]** | [Observable, everyday behaviors or struggles] | ✔ [Specific, actionable support/accommodation]<br>✘ [Counterproductive action or mistake] |
| **[Challenge 2 Title]** | [Observable, everyday behaviors or struggles] | ✔ [Specific, actionable support/accommodation]<br>✘ [Counterproductive action or mistake] |
| *(Add more rows as needed)* | | |

---

## Additional Notes

[Any other relevant observations, context, or information for educators and parents.]`;

  try {
    // Update K-12 demo report template
    console.log('📝 Updating K-12 demo report template...');
    console.log(`📏 New template length: ${newTemplate.length} characters`);
    
    const updateResult = await pool.query(`
      UPDATE prompt_sections 
      SET content = $1, 
          version = 'v7.0', 
          last_updated = CURRENT_TIMESTAMP
      WHERE section_key = 'markdown_report_template_k12_demo'
      RETURNING id
    `, [newTemplate]);
    
    if (updateResult.rows.length === 0) {
      // If doesn't exist, create it
      await pool.query(`
        INSERT INTO prompt_sections (section_key, section_name, module_type, content, version, prompt_type)
        VALUES ('markdown_report_template_k12_demo', 'K-12 Demo Markdown Report Template', 'k12', $1, 'v7.0', 'report_format')
      `, [newTemplate]);
      console.log('✅ Created new K-12 demo report template');
    } else {
      console.log('✅ Updated K-12 demo report template');
    }

    // Also update production K-12 template to match
    console.log('\n📝 Updating K-12 production template to match...');
    
    const prodUpdateResult = await pool.query(`
      UPDATE prompt_sections 
      SET content = $1, 
          version = 'v7.0', 
          last_updated = CURRENT_TIMESTAMP
      WHERE section_key = 'markdown_report_template_k12'
      RETURNING id
    `, [newTemplate]);
    
    if (prodUpdateResult.rows.length === 0) {
      await pool.query(`
        INSERT INTO prompt_sections (section_key, section_name, module_type, content, version, prompt_type)
        VALUES ('markdown_report_template_k12', 'K-12 Markdown Report Template', 'k12', $1, 'v7.0', 'report_format')
      `, [newTemplate]);
      console.log('✅ Created K-12 production report template');
    } else {
      console.log('✅ Updated K-12 production report template');
    }

    // Verify the updates
    console.log('\n🔍 Verifying the updates...');
    
    const verifyResult = await pool.query(`
      SELECT section_key, LENGTH(content) as content_length, version, last_updated 
      FROM prompt_sections 
      WHERE section_key IN ('markdown_report_template_k12', 'markdown_report_template_k12_demo')
      ORDER BY section_key
    `);
    
    console.log('📊 Updated K-12 report templates:');
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.section_key}: ${row.content_length} chars, version ${row.version}`);
    });

    // Check if both have identical content
    const contentCheckResult = await pool.query(`
      SELECT 
        (SELECT content FROM prompt_sections WHERE section_key = 'markdown_report_template_k12') = 
        (SELECT content FROM prompt_sections WHERE section_key = 'markdown_report_template_k12_demo') 
        AS contents_match
    `);
    
    console.log(`\n✅ Templates match: ${contentCheckResult.rows[0].contents_match}`);
    console.log('✅ K-12 demo report template updated to v7.0 successfully!');
    console.log('🎯 New features:');
    console.log('   - ✔ = what to do (recommended strategies/supports)');
    console.log('   - ✘ = what not to do (common mistakes/counterproductive actions)');
    console.log('   - Updated table column headings');
    console.log('   - Plain, observable language requirement');

  } catch (error) {
    console.error('❌ Error updating template:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateK12DemoTemplateV7();
}

export { updateK12DemoTemplateV7 };