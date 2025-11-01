/**
 * DocumentCard Component
 *
 * Displays reviewed document information with a colored left border
 * and icon circle. Used in the Documents Reviewed section.
 * Uses ThriveReportCard as wrapper and design tokens for all styling.
 */

import React from "react";
import { FileText } from "lucide-react";
import { ThriveReportCard } from "./ThriveReportCard";
import type { DocumentCardProps } from "../types";

export const DocumentCard: React.FC<DocumentCardProps> = ({
  title,
  author,
  date,
  keyFindings,
  theme,
}) => {
  return (
    <ThriveReportCard theme={theme} variant="default">
      <div
        className="flex gap-4 md:gap-6 pl-4 md:pl-6"
        style={{
          borderLeft: `4px solid ${theme.colors.accent}`,
        }}
      >
        {/* Icon Circle */}
        <div
          className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12"
          style={{
            borderRadius: theme.borderRadius.full,
            backgroundColor: `${theme.colors.accent}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FileText
            className="w-5 h-5 md:w-6 md:h-6"
            style={{
              color: theme.colors.accent,
            }}
          />
        </div>

        {/* Document Content */}
        <div className="flex-1">
          {/* Title */}
          <h4
            className="text-base md:text-lg font-semibold m-0 mb-2"
            style={{
              fontWeight: theme.typography.fontWeights.semibold,
              color: theme.colors.gray900,
            }}
          >
            {title}
          </h4>

          {/* Metadata */}
          <div
            className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm mb-3 md:mb-4"
            style={{
              color: theme.colors.gray600,
            }}
          >
            <span
              style={{
                fontWeight: theme.typography.fontWeights.medium,
              }}
            >
              {author}
            </span>
            <span>•</span>
            <span>{date}</span>
          </div>

          {/* Key Findings */}
          <div>
            <p
              className="text-sm md:text-base font-semibold m-0 mb-1"
              style={{
                fontWeight: theme.typography.fontWeights.semibold,
                color: theme.colors.gray900,
              }}
            >
              Key Findings:
            </p>
            <p
              className="text-sm md:text-base m-0"
              style={{
                fontWeight: theme.typography.fontWeights.regular,
                color: theme.colors.gray700,
                lineHeight: theme.typography.lineHeights.relaxed,
              }}
            >
              {keyFindings}
            </p>
          </div>
        </div>
      </div>
    </ThriveReportCard>
  );
};
