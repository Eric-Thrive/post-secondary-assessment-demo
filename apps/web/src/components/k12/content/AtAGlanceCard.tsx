/**
 * AtAGlanceCard Component
 *
 * Summary card with Yellow background for Student Overview section.
 * Displays a high-level overview of the student with Sparkles icon.
 *
 * Requirements: 5.1
 */

import React from "react";
import { Sparkles } from "lucide-react";
import { ThriveReportCard } from "@/design-system/components/cards/ThriveReportCard";
import type { Theme } from "@/design-system/components/types";

export interface AtAGlanceCardProps {
  /**
   * Overview text to display
   */
  content: string;

  /**
   * Theme for styling
   */
  theme: Theme;
}

/**
 * AtAGlanceCard Component
 *
 * Displays a highlighted summary card with yellow background and sparkles icon.
 */
export const AtAGlanceCard: React.FC<AtAGlanceCardProps> = ({
  content,
  theme,
}) => {
  return (
    <ThriveReportCard theme={theme} variant="highlighted">
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: theme.spacing.md,
          backgroundColor: `${theme.colors.yellow}40`,
          padding: theme.spacing.lg,
          borderRadius: theme.borderRadius.lg,
        }}
      >
        {/* Sparkles Icon */}
        <div
          style={{
            flexShrink: 0,
            width: theme.dimensions.iconXl,
            height: theme.dimensions.iconXl,
            borderRadius: theme.borderRadius.full,
            backgroundColor: `${theme.colors.yellow}60`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.colors.orange,
          }}
        >
          <Sparkles className="w-6 h-6" />
        </div>

        {/* At a Glance Content */}
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: theme.typography.fontSizes.h3,
              fontWeight: theme.typography.fontWeights.bold,
              color: theme.colors.gray900,
              marginBottom: theme.spacing.sm,
            }}
          >
            At a Glance
          </h3>
          <p
            style={{
              fontSize: theme.typography.fontSizes.body,
              fontWeight: theme.typography.fontWeights.regular,
              lineHeight: theme.typography.lineHeights.relaxed,
              color: theme.colors.gray700,
              margin: 0,
            }}
          >
            {content}
          </p>
        </div>
      </div>
    </ThriveReportCard>
  );
};

export default AtAGlanceCard;
