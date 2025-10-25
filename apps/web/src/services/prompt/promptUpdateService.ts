
import { postSecondaryPromptUpdater } from './postSecondaryPromptUpdater';
import { k12PromptUpdater } from './k12PromptUpdater';
import { useToast } from '@/hooks/use-toast';

export class PromptUpdateService {
  static async updatePostSecondaryPrompts(): Promise<void> {
    try {
      console.log('🚀 Starting post-secondary prompt update...');
      
      // Update all post-secondary prompts to reflect rich content approach
      await postSecondaryPromptUpdater.updateAllPrompts();
      
      // Verify synchronization
      await postSecondaryPromptUpdater.verifyPromptSynchronization();
      
      console.log('✅ Post-secondary prompt update completed successfully');
      
    } catch (error) {
      console.error('❌ Post-secondary prompt update failed:', error);
      throw error;
    }
  }

  static async updateK12Prompts(): Promise<void> {
    try {
      console.log('🚀 Starting K-12 prompt update...');
      
      // Update all K-12 prompts to reflect rich content approach
      await k12PromptUpdater.updateAllPrompts();
      
      // Verify synchronization
      await k12PromptUpdater.verifyPromptSynchronization();
      
      console.log('✅ K-12 prompt update completed successfully');
      
    } catch (error) {
      console.error('❌ K-12 prompt update failed:', error);
      throw error;
    }
  }

  static async updateAllModulePrompts(): Promise<void> {
    try {
      console.log('🚀 Starting comprehensive prompt update for all modules...');
      
      // Update both K-12 and Post-Secondary prompts
      await Promise.all([
        this.updateK12Prompts(),
        this.updatePostSecondaryPrompts()
      ]);
      
      console.log('✅ All module prompts updated successfully');
      
    } catch (error) {
      console.error('❌ Comprehensive prompt update failed:', error);
      throw error;
    }
  }

  static async verifyPromptConsistency(): Promise<{ consistent: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      console.log('🔍 Checking prompt consistency for all modules...');
      
      // Check both K-12 and Post-Secondary synchronization
      await Promise.all([
        postSecondaryPromptUpdater.verifyPromptSynchronization(),
        k12PromptUpdater.verifyPromptSynchronization()
      ]);
      
      console.log('✅ Prompt consistency check completed for all modules');
      return { consistent: issues.length === 0, issues };
      
    } catch (error) {
      console.error('❌ Prompt consistency check failed:', error);
      issues.push(`Consistency check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { consistent: false, issues };
    }
  }
}
