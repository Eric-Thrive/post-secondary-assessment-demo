import pg from 'pg';

const { Pool } = pg;

async function checkK12Data() {
  console.log('🔍 Checking K-12 database setup...\n');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Check for K-12 prompts
    const prompts = await pool.query(`
      SELECT section_key, module_type, version, LEFT(content, 50) as preview
      FROM prompt_sections
      WHERE module_type = 'k12' OR section_key LIKE '%k12%'
    `);
    console.log(`📝 K-12 Prompts: ${prompts.rows.length} found`);
    prompts.rows.forEach((p: any) => console.log(`  - ${p.section_key} (${p.version})`));

    // Check for K-12 AI config
    const config = await pool.query(`
      SELECT config_key, model_name, module_type
      FROM ai_config
      WHERE module_type = 'k12' OR config_key LIKE '%k12%'
    `);
    console.log(`\n🤖 K-12 AI Config: ${config.rows.length} found`);
    config.rows.forEach((c: any) => console.log(`  - ${c.config_key} (${c.model_name})`));

    // Check for K-12 assessment cases
    const cases = await pool.query(`
      SELECT id, display_name, module_type, status, created_date
      FROM assessment_cases
      WHERE module_type = 'k12'
      ORDER BY created_date DESC
      LIMIT 5
    `);
    console.log(`\n📋 K-12 Assessment Cases: ${cases.rows.length} found`);
    cases.rows.forEach((c: any) => console.log(`  - ${c.display_name || c.id} (${c.status})`));

    // Check for demo customer users
    const demoUsers = await pool.query(`
      SELECT username, email, role, customer_id
      FROM users
      WHERE customer_id = 'demo-customer'
    `);
    console.log(`\n👥 Demo Users: ${demoUsers.rows.length} found`);
    demoUsers.rows.forEach((u: any) => console.log(`  - ${u.username} (${u.role})`));

    console.log('\n✅ Database check complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
  process.exit(0);
}

checkK12Data();
