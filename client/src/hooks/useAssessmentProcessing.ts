
import { useState, useCallback } from 'react';
import { AssessmentCase } from '@/types/assessmentCase';
import { ProcessingSteps } from '@/services/assessment/processingSteps';

export const useAssessmentProcessing = (
  updateCase: (caseId: string, updates: Partial<AssessmentCase>) => void,
  currentCase: AssessmentCase | null,
  setCurrentCase: (case_: AssessmentCase) => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processAssessment = useCallback(async (
    assessmentCase: AssessmentCase, 
    documentFiles: FileList, 
    studentGrade?: string,
    studentName?: string
  ) => {
    console.log('=== STARTING ASSESSMENT PROCESSING ===');
    console.log('Assessment case module type:', assessmentCase.module_type);
    console.log('Student grade:', studentGrade || 'not specified');
    console.log('Student name:', studentName || 'not specified');
    console.log('Document files to process:', documentFiles.length);
    
    setIsProcessing(true);

    try {
      // Store original document count for cleanup audit
      const originalDocumentCount = documentFiles.length;

      // Step 0: Clean up lookup tables based on module type (with fallback)
      try {
        if (assessmentCase.module_type === 'k12') {
          await ProcessingSteps.cleanupK12LookupTables();
        } else if (assessmentCase.module_type === 'post_secondary') {
          await ProcessingSteps.cleanupPostSecondaryLookupTables();
        }
      } catch (cleanupError) {
        console.warn('⚠️ Lookup table cleanup failed, continuing with analysis:', cleanupError);
        // Continue processing - cleanup failure shouldn't stop the analysis
      }

      // Step 1: Update case status to processing
      await ProcessingSteps.updateCaseToProcessing(assessmentCase, updateCase);

      // Step 2: Process documents
      const processedDocs = await ProcessingSteps.processDocuments(documentFiles);

      // Step 3: Run AI analysis with the correct module type from the case
      console.log('Calling AI analysis with module type:', assessmentCase.module_type);
      const analysisResult = await ProcessingSteps.runAIAnalysis(
        processedDocs, 
        assessmentCase.module_type, // Use the module type from the case
        studentGrade,
        studentName
      );

      // Step 4: Update case with results and cleanup documents
      const finalCase = await ProcessingSteps.updateCaseWithResults(
        assessmentCase,
        analysisResult,
        updateCase,
        currentCase,
        setCurrentCase,
        originalDocumentCount
      );

      console.log('✅ Assessment processing completed successfully');
      console.log('Final case module type:', finalCase.module_type);
      console.log('Documents cleaned up:', finalCase.documents.length === 0);
      
      return finalCase;

    } catch (error) {
      console.error('❌ Assessment processing failed:', error);
      await ProcessingSteps.updateCaseWithResults(
        assessmentCase,
        {
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error occurred',
          analysis_date: new Date().toISOString(),
          markdown_report: `# Analysis Failed\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`
        },
        updateCase,
        currentCase,
        setCurrentCase
      );
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [updateCase, currentCase, setCurrentCase]);

  return {
    isProcessing,
    processAssessment
  };
};
