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
  // Extract documents from reportData or use default document
  const documents: Document[] =
    reportData?.documentsReviewed?.length > 0
      ? reportData.documentsReviewed
      : [
          {
            title: "2024.9 Psychoeducational Report.pdf",
            author: "School Psychologist",
            date: "September 2024",
          },
        ];

  return (
    <div
      className="p-8"
      style={{
        fontFamily: theme.typography.fontFamilies.primary,
      }}
    >
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
