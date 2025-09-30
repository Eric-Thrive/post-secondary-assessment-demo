
import { AssessmentCase } from '@/types/assessmentCase';
import { caseLoader } from './caseLoader';

export class CaseSubscriber {
  private intervalId: NodeJS.Timeout | null = null;

  subscribeToChanges(callback: (cases: AssessmentCase[]) => void) {
    // Since we no longer have real-time subscriptions, we'll use polling
    this.intervalId = setInterval(async () => {
      try {
        const cases = await caseLoader.loadCases();
        callback(cases);
      } catch (error) {
        console.error('Error polling for case changes:', error);
      }
    }, 30000); // Poll every 30 seconds

    // Return an unsubscribe function
    return {
      unsubscribe: () => {
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
      }
    };
  }
}

export const caseSubscriber = new CaseSubscriber();
