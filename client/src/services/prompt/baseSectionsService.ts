
import { apiClient } from '@/lib/apiClient';
import { PromptSection } from '@/types/promptService';

export class BaseSectionsService {
  async loadPromptSections(moduleType: string = 'post_secondary'): Promise<PromptSection[]> {
    try {
      console.log('Loading prompt sections from API for module:', moduleType);
      
      const data = await apiClient.getPromptSections(moduleType);

      if (!data || data.length === 0) {
        console.log('No prompt sections found for module:', moduleType);
        return [];
      }

      const prompts = data.map(item => ({
        id: item.id,
        section_key: item.section_key,
        title: item.title || item.section_name || 'Untitled',
        description: item.description || '',
        content: item.content || '',
        execution_order: item.execution_order || 0,
        is_system_prompt: item.is_system_prompt || false,
        created_at: item.created_at,
        last_updated: item.last_updated,
        module_type: item.module_type || moduleType
      }));

      console.log('Loaded', prompts.length, 'prompt sections from API for', moduleType);
      return prompts;
      
    } catch (error) {
      console.error('Failed to load prompt sections:', error);
      throw error;
    }
  }

  async savePromptSection(sectionKey: string, content: string, executionOrder?: number, isSystemPrompt?: boolean, moduleType: string = 'post_secondary'): Promise<PromptSection> {
    try {
      console.log('Saving prompt section:', sectionKey, 'for module:', moduleType);
      
      // Use API client to save the prompt section
      const result = await apiClient.savePromptSection(sectionKey, content, moduleType, executionOrder, isSystemPrompt);
      
      console.log('Successfully saved prompt section');
      return result;
      
    } catch (error) {
      console.error('Failed to save prompt section:', error);
      console.error('Error saving prompt section:', error);
      throw error;
    }
  }

  private generateTitleFromSectionKey(sectionKey: string): string {
    // Convert snake_case to Title Case
    return sectionKey
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async updatePromptOrder(sectionKey: string, newOrder: number, moduleType: string = 'post_secondary'): Promise<void> {
    try {
      console.log('Updating prompt order:', sectionKey, 'to', newOrder, 'for module:', moduleType);
      
      const { error } = await database
        .from('prompt_sections')
        .update({
          execution_order: newOrder,
          last_updated: new Date().toISOString()
        })
        .eq('section_key', sectionKey)
        .eq('module_type', moduleType);

      if (error) {
        console.error('Error updating prompt order:', error);
        throw error;
      }

      console.log('Successfully updated prompt order');
      
    } catch (error) {
      console.error('Failed to update prompt order:', error);
      throw error;
    }
  }
}
