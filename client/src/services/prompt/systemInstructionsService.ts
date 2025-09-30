
import { apiClient } from '@/lib/apiClient';
import { BaseSectionsService } from './baseSectionsService';
import { PromptSection } from '@/types/promptService';
import { getK12SystemInstructionsTemplate } from './templates/k12SystemInstructionsTemplate';
import { getPostSecondarySystemInstructionsTemplate } from './templates/postSecondarySystemInstructionsTemplate';
import { getSystemInstructionKey } from './utils/systemInstructionKeys';

export class SystemInstructionsService extends BaseSectionsService {
  async updateSystemInstructions(moduleType: string = 'post_secondary'): Promise<PromptSection> {
    console.log('Updating enhanced system instructions for module:', moduleType);
    
    // Use the new module-specific system instruction keys
    const systemKey = getSystemInstructionKey(moduleType);
    
    const systemInstructionsContent = this.getEnhancedSystemInstructionsTemplate(moduleType);
    
    try {
      const result = await this.savePromptSection(
        systemKey,
        systemInstructionsContent,
        1, // execution order
        true, // is system prompt
        moduleType
      );
      
      console.log('Enhanced system instructions updated successfully for module:', moduleType);
      return result;
    } catch (error) {
      console.error('Failed to update enhanced system instructions:', error);
      throw error;
    }
  }

  private getEnhancedSystemInstructionsTemplate(moduleType: string): string {
    if (moduleType === 'k12') {
      return getK12SystemInstructionsTemplate();
    } else {
      return getPostSecondarySystemInstructionsTemplate();
    }
  }
}
