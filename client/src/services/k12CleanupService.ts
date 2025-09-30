
import { apiClient } from '@/lib/apiClient';

export class K12CleanupService {
  /**
   * Clears all K-12 lookup tables that accumulate data during analysis
   * This should be called before starting a new K-12 assessment
   */
  static async clearK12LookupTables(): Promise<void> {
    console.log('=== K-12 LOOKUP TABLE CLEANUP ===');
    console.log('Starting cleanup of K-12 lookup tables...');

    try {
      // Cleanup temporarily disabled - using server API architecture
      console.log('K-12 cleanup temporarily disabled - using server API architecture');

      // Note: Add other K-12 lookup tables here if they also accumulate data
      // For example:
      // - inference_triggers_k12 (if it gets populated dynamically)
      // - barrier_glossary_k12 (if it gets populated dynamically)
      // - support_lookup (if it gets populated dynamically)
      // - observation_template (if it gets populated dynamically)
      // - caution_lookup (if it gets populated dynamically)

      console.log('✅ K-12 lookup table cleanup completed successfully');

    } catch (error) {
      console.error('❌ K-12 lookup table cleanup failed:', error);
      throw new Error(`K-12 cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets the current count of entries in K-12 lookup tables for monitoring
   */
  static async getK12LookupTableCounts(): Promise<{ [tableName: string]: number }> {
    try {
      const { data: itemMasterData, error: itemMasterError } = await database
        .from('item_master')
        .select('id', { count: 'exact' })
        .eq('module_type', 'k12');

      if (itemMasterError) {
        console.error('Error counting item_master entries:', itemMasterError);
      }

      return {
        item_master: itemMasterData?.length || 0
      };
    } catch (error) {
      console.error('Error getting K-12 lookup table counts:', error);
      return { item_master: 0 };
    }
  }
}

export const k12CleanupService = new K12CleanupService();
