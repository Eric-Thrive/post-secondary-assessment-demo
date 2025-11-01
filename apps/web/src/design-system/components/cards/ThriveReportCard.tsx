/**
 * ThriveReportCard Component
 *
 * A flexible card component for displaying content in THRIVE reports.
 * Supports multiple variants (default, highlighted, bordered) and uses
 * design tokens exclusively for styling.
 */

import React from "react";
import type { ThriveReportCardProps } from "../types";

export const ThriveReportCard: React.FC<ThriveReportCardProps> = ({
  children,
  theme,
  variant = "default",
  className = "",
}) => {
  // Build styles using design tokens only
  const getVariantStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.white,
    };

    switch (variant) {
      case "highlighted":
        return {
          ...baseStyles,
          backgroundColor: theme.colors.yellow,
          boxShadow: theme.shadows.md,
          border: `2px solid ${theme.colors.orange}`,
        };

      case "bordered":
        return {
          ...baseStyles,
          border: `1px solid ${theme.colors.gray200}`,
          boxShadow: theme.shadows.sm,
        };

      case "default":
      default:
        return {
          ...baseStyles,
          boxShadow: theme.shadows.md,
        };
    }
  };

  return (
    <div style={getVariantStyles()} className={`p-4 md:p-6 ${className}`}>
      {children}
    </div>
  );
};
