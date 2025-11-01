/**
 * ReportCompleteContent Component
 *
 * Displays the report completion screen with PDF download and navigation options.
 * Shows completion message and provides actions to download PDF or return to cover.
 *
 * Requirements: 12.1, 12.5
 */

import React from "react";
import { Home, CheckCircle } from "lucide-react";
import PDFDownloadButton from "../PDFDownloadButton";
import type { SectionContentProps } from "../sectionRegistry";

const ReportCompleteContent: React.FC<SectionContentProps> = ({
  theme,
  reportData,
}) => {
  // Get student name from report data
  const studentName = reportData?.caseInfo?.studentName || "Student";

  /**
   * Handle navigation back to cover (Case Information section)
   */
  const handleBackToCover = () => {
    // Navigate to the first section (case-info)
    window.location.hash = "#case-info";
  };

  return (
    <div
      className="p-8 flex flex-col items-center justify-center min-h-[600px]"
      style={{
        fontFamily: theme.typography.fontFamilies.primary,
      }}
    >
      {/* Success Icon */}
      <div
        className="mb-8 rounded-full flex items-center justify-center"
        style={{
          width: theme.dimensions.iconHuge,
          height: theme.dimensions.iconHuge,
          backgroundColor: `${theme.colors.success}20`,
        }}
      >
        <CheckCircle
          className="w-16 h-16"
          style={{ color: theme.colors.success }}
        />
      </div>

      {/* Completion Message */}
      <h2
        className="text-center mb-4"
        style={{
          fontSize: theme.typography.fontSizes.h2,
          fontWeight: theme.typography.fontWeights.bold,
          color: theme.colors.gray900,
        }}
      >
        Report Complete!
      </h2>

      <p
        className="text-center mb-8 max-w-2xl"
        style={{
          fontSize: theme.typography.fontSizes.bodyLarge,
          color: theme.colors.gray700,
          lineHeight: theme.typography.lineHeights.relaxed,
        }}
      >
        You've reviewed all sections of the Teacher Guide for {studentName}.
        Download a PDF copy for your records or return to the beginning to
        review any section.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        {/* PDF Download Button */}
        <div className="flex-1">
          <PDFDownloadButton
            studentName={studentName}
            reportData={reportData}
            theme={theme}
            buttonText="Download PDF"
            className="w-full"
          />
        </div>

        {/* Back to Cover Button */}
        <button
          onClick={handleBackToCover}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            backgroundColor: theme.colors.white,
            color: theme.colors.primary,
            border: `2px solid ${theme.colors.primary}`,
            fontFamily: theme.typography.fontFamilies.primary,
            fontSize: theme.typography.fontSizes.body,
            fontWeight: theme.typography.fontWeights.semibold,
            boxShadow: theme.shadows.sm,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = theme.shadows.md;
            e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = theme.shadows.sm;
            e.currentTarget.style.backgroundColor = theme.colors.white;
          }}
          aria-label="Back to Cover"
          role="button"
          tabIndex={0}
        >
          <Home className="w-5 h-5" />
          <span>Back to Cover</span>
        </button>
      </div>

      {/* Additional Information */}
      <div
        className="mt-12 p-6 rounded-lg max-w-2xl"
        style={{
          backgroundColor: `${theme.colors.info}10`,
          border: `1px solid ${theme.colors.info}30`,
        }}
      >
        <p
          style={{
            fontSize: theme.typography.fontSizes.small,
            color: theme.colors.gray700,
            lineHeight: theme.typography.lineHeights.normal,
            textAlign: "center",
          }}
        >
          <strong>Note:</strong> The PDF will include all sections of this
          Teacher Guide in a printer-friendly format. You can also access this
          report anytime from your dashboard.
        </p>
      </div>
    </div>
  );
};

export default ReportCompleteContent;
