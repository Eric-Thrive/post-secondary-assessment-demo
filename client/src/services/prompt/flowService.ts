
import { apiClient } from '@/lib/apiClient';
import { PromptSection } from '@/types/promptService';

export class FlowService {
  async getExecutionFlow(moduleType: string = 'post_secondary'): Promise<{ systemPrompts: PromptSection[]; instructionPrompts: PromptSection[] }> {
    try {
      console.log('Getting execution flow for module:', moduleType);
      
      const { data, error } = await database
        .from('prompt_sections')
        .select('*')
        .eq('module_type', moduleType)
        .order('execution_order');

      if (error) {
        console.error('Error loading prompt sections for flow:', error);
        throw error;
      }

      const sections = data || [];
      
      // Both K-12 and post-secondary now use system_instructions_v1 as the system prompt
      const systemPrompts = sections.filter(section => 
        section.is_system_prompt === true || 
        section.section_key === 'system_instructions_v1'
      );
      
      const instructionPrompts = sections.filter(section => 
        section.is_system_prompt !== true && 
        section.section_key !== 'system_instructions_v1'
      );

      console.log(`Flow analysis for ${moduleType}:`);
      console.log('- System prompts:', systemPrompts.length);
      console.log('- Instruction prompts:', instructionPrompts.length);

      return {
        systemPrompts,
        instructionPrompts
      };
      
    } catch (error) {
      console.error('Failed to get execution flow:', error);
      throw error;
    }
  }

  async previewCombinedPrompt(moduleType: string = 'post_secondary'): Promise<string> {
    try {
      const { systemPrompts, instructionPrompts } = await this.getExecutionFlow(moduleType);
      
      let combined = '';
      
      // Add system prompts first
      if (systemPrompts.length > 0) {
        combined += '=== SYSTEM PROMPTS ===\n\n';
        systemPrompts.forEach((prompt, index) => {
          combined += `${index + 1}. ${prompt.title} (${prompt.section_key})\n`;
          combined += `${prompt.content}\n\n`;
        });
      }
      
      // Add instruction prompts
      if (instructionPrompts.length > 0) {
        combined += '=== INSTRUCTION PROMPTS ===\n\n';
        instructionPrompts.forEach((prompt, index) => {
          combined += `${index + 1}. ${prompt.title} (${prompt.section_key})\n`;
          combined += `${prompt.content}\n\n`;
        });
      }
      
      return combined;
      
    } catch (error) {
      console.error('Failed to preview combined prompt:', error);
      throw error;
    }
  }
}
