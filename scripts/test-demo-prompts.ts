import pg from 'pg';

const { Pool } = pg;

/**
 * Test script to verify that all demo environments can access their appropriate prompts
 * Tests that prompts are correctly filtered by module_type from the unified demo database
 */

interface PromptCounts {
  post_secondary: number;
  k12: number;
  tutoring: number;
  [key: string]: number;
}

interface PromptInfo {
  section_key: string;
  section_name: string;
  prompt_type: string;
  pathway_type: string;
  version: string;
}

async function testDemoPrompts() {
  console.log('🔍 Testing Demo Environment Prompt Access');
  console.log('==========================================\n');

  // Get the demo database URL - handle misconfigured environment variable
  let demoDbUrl = process.env.POST_SECONDARY_DEMO_DATABASE_URL;
  
  // Check if the POST_SECONDARY_DEMO_DATABASE_URL is misconfigured (contains its own name)
  if (demoDbUrl && demoDbUrl.trim() && demoDbUrl.includes('POST_SECONDARY_DEMO_DATABASE_URL')) {
    console.log('⚠️  POST_SECONDARY_DEMO_DATABASE_URL is misconfigured, falling back to DATABASE_URL');
    demoDbUrl = process.env.DATABASE_URL;
  } else if (!demoDbUrl || !demoDbUrl.trim()) {
    demoDbUrl = process.env.DATABASE_URL;
  }
  
  if (!demoDbUrl) {
    console.error('❌ No demo database URL found. Please set DATABASE_URL');
    process.exit(1);
  }

  // Parse the database URL to show which database we're connecting to (without credentials)
  try {
    const url = new URL(demoDbUrl);
    console.log(`📊 Connecting to Demo Database:`);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Database: ${url.pathname.slice(1)}`);
    console.log(`   Protocol: ${url.protocol}\n`);
  } catch (error) {
    console.log('📊 Using configured demo database\n');
  }

  const pool = new Pool({ connectionString: demoDbUrl });

  try {
    // Test 1: Count prompts by module_type
    console.log('1️⃣  COUNTING PROMPTS BY MODULE TYPE');
    console.log('------------------------------------');
    
    const countQuery = `
      SELECT 
        module_type, 
        COUNT(*) as prompt_count,
        COUNT(DISTINCT prompt_type) as prompt_types,
        COUNT(DISTINCT pathway_type) as pathway_types
      FROM prompt_sections
      GROUP BY module_type
      ORDER BY module_type
    `;
    
    const countResult = await pool.query(countQuery);
    const promptCounts: PromptCounts = {};
    
    if (countResult.rows.length === 0) {
      console.log('⚠️  No prompts found in the demo database');
    } else {
      console.log('📊 Prompt Distribution:');
      for (const row of countResult.rows) {
        promptCounts[row.module_type] = parseInt(row.prompt_count);
        console.log(`   ${row.module_type}: ${row.prompt_count} prompts (${row.prompt_types} types, ${row.pathway_types} pathways)`);
      }
    }
    console.log();

    // Test 2: Verify Post-Secondary Demo Access
    console.log('2️⃣  POST-SECONDARY DEMO TEST');
    console.log('-----------------------------');
    await testModuleAccess(pool, 'post_secondary', 'Post-Secondary Demo');
    console.log();

    // Test 3: Verify K-12 Demo Access  
    console.log('3️⃣  K-12 DEMO TEST');
    console.log('------------------');
    await testModuleAccess(pool, 'k12', 'K-12 Demo');
    console.log();

    // Test 4: Check Tutoring Module Support
    console.log('4️⃣  TUTORING DEMO TEST');
    console.log('----------------------');
    const tutoringPrompts = await testModuleAccess(pool, 'tutoring', 'Tutoring Demo');
    
    if (tutoringPrompts === 0) {
      console.log('ℹ️  Tutoring module uses JSON-based prompts (no DB prompts found)');
      console.log('   Checking for JSON service configuration...');
      
      // Check if tutoring configuration exists
      const configResult = await pool.query(`
        SELECT * FROM ai_config WHERE module_type = 'tutoring'
      `);
      
      if (configResult.rows.length > 0) {
        console.log('✅ Tutoring AI configuration found in database');
      } else {
        console.log('⚠️  No tutoring AI configuration in database (likely uses hardcoded values)');
      }
    }
    console.log();

    // Test 5: Verify Data Isolation
    console.log('5️⃣  DATA ISOLATION TEST');
    console.log('-----------------------');
    console.log('Checking for potential production data leakage...');
    
    // Check for any unusual module types that might indicate production data
    const unusualQuery = `
      SELECT DISTINCT module_type 
      FROM prompt_sections 
      WHERE module_type NOT IN ('post_secondary', 'k12', 'tutoring')
    `;
    
    const unusualResult = await pool.query(unusualQuery);
    if (unusualResult.rows.length > 0) {
      console.log('⚠️  Found unexpected module types:', unusualResult.rows.map(r => r.module_type).join(', '));
      console.log('   This might indicate production data in demo database');
    } else {
      console.log('✅ No unexpected module types found');
    }
    
    // Check prompt versions to ensure they're demo-appropriate
    const versionQuery = `
      SELECT 
        module_type,
        COUNT(DISTINCT version) as version_count,
        MAX(version) as latest_version
      FROM prompt_sections
      GROUP BY module_type
    `;
    
    const versionResult = await pool.query(versionQuery);
    console.log('\n📋 Prompt Versions:');
    for (const row of versionResult.rows) {
      console.log(`   ${row.module_type}: ${row.version_count} versions (latest: ${row.latest_version})`);
    }
    console.log();

    // Test 6: Verify Prompt Types and Pathways
    console.log('6️⃣  PROMPT TYPES AND PATHWAYS TEST');
    console.log('-----------------------------------');
    
    const typeQuery = `
      SELECT 
        module_type,
        prompt_type,
        pathway_type,
        COUNT(*) as count
      FROM prompt_sections
      GROUP BY module_type, prompt_type, pathway_type
      ORDER BY module_type, prompt_type, pathway_type
    `;
    
    const typeResult = await pool.query(typeQuery);
    console.log('📊 Prompt Configuration Matrix:');
    
    let currentModule = '';
    for (const row of typeResult.rows) {
      if (row.module_type !== currentModule) {
        currentModule = row.module_type;
        console.log(`\n   ${currentModule}:`);
      }
      console.log(`     - ${row.prompt_type} / ${row.pathway_type}: ${row.count} prompts`);
    }
    console.log();

    // Summary
    console.log('=' .repeat(50));
    console.log('📊 SUMMARY REPORT');
    console.log('=' .repeat(50));
    
    console.log('\n✅ Demo Database Connection: SUCCESS');
    console.log(`✅ Total Module Types Found: ${Object.keys(promptCounts).length}`);
    
    if (promptCounts.post_secondary > 0) {
      console.log(`✅ Post-Secondary Demo: ${promptCounts.post_secondary} prompts available`);
    } else {
      console.log('❌ Post-Secondary Demo: No prompts found');
    }
    
    if (promptCounts.k12 > 0) {
      console.log(`✅ K-12 Demo: ${promptCounts.k12} prompts available`);
    } else {
      console.log('❌ K-12 Demo: No prompts found');
    }
    
    if (promptCounts.tutoring > 0) {
      console.log(`✅ Tutoring Demo: ${promptCounts.tutoring} prompts available`);
    } else {
      console.log('ℹ️  Tutoring Demo: Uses JSON-based prompts (not database)');
    }
    
    console.log('\n📝 RECOMMENDATIONS:');
    if (promptCounts.tutoring === 0 || !promptCounts.tutoring) {
      console.log('   • Consider migrating tutoring prompts to database for consistency');
      console.log('   • Current JSON approach works but lacks version control');
    }
    
    if (Object.keys(promptCounts).length < 2) {
      console.log('   • Add more module types to demo database for comprehensive testing');
    }
    
    console.log('\n✅ Demo environment prompt isolation test COMPLETE');
    
  } catch (error) {
    console.error('❌ Error testing demo prompts:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function testModuleAccess(pool: any, moduleType: string, environmentName: string): Promise<number> {
  console.log(`Testing ${environmentName} access to ${moduleType} prompts...`);
  
  // Query for prompts of this module type
  const query = `
    SELECT 
      section_key,
      section_name,
      prompt_type,
      pathway_type,
      version
    FROM prompt_sections
    WHERE module_type = $1
    ORDER BY prompt_type, section_key
    LIMIT 5
  `;
  
  const result = await pool.query(query, [moduleType]);
  
  if (result.rows.length === 0) {
    console.log(`   ⚠️  No ${moduleType} prompts found in demo database`);
    return 0;
  }
  
  console.log(`   ✅ Found ${result.rows.length} ${moduleType} prompts (showing first 5):`);
  
  for (const prompt of result.rows as PromptInfo[]) {
    console.log(`      - ${prompt.section_key} (${prompt.prompt_type}/${prompt.pathway_type}) v${prompt.version}`);
  }
  
  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM prompt_sections WHERE module_type = $1`;
  const countResult = await pool.query(countQuery, [moduleType]);
  const total = parseInt(countResult.rows[0].total);
  
  if (total > 5) {
    console.log(`      ... and ${total - 5} more`);
  }
  
  return total;
}

// Run the test
console.log('🚀 Starting Demo Prompt Access Test\n');
testDemoPrompts().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});