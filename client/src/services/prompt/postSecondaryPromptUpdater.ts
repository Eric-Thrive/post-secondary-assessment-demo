
import { apiClient } from '@/lib/apiClient';
import { getPostSecondarySystemInstructionsTemplate } from './templates/postSecondarySystemInstructionsTemplate';
import { getPostSecondaryMarkdownTemplate } from './templates/postSecondaryMarkdownTemplate';

export class PostSecondaryPromptUpdater {
  async updateSystemInstructions(): Promise<void> {
    console.log('Updating post-secondary system instructions in database...');
    
    const systemInstructionsContent = getPostSecondarySystemInstructionsTemplate();
    
    try {
      const { error } = await database
        .from('prompt_sections')
        .update({
          title: 'Post-Secondary System Instructions (Enhanced)',
          description: 'Comprehensive system instructions for post-secondary accommodation analysis with rich content population',
          content: systemInstructionsContent,
          execution_order: 1,
          is_system_prompt: true,
          module_type: 'post_secondary',
          version: '2.0',
          last_updated: new Date().toISOString()
        })
        .eq('section_key', 'system_instructions_post_secondary');

      if (error) {
        console.error('Failed to update system instructions:', error);
        throw error;
      }

      console.log('✅ Post-secondary system instructions updated successfully');
    } catch (error) {
      console.error('❌ Error updating system instructions:', error);
      throw error;
    }
  }

  async updateMarkdownTemplate(): Promise<void> {
    console.log('Updating post-secondary markdown template in database...');
    
    const markdownTemplateContent = getPostSecondaryMarkdownTemplate();
    
    try {
      const { error } = await database
        .from('prompt_sections')
        .update({
          title: 'Post-Secondary Markdown Report Template (Rich Content)',
          description: 'Markdown report template optimized for rich content population from item master',
          content: markdownTemplateContent,
          execution_order: 3,
          is_system_prompt: false,
          module_type: 'post_secondary',
          version: '2.0',
          last_updated: new Date().toISOString()
        })
        .eq('section_key', 'markdown_report_template_post_secondary');

      if (error) {
        console.error('Failed to update markdown template:', error);
        throw error;
      }

      console.log('✅ Post-secondary markdown template updated successfully');
    } catch (error) {
      console.error('❌ Error updating markdown template:', error);
      throw error;
    }
  }

  async updateAllPrompts(): Promise<void> {
    console.log('🔄 Starting post-secondary prompt update process...');
    
    try {
      await this.updateSystemInstructions();
      await this.updateMarkdownTemplate();
      
      console.log('✅ All post-secondary prompts updated successfully');
      console.log('📋 Updated prompts:');
      console.log('  - system_instructions_post_secondary (v2.0)');
      console.log('  - markdown_report_template_post_secondary (v2.0)');
    } catch (error) {
      console.error('❌ Failed to update post-secondary prompts:', error);
      throw error;
    }
  }

  async verifyPromptSynchronization(): Promise<void> {
    console.log('🔍 Verifying prompt synchronization...');
    
    try {
      const { data: prompts, error } = await database
        .from('prompt_sections')
        .select('section_key, title, version, last_updated')
        .eq('module_type', 'post_secondary')
        .in('section_key', ['system_instructions_post_secondary', 'markdown_report_template_post_secondary']);

      if (error) {
        console.error('Failed to verify prompts:', error);
        throw error;
      }

      console.log('📊 Current post-secondary prompts in database:');
      prompts?.forEach(prompt => {
        console.log(`  - ${prompt.section_key}: ${prompt.title} (v${prompt.version})`);
        console.log(`    Last updated: ${prompt.last_updated}`);
      });

      const systemPrompt = prompts?.find(p => p.section_key === 'system_instructions_post_secondary');
      const templatePrompt = prompts?.find(p => p.section_key === 'markdown_report_template_post_secondary');

      if (!systemPrompt) {
        console.warn('⚠️  System instructions not found in database');
      }
      if (!templatePrompt) {
        console.warn('⚠️  Markdown template not found in database');
      }

      if (systemPrompt && templatePrompt) {
        console.log('✅ All required prompts are present in database');
      }
    } catch (error) {
      console.error('❌ Failed to verify prompt synchronization:', error);
      throw error;
    }
  }
}

export const postSecondaryPromptUpdater = new PostSecondaryPromptUpdater();
