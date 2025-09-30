import React from 'react';
import { useModuleAssessmentData } from '@/hooks/useModuleAssessmentData';
import { useModuleReportCase } from '@/hooks/useModuleReportCase';
import { useMarkdownReport } from '@/hooks/useMarkdownReport';
import { useReportDownloads } from '@/hooks/useReportDownloads';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { ReportHeader } from '@/components/report/ReportHeader';
import { ReportContent } from '@/components/report/ReportContent';
import { LoadingState, NoDataPrompt } from '@/components/report/EmptyStates';
import { ModuleConfig } from '@/types/moduleConfig';

interface BaseReportGeneratorProps {
  config: ModuleConfig;
}

const BaseReportGenerator: React.FC<BaseReportGeneratorProps> = ({ config }) => {
  const { assessmentCases, isLoading } = useModuleAssessmentData(config.moduleType);
  const { currentCase, selectedCaseId, displayableCases, handleSelectCase } = useModuleReportCase(assessmentCases, config.moduleType);
  const { markdownReport, hasAnalysisResult } = useMarkdownReport(currentCase);
  const { handleDownloadRawText, handleDownloadMarkdown, handleDownloadPDF, handleDownloadItemMaster } = useReportDownloads();

  console.log(`=== BaseReportGenerator Render State (${config.moduleType}) ===`);
  console.log('Selected case ID:', selectedCaseId);
  console.log('Current case ID:', currentCase?.id);
  console.log('Current case status:', currentCase?.status);
  console.log('Module type:', config.moduleType);
  console.log('Displayable cases:', displayableCases.length);
  console.log('Markdown report exists:', hasAnalysisResult);
  console.log('Markdown report length:', markdownReport?.length || 0);

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
        <ReportLayout><LoadingState /></ReportLayout>
      </div>
    );
  }

  if (displayableCases.length === 0) {
    return (
      <div>
        <AppNavigation />
        <ReportLayout>
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
        </ReportLayout>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div>
        <AppNavigation />
        <ReportLayout>
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
        </ReportLayout>
      </div>
    );
  }

  return (
    <div>
      <AppNavigation />
      <ReportLayout>
        {/* Show module-specific header for K-12 and Post-Secondary */}
        {config.moduleType !== 'general' && (
          <div className="mb-6">
          </div>
        )}

        <ReportContent
          currentCase={currentCase}
          markdownReport={markdownReport}
          hasAnalysisResult={hasAnalysisResult}
        />

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
      </ReportLayout>
    </div>
  );
};

// Simple layout component to avoid repetition
const ReportLayout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      {children}
    </div>
  );
};

export default BaseReportGenerator;