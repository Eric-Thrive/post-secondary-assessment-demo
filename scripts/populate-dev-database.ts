import pg from 'pg';
const { Pool } = pg;

// This script populates the development database with essential lookup data

async function populateDatabase() {
  console.log('🚀 Populating development database with essential data...\n');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // 1. AI Configuration
    console.log('📋 Setting up AI configuration...');
    await pool.query(`
      INSERT INTO ai_config (config_key, model_name, temperature, max_tokens, timeout_seconds, module_type)
      VALUES ('default_config', 'gpt-4o', '0.7', 4500, 300, 'post_secondary')
      ON CONFLICT (config_key) DO UPDATE
      SET model_name = EXCLUDED.model_name,
          temperature = EXCLUDED.temperature,
          max_tokens = EXCLUDED.max_tokens,
          timeout_seconds = EXCLUDED.timeout_seconds
    `);
    console.log('✅ AI configuration set');

    // 2. Post-Secondary System Instructions
    console.log('\n📋 Adding system instructions...');
    // Check if already exists
    const { rows: existingPrompts } = await pool.query(
      `SELECT section_key FROM prompt_sections WHERE section_key IN ($1, $2)`,
      ['system_instructions_post_secondary', 'markdown_report_template_post_secondary']
    );
    
    const existingKeys = existingPrompts.map(r => r.section_key);
    
    if (!existingKeys.includes('system_instructions_post_secondary')) {
      await pool.query(`
        INSERT INTO prompt_sections (section_key, section_name, module_type, content)
        VALUES (
          'system_instructions_post_secondary',
          'System Instructions - Post Secondary',
          'post_secondary',
          'You are an expert disability services specialist analyzing educational assessments.'
        )
      `);
    }

    // 3. Markdown Template (already in code but adding for consistency)
    if (!existingKeys.includes('markdown_report_template_post_secondary')) {
      await pool.query(`
        INSERT INTO prompt_sections (section_key, section_name, module_type, content)
        VALUES (
          'markdown_report_template_post_secondary',
          'Markdown Report Template - Post Secondary',
          'post_secondary',
          '# Disability Accommodation Report'
        )
      `);
    }
    console.log('✅ Prompt sections added');

    // 4. Sample Barrier Glossary
    console.log('\n📋 Adding barrier glossary...');
    const barriers = [
      { key: 'sustained_attention_limit', desc: 'Difficulty maintaining focus on tasks for extended periods' },
      { key: 'slowed_processing_speed', desc: 'Takes longer to process and respond to information' },
      { key: 'working_memory_deficit', desc: 'Difficulty holding and manipulating information in mind' },
      { key: 'executive_function_weakness', desc: 'Challenges with planning, organizing, and task management' },
      { key: 'reading_comprehension_difficulty', desc: 'Struggles to understand and retain written information' },
      { key: 'written_expression_challenge', desc: 'Difficulty expressing thoughts clearly in writing' }
    ];

    let barriersAdded = 0;
    for (const barrier of barriers) {
      const { rowCount } = await pool.query(
        `SELECT 1 FROM barrier_glossary WHERE canonical_key = $1 AND module_type = 'post_secondary'`,
        [barrier.key]
      );
      
      if (rowCount === 0) {
        await pool.query(`
          INSERT INTO barrier_glossary (canonical_key, one_sentence_definition, module_type)
          VALUES ($1, $2, 'post_secondary')
        `, [barrier.key, barrier.desc]);
        barriersAdded++;
      }
    }
    console.log(`✅ Added ${barriersAdded} new barrier definitions`);

    // 5. Sample Accommodations
    console.log('\n📋 Adding post-secondary accommodations...');
    const accommodations = [
      { key: 'extended_time_testing', name: 'Extended Time on Tests', cat: 'Academic' },
      { key: 'reduced_distraction_environment', name: 'Reduced Distraction Testing Environment', cat: 'Academic' },
      { key: 'note_taking_assistance', name: 'Note-Taking Assistance', cat: 'Academic' },
      { key: 'assistive_technology', name: 'Assistive Technology Access', cat: 'Auxiliary' },
      { key: 'preferential_seating', name: 'Preferential Seating', cat: 'Instructional' },
      { key: 'recording_lectures', name: 'Permission to Record Lectures', cat: 'Instructional' }
    ];

    let accommodationsAdded = 0;
    for (const acc of accommodations) {
      const { rowCount } = await pool.query(
        `SELECT 1 FROM post_secondary_accommodations WHERE canonical_key = $1`,
        [acc.key]
      );
      
      if (rowCount === 0) {
        await pool.query(`
          INSERT INTO post_secondary_accommodations (canonical_key, accommodation, category, module_type)
          VALUES ($1, $2, $3, 'post_secondary')
        `, [acc.key, acc.name, acc.cat]);
        accommodationsAdded++;
      }
    }
    console.log(`✅ Added ${accommodationsAdded} new accommodations`);

    console.log('\n🎉 Development database populated successfully!');
    console.log('\nYour development environment is now ready to test the complex AI pipeline.');
    
  } catch (error) {
    console.error('❌ Population failed:', error);
  } finally {
    await pool.end();
  }
}

// Run population
populateDatabase();