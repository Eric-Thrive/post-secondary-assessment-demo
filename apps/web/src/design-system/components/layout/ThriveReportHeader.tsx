/**
 * ThriveReportHeader Component
 *
 * Sticky header with gradient background using theme colors.
 * Reusable across all report types (K-12, Tutoring, Post-Secondary).
 *
 * Features:
 * - Sticky positioning at top of viewport
 * - Gradient background using theme colors
 * - Logo button and action buttons (print, etc.)
 * - Uses design tokens for gradient, spacing, typography
 * - Responsive layout
 */

import React from "react";
import { ThriveReportHeaderProps } from "../types";

const ThriveReportHeader: React.FC<ThriveReportHeaderProps> = ({
  logo,
  title,
  theme,
  actions,
}) => {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 lg:px-8"
      style={{
        background:
          theme.gradients?.header ||
          `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.secondary})`,
        boxShadow: theme.shadows.md,
        height: theme.dimensions.headerHeight,
      }}
    >
      {/* Logo and Title */}
      <div className="flex items-center gap-3 md:gap-4">
        {logo && (
          <a href="/" aria-label="Go to home page">
            <img
              src={logo}
              alt="Logo"
              className="h-auto max-h-10 md:max-h-12"
              style={{
                maxWidth: theme.dimensions.logoMaxWidth,
              }}
            />
          </a>
        )}
        <h1
          className="font-bold text-white hidden md:block text-lg md:text-xl"
          style={{
            fontFamily: theme.typography.fontFamilies.primary,
            fontWeight: theme.typography.fontWeights.bold,
          }}
        >
          {title}
        </h1>
      </div>

      {/* Action Buttons */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
};

export default ThriveReportHeader;
