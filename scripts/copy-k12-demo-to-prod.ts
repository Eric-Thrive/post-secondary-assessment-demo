import pg from 'pg';

const { Pool } = pg;

/**
 * Script to copy K-12 Demo prompts to production K-12 prompts
 * This will overwrite the main K-12 prompts with the demo versions
 */

async function copyK12DemoToProduction() {
  console.log('🚀 Copying K-12 Demo prompts to production K-12 prompts...\n');

  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ No DATABASE_URL found');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // 1. Copy system instructions from demo to production
    console.log('📝 Copying K-12 demo system instructions to production...');
    
    // Get the demo system instructions
    const demoSystemResult = await pool.query(
      `SELECT content FROM prompt_sections WHERE section_key = 'system_instructions_k12_demo'`
    );
    
    if (demoSystemResult.rows.length === 0) {
      console.error('❌ K-12 demo system instructions not found');
      return;
    }
    
    const demoSystemContent = demoSystemResult.rows[0].content;
    console.log(`📏 Demo system instructions length: ${demoSystemContent.length} characters`);
    
    // Update production K-12 system instructions
    const systemUpdateResult = await pool.query(`
      UPDATE prompt_sections 
      SET content = $1, 
          version = 'v3.0', 
          last_updated = CURRENT_TIMESTAMP
      WHERE section_key = 'system_instructions_k12'
      RETURNING id
    `, [demoSystemContent]);
    
    if (systemUpdateResult.rows.length === 0) {
      // If doesn't exist, create it
      await pool.query(`
        INSERT INTO prompt_sections (section_key, section_name, module_type, content, version, prompt_type)
        VALUES ('system_instructions_k12', 'K-12 System Instructions', 'k12', $1, 'v3.0', 'system')
      `, [demoSystemContent]);
      console.log('✅ Created new K-12 production system instructions from demo');
    } else {
      console.log('✅ Updated K-12 production system instructions from demo');
    }

    // 2. Copy report template from demo to production
    console.log('\n📄 Copying K-12 demo report template to production...');
    
    // Get the demo report template
    const demoTemplateResult = await pool.query(
      `SELECT content FROM prompt_sections WHERE section_key = 'markdown_report_template_k12_demo'`
    );
    
    if (demoTemplateResult.rows.length === 0) {
      console.error('❌ K-12 demo report template not found');
      return;
    }
    
    const demoTemplateContent = demoTemplateResult.rows[0].content;
    console.log(`📏 Demo report template length: ${demoTemplateContent.length} characters`);
    
    // Update production K-12 report template
    const templateUpdateResult = await pool.query(`
      UPDATE prompt_sections 
      SET content = $1, 
          version = 'v3.0', 
          last_updated = CURRENT_TIMESTAMP
      WHERE section_key = 'markdown_report_template_k12'
      RETURNING id
    `, [demoTemplateContent]);
    
    if (templateUpdateResult.rows.length === 0) {
      // If doesn't exist, create it
      await pool.query(`
        INSERT INTO prompt_sections (section_key, section_name, module_type, content, version, prompt_type)
        VALUES ('markdown_report_template_k12', 'K-12 Markdown Report Template', 'k12', $1, 'v3.0', 'report_format')
      `, [demoTemplateContent]);
      console.log('✅ Created new K-12 production report template from demo');
    } else {
      console.log('✅ Updated K-12 production report template from demo');
    }

    // 3. Verify the copy
    console.log('\n🔍 Verifying the copy...');
    
    const verifyResult = await pool.query(`
      SELECT section_key, LENGTH(content) as content_length, version, last_updated 
      FROM prompt_sections 
      WHERE section_key IN ('system_instructions_k12', 'markdown_report_template_k12')
      ORDER BY section_key
    `);
    
    console.log('📊 Production K-12 prompts after copy:');
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.section_key}: ${row.content_length} chars, version ${row.version}`);
    });

    console.log('\n✅ Successfully copied K-12 demo prompts to production!');
    console.log('🎯 The main K-12 module now uses the same prompts as the demo');

  } catch (error) {
    console.error('❌ Error copying prompts:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
copyK12DemoToProduction().catch(console.error);