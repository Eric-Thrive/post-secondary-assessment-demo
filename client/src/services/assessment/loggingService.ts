
export class LoggingService {
  logSaveOperation(assessmentCase: any) {
    console.log('=== SAVING CASE TO DATABASE (v4.0 - MARKDOWN ONLY) ===');
    console.log('Case ID:', assessmentCase.id);
    console.log('Case status:', assessmentCase.status);
    console.log('Has analysis_result:', !!assessmentCase.analysis_result);
    
    if (assessmentCase.analysis_result) {
      console.log('Analysis result status:', assessmentCase.analysis_result.status);
      console.log('MARKDOWN TRACKING - Has markdown_report:', !!assessmentCase.analysis_result.markdown_report);
      console.log('MARKDOWN TRACKING - Markdown length:', assessmentCase.analysis_result.markdown_report?.length || 0);
      
      if (assessmentCase.analysis_result.markdown_report) {
        console.log('MARKDOWN TRACKING - Preview:', assessmentCase.analysis_result.markdown_report.substring(0, 200));
      } else {
        console.error('CRITICAL ERROR - No markdown_report in analysis_result!');
      }
    }
  }

  logSaveData(saveData: any) {
    console.log('=== DATABASE SAVE DATA (v4.0 - MARKDOWN ONLY) ===');
    console.log('Save data keys:', Object.keys(saveData));
    
    if (saveData.analysis_result) {
      console.log('SAVE DATA - Analysis status:', saveData.analysis_result.status);
      console.log('SAVE DATA - Has markdown_report:', !!saveData.analysis_result.markdown_report);
      console.log('SAVE DATA - Markdown length:', saveData.analysis_result.markdown_report?.length || 0);
      
      if (saveData.analysis_result.markdown_report) {
        console.log('SAVE DATA - Markdown preview:', saveData.analysis_result.markdown_report.substring(0, 200));
      } else {
        console.error('CRITICAL ERROR - No markdown_report in save data!');
      }
    }
  }

  logSaveSuccess(data: any) {
    console.log('=== DATABASE SAVE SUCCESS (v4.0 - MARKDOWN ONLY) ===');
    console.log('Successfully saved case:', data.id);
    
    if (data.analysis_result) {
      console.log('SUCCESS - Saved analysis_result has markdown_report:', !!data.analysis_result.markdown_report);
      console.log('SUCCESS - Saved markdown length:', data.analysis_result.markdown_report?.length || 0);
      
      if (data.analysis_result.markdown_report) {
        console.log('SUCCESS - Saved markdown preview:', data.analysis_result.markdown_report.substring(0, 200));
      } else {
        console.error('CRITICAL ERROR - Markdown report NOT saved to database!');
      }
    } else {
      console.error('CRITICAL ERROR - No analysis_result in saved data!');
    }
  }

  logFinalVerification(savedCase: any) {
    console.log('=== FINAL VERIFICATION (v4.0 - MARKDOWN ONLY) ===');
    
    if (savedCase.analysis_result) {
      console.log('FINAL - Has markdown_report:', !!savedCase.analysis_result.markdown_report);
      console.log('FINAL - Markdown length:', savedCase.analysis_result.markdown_report?.length || 0);
      
      if (savedCase.analysis_result.markdown_report) {
        console.log('SUCCESS - Final markdown preview:', savedCase.analysis_result.markdown_report.substring(0, 200));
      } else {
        console.error('FINAL ERROR - No markdown report in final saved case!');
      }
    } else {
      console.error('FINAL ERROR - No analysis_result in final saved case!');
    }
  }

  logUpdateOperation(caseId: string, status: string, analysisResult?: any) {
    console.log('=== UPDATING CASE (v4.0 - MARKDOWN ONLY) ===');
    console.log('Case ID:', caseId);
    console.log('New status:', status);
    console.log('Has analysis result:', !!analysisResult);
    
    if (analysisResult) {
      console.log('UPDATE - Analysis status:', analysisResult.status);
      console.log('UPDATE - Has markdown_report:', !!analysisResult.markdown_report);
      console.log('UPDATE - Markdown length:', analysisResult.markdown_report?.length || 0);
      
      if (analysisResult.markdown_report) {
        console.log('UPDATE - Markdown preview:', analysisResult.markdown_report.substring(0, 200));
      } else {
        console.error('UPDATE ERROR - No markdown_report in analysis result!');
      }
    }
  }

  logUpdateData(updateData: any) {
    console.log('=== UPDATE DATA PREPARED (v4.0 - MARKDOWN ONLY) ===');
    console.log('Update data keys:', Object.keys(updateData));
    
    if (updateData.analysis_result) {
      console.log('UPDATE DATA - Has markdown_report:', !!updateData.analysis_result.markdown_report);
      console.log('UPDATE DATA - Markdown length:', updateData.analysis_result.markdown_report?.length || 0);
      
      if (updateData.analysis_result.markdown_report) {
        console.log('UPDATE DATA - Markdown preview:', updateData.analysis_result.markdown_report.substring(0, 200));
      } else {
        console.error('UPDATE DATA ERROR - No markdown_report!');
      }
    }
  }
}

export const loggingService = new LoggingService();
