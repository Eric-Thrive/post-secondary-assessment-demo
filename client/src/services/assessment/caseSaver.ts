
import { apiClient } from '@/lib/apiClient';
import { AssessmentCase } from '@/types/assessmentCase';
import { assessmentCaseStorage } from '../assessmentCaseStorage';
import { idMigrationService } from './idMigration';
import { dataTransformers } from './dataTransformers';
import { loggingService } from './loggingService';

export class CaseSaver {
  async saveCase(assessmentCase: AssessmentCase): Promise<AssessmentCase> {
    try {
      const migratedCase = idMigrationService.migrateOldIdToUUID(assessmentCase);
      
      loggingService.logSaveOperation(migratedCase);
      
      const saveData = dataTransformers.assessmentCaseToDatabaseData(migratedCase);
      loggingService.logSaveData(saveData);

      const data = await apiClient.createAssessmentCase(saveData);

      loggingService.logSaveSuccess(data);
      
      const savedCase = dataTransformers.databaseRowToAssessmentCase(data);
      loggingService.logFinalVerification(savedCase);
      
      return savedCase;
      
    } catch (error) {
      console.error('Failed to save case via API, falling back to localStorage:', error);
      
      const migratedCase = idMigrationService.migrateOldIdToUUID(assessmentCase);
      const allCases = assessmentCaseStorage.load();
      const updatedCases = allCases.filter(c => c.id !== migratedCase.id);
      updatedCases.push(migratedCase);
      assessmentCaseStorage.save(updatedCases);
      
      return migratedCase;
    }
  }
}

export const caseSaver = new CaseSaver();
