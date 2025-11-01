/**
 * BottomNavigation Component
 *
 * Bottom navigation buttons for section progression.
 * Reusable across all report types (K-12, Tutoring, Post-Secondary).
 *
 * Features:
 * - "Next Section" / "Complete Report" buttons
 * - Uses design tokens for button styling
 * - Keyboard accessible
 * - Smooth hover transitions
 */

import React from "react";
import { ChevronRight } from "lucide-react";
import { BottomNavigationProps } from "../types";

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  nextLabel = "Next Section",
  onNext,
  theme,
}) => {
  return (
    <div
      className="flex justify-end mt-8 md:mt-12 pt-6 md:pt-8"
      style={{
        borderTop: `${theme.dimensions.borderThin} solid ${theme.colors.gray200}`,
      }}
    >
      <button
        onClick={onNext}
        className="flex items-center gap-2 px-5 md:px-6 py-3 rounded-lg transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm md:text-base"
        style={{
          backgroundColor: theme.colors.primary,
          color: theme.colors.white,
          fontFamily: theme.typography.fontFamilies.primary,
          fontWeight: theme.typography.fontWeights.semibold,
          boxShadow: theme.shadows.md,
          minHeight: theme.dimensions.minTouchTarget, // WCAG minimum touch target size
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = theme.shadows.xl;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = theme.shadows.md;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onNext();
          }
        }}
        aria-label={nextLabel}
        role="button"
        tabIndex={0}
      >
        <span>{nextLabel}</span>
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
      </button>
    </div>
  );
};

export default BottomNavigation;
