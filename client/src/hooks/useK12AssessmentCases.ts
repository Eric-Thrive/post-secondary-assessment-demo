
import { useState, useCallback, useEffect } from 'react';
import { AssessmentCase } from '@/types/assessmentCase';
import { apiClient } from '@/lib/apiClient';

export const useK12AssessmentCases = () => {
  const [assessmentCases, setAssessmentCases] = useState<AssessmentCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  console.log('=== useK12AssessmentCases Hook State ===');
  console.log('Total K-12 cases:', assessmentCases.length);
  console.log('Loading status:', isLoading);
  console.log('K-12 Case IDs:', assessmentCases.map(c => ({ id: c.id, status: c.status, module_type: c.module_type })));

  // Load K-12 cases via API client
  const loadCases = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Loading assessment cases via API client...');
      const k12Cases = await apiClient.getAssessmentCases('k12');
      console.log('Loaded', k12Cases.length, 'cases from API client');
      console.log('K-12 Case details:', k12Cases.map((c: any) => ({ 
        id: c.id, 
        status: c.status, 
        display_name: c.display_name,
        module_type: c.module_type,
        hasAnalysis: !!c.analysis_result 
      })));
      setAssessmentCases(k12Cases);
    } catch (error) {
      console.error('Failed to load K-12 cases via API:', error);
      setAssessmentCases([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const updateCases = useCallback((updater: (cases: AssessmentCase[]) => AssessmentCase[]) => {
    setAssessmentCases(updater);
  }, []);

  const addCase = useCallback((newCase: AssessmentCase) => {
    console.log('Adding new K-12 case to state:', newCase.id, 'Module:', newCase.module_type);
    if (newCase.module_type === 'k12') {
      setAssessmentCases(prev => {
        const updated = [...prev, newCase];
        console.log('Updated K-12 cases count:', updated.length);
        return updated;
      });
    }
  }, []);

  const updateCase = useCallback((caseId: string, updates: Partial<AssessmentCase>) => {
    console.log('Updating K-12 case in state:', caseId, 'with updates:', Object.keys(updates));
    setAssessmentCases(prev => {
      const updated = prev.map(c => 
        c.id === caseId ? { ...c, ...updates } : c
      );
      console.log('K-12 Case update result:', updated.find(c => c.id === caseId)?.status);
      return updated;
    });
  }, []);

  return {
    assessmentCases,
    isLoading,
    loadCases,
    updateCases,
    addCase,
    updateCase
  };
};
