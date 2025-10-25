// @ts-nocheck

import { apiClient } from '@/lib/apiClient';
import { AssessmentCase } from '@/types/assessmentCase';
import { idMigrationService } from './idMigration';

export class MigrationService {
  async migrateCasesToDatabase(cases: AssessmentCase[]): Promise<void> {
    try {
      console.log('Migrating', cases.length, 'cases from localStorage to Database...');
      
      const migratedCases = cases.map(c => idMigrationService.migrateOldIdToUUID(c));
      
      const { error } = await database
        .from('assessment_cases')
        .upsert(migratedCases.map(c => ({
          id: c.id,
          student_info: c.student_info as any,
          documents: c.documents as any,
          analysis_result: c.analysis_result as any,
          created_date: c.created_date,
          last_updated: c.last_updated,
          status: c.status
        })));

      if (error) {
        console.error('Error migrating cases to Database:', error);
        throw error;
      }

      console.log('Successfully migrated all cases to Database with proper UUIDs');
      
      localStorage.removeItem('assessment_cases');
      console.log('Cleared localStorage after successful migration');
      
    } catch (error) {
      console.error('Migration failed, keeping localStorage data:', error);
      throw error;
    }
  }
}

export const migrationService = new MigrationService();
