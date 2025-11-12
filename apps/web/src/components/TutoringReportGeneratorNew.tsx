/**
 * TutoringReportGenerator Component
 *
 * Main component for displaying Tutoring assessment reports using the enhanced
 * TutoringReportViewer. Provides modern section-based navigation with improved
 * formatting and user experience.
 */

import React, { useMemo, useState, useEffect } from "react";
import TutoringReportViewer from "@/components/tutoring/TutoringReportViewer";
import {
  parseTutoringReportSimple,
  type TutoringReportData,
} from "@/utils/tutoringReportParserSimple";
import BaseReportGenerator from "@/components/BaseReportGenerator";
import { MODULE_CONFIGS } from "@/types/moduleConfig";
import { useModuleAssessmentData } from "@/hooks/useModuleAssessmentData";
import { useModuleReportCase } from "@/hooks/useModuleReportCase";
import { useMarkdownReport } from "@/hooks/useMarkdownReport";
import { AppNavigation } from "@/components/shared/AppNavigation";
import { Loader2 } from "lucide-react";

const ErrorDisplay: React.FC<{
  error: string;
  onRetry?: () => void;
  showRetry?: boolean;
}> = ({ error, onRetry, showRetry = true }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
      <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Report Display Error
      </h3>
      <p className="text-gray-600 mb-4">{error}</p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

const LoadingDisplay: React.FC<{
  message?: string;
}> = ({ message = "Loading report..." }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center">
      <Loader2 className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
      <p className="text-gray-700 font-medium">{message}</p>
    </div>
  </div>
);

const TutoringReportGenerator: React.FC = () => {
  const config = MODULE_CONFIGS.tutoring;
  const { assessmentCases, isLoading } = useModuleAssessmentData("tutoring");
  const { currentCase, selectedCaseId, displayableCases } = useModuleReportCase(
    assessmentCases,
    "tutoring"
  );
  const { markdownReport, hasAnalysisResult } = useMarkdownReport(currentCase);

  const PARSER_VERSION = "tutoring-v1";
  const [parsedDataCache, setParsedDataCache] = useState<{
    caseId: string;
    markdownHash: string;
    parserVersion: string;
    data: TutoringReportData;
  } | null>(null);
  const [errorState, setErrorState] = useState<{
    hasError: boolean;
    errorMessage: string;
  }>({
    hasError: false,
    errorMessage: "",
  });
  const [retryCount, setRetryCount] = useState(0);

  const hashMarkdown = (markdown: string): string => {
    let hash = 0;
    for (let i = 0; i < markdown.length; i++) {
      const char = markdown.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setErrorState({
      hasError: false,
      errorMessage: "",
    });
    setParsedDataCache(null);
  };

  const parsedData = useMemo(() => {
    setErrorState({
      hasError: false,
      errorMessage: "",
    });

    if (isLoading) {
      return null;
    }

    if (displayableCases.length === 0) {
      setErrorState({
        hasError: true,
        errorMessage:
          "No assessment cases are available. Please create an assessment first.",
      });
      return null;
    }

    if (!currentCase) {
      setErrorState({
        hasError: true,
        errorMessage:
          "No case is currently selected. Please select a case to view the report.",
      });
      return null;
    }

    if (!hasAnalysisResult) {
      setErrorState({
        hasError: true,
        errorMessage:
          "This case does not have analysis results yet. Please complete the assessment first.",
      });
      return null;
    }

    if (!markdownReport || markdownReport.trim().length === 0) {
      setErrorState({
        hasError: true,
        errorMessage:
          "The report content is not available. The analysis may still be processing.",
      });
      return null;
    }

    const currentCaseId = currentCase.case_id || currentCase.id;
    const markdownHash = hashMarkdown(markdownReport);

    if (
      parsedDataCache &&
      parsedDataCache.caseId === currentCaseId &&
      parsedDataCache.markdownHash === markdownHash &&
      parsedDataCache.parserVersion === PARSER_VERSION &&
      retryCount === 0
    ) {
      return parsedDataCache.data;
    }

    try {
      const parsed = parseTutoringReportSimple(markdownReport);

      if (!parsed || !parsed.caseInfo) {
        throw new Error("Parser returned invalid data");
      }

      setParsedDataCache({
        caseId: currentCaseId,
        markdownHash,
        parserVersion: PARSER_VERSION,
        data: parsed,
      });

      return parsed;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ Failed to parse Tutoring report:", errorMessage);

      setErrorState({
        hasError: true,
        errorMessage: "There was an error processing the report content.",
      });

      return null;
    }
  }, [
    isLoading,
    displayableCases.length,
    currentCase,
    hasAnalysisResult,
    markdownReport,
    parsedDataCache,
    retryCount,
  ]);

  useEffect(() => {
    const currentCaseId = currentCase?.case_id || currentCase?.id;
    if (parsedDataCache && parsedDataCache.caseId !== currentCaseId) {
      setParsedDataCache(null);
      setErrorState({
        hasError: false,
        errorMessage: "",
      });
      setRetryCount(0);
    }
  }, [currentCase, parsedDataCache]);

  if (isLoading) {
    return <LoadingDisplay message="Loading assessment cases..." />;
  }

  if (errorState.hasError) {
    return (
      <ErrorDisplay
        error={errorState.errorMessage}
        onRetry={handleRetry}
        showRetry={retryCount < 3}
      />
    );
  }

  if (!parsedData) {
    return <BaseReportGenerator config={config} />;
  }

  return (
    <div>
      <AppNavigation />
      <TutoringReportViewer
        reportData={parsedData}
        originalMarkdown={markdownReport || undefined}
        caseId={currentCase?.case_id || currentCase?.id || ""}
        initialSection="case-info"
      />
    </div>
  );
};

export default TutoringReportGenerator;
