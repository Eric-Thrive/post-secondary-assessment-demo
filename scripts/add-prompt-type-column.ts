import { pool } from '../server/db';

async function addPromptTypeColumn() {
  console.log('🔄 Starting database migration to add prompt_type column...');
  
  try {
    // First check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'prompt_sections' 
      AND column_name = 'prompt_type'
    `;
    
    const checkResult = await pool.query(checkColumnQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ prompt_type column already exists in prompt_sections table');
      return;
    }
    
    // Add the prompt_type column
    console.log('Adding prompt_type column to prompt_sections table...');
    await pool.query(`
      ALTER TABLE prompt_sections 
      ADD COLUMN prompt_type text NOT NULL DEFAULT 'system'
    `);
    
    console.log('✅ prompt_type column added successfully');
    
    // Update existing records based on their section_key
    console.log('Updating existing prompt records...');
    
    // Update system instruction prompts
    await pool.query(`
      UPDATE prompt_sections 
      SET prompt_type = 'system' 
      WHERE section_key LIKE '%system_instructions%'
    `);
    
    // Update report format prompts
    await pool.query(`
      UPDATE prompt_sections 
      SET prompt_type = 'report_format' 
      WHERE section_key LIKE '%markdown_report_template%' 
         OR section_key LIKE '%report_template%'
         OR section_key LIKE '%report_format%'
    `);
    
    // Get counts to verify
    const systemCount = await pool.query(`
      SELECT COUNT(*) FROM prompt_sections WHERE prompt_type = 'system'
    `);
    
    const reportCount = await pool.query(`
      SELECT COUNT(*) FROM prompt_sections WHERE prompt_type = 'report_format'
    `);
    
    console.log(`✅ Updated ${systemCount.rows[0].count} system prompts`);
    console.log(`✅ Updated ${reportCount.rows[0].count} report format prompts`);
    
    // Create indexes for better performance
    console.log('Creating indexes for better query performance...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_prompt_sections_module_type_prompt_type 
      ON prompt_sections(module_type, prompt_type)
    `);
    
    console.log('✅ Database migration completed successfully');
    
    // Display current prompt structure
    const allPrompts = await pool.query(`
      SELECT section_key, module_type, prompt_type 
      FROM prompt_sections 
      ORDER BY module_type, prompt_type, section_key
    `);
    
    console.log('\n📊 Current prompt structure:');
    console.log('Module Type | Prompt Type | Section Key');
    console.log('------------|-------------|------------');
    allPrompts.rows.forEach(row => {
      console.log(`${row.module_type.padEnd(11)} | ${row.prompt_type.padEnd(11)} | ${row.section_key}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
addPromptTypeColumn().catch(console.error);