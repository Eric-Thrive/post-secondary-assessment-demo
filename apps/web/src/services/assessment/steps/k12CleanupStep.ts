
import { K12CleanupService } from '@/services/k12CleanupService';

export class K12CleanupStep {
  static async execute(): Promise<void> {
    console.log('=== STEP 0: K-12 Lookup Table Cleanup ===');
    console.log('Clearing K-12 lookup tables before analysis...');
    
    // Get current counts for logging
    const beforeCounts = await K12CleanupService.getK12LookupTableCounts();
    console.log('Table counts before cleanup:', beforeCounts);
    
    // Perform the cleanup
    await K12CleanupService.clearK12LookupTables();
    
    // Verify cleanup
    const afterCounts = await K12CleanupService.getK12LookupTableCounts();
    console.log('Table counts after cleanup:', afterCounts);
    console.log('✅ K-12 lookup table cleanup completed');
  }
}
