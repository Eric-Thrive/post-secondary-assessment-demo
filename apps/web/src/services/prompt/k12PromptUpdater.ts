// @ts-nocheck
import { apiClient } from '@/lib/apiClient';
import { getK12SystemInstructionsTemplate } from './templates/k12SystemInstructionsTemplate';
import { getK12MarkdownTemplate } from './templates/k12MarkdownTemplate';

export class K12PromptUpdater {
  async updateSystemInstructions(): Promise<void> {
    console.log('Updating K-12 system instructions in database...');
    
    const systemInstructionsContent = getK12SystemInstructionsTemplate();
    
    try {
      const { error } = await database
        .from('prompt_sections')
        .update({
          title: 'K-12 System Instructions (Enhanced)',
          description: 'Comprehensive system instructions for K-12 educational analysis with rich content population',
          content: systemInstructionsContent,
          execution_order: 1,
          is_system_prompt: true,
          module_type: 'k12',
          version: '2.0',
          last_updated: new Date().toISOString()
        })
        .eq('section_key', 'system_instructions_k12');

      if (error) {
        console.error('Failed to update K-12 system instructions:', error);
        throw error;
      }

      console.log('✅ K-12 system instructions updated successfully');
    } catch (error) {
      console.error('❌ Error updating K-12 system instructions:', error);
      throw error;
    }
  }

  async updateMarkdownTemplate(): Promise<void> {
    console.log('Updating K-12 markdown template in database...');
    
    const markdownTemplateContent = getK12MarkdownTemplate();
    
    try {
      const { error } = await database
        .from('prompt_sections')
        .update({
          title: 'K-12 Markdown Report Template (Rich Content)',
          description: 'Markdown report template optimized for rich content population from K-12 item master',
          content: markdownTemplateContent,
          execution_order: 3,
          is_system_prompt: false,
          module_type: 'k12',
          version: '2.0',
          last_updated: new Date().toISOString()
        })
        .eq('section_key', 'markdown_report_template_k12');

      if (error) {
        console.error('Failed to update K-12 markdown template:', error);
        throw error;
      }

      console.log('✅ K-12 markdown template updated successfully');
    } catch (error) {
      console.error('❌ Error updating K-12 markdown template:', error);
      throw error;
    }
  }

  async updateAllPrompts(): Promise<void> {
    console.log('🔄 Starting K-12 prompt update process...');
    
    try {
      await this.updateSystemInstructions();
      await this.updateMarkdownTemplate();
      
      console.log('✅ All K-12 prompts updated successfully');
      console.log('📋 Updated prompts:');
      console.log('  - system_instructions_k12 (v2.0)');
      console.log('  - markdown_report_template_k12 (v2.0)');
    } catch (error) {
      console.error('❌ Failed to update K-12 prompts:', error);
      throw error;
    }
  }

  async verifyPromptSynchronization(): Promise<void> {
    console.log('🔍 Verifying K-12 prompt synchronization...');
    
    try {
      const { data: prompts, error } = await database
        .from('prompt_sections')
        .select('section_key, title, version, last_updated')
        .eq('module_type', 'k12')
        .in('section_key', ['system_instructions_k12', 'markdown_report_template_k12']);

      if (error) {
        console.error('Failed to verify K-12 prompts:', error);
        throw error;
      }

      console.log('📊 Current K-12 prompts in database:');
      prompts?.forEach(prompt => {
        console.log(`  - ${prompt.section_key}: ${prompt.title} (v${prompt.version})`);
        console.log(`    Last updated: ${prompt.last_updated}`);
      });

      const systemPrompt = prompts?.find(p => p.section_key === 'system_instructions_k12');
      const templatePrompt = prompts?.find(p => p.section_key === 'markdown_report_template_k12');

      if (!systemPrompt) {
        console.warn('⚠️  K-12 system instructions not found in database');
      }
      if (!templatePrompt) {
        console.warn('⚠️  K-12 markdown template not found in database');
      }

      if (systemPrompt && templatePrompt) {
        console.log('✅ All required K-12 prompts are present in database');
      }
    } catch (error) {
      console.error('❌ Failed to verify K-12 prompt synchronization:', error);
      throw error;
    }
  }
}

export const k12PromptUpdater = new K12PromptUpdater();