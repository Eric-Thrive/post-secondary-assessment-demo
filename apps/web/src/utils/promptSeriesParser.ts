import { ParsedComponent } from '@/hooks/usePromptImport';
import { extractLookupTable } from './lookupTableExtractor';

export const parsePromptSeries = async (text: string): Promise<ParsedComponent[]> => {
  const components: ParsedComponent[] = [];

  console.log('Starting to parse prompt series, detecting format...');

  // Detect if this is K-12 format (has SYSTEM PROMPT START/END markers)
  const isK12Format = text.includes('SYSTEM PROMPT START') && text.includes('SYSTEM PROMPT END');
  
  if (isK12Format) {
    console.log('Detected K-12 format prompt series');
    return parseK12Format(text);
  } else {
    console.log('Detected post-secondary format prompt series');
    return parsePostSecondaryFormat(text);
  }
};

const parseK12Format = async (text: string): Promise<ParsedComponent[]> => {
  const components: ParsedComponent[] = [];

  // Parse K-12 System Prompt (between SYSTEM PROMPT START and SYSTEM PROMPT END)
  const systemPromptMatch = text.match(/SYSTEM PROMPT START\s*([\s\S]*?)\s*SYSTEM PROMPT END/i);
  if (systemPromptMatch && systemPromptMatch[1].trim()) {
    const systemContent = systemPromptMatch[1].trim();
    console.log('Found K-12 system prompt:', systemContent.length, 'characters');
    
    // Use system_instructions_v1 to match database expectations
    components.push({
      type: 'system_prompt',
      key: 'system_instructions_v1',
      title: 'System Instructions',
      content: systemContent,
      action: 'update',
      preview: systemContent.substring(0, 200) + '...',
      size: `${systemContent.length} characters`,
      isSystemPrompt: true,
      executionOrder: 1
    });
  }

  // Parse Markdown Report Template - look for content after SYSTEM PROMPT END
  const afterSystemPrompt = text.split(/SYSTEM PROMPT END/i)[1];
  if (afterSystemPrompt) {
    console.log('Searching for markdown template in content after SYSTEM PROMPT END...');
    console.log('Content preview:', afterSystemPrompt.substring(0, 200));
    
    // Try multiple patterns to catch the markdown template
    let markdownTemplateMatch = null;
    let templateContent = '';
    
    // Pattern 1: Look for "MARKDOWN REPORT TEMPLATE" followed by content
    markdownTemplateMatch = afterSystemPrompt.match(/MARKDOWN\s+REPORT\s+TEMPLATE\s*\n\s*\n([\s\S]*)/i);
    if (markdownTemplateMatch) {
      templateContent = markdownTemplateMatch[1].trim();
      console.log('Found markdown template using pattern 1 (MARKDOWN REPORT TEMPLATE)');
    }
    
    // Pattern 2: Look for content starting with "# 1. What We Learned"
    if (!templateContent) {
      markdownTemplateMatch = afterSystemPrompt.match(/(#\s+1\.\s+What\s+We\s+Learned[\s\S]*)/i);
      if (markdownTemplateMatch) {
        templateContent = markdownTemplateMatch[1].trim();
        console.log('Found markdown template using pattern 2 (# 1. What We Learned)');
      }
    }
    
    // Pattern 3: Look for any content that has markdown headers
    if (!templateContent) {
      markdownTemplateMatch = afterSystemPrompt.match(/(#\s+[^#]+[\s\S]*#\s+[^#]+[\s\S]*)/i);
      if (markdownTemplateMatch) {
        templateContent = markdownTemplateMatch[1].trim();
        console.log('Found markdown template using pattern 3 (multiple markdown headers)');
      }
    }
    
    if (templateContent) {
      console.log('Found K-12 markdown template:', templateContent.length, 'characters');
      console.log('Template preview:', templateContent.substring(0, 100));
      
      components.push({
        type: 'prompt_section',
        key: 'markdown_report',
        title: 'Markdown Report Template',
        content: templateContent,
        action: 'update',
        preview: templateContent.substring(0, 200) + '...',
        size: `${templateContent.length} characters`,
        executionOrder: 3
      });
    } else {
      console.log('No markdown template found. Available content after SYSTEM PROMPT END:', afterSystemPrompt.length, 'characters');
    }
  }

  // Parse Lookup Table using improved extraction
  const lookupTable = extractLookupTable(text);
  if (lookupTable) {
    console.log('Found K-12 lookup table with categories:', Object.keys(lookupTable));
    components.push({
      type: 'lookup_table',
      key: 'accommodation_lookup',
      title: 'Accommodation Lookup Table',
      content: lookupTable,
      action: 'update',
      preview: `${Object.keys(lookupTable).length} accommodation categories`,
      size: `${Object.keys(lookupTable).length} categories`
    });
  }

  // Parse AI Configuration for K-12
  const aiConfigSection = text.match(/(?:AI\s+CONFIG|MODEL\s+CONFIG|CONFIGURATION)([\s\S]*?)(?=_{10,}|SYSTEM PROMPT END|$)/i);
  if (aiConfigSection) {
    const configText = aiConfigSection[1];
    const modelMatch = configText.match(/model[:\s]+([^\n\r,]+)/i);
    const tempMatch = configText.match(/temperature[:\s]+([\d.]+)/i);
    const tokensMatch = configText.match(/max_tokens[:\s]+(\d+)/i);
    const timeoutMatch = configText.match(/timeout[:\s]+(\d+)/i);

    if (modelMatch || tempMatch || tokensMatch || timeoutMatch) {
      const config = {
        model_name: modelMatch?.[1]?.trim() || 'gpt-4.1',
        temperature: tempMatch ? parseFloat(tempMatch[1]) : 0.1,
        max_tokens: tokensMatch ? parseInt(tokensMatch[1]) : 4000,
        timeout_seconds: timeoutMatch ? parseInt(timeoutMatch[1]) : 120
      };

      console.log('Found K-12 AI config:', config);
      components.push({
        type: 'ai_config',
        key: 'default',
        title: 'AI Configuration',
        content: config,
        action: 'update',
        preview: `Model: ${config.model_name}, Temp: ${config.temperature}`,
        size: '4 parameters'
      });
    }
  }

  console.log('K-12 parsing complete. Found', components.length, 'components');
  return components;
};

const parsePostSecondaryFormat = async (text: string): Promise<ParsedComponent[]> => {
  const components: ParsedComponent[] = [];

  // Parse System Initial Prompt (everything before major section markers)
  const systemPromptMatch = text.match(/^([\s\S]*?)(?=_{10,}|## LOOKUP TABLE|$)/i);
  if (systemPromptMatch && systemPromptMatch[1].trim()) {
    const systemContent = systemPromptMatch[1].trim();
    if (systemContent.length > 200) {
      console.log('Found post-secondary system prompt:', systemContent.length, 'characters');
      components.push({
        type: 'system_prompt',
        key: 'system_instructions_v1',
        title: 'System Instructions',
        content: systemContent,
        action: 'update',
        preview: systemContent.substring(0, 200) + '...',
        size: `${systemContent.length} characters`,
        isSystemPrompt: true,
        executionOrder: 1
      });
    }
  }

  // Parse Lookup Table using improved extraction
  const lookupTable = extractLookupTable(text);
  if (lookupTable) {
    console.log('Found post-secondary lookup table with categories:', Object.keys(lookupTable));
    components.push({
      type: 'lookup_table',
      key: 'accommodation_lookup',
      title: 'Accommodation Lookup Table',
      content: lookupTable,
      action: 'update',
      preview: `${Object.keys(lookupTable).length} accommodation categories`,
      size: `${Object.keys(lookupTable).length} categories`
    });
  }

  // Parse AI Configuration
  const aiConfigSection = text.match(/(?:AI\s+CONFIG|MODEL\s+CONFIG|CONFIGURATION)([\s\S]*?)(?=_{10,}|$)/i);
  if (aiConfigSection) {
    const configText = aiConfigSection[1];
    const modelMatch = configText.match(/model[:\s]+([^\n\r,]+)/i);
    const tempMatch = configText.match(/temperature[:\s]+([\d.]+)/i);
    const tokensMatch = configText.match(/max_tokens[:\s]+(\d+)/i);
    const timeoutMatch = configText.match(/timeout[:\s]+(\d+)/i);

    if (modelMatch || tempMatch || tokensMatch || timeoutMatch) {
      const config = {
        model_name: modelMatch?.[1]?.trim() || 'gpt-4.1',
        temperature: tempMatch ? parseFloat(tempMatch[1]) : 0.1,
        max_tokens: tokensMatch ? parseInt(tokensMatch[1]) : 4000,
        timeout_seconds: timeoutMatch ? parseInt(timeoutMatch[1]) : 120
      };

      console.log('Found post-secondary AI config:', config);
      components.push({
        type: 'ai_config',
        key: 'default',
        title: 'AI Configuration',
        content: config,
        action: 'update',
        preview: `Model: ${config.model_name}, Temp: ${config.temperature}`,
        size: '4 parameters'
      });
    }
  }

  console.log('Post-secondary parsing complete. Found', components.length, 'components');
  return components;
};
