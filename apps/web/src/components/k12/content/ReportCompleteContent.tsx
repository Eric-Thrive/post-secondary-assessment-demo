/**
 * ReportCompleteContent Component
 *
 * Displays the report completion screen with PDF download option.
 * Shows completion message and provides action to download PDF.
 *
 * Requirements: 12.1
 */

import React from "react";
import { CheckCircle } from "lucide-react";
import PDFDownloadButton from "../PDFDownloadButton";
import type { SectionContentProps } from "../sectionRegistry";

const ReportCompleteContent: React.FC<SectionContentProps> = ({
  theme,
  reportData,
}) => {
  // Get student name from report data
  const studentName = reportData?.caseInfo?.studentName || "Student";

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

      {/* Action Buttons */}
      <div className="flex justify-center w-full max-w-md">
        {/* PDF Download Button */}
        <PDFDownloadButton
          studentName={studentName}
          reportData={reportData}
          theme={theme}
          buttonText="Download PDF"
          className="w-full"
        />
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
