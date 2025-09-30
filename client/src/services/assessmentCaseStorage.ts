
import { AssessmentCase } from '@/types/assessmentCase';

const STORAGE_KEY = 'assessment_cases';

export const assessmentCaseStorage = {
  load: (): AssessmentCase[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const cases = JSON.parse(stored);
        console.log('Loaded assessment cases from localStorage:', cases.length, 'cases found');
        cases.forEach((case_: AssessmentCase) => {
          console.log(`- Case ${case_.id}: ${case_.display_name} (${case_.status})`);
        });
        return cases;
      }
    } catch (error) {
      console.error('Failed to load assessment cases from localStorage:', error);
    }
    console.log('No assessment cases found in localStorage');
    return [];
  },

  save: (cases: AssessmentCase[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
      console.log('Saved assessment cases to localStorage:', cases.length, 'cases');
    } catch (error) {
      console.error('Failed to save assessment cases to localStorage:', error);
    }
  }
};
