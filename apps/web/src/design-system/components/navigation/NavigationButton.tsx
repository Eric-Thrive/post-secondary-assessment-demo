/**
 * NavigationButton Component
 *
 * Individual navigation button for sidebar section navigation.
 * Reusable across all report types (K-12, Tutoring, Post-Secondary).
 *
 * Features:
 * - Button with active/inactive states using theme
 * - Icon rendering (custom or Lucide icons)
 * - Uses design tokens for colors, spacing, borders
 * - Keyboard accessibility (Enter/Space) and focus indicators
 * - Smooth hover transitions
 */

import React from "react";
import { NavigationButtonProps } from "../types";

const NavigationButton: React.FC<NavigationButtonProps> = ({
  section,
  isActive,
  theme,
  onClick,
}) => {
  const IconComponent = typeof section.icon === "string" ? null : section.icon;

  const buttonStyles = isActive
    ? {
        backgroundColor: theme.navigation.activeBackground,
        borderColor: theme.navigation.activeBorder,
        color: theme.navigation.activeText,
        borderWidth: theme.dimensions.borderMedium,
        borderStyle: "solid" as const,
      }
    : {
        backgroundColor: theme.navigation.inactiveBackground,
        borderColor: theme.navigation.inactiveBorder,
        color: theme.navigation.inactiveText,
        borderWidth: theme.dimensions.borderThin,
        borderStyle: "solid" as const,
      };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        ...buttonStyles,
        fontFamily: theme.typography.fontFamilies.primary,
        fontSize: theme.typography.fontSizes.body,
        fontWeight: isActive
          ? theme.typography.fontWeights.semibold
          : theme.typography.fontWeights.medium,
        boxShadow: isActive ? theme.shadows.md : "none",
        minHeight: theme.dimensions.minTouchTarget, // WCAG minimum touch target size
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = theme.colors.gray200;
          e.currentTarget.style.transform = "translateX(4px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor =
            theme.navigation.inactiveBackground;
          e.currentTarget.style.transform = "translateX(0)";
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-current={isActive ? "page" : undefined}
      aria-label={`Navigate to ${section.title}`}
      role="button"
      tabIndex={0}
    >
      {/* Icon */}
      {IconComponent && (
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-full"
          style={{
            width: theme.dimensions.iconLg,
            height: theme.dimensions.iconLg,
            backgroundColor: isActive
              ? theme.colors.white
              : theme.colors.gray200,
            color: isActive ? theme.colors.primary : theme.colors.gray600,
          }}
        >
          <IconComponent className="w-5 h-5" />
        </div>
      )}

      {/* Text */}
      <span className="flex-1 text-left">{section.title}</span>

      {/* Active indicator */}
      {isActive && (
        <div
          className="flex-shrink-0 w-2 h-2 rounded-full"
          style={{
            backgroundColor: theme.navigation.activeBorder,
          }}
          aria-hidden="true"
        />
      )}
    </button>
  );
};

export default NavigationButton;
