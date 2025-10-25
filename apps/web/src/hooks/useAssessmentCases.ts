
import { useState, useCallback, useEffect, useRef } from 'react';
import { AssessmentCase } from '@/types/assessmentCase';
import { apiClient } from '@/lib/apiClient';

export const useAssessmentCases = () => {
  const [assessmentCases, setAssessmentCases] = useState<AssessmentCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitiallyLoaded = useRef(false);

  console.log('=== useAssessmentCases Hook State ===');
  console.log('Total cases:', assessmentCases.length);
  console.log('Loading status:', isLoading);
  console.log('Case IDs:', assessmentCases.map(c => ({ id: c.id, status: c.status })));

  // Load cases from Database on mount - uses 'general' module type for backward compatibility
  const loadCases = useCallback(async () => {
    try {
      // Only show loading state on initial load, not on refreshes
      if (!hasInitiallyLoaded.current) {
        setIsLoading(true);
      }
      console.log('Loading general assessment cases from Database...');
      // Use 'general' module type for backward compatibility
      const cases = await apiClient.getAssessmentCases('general');
      console.log('Loaded', cases.length, 'general cases from Database');
      console.log('Case details:', cases.map((c: any) => ({ 
        id: c.id, 
        status: c.status, 
        display_name: c.display_name,
        hasAnalysis: !!c.analysis_result 
      })));
      setAssessmentCases(cases);
      hasInitiallyLoaded.current = true;
    } catch (error) {
      console.error('Failed to load general cases:', error);
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
    console.log('Adding new case to state:', newCase.id);
    setAssessmentCases(prev => {
      const updated = [...prev, newCase];
      console.log('Updated cases count:', updated.length);
      return updated;
    });
  }, []);

  const updateCase = useCallback((caseId: string, updates: Partial<AssessmentCase>) => {
    console.log('Updating case in state:', caseId, 'with updates:', Object.keys(updates));
    setAssessmentCases(prev => {
      const updated = prev.map(c => 
        c.id === caseId ? { ...c, ...updates } : c
      );
      console.log('Case update result:', updated.find(c => c.id === caseId)?.status);
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
