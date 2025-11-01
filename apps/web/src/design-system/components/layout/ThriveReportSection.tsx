/**
 * ThriveReportSection Component
 *
 * Section wrapper with background gradient from theme.
 * Reusable across all report types (K-12, Tutoring, Post-Secondary).
 *
 * Features:
 * - Section wrapper with themed background gradient
 * - Smooth transitions when switching sections
 * - Uses design tokens for padding, spacing, background
 * - Consistent section styling across all report types
 */

import React from "react";
import { ThriveReportSectionProps } from "../types";

const ThriveReportSection: React.FC<ThriveReportSectionProps> = ({
  section,
  isActive,
  theme,
  children,
}) => {
  // Get section-specific gradient from theme if available
  const getSectionGradient = () => {
    if (theme.gradients && typeof theme.gradients === "object") {
      const gradients = theme.gradients as Record<string, string>;
      // Try to match section ID to gradient key
      const gradientKey = section.id.replace(/-/g, "");
      if (gradients[gradientKey]) {
        return gradients[gradientKey];
      }
    }
    // Default gradient
    return `linear-gradient(135deg, ${theme.colors.gray50}, ${theme.colors.white})`;
  };

  if (!isActive) {
    return null;
  }

  return (
    <section
      className="min-h-screen transition-opacity duration-300 ease-in-out"
      style={{
        background: getSectionGradient(),
        padding: `${theme.spacing.xxl} ${theme.spacing.xl}`,
        opacity: isActive ? 1 : 0,
      }}
      aria-labelledby={`section-${section.id}`}
    >
      {/* Section Title */}
      <h2
        id={`section-${section.id}`}
        className="mb-8 font-bold"
        style={{
          fontFamily: theme.typography.fontFamilies.primary,
          fontSize: theme.typography.fontSizes.h2,
          fontWeight: theme.typography.fontWeights.bold,
          color: theme.colors.gray900,
        }}
      >
        {section.title}
      </h2>

      {/* Section Content */}
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  );
};

export default ThriveReportSection;
