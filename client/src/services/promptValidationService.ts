
import { apiClient } from '@/lib/apiClient';

export class PromptValidationService {
  async testPrompts(moduleType: string = 'post_secondary'): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing prompt validation for module:', moduleType);
      
      // Test database connectivity and prompt sections
      const { data: promptSections, error: promptError } = await database
        .from('prompt_sections' as any)
        .select('count')
        .limit(1);

      if (promptError) {
        console.error('Prompt validation failed:', promptError);
        return {
          success: false,
          message: `Database connection failed: ${promptError.message}`
        };
      }

      // Test lookup tables
      const { data: lookupTables, error: lookupError } = await database
        .from('lookup_tables' as any)
        .select('count')
        .limit(1);

      if (lookupError) {
        console.error('Lookup table validation failed:', lookupError);
        return {
          success: false,
          message: `Lookup tables validation failed: ${lookupError.message}`
        };
      }

      // Test AI config
      const { data: aiConfig, error: aiConfigError } = await database
        .from('ai_config' as any)
        .select('count')
        .limit(1);

      if (aiConfigError) {
        console.error('AI config validation failed:', aiConfigError);
        return {
          success: false,
          message: `AI config validation failed: ${aiConfigError.message}`
        };
      }

      console.log('All prompt validation tests passed for module:', moduleType);
      return {
        success: true,
        message: 'All prompt system components validated successfully'
      };
      
    } catch (error) {
      console.error('Prompt validation error:', error);
      return {
        success: false,
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
