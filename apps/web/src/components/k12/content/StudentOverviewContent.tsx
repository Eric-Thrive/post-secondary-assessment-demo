/**
 * StudentOverviewContent Component
 *
 * Displays student overview as a simple paragraph on a white card.
 * No accordion, no "At a Glance" label, just clean text.
 */

import React from "react";
import BottomNavigation from "@/design-system/components/navigation/BottomNavigation";
import type { SectionContentProps } from "../sectionRegistry";
import type { StudentOverview } from "@/design-system/components/types";

const StudentOverviewContent: React.FC<SectionContentProps> = ({
  theme,
  onNext,
  reportData,
}) => {
  // Extract student overview from reportData or use sample data
  const studentOverview: StudentOverview = reportData?.studentOverview || {
    atAGlance:
      "Sarah is a bright, creative 2nd grader who thrives when given visual supports and time to process information. She excels in verbal expression and shows strong problem-solving skills when tasks are broken into manageable steps. Sarah benefits from a structured environment with clear expectations and opportunities for movement breaks.",
    sections: [],
  };

  return (
    <div
      className="p-8"
      style={{
        fontFamily: theme.typography.fontFamilies.primary,
      }}
    >
      {/* Index card shaped white card with overview text */}
      <div
        style={{
          backgroundColor: theme.colors.white,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.xl,
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          maxWidth: "600px", // 5 units
          minHeight: "360px", // 3 units (3:5 ratio)
          aspectRatio: "5 / 3", // Index card proportions
          margin: "0 auto", // Center the card
          display: "flex",
          alignItems: "center", // Center content vertically
        }}
      >
        <p
          style={{
            fontSize: theme.typography.fontSizes.bodyLarge,
            lineHeight: theme.typography.lineHeights.relaxed,
            color: theme.colors.gray700,
            margin: 0, // Remove default paragraph margins
            textAlign: "left", // Left-justify the text
          }}
        >
          {studentOverview.atAGlance}
        </p>
      </div>

      {/* Bottom Navigation */}
      {onNext && (
        <BottomNavigation
          nextLabel="Next Section"
          onNext={onNext}
          theme={theme}
        />
      )}
    </div>
  );
};

export default StudentOverviewContent;
