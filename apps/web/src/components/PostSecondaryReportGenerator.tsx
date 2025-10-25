import React from 'react';
import { useModuleAssessmentData } from '@/hooks/useModuleAssessmentData';
import { useModuleReportCase } from '@/hooks/useModuleReportCase';
import { useMarkdownReport } from '@/hooks/useMarkdownReport';
import FigmaEnhancedReportViewer from '@/components/FigmaEnhancedReportViewer';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { LoadingState, NoDataPrompt } from '@/components/report/EmptyStates';
import { MODULE_CONFIGS } from '@/types/moduleConfig';

const PostSecondaryReportGenerator: React.FC = () => {
  const config = MODULE_CONFIGS.post_secondary;
  
  // Fetch assessment data
  const { assessmentCases, isLoading } = useModuleAssessmentData('post_secondary');
  const { currentCase, selectedCaseId, displayableCases, handleSelectCase } = useModuleReportCase(assessmentCases, 'post_secondary');
  const { markdownReport, hasAnalysisResult } = useMarkdownReport(currentCase);

  console.log('=== PostSecondaryReportGenerator Debug ===');
  console.log('Assessment cases count:', assessmentCases.length);
  console.log('Displayable cases count:', displayableCases.length);
  console.log('Is loading:', isLoading);
  console.log('Current case:', currentCase?.id);
  console.log('Has markdown report:', hasAnalysisResult);
  console.log('Markdown report length:', markdownReport?.length || 0);
  console.log('Selected case ID:', selectedCaseId);
  
  // Log why we might be showing empty state
  if (displayableCases.length === 0) {
    console.log('⚠️ SHOWING EMPTY STATE - No displayable cases');
    console.log('Raw assessment cases:', assessmentCases);
  }
  
  // Handle loading state
  if (isLoading) {
    return (
      <div>
        <AppNavigation />
        <div className="container mx-auto px-4 py-8">
          <LoadingState />
        </div>
      </div>
    );
  }

  // Handle no data state
  if (displayableCases.length === 0) {
    return (
      <div>
        <AppNavigation />
        <div className="container mx-auto px-4 py-8">
          <NoDataPrompt 
            title={config.noDataTitle}
            description={config.noDataDescription}
          />
        </div>
      </div>
    );
  }

  // Handle no current case selected
  if (!currentCase) {
    return (
      <div>
        <AppNavigation />
        <div className="container mx-auto px-4 py-8">
          <NoDataPrompt 
            title="No Case Selected" 
            description="Please select an assessment case from the dropdown to view the report."
          />
        </div>
      </div>
    );
  }

  // Render the FigmaEnhancedReportViewer for post-secondary reports
  return (
    <div>
      <AppNavigation />
      <FigmaEnhancedReportViewer
        currentCase={currentCase}
        markdownReport={markdownReport}
        hasAnalysisResult={hasAnalysisResult}
        initialViewMode="figma"
        autoload={true}
      />
    </div>
  );
};

export default PostSecondaryReportGenerator;