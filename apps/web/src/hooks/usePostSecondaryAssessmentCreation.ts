
import { useCallback } from 'react';
import { DocumentFile } from '@/types/assessment';
import { AssessmentCase } from '@/types/assessmentCase';
import { apiClient } from '@/lib/apiClient';

export const usePostSecondaryAssessmentCreation = (
  addCase: (case_: AssessmentCase) => void,
  setCurrentCase: (case_: AssessmentCase) => void,
  moduleType: 'post_secondary' | 'tutoring' | 'k12' | 'general' = 'post_secondary'
) => {
  const createAssessment = useCallback(async (documents: DocumentFile[], studentName?: string): Promise<AssessmentCase> => {
    console.log(`🚀 ASSESSMENT CREATION DEBUG - ${moduleType.toUpperCase()} MODULE 🚀`);
    console.log('='.repeat(80));
    console.log('✅ Student Name:', studentName || 'not provided');
    console.log('✅ Student Name Type:', typeof studentName);
    console.log('✅ Student Name Length:', studentName?.length || 0);
    
    // Generate a proper UUID
    const newCaseId = crypto.randomUUID();
    console.log('✅ Generated UUID:', newCaseId);
    
    // Generate display name from document names or timestamp based on module type
    const moduleDisplayName = moduleType === 'tutoring' ? 'Tutoring' : 
                              moduleType === 'k12' ? 'K-12' : 
                              moduleType === 'general' ? 'General' : 'Post-Secondary';
    console.log('✅ Module Display Name:', moduleDisplayName);
    
    // Use student name if provided, otherwise fallback to document name or timestamp
    console.log('🔍 DISPLAY NAME LOGIC DEBUG:');
    console.log('  - studentName value:', studentName);
    console.log('  - studentName truthy:', !!studentName);
    console.log('  - studentName length:', studentName?.length);
    
    const displayName = studentName && studentName.trim().length > 0
      ? studentName.trim()
      : documents.length > 0 
        ? `${moduleDisplayName} Analysis: ${documents[0].name.replace(/\.[^/.]+$/, "")}` 
        : `${moduleDisplayName} Assessment ${new Date().toLocaleDateString()}`;
    console.log('✅ Generated Display Name:', displayName);
    console.log('✅ Documents Array Length:', documents.length);
    console.log('✅ Documents Array Contents:', documents);
    
    const newCase: AssessmentCase = {
      id: newCaseId,
      case_id: newCaseId, // Add the required case_id field
      display_name: displayName,
      documents,
      created_date: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      status: 'draft',
      module_type: moduleType // Use the provided module type
    };

    console.log(`🔥 FINAL CASE OBJECT (${moduleDisplayName}):`, JSON.stringify(newCase, null, 2));
    console.log('📊 Case validation:');
    console.log('  - Has ID:', !!newCase.id);
    console.log('  - Has display_name:', !!newCase.display_name);
    console.log('  - Has module_type:', !!newCase.module_type);
    console.log('  - Module type value:', newCase.module_type);
    console.log('  - Documents count:', newCase.documents.length);
    
    try {
      console.log('💾 ATTEMPTING TO SAVE TO DATABASE...');
      console.log('Using apiClient.createAssessmentCase()');
      
      // Save to database
      const savedCase = await apiClient.createAssessmentCase(newCase);
      
      console.log('🎉 DATABASE SAVE SUCCESS!');
      console.log('✅ Saved case ID:', savedCase.id);
      console.log('✅ Saved case module:', savedCase.module_type);
      console.log('✅ Saved case status:', savedCase.status);
      console.log('✅ Saved case display_name:', savedCase.display_name);
      
      // Update local state
      console.log('🔄 UPDATING LOCAL STATE...');
      addCase(savedCase);
      setCurrentCase(savedCase);
      console.log('✅ Local state updated successfully');
      
      console.log(`🚀 ${moduleDisplayName.toUpperCase()} ASSESSMENT CASE CREATION COMPLETED SUCCESSFULLY! 🚀`);
      console.log('='.repeat(80));
      return savedCase;
    } catch (error) {
      console.log('💥 DATABASE SAVE FAILED!');
      console.error(`❌ Failed to create ${moduleDisplayName} assessment case:`, error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      console.log('='.repeat(80));
      throw error;
    }
  }, [addCase, setCurrentCase]);

  return { createAssessment };
};
