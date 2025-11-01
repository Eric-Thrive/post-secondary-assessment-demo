/**
 * CaseInformationContent Component
 *
 * Displays case information using InfoCard from the design system.
 * Shows student name, grade level, school year, tutor/case manager, and dates.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import React from "react";
import { InfoCard } from "@/design-system/components/cards/InfoCard";
import BottomNavigation from "@/design-system/components/navigation/BottomNavigation";
import type { SectionContentProps } from "../sectionRegistry";
import type { CaseInformation } from "@/design-system/components/types";

const CaseInformationContent: React.FC<SectionContentProps> = ({
  theme,
  onNext,
  reportData,
}) => {
  // Extract case information from reportData or use sample data
  const caseInfo: CaseInformation = reportData?.caseInfo || {
    studentName: "Sarah Johnson",
    grade: "5th Grade",
    schoolYear: "2024-2025",
    tutor: "Ms. Emily Rodriguez",
    dateCreated: "January 15, 2025",
    lastUpdated: "January 20, 2025",
  };

  // Format data for InfoCard
  const caseInfoData: Record<string, string> = {
    "Student Name": caseInfo.studentName,
    Grade: caseInfo.grade,
    "School Year": caseInfo.schoolYear,
    "Tutor/Case Manager": caseInfo.tutor,
    "Date Created": caseInfo.dateCreated,
    "Last Updated": caseInfo.lastUpdated,
  };

  return (
    <div
      className="p-8"
      style={{
        fontFamily: theme.typography.fontFamilies.primary,
      }}
    >
      {/* Section Header */}
      <h2
        style={{
          fontSize: theme.typography.fontSizes.h2,
          fontWeight: theme.typography.fontWeights.bold,
          color: theme.colors.gray900,
          marginBottom: theme.spacing.lg,
        }}
      >
        Case Information
      </h2>

      {/* Case Information Card */}
      <InfoCard data={caseInfoData} theme={theme} />

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

export default CaseInformationContent;
