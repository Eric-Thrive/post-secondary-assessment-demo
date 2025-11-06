/**
 * K12ReportViewer Component
 *
 * Main component for displaying K-12 Teacher Guide reports.
 * Uses the design system layout components and config-driven section rendering.
 *
 * Features:
 * - Config-driven section navigation
 * - Lazy-loaded section content components
 * - Section state management
 * - Integration with design system layout components
 * - Responsive design
 * - Full keyboard navigation support
 */

import React, { useState, Suspense, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { ThriveReportLayout, ThriveReportSection } from "@/design-system";
import { k12Config, type K12SectionId, getNextSection } from "./k12Config";
import { getSectionContent, type SectionContentProps } from "./sectionRegistry";
import { K12MarkdownExportService } from "@/services/k12MarkdownExportService";
import K12CompactPrintReport from "./K12CompactPrintReport";
import { Loader2 } from "lucide-react";

/**
 * Props for K12ReportViewer
 */
export interface K12ReportViewerProps {
  /**
   * Initial section to display (defaults to "case-info")
   */
  initialSection?: K12SectionId;

  /**
   * Report data to display
   * Will be properly typed when content components are implemented
   */
  reportData?: any;

  /**
   * Original markdown report for printing
   */
  originalMarkdown?: string;

  /**
   * Case ID for the current report
   */
  caseId?: string;

  /**
   * Callback when section changes
   */
  onSectionChange?: (sectionId: K12SectionId) => void;
}

/**
 * Loading fallback component
 */
const LoadingFallback: React.FC = () => (
  <div
    className="flex items-center justify-center min-h-screen"
    style={{
      fontFamily: k12Config.theme.typography.fontFamilies.primary,
    }}
  >
    <div className="flex flex-col items-center gap-4">
      <Loader2
        className="animate-spin"
        size={48}
        style={{ color: k12Config.theme.colors.primary }}
      />
      <p
        style={{
          fontSize: k12Config.theme.typography.fontSizes.bodyLarge,
          color: k12Config.theme.colors.gray600,
        }}
      >
        Loading section...
      </p>
    </div>
  </div>
);

/**
 * K12ReportViewer Component
 */
const K12ReportViewer: React.FC<K12ReportViewerProps> = ({
  initialSection = "case-info",
  reportData,
  originalMarkdown,
  caseId,
  onSectionChange,
}) => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] =
    useState<K12SectionId>(initialSection);
  const compactPrintRef = useRef<HTMLDivElement>(null);
  const [showDebugMenu, setShowDebugMenu] = useState(false);
  const debugMenuRef = useRef<HTMLDivElement>(null);

  /**
   * Handle section navigation
   */
  const handleSectionChange = (sectionId: string) => {
    const newSection = sectionId as K12SectionId;
    setCurrentSection(newSection);

    // Call optional callback
    if (onSectionChange) {
      onSectionChange(newSection);
    }

    // Update URL hash for deep linking (optional)
    window.location.hash = newSection;
  };

  /**
   * Handle "Next Section" button click
   */
  const handleNext = () => {
    const nextSection = getNextSection(currentSection);
    if (nextSection) {
      handleSectionChange(nextSection);
    }
  };

  /**
   * Handle compact print button click
   */
  const handleCompactPrint = useReactToPrint({
    contentRef: compactPrintRef,
    documentTitle: `Teacher_Guide_${
      reportData?.caseInfo?.studentName || "Student"
    }_${new Date().toISOString().split("T")[0]}`,
    pageStyle: `
      @page {
        size: letter;
        margin: 0.5in;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  /**
   * Handle markdown print button click (for development)
   */
  const handleMarkdownPrint = () => {
    if (originalMarkdown) {
      K12MarkdownExportService.printOriginalMarkdown(
        originalMarkdown,
        reportData?.caseInfo?.studentName || "Student"
      );
    } else {
      console.warn("No original markdown available for printing");
    }
  };

  /**
   * Handle copy markdown to clipboard (for development)
   */
  const handleCopyMarkdown = async () => {
    if (originalMarkdown) {
      try {
        await navigator.clipboard.writeText(originalMarkdown);
        alert("Raw markdown copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy markdown:", err);
        alert("Failed to copy markdown to clipboard");
      }
    } else {
      console.warn("No original markdown available for copying");
    }
  };

  /**
   * Handle console log markdown (for development)
   */
  const handleConsoleLogMarkdown = () => {
    if (originalMarkdown) {
      console.log("=== RAW MARKDOWN START ===");
      console.log(originalMarkdown);
      console.log("=== RAW MARKDOWN END ===");
      console.log("Markdown length:", originalMarkdown.length);
      alert("Raw markdown logged to console (check DevTools)");
    } else {
      console.warn("No original markdown available for logging");
    }
  };

  /**
   * Close debug menu when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        debugMenuRef.current &&
        !debugMenuRef.current.contains(event.target as Node)
      ) {
        setShowDebugMenu(false);
      }
    };

    if (showDebugMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDebugMenu]);

  /**
   * Handle utility button clicks
   */
  const handleUtilityButtonClick = (route: string) => {
    // If route includes caseId placeholder, replace it
    const finalRoute = route.replace(":caseId", caseId || "");
    navigate(finalRoute);
  };

  /**
   * Get the current section configuration
   */
  const currentSectionConfig = k12Config.sections.find(
    (section) => section.id === currentSection
  );

  /**
   * Get the content component for the current section
   */
  const ContentComponent = getSectionContent(currentSection);

  return (
    <>
      {/* Debug Button - Bottom Right */}
      {originalMarkdown && (
        <div ref={debugMenuRef} className="fixed bottom-4 right-4 z-50">
          {/* Dropdown Menu */}
          {showDebugMenu && (
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px]">
              <button
                onClick={() => {
                  handleMarkdownPrint();
                  setShowDebugMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print Markdown
              </button>
              <button
                onClick={() => {
                  handleCopyMarkdown();
                  setShowDebugMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy to Clipboard
              </button>
              <button
                onClick={() => {
                  handleConsoleLogMarkdown();
                  setShowDebugMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Log to Console
              </button>
            </div>
          )}

          {/* Main Button */}
          <button
            onClick={() => setShowDebugMenu(!showDebugMenu)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            title="Debug: View Raw Markdown"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            <span className="text-sm font-medium">Raw Markdown</span>
          </button>
        </div>
      )}

      <ThriveReportLayout
        config={{
          ...k12Config,
          // Override utility button routes and add click handlers
          utilityButtons: k12Config.utilityButtons?.map((button) => ({
            ...button,
            route:
              button.id === "review" && caseId
                ? `/k12-review-edit/${caseId}`
                : button.route,
            onClick: button.id === "print" ? handleCompactPrint : undefined,
          })),
        }}
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
        theme={k12Config.theme}
      >
        {currentSectionConfig && ContentComponent ? (
          <ThriveReportSection
            section={currentSectionConfig}
            isActive={true}
            theme={k12Config.theme}
          >
            <Suspense fallback={<LoadingFallback />}>
              <ContentComponent
                theme={k12Config.theme}
                onNext={handleNext}
                reportData={reportData}
              />
            </Suspense>
          </ThriveReportSection>
        ) : (
          <div
            className="flex items-center justify-center min-h-screen"
            style={{
              fontFamily: k12Config.theme.typography.fontFamilies.primary,
            }}
          >
            <div className="text-center">
              <h2
                style={{
                  fontSize: k12Config.theme.typography.fontSizes.h2,
                  fontWeight: k12Config.theme.typography.fontWeights.bold,
                  color: k12Config.theme.colors.gray900,
                  marginBottom: k12Config.theme.spacing.md,
                }}
              >
                Section Not Found
              </h2>
              <p
                style={{
                  fontSize: k12Config.theme.typography.fontSizes.body,
                  color: k12Config.theme.colors.gray600,
                }}
              >
                The requested section could not be found.
              </p>
              <button
                onClick={() => handleSectionChange("case-info")}
                className="mt-6 px-6 py-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: k12Config.theme.colors.primary,
                  color: k12Config.theme.colors.white,
                  fontSize: k12Config.theme.typography.fontSizes.body,
                  fontWeight: k12Config.theme.typography.fontWeights.medium,
                }}
              >
                Go to Case Information
              </button>
            </div>
          </div>
        )}
      </ThriveReportLayout>

      {/* Hidden Compact Print Component */}
      {reportData && (
        <div
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
          }}
          aria-hidden="true"
        >
          <K12CompactPrintReport
            ref={compactPrintRef}
            reportData={reportData}
            studentName={reportData.caseInfo?.studentName}
          />
        </div>
      )}
    </>
  );
};

export default K12ReportViewer;
