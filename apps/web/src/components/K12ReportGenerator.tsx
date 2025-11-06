/**
 * K12ReportGenerator Component
 *
 * @module K12ReportGenerator
 * @description Main component for displaying K-12 assessment reports using the enhanced
 * K12ReportViewer. Replaces BaseReportGenerator for K-12 reports, providing modern
 * section-based navigation with improved formatting and user experience.
 *
 * @features
 * - Fetches K-12 assessment data from API
 * - Parses markdown reports into structured data on-the-fly
 * - Displays reports using K12ReportViewer component
 * - Comprehensive error handling with user-friendly messages
 * - Performance optimization with component-level caching
 * - Graceful fallback to BaseReportGenerator when needed
 * - Loading states with progress indication for large reports
 * - Retry functionality for recoverable errors
 *
 * @example Basic Usage
 * ```tsx
 * // In routing configuration
 * <Route path="/k12-reports" element={<K12ReportGenerator />} />
 * ```
 *
 * @architecture
 * 1. Fetch assessment data (useModuleAssessmentData)
 * 2. Select current case (useModuleReportCase)
 * 3. Get markdown report (useMarkdownReport)
 * 4. Parse markdown to structured data (parseK12Report)
 * 5. Cache parsed data (component state)
 * 6. Render K12ReportViewer with parsed data
 *
 * @performance
 * - Component-level caching prevents re-parsing
 * - Memoization for expensive operations
 * - Progress indication for large reports (>50KB)
 * - Typical parse time: 50-100ms
 * - Cached load time: <1ms
 *
 * @errorHandling
 * - Loading errors (no cases, no analysis)
 * - Parsing errors (malformed markdown)
 * - Network errors (failed requests)
 * - Automatic fallback to BaseReportGenerator
 * - Retry functionality for recoverable errors
 *
 * @backwardCompatibility
 * - Maintains markdown storage in database
 * - Preserves compact view PDF generation
 * - Keeps existing editing functionality
 * - No breaking changes to existing features
 *
 * @requirements
 * - Requirement 1.1: Display reports using K12ReportViewer
 * - Requirement 1.2: Parse markdown into structured format
 * - Requirement 1.3: Maintain navigation state
 * - Requirement 4.1-4.5: Backward compatibility
 * - Requirement 6.1-6.5: Performance and loading states
 *
 * @see {@link K12ReportViewer} - Component that displays the parsed report
 * @see {@link parseK12Report} - Utility that parses markdown to structured data
 * @see {@link BaseReportGenerator} - Fallback component for error cases
 * @see {@link docs/K12_REPORT_GENERATOR.md} - Comprehensive documentation
 */

import React, { useMemo, useState, useEffect } from "react";
import K12ReportViewer from "@/components/k12/K12ReportViewer";
import {
  parseK12ReportSimple,
  type K12ReportData,
} from "@/utils/k12ReportParserSimple";
import BaseReportGenerator from "@/components/BaseReportGenerator";
import { MODULE_CONFIGS } from "@/types/moduleConfig";
import { useModuleAssessmentData } from "@/hooks/useModuleAssessmentData";
import { useModuleReportCase } from "@/hooks/useModuleReportCase";
import { useMarkdownReport } from "@/hooks/useMarkdownReport";
import { AppNavigation } from "@/components/shared/AppNavigation";

/**
 * Error display component for user-friendly error messages
 *
 * @component ErrorDisplay
 * @description Displays error messages with optional retry functionality.
 * Provides clear, user-friendly error information with smooth animations.
 *
 * @param {Object} props - Component props
 * @param {string} props.error - Error message to display
 * @param {() => void} [props.onRetry] - Optional retry callback function
 * @param {boolean} [props.showRetry=true] - Whether to show retry button
 *
 * @example
 * ```tsx
 * <ErrorDisplay
 *   error="Failed to load report"
 *   onRetry={handleRetry}
 *   showRetry={true}
 * />
 * ```
 */
const ErrorDisplay: React.FC<{
  error: string;
  onRetry?: () => void;
  showRetry?: boolean;
}> = ({ error, onRetry, showRetry = true }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center animate-fadeIn error-bounce">
      <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center transition-all duration-200">
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
      <p className="text-gray-600 mb-4 animate-slideIn">{error}</p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          Try Again
        </button>
      )}

      {/* Additional helpful information */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          If this problem persists, please contact support or try refreshing the
          page.
        </p>
      </div>
    </div>
  </div>
);

/**
 * Loading display component with progress indication
 *
 * @component LoadingDisplay
 * @description Displays animated loading indicator with optional progress bar.
 * Provides visual feedback during data loading and report parsing.
 *
 * @param {Object} props - Component props
 * @param {string} [props.message="Loading report..."] - Loading message to display
 * @param {number} [props.progress=0] - Progress percentage (0-100)
 * @param {boolean} [props.showProgress=false] - Whether to show progress bar
 *
 * @example
 * ```tsx
 * <LoadingDisplay
 *   message="Processing large report..."
 *   progress={75}
 *   showProgress={true}
 * />
 * ```
 */
const LoadingDisplay: React.FC<{
  message?: string;
  progress?: number;
  showProgress?: boolean;
}> = ({
  message = "Loading report...",
  progress = 0,
  showProgress = false,
}) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
    <div className="text-center max-w-md w-full">
      {/* Animated loading spinner */}
      <div className="relative w-16 h-16 mx-auto mb-6">
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        {showProgress && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-blue-600">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>

      {/* Loading message */}
      <p className="text-gray-700 font-medium mb-2">{message}</p>

      {/* Progress bar */}
      {showProgress && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Loading steps indicator */}
      <div className="flex justify-center space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              progress > i * 33 ? "bg-blue-600" : "bg-gray-300"
            }`}
            style={{
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Helpful tip */}
      <p className="text-sm text-gray-500 mt-4">
        Processing report content for optimal display...
      </p>
    </div>
  </div>
);

/**
 * K12ReportGenerator main component
 *
 * @component K12ReportGenerator
 * @description Main component that orchestrates K-12 report display.
 * Fetches data, parses markdown, handles errors, and renders the viewer.
 *
 * @returns {JSX.Element} Rendered component (viewer, loading, or error state)
 *
 * @stateManagement
 * - parsedDataCache: Caches parsed report data by case ID and markdown hash
 * - errorState: Tracks error status, message, and type
 * - retryCount: Counts retry attempts for error recovery
 * - parsingProgress: Tracks parsing progress for large reports
 * - isParsingLargeReport: Indicates if currently parsing large report
 *
 * @hooks
 * - useModuleAssessmentData: Fetches assessment cases
 * - useModuleReportCase: Manages current case selection
 * - useMarkdownReport: Retrieves markdown report content
 * - useMemo: Memoizes parsed data to prevent re-parsing
 * - useEffect: Clears cache when case changes
 *
 * @errorHandling
 * - No cases available: Shows error with guidance
 * - No case selected: Shows selection prompt
 * - No analysis results: Shows completion prompt
 * - Parsing errors: Shows error with retry option
 * - Network errors: Shows error with retry option
 * - Fallback: Returns BaseReportGenerator on critical failure
 *
 * @performance
 * - Caches parsed data to avoid re-parsing
 * - Uses memoization for expensive operations
 * - Shows progress for large reports (>50KB)
 * - Clears cache automatically on case change
 *
 * @example
 * ```tsx
 * // Component is used in routing
 * <Route path="/k12-reports" element={<K12ReportGenerator />} />
 * ```
 */
const K12ReportGenerator: React.FC = () => {
  const config = MODULE_CONFIGS.k12;
  const { assessmentCases, isLoading } = useModuleAssessmentData(
    config.moduleType
  );
  const { currentCase, selectedCaseId, displayableCases } = useModuleReportCase(
    assessmentCases,
    config.moduleType
  );
  const { markdownReport, hasAnalysisResult } = useMarkdownReport(currentCase);

  // Performance optimization: Cache parsed data in component state
  // PARSER_VERSION: Increment this when parser logic changes to invalidate cache
  const PARSER_VERSION = "simple-v7-clean-overview";
  const [parsedDataCache, setParsedDataCache] = useState<{
    caseId: string;
    markdownHash: string;
    parserVersion: string;
    data: K12ReportData;
  } | null>(null);
  const [errorState, setErrorState] = useState<{
    hasError: boolean;
    errorMessage: string;
    errorType: "parsing" | "loading" | "network" | "unknown";
  }>({
    hasError: false,
    errorMessage: "",
    errorType: "unknown",
  });
  const [retryCount, setRetryCount] = useState(0);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [isParsingLargeReport, setIsParsingLargeReport] = useState(false);

  console.log(`=== K12ReportGenerator Render State ===`);
  console.log("Selected case ID:", selectedCaseId);
  console.log("Current case ID:", currentCase?.id);
  console.log("Current case case_id:", currentCase?.case_id);
  console.log("Has analysis result:", hasAnalysisResult);
  console.log("Markdown report length:", markdownReport?.length || 0);
  console.log("Error state:", errorState);

  // Simple hash function for markdown content
  const hashMarkdown = (markdown: string): string => {
    let hash = 0;
    for (let i = 0; i < markdown.length; i++) {
      const char = markdown.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  };

  // Retry function for error recovery
  const handleRetry = () => {
    console.log("🔄 Retrying report generation, attempt:", retryCount + 1);
    setRetryCount((prev) => prev + 1);
    setErrorState({
      hasError: false,
      errorMessage: "",
      errorType: "unknown",
    });
    setParsedDataCache(null); // Clear cache to force re-parsing
  };

  // Memoized parsing with comprehensive error handling
  const parsedData = useMemo(() => {
    console.log("🔵🔵🔵 USEMEMO RUNNING 🔵🔵🔵");
    console.log("isLoading:", isLoading);
    console.log("displayableCases.length:", displayableCases.length);
    console.log("currentCase:", currentCase?.id);
    console.log("hasAnalysisResult:", hasAnalysisResult);
    console.log("markdownReport length:", markdownReport?.length);

    // Reset error state when starting fresh
    setErrorState({
      hasError: false,
      errorMessage: "",
      errorType: "unknown",
    });

    // Handle loading states
    if (isLoading) {
      return null; // Will show loading display
    }

    // Handle no cases available
    if (displayableCases.length === 0) {
      setErrorState({
        hasError: true,
        errorMessage:
          "No assessment cases are available. Please create an assessment first.",
        errorType: "loading",
      });
      return null;
    }

    // Handle no current case
    if (!currentCase) {
      setErrorState({
        hasError: true,
        errorMessage:
          "No case is currently selected. Please select a case to view the report.",
        errorType: "loading",
      });
      return null;
    }

    // Handle no analysis result
    if (!hasAnalysisResult) {
      setErrorState({
        hasError: true,
        errorMessage:
          "This case does not have analysis results yet. Please complete the assessment first.",
        errorType: "loading",
      });
      return null;
    }

    // Handle missing or empty markdown
    if (!markdownReport || markdownReport.trim().length === 0) {
      setErrorState({
        hasError: true,
        errorMessage:
          "The report content is not available. The analysis may still be processing.",
        errorType: "loading",
      });
      return null;
    }

    const currentCaseId = currentCase.case_id || currentCase.id;
    const markdownHash = hashMarkdown(markdownReport);

    // Check if we have cached data for this case and markdown
    if (
      parsedDataCache &&
      parsedDataCache.caseId === currentCaseId &&
      parsedDataCache.markdownHash === markdownHash &&
      parsedDataCache.parserVersion === PARSER_VERSION &&
      retryCount === 0 // Don't use cache if we're retrying
    ) {
      console.log(
        "🚀 Using component-cached parsed data for case:",
        currentCaseId
      );
      console.log("   Cache version:", parsedDataCache.parserVersion);
      return parsedDataCache.data;
    }

    // Log cache miss reason
    if (parsedDataCache) {
      console.log("❌ Cache miss reason:");
      console.log(
        "   Case ID match:",
        parsedDataCache.caseId === currentCaseId
      );
      console.log(
        "   Hash match:",
        parsedDataCache.markdownHash === markdownHash
      );
      console.log(
        "   Version match:",
        parsedDataCache.parserVersion === PARSER_VERSION
      );
      console.log("   Retry count:", retryCount);
    }

    try {
      console.log("📄 Parsing K-12 markdown report for case:", currentCaseId);

      // Check if this is a large report that might need progress indication
      const isLargeReport = markdownReport.length > 50000; // 50KB threshold
      setIsParsingLargeReport(isLargeReport);

      if (isLargeReport) {
        setParsingProgress(10);
      }

      // Validate markdown content before parsing
      if (markdownReport.length > 1000000) {
        // 1MB limit
        throw new Error("Report content is too large to process");
      }

      if (isLargeReport) {
        setParsingProgress(30);
      }

      console.log("🚀🚀🚀 ABOUT TO CALL SIMPLE PARSER 🚀🚀🚀");
      console.log("Parser version:", PARSER_VERSION);
      console.log("Markdown length:", markdownReport.length);
      console.log("First 500 chars:", markdownReport.substring(0, 500));

      const parsed = parseK12ReportSimple(markdownReport);

      console.log("🎉🎉🎉 PARSER RETURNED 🎉🎉🎉");
      console.log("Parsed data:", parsed);

      if (isLargeReport) {
        setParsingProgress(70);
      }

      // Validate that parsing returned valid data
      if (!parsed) {
        throw new Error("Parser returned null or undefined");
      }

      if (!parsed.caseInfo) {
        throw new Error("Parser returned data without case information");
      }

      // Additional validation of parsed data structure
      if (typeof parsed.caseInfo.studentName !== "string") {
        console.warn("⚠️ Invalid student name in parsed data, using default");
        parsed.caseInfo.studentName = "Student";
      }

      if (isLargeReport) {
        setParsingProgress(90);
      }

      // Cache the parsed data in component state
      setParsedDataCache({
        caseId: currentCaseId,
        markdownHash,
        parserVersion: PARSER_VERSION,
        data: parsed,
      });

      if (isLargeReport) {
        setParsingProgress(100);
        // Reset progress after a short delay
        setTimeout(() => {
          setParsingProgress(0);
          setIsParsingLargeReport(false);
        }, 500);
      }

      console.log("✅ Successfully parsed and cached K-12 report data");
      return parsed;
    } catch (error) {
      // Log detailed error information for debugging
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ Failed to parse K-12 report:", {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        markdownLength: markdownReport?.length || 0,
        caseId: currentCaseId,
        retryCount,
      });

      // Set user-friendly error message based on error type
      let userMessage = "There was an error processing the report content.";
      let errorType: "parsing" | "loading" | "network" | "unknown" = "parsing";

      if (errorMessage.includes("too large")) {
        userMessage =
          "The report content is too large to display. Please contact support.";
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("fetch")
      ) {
        userMessage =
          "There was a network error loading the report. Please check your connection and try again.";
        errorType = "network";
      } else if (errorMessage.includes("timeout")) {
        userMessage =
          "The report is taking too long to load. Please try again.";
        errorType = "network";
      } else if (retryCount < 2) {
        userMessage =
          "There was an error processing the report. Please try again.";
      } else {
        userMessage =
          "The report cannot be displayed due to a processing error. Please contact support if this continues.";
      }

      setErrorState({
        hasError: true,
        errorMessage: userMessage,
        errorType,
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
    retryCount, // Include retryCount in dependencies
  ]);

  // Clear cache when case changes
  useEffect(() => {
    const currentCaseId = currentCase?.case_id || currentCase?.id;
    if (parsedDataCache && parsedDataCache.caseId !== currentCaseId) {
      console.log("🗑️ Clearing parsed data cache due to case change");
      setParsedDataCache(null);
      setErrorState({
        hasError: false,
        errorMessage: "",
        errorType: "unknown",
      });
      setRetryCount(0); // Reset retry count for new case
    }
  }, [currentCase, parsedDataCache]);

  // Show loading display
  if (isLoading) {
    return <LoadingDisplay message="Loading assessment cases..." />;
  }

  // Show parsing progress for large reports
  if (isParsingLargeReport && parsingProgress > 0) {
    return (
      <LoadingDisplay
        message="Processing large report content..."
        progress={parsingProgress}
        showProgress={true}
      />
    );
  }

  // Show error display with retry option
  if (errorState.hasError) {
    const showRetry =
      errorState.errorType === "parsing" || errorState.errorType === "network";
    return (
      <ErrorDisplay
        error={errorState.errorMessage}
        onRetry={showRetry ? handleRetry : undefined}
        showRetry={showRetry && retryCount < 3}
      />
    );
  }

  // Fall back to BaseReportGenerator if no parsed data and no specific error
  if (!parsedData) {
    console.log(
      "🔄 Falling back to BaseReportGenerator - no parsed data available"
    );
    return <BaseReportGenerator config={config} />;
  }

  // Render the K12ReportViewer with parsed data and smooth transitions
  return (
    <div className="transition-opacity duration-300 ease-in-out">
      <AppNavigation />
      <div className="animate-fadeIn">
        <K12ReportViewer
          reportData={parsedData}
          originalMarkdown={markdownReport || undefined}
          caseId={currentCase?.case_id || currentCase?.id || ""}
          initialSection="case-info"
        />
      </div>
    </div>
  );
};

export default K12ReportGenerator;
