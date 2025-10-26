import { LocalAIService } from './ai-service';
import { storage } from './storage';

interface QCMetadata {
  confidence: number; // 1-5 scale
  evidenceQuality: 'strong' | 'moderate' | 'limited' | 'inference';
  uncertaintyFlag: boolean;
  uncertaintyReason?: string;
}

interface ReportSection {
  title: string;
  content: string;
  qc: QCMetadata;
}

interface JSONReportStructure {
  studentOverview: {
    summary: string;
    qc: QCMetadata;
  };
  strengths: ReportSection[];
  challenges: ReportSection[];
  keySupport: ReportSection[];
  overallQC: {
    averageConfidence: number;
    totalUncertainties: number;
    recommendsReview: boolean;
  };
}

// Tutoring-specific strict schema (from user's comprehensive prompt)
interface TutoringReportStructure {
  meta: {
    student_name: string;
    pronouns: 'she/her' | 'he/him' | 'they/them';
    grade: string;
    school_year: string;
    schema_version: string;
    prompt_version: string;
    generated_at: string;
  };
  student_overview: {
    tldr_paragraph: string;
    strengths_highlight: string;
    diagnoses: {
      label: string;
      plain_language: string;
      obvious_to_12th_grader: boolean;
      source?: string;
      notes?: string;
    }[];
    critical_nuance: string;
    gen_ed_support_need: string;
    paragraph: {
      main_five: string;
      capstone_one: string;
      full: string;
    };
  };
  key_support_strategies: {
    use_strengths: string[];
    support_challenges: string[];
    small_changes: string;
    dont_underestimate: string;
    support_challenges_refs?: string[][];
    paragraph: {
      use_strengths_line: string;
      support_challenges_line: string;
      small_changes_line: string;
      dont_underestimate_line: string;
      full: string;
    };
  };
  strengths: {
    title: string;
    what_you_see: string;
    evidence: string;
    impact: string;
    do: string;
    avoid: string;
  }[];
  challenges: {
    title: string;
    what_you_see: string;
    evidence: string;
    impact: string;
    do: string;
    avoid: string;
  }[];
  documents_reviewed: {
    section_title: string;
    documents: {
      filename: string;
      document_type: string; // "Psychological Evaluation", "IEP", "Progress Report", etc.
      key_findings: string; // Brief summary of relevant findings
    }[];
    summary: string; // Overall summary of document set
  };
  additional_notes?: string;
}

export class AIJSONService {
  private aiService: LocalAIService;

  constructor() {
    this.aiService = new LocalAIService();
  }
  
  private async callOpenAIDirect(messages: Array<{role: string, content: string}>): Promise<string> {
    try {
      // Use the LocalAIService to call OpenAI with GPT-4.1 primary, GPT-4o fallback
      const response = await (this.aiService as any).openai.chat.completions.create({
        model: 'gpt-4.1', // GPT-4.1
        messages: messages,
        temperature: 0.3, // Lower temperature for more consistent JSON
        max_tokens: 4000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.log('GPT-4.1 failed, trying GPT-4o fallback...');
      try {
        const response = await (this.aiService as any).openai.chat.completions.create({
          model: 'gpt-4o',
          messages: messages,
          temperature: 0.3,
          max_tokens: 4000,
        });
        return response.choices[0]?.message?.content || '';
      } catch (fallbackError) {
        const errorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown OpenAI error';
        throw new Error(`OpenAI API call failed: ${errorMessage}`);
      }
    }
  }

  async generateJSONReport(
    documents: string[], 
    moduleType: string, 
    studentName?: string,
    gradeBand?: string
  ): Promise<{ jsonReport: JSONReportStructure | TutoringReportStructure; markdownReport: string }> {
    
    console.log('🔄 Generating JSON-first report with QC metadata');
    
    // Get module-specific prompts
    const reportFormatPrompts = await storage.getPromptSections(moduleType, 'report_format');
    const jsonSystemPrompt = await this.loadJSONSystemPrompt(moduleType);
    const jsonUserPrompt = this.buildJSONUserPrompt(moduleType, documents, studentName, gradeBand);
    
    try {
      // Generate JSON report from OpenAI
      const openaiResponse = await this.callOpenAIDirect([
        { role: 'system', content: jsonSystemPrompt },
        { role: 'user', content: jsonUserPrompt }
      ]);

      console.log('📊 Raw OpenAI response received');
      
      // Parse JSON response based on module type
      const jsonReport = moduleType === 'tutoring' 
        ? this.parseTutoringJSONResponse(openaiResponse, studentName, gradeBand)
        : this.parseJSONResponse(openaiResponse);
      
      // Calculate overall QC metrics and convert to markdown
      let markdownReport: string;
      if (moduleType === 'tutoring') {
        // Use database template for tutoring markdown generation
        markdownReport = await this.generateMarkdownFromTemplate(jsonReport as TutoringReportStructure, reportFormatPrompts);
      } else {
        (jsonReport as JSONReportStructure).overallQC = this.calculateOverallQC(jsonReport as JSONReportStructure);
        markdownReport = this.convertJSONToMarkdown(jsonReport as JSONReportStructure, moduleType);
      }
      
      console.log('✅ JSON report generated with QC metadata');
      if (moduleType === 'tutoring') {
        console.log(`📊 Tutoring schema enforced: 3 strengths, 4 challenges, strict format`);
      } else {
        console.log(`📊 QC Summary: Avg Confidence: ${(jsonReport as JSONReportStructure).overallQC.averageConfidence}, Uncertainties: ${(jsonReport as JSONReportStructure).overallQC.totalUncertainties}`);
      }
      
      return { jsonReport, markdownReport };
      
    } catch (error) {
      console.error('❌ JSON report generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`JSON report generation failed: ${errorMessage}`);
    }
  }
  
  private async loadJSONSystemPrompt(moduleType: string): Promise<string> {
    const candidateKeys = [
      `system_instructions_${moduleType}_json`,
      `system_instructions_${moduleType}_json_report`,
      `system_instructions_${moduleType}_json_generation`,
      `json_report_system_prompt_${moduleType}`,
      `system_instructions_${moduleType}`
    ];

    const jsonScopedPrompts = await storage.getPromptSections(moduleType, 'system', 'json');
    const systemPrompts = jsonScopedPrompts.length > 0
      ? jsonScopedPrompts
      : await storage.getPromptSections(moduleType, 'system');

    for (const key of candidateKeys) {
      const match = systemPrompts.find((prompt: any) => prompt.section_key === key);
      if (match?.content) {
        console.log(`✅ Loaded JSON system prompt for ${moduleType}: ${key}`);
        return match.content;
      }
    }

    throw new Error(`JSON system prompt not found for module: ${moduleType}. Please ensure one of the following keys exists: ${candidateKeys.join(', ')}`);
  }

  private buildJSONUserPrompt(
    moduleType: string,
    documents: string[],
    studentName?: string,
    gradeBand?: string
  ): string {
    const basePrompt = `Generate a structured JSON report with the following schema:
{
  "studentOverview": {
    "summary": "Brief 2-3 sentence overview of the student",
    "qc": {
      "confidence": 4,
      "evidenceQuality": "strong",
      "uncertaintyFlag": false
    }
  },
  "strengths": [
    {
      "title": "Strength title",
      "content": "Detailed description with specific examples from documents",
      "qc": {
        "confidence": 3,
        "evidenceQuality": "moderate",
        "uncertaintyFlag": true,
        "uncertaintyReason": "Limited evidence in documents"
      }
    }
  ],
  "challenges": [
    {
      "title": "Challenge title",
      "content": "Detailed description with specific examples",
      "qc": {
        "confidence": 5,
        "evidenceQuality": "strong",
        "uncertaintyFlag": false
      }
    }
  ],
  "keySupport": [
    {
      "title": "Support strategy title",
      "content": "Specific, actionable support recommendation",
      "qc": {
        "confidence": 4,
        "evidenceQuality": "strong",
        "uncertaintyFlag": false
      }
    }
  ]
}

**CRITICAL FORMAT RULES**
- Respond with valid JSON only (no Markdown or prose)
- All required fields must be present using the schema above
- Keep arrays within the recommended item counts

**QC GUIDELINES**
- confidence: integer 1-5 (1=very uncertain, 5=very confident)
- evidenceQuality: "strong", "moderate", "limited", or "inference"
- uncertaintyFlag: true when confidence < 3 or evidenceQuality is "limited"/"inference"
- uncertaintyReason: required when uncertaintyFlag is true

**QUALITY STANDARDS**
- Flag any finding with limited or conflicting evidence
- Mark expert inferences as uncertain
- Clearly state gaps or limitations in the document set
- Generate 2-4 strengths, 2-4 challenges, and 3-5 support strategies`;

    let moduleContext = '';
    if (moduleType === 'k12') {
      moduleContext = '**Context:** Focus on classroom behaviors, academic skills, and family-friendly language.';
    } else if (moduleType === 'tutoring') {
      moduleContext = '**Context:** Emphasize one-on-one learning strategies, targeted skill gaps, and tutor-implementable actions.';
    } else {
      moduleContext = '**Context:** Prioritize academic accommodations, self-advocacy, and supports suited for college/university settings.';
    }

    const learnerContextParts: string[] = [];
    if (studentName) {
      learnerContextParts.push(`Student Name: ${studentName}`);
    }
    if (gradeBand) {
      learnerContextParts.push(`Grade Band: ${gradeBand}`);
    }

    const documentSection = documents.length > 0
      ? `Documents to analyze:\n\n${documents.join('\n\n---\n\n')}`
      : 'No documents were supplied. Base the report on available context.';

    const learnerContext = learnerContextParts.length > 0
      ? `${learnerContextParts.join('\n')}\n\n`
      : '';

    return `${basePrompt}\n\n${moduleContext}\n\n${learnerContext}${documentSection}`;
  }
  
  private parseJSONResponse(response: string): JSONReportStructure {
    try {
      // Clean up response - remove any markdown formatting
      const cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanResponse);
      
      // Validate structure
      if (!parsed.studentOverview || !parsed.strengths || !parsed.challenges || !parsed.keySupport) {
        throw new Error('Invalid JSON structure - missing required sections');
      }
      
      return parsed as JSONReportStructure;
    } catch (error) {
      console.error('JSON parsing error:', error);
      console.error('Raw response:', response);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse JSON response: ${errorMessage}`);
    }
  }
  
  private calculateOverallQC(report: JSONReportStructure): JSONReportStructure['overallQC'] {
    const allSections = [
      report.studentOverview,
      ...report.strengths,
      ...report.challenges, 
      ...report.keySupport
    ];
    
    const confidenceScores = allSections.map(section => section.qc.confidence);
    const averageConfidence = Math.round(
      (confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length) * 10
    ) / 10;
    
    const totalUncertainties = allSections.filter(section => section.qc.uncertaintyFlag).length;
    const recommendsReview = averageConfidence < 3.5 || totalUncertainties > 2;
    
    return {
      averageConfidence,
      totalUncertainties,
      recommendsReview
    };
  }
  
  private convertJSONToMarkdown(jsonReport: JSONReportStructure, moduleType: string): string {
    let markdown = `# Student Support Report\n\n`;
    
    // Student Overview
    markdown += `## Student Overview\n\n${jsonReport.studentOverview.summary}\n\n`;
    if (jsonReport.studentOverview.qc.uncertaintyFlag) {
      markdown += `⚠️ **Note:** ${jsonReport.studentOverview.qc.uncertaintyReason}\n\n`;
    }
    
    // Strengths
    markdown += `## Strengths\n\n`;
    jsonReport.strengths.forEach((strength, index) => {
      markdown += `### ${index + 1}. ${strength.title}\n\n${strength.content}\n\n`;
      if (strength.qc.uncertaintyFlag) {
        markdown += `⚠️ **Uncertainty:** ${strength.qc.uncertaintyReason}\n\n`;
      }
    });
    
    // Challenges
    markdown += `## Challenges / Areas of Need\n\n`;
    jsonReport.challenges.forEach((challenge, index) => {
      markdown += `### ${index + 1}. ${challenge.title}\n\n${challenge.content}\n\n`;
      if (challenge.qc.uncertaintyFlag) {
        markdown += `⚠️ **Uncertainty:** ${challenge.qc.uncertaintyReason}\n\n`;
      }
    });
    
    // Key Support Strategies
    markdown += `## Key Support Strategies\n\n`;
    jsonReport.keySupport.forEach((support, index) => {
      markdown += `### ${index + 1}. ${support.title}\n\n${support.content}\n\n`;
      if (support.qc.uncertaintyFlag) {
        markdown += `⚠️ **Uncertainty:** ${support.qc.uncertaintyReason}\n\n`;
      }
    });
    
    return markdown;
  }

  // New methods for tutoring schema enforcement
  private parseTutoringJSONResponse(response: string, studentName?: string, gradeBand?: string): TutoringReportStructure {
    try {
      // Clean up response - remove any markdown formatting
      const cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanResponse);
      
      // Validate strict tutoring schema structure
      if (!parsed.meta || !parsed.student_overview || !parsed.key_support_strategies || 
          !parsed.strengths || !parsed.challenges) {
        throw new Error('Invalid tutoring JSON structure - missing required sections');
      }
      
      // Validate specific field requirements  
      if (!parsed.student_overview.tldr_paragraph || typeof parsed.student_overview.tldr_paragraph !== 'string') {
        throw new Error('student_overview.tldr_paragraph must be a non-empty string');
      }
      
      if (!parsed.student_overview.paragraph || !parsed.student_overview.paragraph.main_five || !parsed.student_overview.paragraph.capstone_one || !parsed.student_overview.paragraph.full) {
        throw new Error('student_overview.paragraph must contain main_five, capstone_one, and full fields');
      }
      
      if (!parsed.key_support_strategies.paragraph || !parsed.key_support_strategies.paragraph.full) {
        throw new Error('key_support_strategies.paragraph must contain required fields');
      }
      
      if (!Array.isArray(parsed.strengths) || parsed.strengths.length !== 3) {
        throw new Error('strengths must be exactly 3 items');
      }
      
      if (!Array.isArray(parsed.challenges) || parsed.challenges.length !== 4) {
        throw new Error('challenges must be exactly 4 items');
      }
      
      // Fill in meta fields if missing
      if (!parsed.meta.student_name && studentName) {
        parsed.meta.student_name = studentName;
      }
      if (!parsed.meta.grade && gradeBand) {
        parsed.meta.grade = gradeBand;
      }
      if (!parsed.meta.generated_at) {
        parsed.meta.generated_at = new Date().toISOString();
      }
      if (!parsed.meta.schema_version) {
        parsed.meta.schema_version = '1.0.0';
      }
      if (!parsed.meta.prompt_version) {
        parsed.meta.prompt_version = '2.0';
      }
      if (!parsed.meta.school_year) {
        parsed.meta.school_year = '2024-2025';
      }
      if (!parsed.meta.pronouns) {
        parsed.meta.pronouns = 'they/them'; // Default pronoun
      }
      
      return parsed as TutoringReportStructure;
    } catch (error) {
      console.error('Tutoring JSON parsing error:', error);
      console.error('Raw response:', response);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse tutoring JSON response: ${errorMessage}`);
    }
  }

  private async generateMarkdownFromTemplate(tutoringReport: TutoringReportStructure, reportFormatPrompts: any[]): Promise<string> {
    // Get the tutoring markdown template from database
    const templateSection = reportFormatPrompts.find(p => p.section_key === 'markdown_report_template_tutoring');
    
    if (!templateSection || !templateSection.content) {
      console.error('❌ No tutoring markdown template found in database');
      // Fallback to hardcoded conversion
      return this.convertTutoringJSONToMarkdown(tutoringReport);
    }
    
    console.log(`✅ Using database template for tutoring: ${templateSection.content.length} characters`);
    
    try {
      // Use AI to render the JSON data with the template
      const renderPrompt = `${templateSection.content}\n\n---\n\nRender the following JSON data using the template above:\n\n${JSON.stringify(tutoringReport, null, 2)}`;
      
      const response = await this.callOpenAIDirect([
        { role: 'user', content: renderPrompt }
      ]);
      
      // Clean the response by removing markdown code block wrappers
      const cleanResponse = response
        .replace(/^```(?:markdown)?\n/, '')  // Remove opening code block
        .replace(/\n```$/, '')               // Remove closing code block
        .trim();
      
      return cleanResponse;
    } catch (error) {
      console.error('❌ Failed to generate markdown from template:', error);
      // Return hardcoded fallback
      return this.convertTutoringJSONToMarkdown(tutoringReport);
    }
  }

  private convertTutoringJSONToMarkdown(tutoringReport: TutoringReportStructure): string {
    let markdown = `# Student Support Report — Tutor Orientation\n\n`;
    
    // Header with student info
    markdown += `**Student:** ${tutoringReport.meta.student_name}    **Grade:** ${tutoringReport.meta.grade}    **School year:** ${tutoringReport.meta.school_year}\n\n`;
    markdown += `> *This is an orientation document (accommodations & teaching approaches) for a one-to-one tutor.*\n\n`;
    markdown += `---\n\n`;
    
    // Documents Reviewed Section
    markdown += `## Documents Reviewed\n\n`;
    markdown += `The following documents were analyzed as part of this tutoring assessment:\n\n`;
    markdown += `### Uploaded Documents:\n`;
    markdown += `- [Document will be listed here] - [Upload Date] - [File Type]\n`;
    markdown += `- [Document will be listed here] - [Upload Date] - [File Type]\n`;
    markdown += `- [Document will be listed here] - [Upload Date] - [File Type]\n\n`;
    markdown += `### Document Analysis Summary:\n`;
    markdown += `[Summary of key patterns and insights identified across all uploaded documents relevant to tutoring approach and student support needs.]\n\n`;
    markdown += `**Total Documents Analyzed:** [Document Count]  \n`;
    markdown += `**Analysis Completion Date:** [Date]\n\n`;
    markdown += `---\n\n`;
    
    // 1) Student Overview - use pre-rendered paragraph
    markdown += `## 1) Student Overview\n\n`;
    if (tutoringReport.student_overview.paragraph && tutoringReport.student_overview.paragraph.full) {
      markdown += `${tutoringReport.student_overview.paragraph.full}\n\n`;
    } else {
      // Fallback to old format if paragraph object doesn't exist
      markdown += `${tutoringReport.student_overview.tldr_paragraph}\n\n`;
    }
    markdown += `---\n\n`;
    
    // 2) Key Support Strategies - use pre-rendered lines
    markdown += `## 2) Key Support Strategies (orientation level)\n\n`;
    if (tutoringReport.key_support_strategies.paragraph && tutoringReport.key_support_strategies.paragraph.full) {
      markdown += `${tutoringReport.key_support_strategies.paragraph.full}\n\n`;
    } else {
      // Fallback to old format if paragraph object doesn't exist
      markdown += `**Use Strengths:** ${tutoringReport.key_support_strategies.use_strengths.join(', ')}\n\n`;
      markdown += `**Support Challenges:** ${tutoringReport.key_support_strategies.support_challenges.join(', ')}\n\n`;
      markdown += `**Small Changes:** ${tutoringReport.key_support_strategies.small_changes}\n\n`;
      markdown += `**Don't Underestimate:** ${tutoringReport.key_support_strategies.dont_underestimate}\n\n`;
    }
    markdown += `---\n\n`;
    
    // 3) Strengths (exactly 3)
    markdown += `## 3) Strengths (exactly 3)\n\n`;
    markdown += `| Strength | What you see | ✔️ What to do | ✖️ What not to do |\n`;
    markdown += `| -------- | ----------- | ------------- | ----------------- |\n`;
    tutoringReport.strengths.slice(0, 3).forEach((strength) => {
      const whatYouSee = `${strength.what_you_see}${strength.evidence ? `<br/><sub>**evidence:** ${strength.evidence}</sub>` : ''}${strength.impact ? `<br/><sub>**impact:** ${strength.impact}</sub>` : ''}`;
      markdown += `| ${strength.title} | ${whatYouSee} | ${strength.do} | ${strength.avoid} |\n`;
    });
    markdown += `\n---\n\n`;
    
    // 4) Challenges (exactly 4)
    markdown += `## 4) Challenges / Areas of Need (exactly 4)\n\n`;
    markdown += `| Challenge | What you see | ✔️ What to do | ✖️ What not to do |\n`;
    markdown += `| --------- | ----------- | ------------- | ----------------- |\n`;
    tutoringReport.challenges.slice(0, 4).forEach((challenge) => {
      const whatYouSee = `${challenge.what_you_see}${challenge.evidence ? `<br/><sub>**evidence:** ${challenge.evidence}</sub>` : ''}${challenge.impact ? `<br/><sub>**impact:** ${challenge.impact}</sub>` : ''}`;
      markdown += `| ${challenge.title} | ${whatYouSee} | ${challenge.do} | ${challenge.avoid} |\n`;
    });
    
    // Additional Notes if present
    if (tutoringReport.additional_notes) {
      markdown += `## Additional Notes\n\n${tutoringReport.additional_notes}\n\n`;
    }
    
    return markdown;
  }
}

export const aiJSONService = new AIJSONService();
