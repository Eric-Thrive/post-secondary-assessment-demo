
import { apiClient } from '@/lib/apiClient';
import { AssessmentCase } from '@/types/assessmentCase';
import { assessmentCaseStorage } from '../assessmentCaseStorage';
import { dataTransformers } from './dataTransformers';

export class CaseLoader {
  async loadCases(): Promise<AssessmentCase[]> {
    try {
      console.log('Loading assessment cases via API...');
      
      // Get K-12, post-secondary, and tutoring cases
      const [k12Cases, postSecondaryCases, tutoringCases] = await Promise.all([
        apiClient.getAssessmentCases('k12'),
        apiClient.getAssessmentCases('post_secondary'),
        apiClient.getAssessmentCases('tutoring')
      ]);

      const allCases = [...k12Cases, ...postSecondaryCases, ...tutoringCases];
      console.log('Loaded', allCases.length, 'cases from API');
      
      const cases: AssessmentCase[] = allCases.map(row => 
        dataTransformers.databaseRowToAssessmentCase(row)
      );
      
      return cases;
      
    } catch (error) {
      console.error('Failed to load cases from API, checking localStorage...', error);
      
      const localCases = assessmentCaseStorage.load();
      if (localCases.length > 0) {
        console.log('Found', localCases.length, 'cases in localStorage');
        return localCases;
      }
      
      return [];
    }
  }
}

export const caseLoader = new CaseLoader();
