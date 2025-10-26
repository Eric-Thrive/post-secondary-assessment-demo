import React from "react";
import { useModuleAssessmentData } from "@/hooks/useModuleAssessmentData";
import { useModuleReportCase } from "@/hooks/useModuleReportCase";
import { useMarkdownReport } from "@/hooks/useMarkdownReport";
import { useEnhancedReportDownloads } from "@/hooks/useEnhancedReportDownloads";
import { useReportSharing } from "@/hooks/useReportSharing";
import { UnifiedReportViewer } from "@/components/shared/UnifiedReportViewer";
import { ShareReportModal } from "@/components/report/ShareReportModal";
import { LoadingState, NoDataPrompt } from "@/components/report/EmptyStates";
import { MODULE_CONFIGS } from "@/types/moduleConfig";

const TutoringReportGenerator: React.FC = () => {
  const config = MODULE_CONFIGS.tutoring;

  // Fetch assessment data
  const { assessmentCases, isLoading } = useModuleAssessmentData("tutoring");
  const { currentCase, selectedCaseId, displayableCases, handleSelectCase } =
    useModuleReportCase(assessmentCases, "tutoring");
  const { markdownReport, hasAnalysisResult } = useMarkdownReport(currentCase);
  const { handleDownloadRawText, handleDownloadMarkdown, handleDownloadPDF } =
    useEnhancedReportDownloads();

  // Sharing functionality
  const sharing = useReportSharing(
    currentCase?.case_id,
    currentCase?.is_shared,
    currentCase?.share_token || undefined
  );

  console.log("=== TutoringReportGenerator Debug ===");
  console.log("Assessment cases count:", assessmentCases.length);
  console.log("Displayable cases count:", displayableCases.length);
  console.log("Is loading:", isLoading);
  console.log("Current case:", currentCase?.id);
  console.log("Has markdown report:", hasAnalysisResult);
  console.log("Markdown report length:", markdownReport?.length || 0);
  console.log("Selected case ID:", selectedCaseId);

  // Download handlers
  const onDownloadRawText = () => handleDownloadRawText(currentCase);
  const onDownloadMarkdown = () =>
    handleDownloadMarkdown(markdownReport, currentCase);
  const onDownloadPDF = () => handleDownloadPDF(markdownReport, currentCase);

  // Sharing handlers
  const handleEnableSharing = () => {
    const caseId = currentCase?.case_id || currentCase?.id;
    console.log("🔗 Enabling sharing for case:", caseId);
    if (caseId) {
      sharing.enableSharing(caseId);
    } else {
      console.error("❌ No case ID available for sharing");
    }
  };

  const handleDisableSharing = () => {
    const caseId = currentCase?.case_id || currentCase?.id;
    console.log("🔗 Disabling sharing for case:", caseId);
    if (caseId) {
      sharing.disableSharing(caseId);
    } else {
      console.error("❌ No case ID available for sharing");
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState />
      </div>
    );
  }

  // Handle no data state
  if (displayableCases.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <NoDataPrompt
          title={config.noDataTitle}
          description={config.noDataDescription}
        />
      </div>
    );
  }

  // Handle no current case selected
  if (!currentCase) {
    return (
      <div className="container mx-auto px-4 py-8">
        <NoDataPrompt
          title="No Case Selected"
          description="Please select an assessment case from the dropdown to view the report."
        />
      </div>
    );
  }

  // Determine the current case display name
  const currentCaseDisplayName =
    currentCase?.display_name || "Tutoring Assessment Report";

  // Render the UnifiedReportViewer for tutoring reports
  return (
    <>
      <UnifiedReportViewer
        currentCase={currentCase}
        markdownReport={markdownReport}
        hasAnalysisResult={hasAnalysisResult}
        onDownloadPDF={onDownloadPDF}
        onDownloadMarkdown={onDownloadMarkdown}
        onDownloadRawText={onDownloadRawText}
        onShareReport={sharing.openShareModal}
        isShared={sharing.isShared}
        availableCases={assessmentCases}
      />

      <ShareReportModal
        isOpen={sharing.isShareModalOpen}
        onClose={sharing.closeShareModal}
        onEnableSharing={handleEnableSharing}
        onDisableSharing={handleDisableSharing}
        onCopyUrl={sharing.copyShareUrl}
        shareUrl={sharing.shareUrl}
        isSharing={sharing.isSharing}
        isShared={sharing.isShared}
        reportTitle={currentCaseDisplayName}
      />
    </>
  );
};

export default TutoringReportGenerator;
