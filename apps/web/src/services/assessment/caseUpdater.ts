
import { apiClient } from '@/lib/apiClient';
import { AssessmentCase } from '@/types/assessmentCase';
import { assessmentCaseStorage } from '../assessmentCaseStorage';
import { loggingService } from './loggingService';

export class CaseUpdater {
  async updateCaseStatus(caseId: string, status: AssessmentCase['status'], analysisResult?: any): Promise<void> {
    try {
      loggingService.logUpdateOperation(caseId, status, analysisResult);
      
      const updateData: any = {
        status,
        last_updated: new Date().toISOString()
      };
      
      if (analysisResult) {
        // Enhanced validation for large analysis results
        console.log('=== DATABASE UPDATE VALIDATION ===');
        console.log('Analysis result type:', typeof analysisResult);
        console.log('Analysis result keys:', Object.keys(analysisResult));
        
        if (analysisResult.markdown_report) {
          const markdownLength = analysisResult.markdown_report.length;
          console.log('Markdown report length for database:', markdownLength.toLocaleString());
          
          // Test JSON serialization before database storage
          try {
            const testSerialization = JSON.stringify(analysisResult);
            console.log('JSON serialization size:', testSerialization.length.toLocaleString(), 'bytes');
            
            const testParsed = JSON.parse(testSerialization);
            const parsedMarkdownLength = testParsed.markdown_report?.length || 0;
            
            if (parsedMarkdownLength !== markdownLength) {
              console.error('🚨 JSON CORRUPTION DETECTED BEFORE DATABASE STORAGE!');
              console.error('Original markdown length:', markdownLength);
              console.error('After JSON round-trip:', parsedMarkdownLength);
              throw new Error('Analysis result cannot be properly serialized for database storage');
            }
            
            console.log('✅ JSON serialization validation passed');
            
          } catch (serializationError) {
            console.error('❌ JSON serialization failed:', serializationError);
            throw new Error('Failed to serialize analysis result for database storage');
          }
        }
        
        updateData.analysis_result = analysisResult;
        loggingService.logUpdateData(updateData);
      }
      
      await apiClient.updateAssessmentCase(caseId, updateData);

      console.log('=== API UPDATE SUCCESS ===');
      console.log('Successfully updated case status via API');
      
      // Post-update verification for analysis results
      if (analysisResult && analysisResult.markdown_report) {
        await this.verifyStoredData(caseId, analysisResult);
      }
      
    } catch (error) {
      console.error('Failed to update case status via API, falling back to localStorage:', error);
      
      const allCases = assessmentCaseStorage.load();
      const updatedCases = allCases.map(c => {
        if (c.id === caseId) {
          const updated = {
            ...c,
            status,
            last_updated: new Date().toISOString()
          };
          if (analysisResult) {
            updated.analysis_result = analysisResult;
          }
          return updated;
        }
        return c;
      });
      assessmentCaseStorage.save(updatedCases);
    }
  }

  private async verifyStoredData(caseId: string, analysisResult: any): Promise<void> {
    console.log('=== POST-UPDATE VERIFICATION ===');
    
    try {
      const verificationData = await apiClient.getAssessmentCase(caseId);
      
      // Type guard to check if analysis_result is an object with markdown_report
      const storedAnalysisResult = verificationData?.analysis_result;
      let storedMarkdownLength = 0;
      
      if (storedAnalysisResult && 
          typeof storedAnalysisResult === 'object' && 
          storedAnalysisResult !== null &&
          'markdown_report' in storedAnalysisResult) {
        const markdownReport = (storedAnalysisResult as any).markdown_report;
        storedMarkdownLength = typeof markdownReport === 'string' ? markdownReport.length : 0;
      }
      
      const originalMarkdownLength = analysisResult.markdown_report.length;
      
      console.log('Original markdown length:', originalMarkdownLength.toLocaleString());
      console.log('Stored markdown length:', storedMarkdownLength.toLocaleString());
      
      if (storedMarkdownLength !== originalMarkdownLength) {
        console.error('🚨 DATABASE STORAGE TRUNCATED MARKDOWN!');
        console.error('Lost characters:', originalMarkdownLength - storedMarkdownLength);
        console.error('Truncation percentage:', ((originalMarkdownLength - storedMarkdownLength) / originalMarkdownLength * 100).toFixed(2) + '%');
      } else {
        console.log('✅ Database storage preserved full markdown report');
      }
    } catch (verificationError) {
      console.error('❌ Post-update verification failed:', verificationError);
    }
  }

  async updateCaseDocuments(caseId: string, documents: any[]): Promise<void> {
    console.log('=== Updating case documents via API ===');
    console.log('Case ID:', caseId);
    console.log('Documents to save:', documents.length);

    try {
      await apiClient.updateAssessmentCase(caseId, { 
        documents: documents,
        last_updated: new Date().toISOString()
      });

      console.log('✅ Case documents updated successfully via API');
    } catch (error) {
      console.error('❌ Error updating case documents:', error);
      throw error;
    }
  }
}

export const caseUpdater = new CaseUpdater();
