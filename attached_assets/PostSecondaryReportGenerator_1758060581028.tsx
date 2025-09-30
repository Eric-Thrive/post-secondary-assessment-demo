import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useModuleAssessmentData } from '@/hooks/useModuleAssessmentData';
import { useModuleReportCase } from '@/hooks/useModuleReportCase';
import { useMarkdownReport } from '@/hooks/useMarkdownReport';
import { useReportDownloads } from '@/hooks/useReportDownloads';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { ReportHeader } from '@/components/report/ReportHeader';
import FigmaEnhancedReportViewer from '@/components/FigmaEnhancedReportViewer';
import { LoadingState, NoDataPrompt } from '@/components/report/EmptyStates';
import { MODULE_CONFIGS } from '@/types/moduleConfig';

const PostSecondaryReportGenerator: React.FC = () => {
  const config = MODULE_CONFIGS.post_secondary;
  const [searchParams] = useSearchParams();
  const { assessmentCases, isLoading } = useModuleAssessmentData(config.moduleType);
  const { currentCase, selectedCaseId, displayableCases, handleSelectCase } = useModuleReportCase(assessmentCases, config.moduleType);
  const { markdownReport, hasAnalysisResult } = useMarkdownReport(currentCase);
  const { handleDownloadRawText, handleDownloadMarkdown, handleDownloadPDF, handleDownloadItemMaster } = useReportDownloads();

  // Extract URL parameters for demo mode
  const urlCaseId = searchParams.get('case');
  const urlViewMode = searchParams.get('view');
  const urlAutoload = searchParams.get('autoload') === 'true';

  // Auto-select case based on URL parameter
  useEffect(() => {
    if (urlCaseId && displayableCases.length > 0) {
      const targetCase = displayableCases.find(c => c.id === urlCaseId);
      if (targetCase && selectedCaseId !== urlCaseId) {
        console.log('Auto-selecting case from URL:', urlCaseId);
        handleSelectCase(urlCaseId);
      }
    }
  }, [urlCaseId, displayableCases, selectedCaseId, handleSelectCase]);

  console.log(`=== PostSecondaryReportGenerator (Figma Enhanced) ===`);
  console.log('Selected case ID:', selectedCaseId);
  console.log('Current case ID:', currentCase?.id);
  console.log('Has analysis result:', hasAnalysisResult);
  console.log('URL Parameters:', { urlCaseId, urlViewMode, urlAutoload });

  const onDownloadRawText = () => handleDownloadRawText(currentCase);
  const onDownloadMarkdown = () => handleDownloadMarkdown(markdownReport, currentCase);
  const onDownloadPDF = () => handleDownloadPDF(markdownReport);
  const onDownloadItemMaster = config.features.itemMasterExport 
    ? (format: 'csv' | 'json' | 'markdown') => handleDownloadItemMaster(currentCase, format)
    : undefined;

  if (isLoading) {
    return (
      <div>
        <AppNavigation />
        <div className="max-w-6xl mx-auto p-6">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (displayableCases.length === 0) {
    return (
      <div>
        <AppNavigation />
        <div className="max-w-6xl mx-auto p-6">
          <div className="mt-8">
            <NoDataPrompt 
              title={config.noDataTitle}
              description={config.noDataDescription}
            />
          </div>
          <div className="mt-8 border-t pt-4">
            <ReportHeader
              selectedCaseId=""
              displayableCases={[]}
              onSelectCase={() => {}}
              onDownloadReport={() => {}}
              onDownloadMarkdown={() => {}}
              onDownloadRawText={() => {}}
              hasAnalysisResult={false}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div>
        <AppNavigation />
        <div className="max-w-6xl mx-auto p-6">
          <div className="mt-8">
            <NoDataPrompt 
              title={config.noCaseSelectedTitle}
              description={config.noCaseSelectedDescription}
            />
          </div>
          <div className="mt-8 border-t pt-4">
            <ReportHeader
              selectedCaseId={selectedCaseId}
              displayableCases={displayableCases}
              onSelectCase={handleSelectCase}
              onDownloadReport={onDownloadPDF}
              onDownloadMarkdown={onDownloadMarkdown}
              onDownloadRawText={onDownloadRawText}
              onDownloadItemMaster={onDownloadItemMaster}
              hasAnalysisResult={false}
            />
          </div>
        </div>
      </div>
    );
  }

  // Check if this is a demo link (should hide header and navigation)
  const isDemoLink = urlAutoload && urlViewMode === 'figma';

  return (
    <div className={isDemoLink ? "w-full" : ""}>
      {!isDemoLink && <AppNavigation />}
      <div className={isDemoLink ? "w-full" : "max-w-6xl mx-auto"}>
        {/* Header removed - clean interface for enhanced view only */}

        {/* Figma-Enhanced Report Viewer */}
        <FigmaEnhancedReportViewer
          currentCase={currentCase}
          markdownReport={markdownReport}
          hasAnalysisResult={hasAnalysisResult}
          initialViewMode={urlViewMode as 'standard' | 'figma' | undefined}
          autoload={urlAutoload}
        >
          {/* Report Header with download options */}
          <div className="mt-8 border-t pt-4">
            <ReportHeader
              selectedCaseId={selectedCaseId}
              displayableCases={displayableCases}
              onSelectCase={handleSelectCase}
              onDownloadReport={onDownloadPDF}
              onDownloadMarkdown={onDownloadMarkdown}
              onDownloadRawText={onDownloadRawText}
              onDownloadItemMaster={onDownloadItemMaster}
              hasAnalysisResult={hasAnalysisResult}
            />
          </div>
        </FigmaEnhancedReportViewer>
      </div>
    </div>
  );
};

export default PostSecondaryReportGenerator;