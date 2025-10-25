import pg from 'pg';

const { Pool } = pg;

/**
 * Script to set up K-12 Demo Database
 * This creates all necessary tables and populates them with K-12 specific data
 */

async function setupK12DemoDatabase() {
  console.log('🚀 Setting up K-12 Demo Database...\n');

  // Use the shared database
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ No database URL found. Please set DATABASE_URL');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // 1. AI Configuration for K-12
    console.log('📋 Setting up K-12 AI configuration...');
    await pool.query(`
      INSERT INTO ai_config (config_key, model_name, temperature, max_tokens, timeout_seconds, module_type)
      VALUES ('k12_config', 'gpt-4.1', '0.2', 16000, 900, 'k12')
      ON CONFLICT (config_key) DO UPDATE
      SET model_name = EXCLUDED.model_name,
          temperature = EXCLUDED.temperature,
          max_tokens = EXCLUDED.max_tokens,
          timeout_seconds = EXCLUDED.timeout_seconds,
          module_type = EXCLUDED.module_type
    `);
    console.log('✅ K-12 AI configuration set up');

    // 2. K-12 System Instructions
    console.log('\n📝 Creating K-12 system instructions...');
    const k12SystemInstructions = `You are an expert educational psychologist specializing in K-12 student assessments and support planning. Your role is to analyze educational and psychological assessments to identify students' learning profiles, strengths, and areas needing support.

## Your Task
Generate a comprehensive educational support report that:
1. Identifies the student's strengths and abilities
2. Recognizes areas where the student may need additional support
3. Provides specific, actionable support strategies
4. Uses educational terminology appropriate for teachers and parents
5. Focuses on supporting student success in the classroom

## Important Guidelines
- Use plain, accessible language that teachers and parents can understand
- Avoid medical or clinical terminology
- Focus on educational impacts and classroom strategies
- Be strength-based while honestly addressing challenges
- Provide specific, implementable recommendations
- Consider grade-appropriate expectations
- Include both academic and social-emotional aspects

## Report Sections Required
1. Student Profile Overview
2. Identified Strengths
3. Areas Needing Support
4. Recommended Support Strategies
5. Classroom Accommodations
6. Home Support Suggestions

Remember: Your goal is to help educators and parents understand how to best support this student's learning and development.`;

    await pool.query(`
      INSERT INTO prompt_sections (section_key, module_type, content, version, prompt_type)
      VALUES ('system_instructions_k12', 'k12', $1, 'v1.0', 'system')
      ON CONFLICT (section_key) DO UPDATE
      SET content = EXCLUDED.content,
          version = EXCLUDED.version,
          last_updated = CURRENT_TIMESTAMP
    `, [k12SystemInstructions]);
    console.log('✅ K-12 system instructions created');

    // 3. K-12 Report Template
    console.log('\n📄 Creating K-12 report template...');
    const k12ReportTemplate = `# K-12 Educational Support Report

**Student:** [Student Name]  
**Grade:** [Grade Level]  
**Assessment Date:** [Date]  
**Report Generated:** [Current Date]

---

## 1. Student Profile Overview

[Provide a brief, strength-based overview of the student, including their general learning profile and any relevant background information from the assessments.]

---

## 2. Identified Strengths

Based on the assessment results, the following strengths were identified:

**Academic Strengths:**
- [List specific academic strengths with examples from assessment data]
- [Include areas where student performs at or above grade level]
- [Note any particular talents or interests]

**Social-Emotional Strengths:**
- [List interpersonal skills and emotional strengths]
- [Include resilience factors and coping strategies]
- [Note positive behavioral patterns]

**Learning Style Strengths:**
- [Identify how the student learns best]
- [Note preferred modalities and successful strategies]

---

## 3. Areas Needing Support

The assessment identified the following areas where additional support would benefit the student:

**Area 1: [Specific Area]**
- *What we observed:* [Description of the challenge based on assessment data]
- *How this impacts learning:* [Explain the educational impact]
- *Grade-level expectation:* [What is typically expected at this grade]

**Area 2: [Specific Area]**
- *What we observed:* [Description of the challenge based on assessment data]
- *How this impacts learning:* [Explain the educational impact]
- *Grade-level expectation:* [What is typically expected at this grade]

[Continue for all identified areas]

---

## 4. Recommended Support Strategies

### For Area 1: [Match to areas above]
1. [Specific strategy with implementation details]
2. [Another strategy with clear steps]
3. [Additional support recommendation]

### For Area 2: [Match to areas above]
1. [Specific strategy with implementation details]
2. [Another strategy with clear steps]
3. [Additional support recommendation]

[Continue for all areas identified]

---

## 5. Classroom Accommodations

The following accommodations are recommended to support the student's success:

**Environmental Accommodations:**
- [Specific accommodation with rationale]
- [Additional accommodations as needed]

**Instructional Accommodations:**
- [Specific teaching adaptations]
- [Presentation modifications]
- [Assignment adjustments]

**Assessment Accommodations:**
- [Testing accommodations]
- [Alternative assessment options]
- [Time or format modifications]

---

## 6. Home Support Suggestions

Parents/caregivers can support learning at home by:

**Daily Routines:**
- [Specific routine suggestions]
- [Structure recommendations]

**Homework Support:**
- [Strategies for homework completion]
- [Organization tips]

**Skill Building Activities:**
- [Fun, engaging activities that build needed skills]
- [Resources for continued practice]

**Communication with School:**
- [Suggestions for parent-teacher collaboration]
- [Key points to monitor and share]

---

## Summary and Next Steps

[Provide a brief, encouraging summary that emphasizes the student's potential and the importance of implementing supports. Include recommendations for follow-up or progress monitoring.]

---

*This report is based on assessment data and is intended to guide educational planning. Regular monitoring and adjustment of strategies is recommended based on the student's response to interventions.*`;

    await pool.query(`
      INSERT INTO prompt_sections (section_key, module_type, content, version, prompt_type)
      VALUES ('markdown_report_template_k12', 'k12', $1, 'v1.0', 'report_format')
      ON CONFLICT (section_key) DO UPDATE
      SET content = EXCLUDED.content,
          version = EXCLUDED.version,
          last_updated = CURRENT_TIMESTAMP
    `, [k12ReportTemplate]);
    console.log('✅ K-12 report template created');

    // 4. K-12 Barrier Glossary (Educational Challenges)
    console.log('\n📚 Creating K-12 educational challenges glossary...');
    const k12Challenges = [
      {
        canonical_key: 'reading_comprehension',
        plain_language: 'Difficulty understanding what they read',
        educational_impact: 'Student may struggle to grasp main ideas, make inferences, or remember details from texts, affecting performance across all subject areas.'
      },
      {
        canonical_key: 'written_expression',
        plain_language: 'Challenges with writing tasks',
        educational_impact: 'Student may have difficulty organizing thoughts, using appropriate vocabulary, or producing grade-level written work.'
      },
      {
        canonical_key: 'math_reasoning',
        plain_language: 'Difficulty with math problem-solving',
        educational_impact: 'Student may struggle with word problems, applying math concepts, or understanding mathematical relationships.'
      },
      {
        canonical_key: 'attention_focus',
        plain_language: 'Difficulty maintaining attention',
        educational_impact: 'Student may miss important instructions, have trouble completing tasks, or become easily distracted during lessons.'
      },
      {
        canonical_key: 'organization_planning',
        plain_language: 'Challenges with organization and planning',
        educational_impact: 'Student may struggle with managing materials, planning projects, or breaking down complex tasks into steps.'
      },
      {
        canonical_key: 'processing_speed',
        plain_language: 'Takes longer to complete tasks',
        educational_impact: 'Student may need extra time to understand information, complete assignments, or respond to questions.'
      }
    ];

    for (const challenge of k12Challenges) {
      await pool.query(`
        INSERT INTO barrier_glossary (canonical_key, plain_language, educational_impact, module_type)
        VALUES ($1, $2, $3, 'k12')
        ON CONFLICT (canonical_key, module_type) DO UPDATE
        SET plain_language = EXCLUDED.plain_language,
            educational_impact = EXCLUDED.educational_impact
      `, [challenge.canonical_key, challenge.plain_language, challenge.educational_impact]);
    }
    console.log('✅ K-12 educational challenges glossary created');

    // 5. K-12 Support Strategies
    console.log('\n🎯 Creating K-12 support strategies...');
    const supportStrategies = [
      {
        strategy_key: 'reading_support_elementary',
        canonical_key: 'reading_comprehension',
        grade_band: 'elementary',
        strategy: 'Use graphic organizers for story elements, provide reading guides with key questions, allow student to pre-read materials at home',
        implementation: 'Before reading: Preview vocabulary and main concepts. During reading: Use sticky notes for questions. After reading: Complete story maps together.'
      },
      {
        strategy_key: 'writing_support_elementary',
        canonical_key: 'written_expression',
        grade_band: 'elementary',
        strategy: 'Provide sentence starters, use word banks, allow dictation for first drafts',
        implementation: 'Start with verbal storytelling, then move to writing. Use graphic organizers for planning. Accept shorter assignments focusing on quality over quantity.'
      },
      {
        strategy_key: 'math_support_elementary',
        canonical_key: 'math_reasoning',
        grade_band: 'elementary',
        strategy: 'Use manipulatives and visual models, break problems into steps, provide worked examples',
        implementation: 'Always start with concrete objects before moving to abstract. Use color coding for different operations. Create step-by-step guides for problem types.'
      }
    ];

    // Create support_strategies table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_strategies (
        strategy_key VARCHAR(255) PRIMARY KEY,
        canonical_key VARCHAR(255),
        grade_band VARCHAR(50),
        strategy TEXT,
        implementation TEXT,
        module_type VARCHAR(50) DEFAULT 'k12'
      )
    `);

    for (const strategy of supportStrategies) {
      await pool.query(`
        INSERT INTO support_strategies (strategy_key, canonical_key, grade_band, strategy, implementation, module_type)
        VALUES ($1, $2, $3, $4, $5, 'k12')
        ON CONFLICT (strategy_key) DO UPDATE
        SET canonical_key = EXCLUDED.canonical_key,
            grade_band = EXCLUDED.grade_band,
            strategy = EXCLUDED.strategy,
            implementation = EXCLUDED.implementation
      `, [strategy.strategy_key, strategy.canonical_key, strategy.grade_band, strategy.strategy, strategy.implementation]);
    }
    console.log('✅ K-12 support strategies created');

    console.log('\n🎉 K-12 Demo database setup completed successfully!');
    console.log('\nYou can now switch to the K-12 Demo environment to see it in action.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupK12DemoDatabase();
}

export { setupK12DemoDatabase };