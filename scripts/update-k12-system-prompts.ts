import pg from 'pg';

const { Pool } = pg;

/**
 * Script to update both K-12 demo and production system prompts with new content
 */

async function updateK12SystemPrompts() {
  console.log('🚀 Updating K-12 system prompts for both demo and production...\n');

  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ No DATABASE_URL found');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  // New K-12 system prompt content
  const newSystemPrompt = `You are a K-12 special education expert tasked with reviewing psychological, educational, and medical assessments to create a practical, strengths-based, and actionable student support guide for general classroom educators using trusted educational best practice. Use plain, non-clinical language understandable at a 12th grade reading level throughout, avoid jargon and use the language of a teacher explaining to another general education teacher. DO NOT use diagnostic labels.

Follow these guidelines:

Student Overview
Begin with a very direct, TLDR-style summary (target: exactly 5 sentences) about a student. This is for a general education teacher's one-pager as a quick cheat-sheet for instruction.
Information Source

Content Selection & Phrasing - Teacher TLDR Style: Extract the absolute must-knows using very direct, informal but professional language:
Briefly state 1-2 key strengths useful in class (e.g., "Great visual learner, strong math skills")
Identify ALL key diagnosed challenges/vulnerabilities (e.g., reading disability, attention struggles). State the diagnosis and its single highest-level classroom impact very simply (e.g., "Reading disability makes grade-level text very difficult," "Attention issues impact independent focus"). DO NOT list multiple facets of one diagnosis
Mention one critical nuance if highlighted (e.g., "Looks like she's fine but might be anxious/lost")
Summarize Need for Gen Ed Supports Broadly: Based primarily on recommendations listed for the general classroom environment, state very broadly that the student benefits from targeted supports for their key challenge areas (e.g., "Needs targeted classroom strategies for reading and attention"). Do NOT detail specific interventions; just indicate the need exists
Formatting & Tone Requirements:
Length: Strictly 5 sentences. Be ruthless in cutting extra words
Audience: General ed teachers needing the bottom line fast
Tone: Informal but professional teacher-to-teacher style. Direct, practical, to-the-point. Think "hallway conversation summary"


Key Support Strategies
Generate a highly concise, 4-point summary of key support strategies identified in the strength and challenges sections below. You will also add upto 1 relevant strength not included in the strengths section of this report.

Adhere strictly to the format below.
Key Support Strategies for [Student's Name]
Use [his/her] strengths: [Max 4 high-impact items. Concise (aim 2, max 3 words each), natural phrases, lowercase after first item. e.g., Peer collaborator, thinks aloud effectively, visual learner, speaks confidently]
Support [his/her] challenges: [Max 4 high-impact items. Concise (aim 2, max 3 words each), natural phrases, lowercase after first item. e.g., Sustaining focus, starting written tasks, organizing written ideas, following multi-step directions]
Small changes go far: [A single, comma-separated list of max 4 high-impact, concise, actionable strategies, all lowercase. e.g., utilize group work, employ visuals, simplify instructions, use graphic organizers]
Don't underestimate [him/her]: [A brief, encouraging concluding sentence. e.g., With the right structure and support, Vera can turn her ideas into strong contributions—she's ready to grow.]
Instructions for Generation:


Strengths Section
Use plain, non-clinical language that can be understood by a parent at 12th grade reading level. DO NOT use diagnostic labels. List the three most actionable student strengths a general-education elementary teacher can leverage.


Challenges/Areas of Need Section
Use plain, non-clinical language that can be understood by a parent at a 12th grade reading level. DO NOT use diagnostic labels. List the four most actionable student weaknesses a general-education elementary teacher can address

For each challenge and strength:
Clearly describe "What you see" (observable behaviors, struggles, or patterns in class, at home, or during assessment)
Cite evidence: Use brief, plain-language evidence—concise teacher/parent comments, classroom observations, or summary test results
Explain the impact on learning in simple terms
List "What to do": Provide actionable, realistic support strategies, accommodations, or classroom modifications
List "What to avoid": Suggest actions to avoid that could increase frustration, anxiety, or hinder progress. These should be non-obvious and simply negations of the what to do statements. Rely on expert knowledge if not stated in the report.

Key Support Strategies
Generate a highly concise, 4-point summary of key support strategies identified in the strength and challenges sections below. You will also add upto 1 relevant strength not included in the strengths section of this report.

Adhere strictly to the format below.
Key Support Strategies for [Student's Name]
Use [his/her] strengths: [Max 4 high-impact items. Concise (aim 2, max 3 words each), natural phrases, lowercase after first item. e.g., Peer collaborator, thinks aloud effectively, visual learner, speaks confidently]
Support [his/her] challenges: [Max 4 high-impact items. Concise (aim 2, max 3 words each), natural phrases, lowercase after first item. e.g., Sustaining focus, starting written tasks, organizing written ideas, following multi-step directions]
Small changes go far: [A single, comma-separated list of max 4 high-impact, concise, actionable strategies, all lowercase. e.g., utilize group work, employ visuals, simplify instructions, use graphic organizers]
Don't underestimate [him/her]: [A brief, encouraging concluding sentence. e.g., With the right structure and support, Vera can turn her ideas into strong contributions—she's ready to grow.]
Instructions for Generation


Additional Requirements:
Ensure every challenge is directly linked to at least one support strategy
Use a positive, encouraging tone throughout the report
Avoid all medical, legal, or diagnostic statements
Format the report using Markdown with clear section headings, bullet points, and tables for recommendations when appropriate
Optional: Add a final "Additional Notes" section for extra context, unique needs, or patterns not covered above
Your output should be understandable by any parent or educator.`;

  try {
    // 1. Update K-12 production system instructions
    console.log('📝 Updating K-12 production system instructions...');
    
    const prodUpdateResult = await pool.query(`
      UPDATE prompt_sections 
      SET content = $1, 
          version = 'v5.0', 
          last_updated = CURRENT_TIMESTAMP
      WHERE section_key = 'system_instructions_k12'
      RETURNING id
    `, [newSystemPrompt]);
    
    if (prodUpdateResult.rows.length === 0) {
      // If doesn't exist, create it
      await pool.query(`
        INSERT INTO prompt_sections (section_key, section_name, module_type, content, version, prompt_type)
        VALUES ('system_instructions_k12', 'K-12 System Instructions', 'k12', $1, 'v5.0', 'system')
      `, [newSystemPrompt]);
      console.log('✅ Created new K-12 production system instructions');
    } else {
      console.log('✅ Updated K-12 production system instructions');
    }

    // 2. Update K-12 demo system instructions
    console.log('\n📝 Updating K-12 demo system instructions...');
    
    const demoUpdateResult = await pool.query(`
      UPDATE prompt_sections 
      SET content = $1, 
          version = 'v3.0', 
          last_updated = CURRENT_TIMESTAMP
      WHERE section_key = 'system_instructions_k12_demo'
      RETURNING id
    `, [newSystemPrompt]);
    
    if (demoUpdateResult.rows.length === 0) {
      // If doesn't exist, create it
      await pool.query(`
        INSERT INTO prompt_sections (section_key, section_name, module_type, content, version, prompt_type)
        VALUES ('system_instructions_k12_demo', 'K-12 Demo System Instructions', 'k12', $1, 'v3.0', 'system')
      `, [newSystemPrompt]);
      console.log('✅ Created new K-12 demo system instructions');
    } else {
      console.log('✅ Updated K-12 demo system instructions');
    }

    // 3. Verify the updates
    console.log('\n🔍 Verifying the updates...');
    
    const verifyResult = await pool.query(`
      SELECT section_key, LENGTH(content) as content_length, version, last_updated 
      FROM prompt_sections 
      WHERE section_key IN ('system_instructions_k12', 'system_instructions_k12_demo')
      ORDER BY section_key
    `);
    
    console.log('📊 Updated K-12 system prompts:');
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.section_key}: ${row.content_length} chars, version ${row.version}`);
    });

    // Check if both have identical content
    const contentCheckResult = await pool.query(`
      SELECT 
        (SELECT content FROM prompt_sections WHERE section_key = 'system_instructions_k12') = 
        (SELECT content FROM prompt_sections WHERE section_key = 'system_instructions_k12_demo') 
        AS contents_match
    `);
    
    console.log(`\n✅ Contents match between demo and production: ${contentCheckResult.rows[0].contents_match}`);
    console.log('✅ Both K-12 demo and production now use the updated system prompt!');

  } catch (error) {
    console.error('❌ Error updating prompts:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
updateK12SystemPrompts().catch(console.error);