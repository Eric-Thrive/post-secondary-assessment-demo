
import { useCallback } from 'react';
import { DocumentFile } from '@/types/assessment';
import { AssessmentCase } from '@/types/assessmentCase';
import { apiClient } from '@/lib/apiClient';

export const useK12AssessmentCreation = (
  addCase: (case_: AssessmentCase) => void,
  setCurrentCase: (case_: AssessmentCase) => void
) => {
  const createAssessment = useCallback(async (documents: DocumentFile[], studentName?: string): Promise<AssessmentCase> => {
    // Generate a proper UUID
    const newCaseId = crypto.randomUUID();
    
    // Use student name if provided, otherwise fallback to document name or timestamp
    const displayName = studentName && studentName.trim().length > 0
      ? studentName.trim()
      : documents.length > 0 
        ? `K-12 Analysis: ${documents[0].name.replace(/\.[^/.]+$/, "")}` 
        : `K-12 Assessment ${new Date().toLocaleDateString()}`;
    
    const newCase: AssessmentCase = {
      id: newCaseId,
      case_id: newCaseId, // Add required case_id field
      display_name: displayName,
      documents,
      created_date: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      status: 'draft',
      module_type: 'k12' // Hard-coded for K-12
    };

    console.log('=== Creating K-12 Assessment Case ===');
    console.log('Case ID (UUID):', newCase.id);
    console.log('Student Name:', studentName || 'not provided');
    console.log('Display Name:', displayName);
    console.log('Module Type:', 'k12');
    console.log('Documents:', documents.length);
    
    try {
      // Save to Database
      const savedCase = await apiClient.createAssessmentCase(newCase);
      
      // Update local state
      addCase(savedCase);
      setCurrentCase(savedCase);
      
      console.log('Successfully created and saved K-12 assessment case with UUID:', savedCase.id, 'Module:', savedCase.module_type);
      return savedCase;
    } catch (error) {
      console.error('Failed to create K-12 assessment case:', error);
      throw error;
    }
  }, [addCase, setCurrentCase]);

  return { createAssessment };
};
