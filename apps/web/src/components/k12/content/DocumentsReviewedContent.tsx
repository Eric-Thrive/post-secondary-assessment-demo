/**
 * DocumentsReviewedContent Component
 *
 * Displays list of reviewed documents using DocumentCard from the design system.
 * Shows document title, author, date, and key findings for each document.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import React from "react";
import { DocumentCard } from "@/design-system/components/cards/DocumentCard";
import BottomNavigation from "@/design-system/components/navigation/BottomNavigation";
import type { SectionContentProps } from "../sectionRegistry";
import type { Document } from "@/design-system/components/types";

const DocumentsReviewedContent: React.FC<SectionContentProps> = ({
  theme,
  onNext,
  reportData,
}) => {
  // Extract documents from reportData or use sample data
  const documents: Document[] = reportData?.documentsReviewed || [
    {
      title: "Psychoeducational Assessment Report",
      author: "Dr. Jennifer Martinez, Ph.D.",
      date: "September 2024",
      keyFindings:
        "Assessment indicates strengths in verbal reasoning and creative problem-solving. Challenges identified in working memory and processing speed, particularly with multi-step instructions.",
    },
    {
      title: "IEP Documentation",
      author: "Lincoln Elementary School",
      date: "October 2024",
      keyFindings:
        "Current accommodations include extended time on tests, preferential seating, and access to graphic organizers. Progress notes show improvement in reading comprehension with visual supports.",
    },
    {
      title: "Teacher Progress Notes",
      author: "Ms. Thompson, 5th Grade Teacher",
      date: "December 2024",
      keyFindings:
        "Sarah demonstrates strong participation in class discussions and shows creativity in project-based learning. Benefits from breaking down complex tasks into smaller steps.",
    },
  ];

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
        Documents Reviewed
      </h2>

      {/* Document Cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing.lg,
        }}
      >
        {documents.map((doc, index) => (
          <DocumentCard
            key={index}
            title={doc.title}
            author={doc.author}
            date={doc.date}
            keyFindings={doc.keyFindings}
            theme={theme}
          />
        ))}
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

export default DocumentsReviewedContent;
