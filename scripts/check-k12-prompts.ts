import pg from 'pg';

const { Pool } = pg;

async function checkK12Prompts() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const result = await pool.query(`
      SELECT section_key, LENGTH(content) as content_length, version, last_updated,
             SUBSTRING(content, 1, 100) as content_preview
      FROM prompt_sections 
      WHERE section_key IN ('system_instructions_k12', 'system_instructions_k12_demo')
      ORDER BY section_key
    `);
    
    console.log('K-12 System Prompts in Replit Production Database:\n');
    result.rows.forEach(row => {
      console.log(`${row.section_key}:`);
      console.log(`  - Length: ${row.content_length} characters`);
      console.log(`  - Version: ${row.version}`);
      console.log(`  - Updated: ${row.last_updated}`);
      console.log(`  - Preview: ${row.content_preview}...`);
      console.log('');
    });
    
    // Also check if content is identical
    const contentResult = await pool.query(`
      SELECT 
        (SELECT content FROM prompt_sections WHERE section_key = 'system_instructions_k12') = 
        (SELECT content FROM prompt_sections WHERE section_key = 'system_instructions_k12_demo') 
        AS contents_match
    `);
    
    console.log(`Contents match between demo and production: ${contentResult.rows[0].contents_match}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkK12Prompts();