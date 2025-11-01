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

import React, { useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { ThriveReportLayout, ThriveReportSection } from "@/design-system";
import { k12Config, type K12SectionId, getNextSection } from "./k12Config";
import { getSectionContent, type SectionContentProps } from "./sectionRegistry";
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
  caseId,
  onSectionChange,
}) => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] =
    useState<K12SectionId>(initialSection);

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
    <ThriveReportLayout
      config={{
        ...k12Config,
        // Override utility button routes to include caseId if needed
        utilityButtons: k12Config.utilityButtons?.map((button) => ({
          ...button,
          route:
            button.id === "review" && caseId
              ? `/k12-review-edit/${caseId}`
              : button.route,
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
  );
};

export default K12ReportViewer;
