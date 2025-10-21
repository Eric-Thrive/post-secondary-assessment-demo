
import { useState, useCallback, useEffect, useRef } from 'react';
import { AssessmentCase } from '@/types/assessmentCase';
import { apiClient } from '@/lib/apiClient';

export const usePostSecondaryAssessmentCases = () => {
  const [assessmentCases, setAssessmentCases] = useState<AssessmentCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitiallyLoaded = useRef(false);

  console.log('=== usePostSecondaryAssessmentCases Hook State ===');
  console.log('Total Post-Secondary cases:', assessmentCases.length);
  console.log('Loading status:', isLoading);
  console.log('Post-Secondary Case IDs:', assessmentCases.map(c => ({ id: c.id, status: c.status, module_type: c.module_type })));

  // Load Post-Secondary cases via API client
  const loadCases = useCallback(async () => {
    try {
      // Only show loading state on initial load, not on refreshes
      if (!hasInitiallyLoaded.current) {
        setIsLoading(true);
      }
      console.log('Loading assessment cases via API client...');
      const postSecondaryCases = await apiClient.getAssessmentCases('post_secondary');
      console.log('Loaded', postSecondaryCases.length, 'cases from API client');
      console.log('Post-Secondary Case details:', postSecondaryCases.map((c: any) => ({ 
        id: c.id, 
        status: c.status, 
        display_name: c.display_name,
        module_type: c.module_type,
        hasAnalysis: !!c.analysis_result 
      })));
      setAssessmentCases(postSecondaryCases);
      hasInitiallyLoaded.current = true;
    } catch (error) {
      console.error('Failed to load Post-Secondary cases via API:', error);
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
    console.log('Adding new Post-Secondary case to state:', newCase.id, 'Module:', newCase.module_type);
    if (newCase.module_type === 'post_secondary') {
      setAssessmentCases(prev => {
        const updated = [...prev, newCase];
        console.log('Updated Post-Secondary cases count:', updated.length);
        return updated;
      });
    }
  }, []);

  const updateCase = useCallback((caseId: string, updates: Partial<AssessmentCase>) => {
    console.log('Updating Post-Secondary case in state:', caseId, 'with updates:', Object.keys(updates));
    setAssessmentCases(prev => {
      const updated = prev.map(c => 
        c.id === caseId ? { ...c, ...updates } : c
      );
      console.log('Post-Secondary Case update result:', updated.find(c => c.id === caseId)?.status);
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
