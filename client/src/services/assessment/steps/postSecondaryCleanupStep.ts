import { PostSecondaryCleanupService } from '@/services/postSecondaryCleanupService';

export class PostSecondaryCleanupStep {
  static async execute(): Promise<void> {
    console.log('=== STEP 0: Post-Secondary Lookup Table Cleanup ===');
    console.log('Clearing post-secondary lookup tables before analysis...');
    
    // Get current counts for logging
    const beforeCounts = await PostSecondaryCleanupService.getPostSecondaryLookupTableCounts();
    console.log('Table counts before cleanup:', beforeCounts);
    
    // Perform the cleanup
    await PostSecondaryCleanupService.clearPostSecondaryLookupTables();
    
    // Verify cleanup
    const afterCounts = await PostSecondaryCleanupService.getPostSecondaryLookupTableCounts();
    console.log('Table counts after cleanup:', afterCounts);
    console.log('✅ Post-secondary lookup table cleanup completed');
  }
}